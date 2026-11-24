import 'dotenv/config';
import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createServer as createViteServer } from 'vite';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface ExistingEventInput {
  title: string;
  type: string;
  startTime: string;
  endTime: string;
  courseCode?: string;
}

interface AssignmentInput {
  id: string;
  title: string;
  courseCode?: string;
  dueDate: string;
  estimatedMinutes: number;
  priority: string;
  category: string;
  notes?: string;
}

interface EssayInput {
  id: string;
  title: string;
  courseCode?: string;
  dueDate: string;
  currentWordCount: number;
  targetWordCount: number;
  status: string;
}

interface TestInput {
  id: string;
  title: string;
  courseCode?: string;
  date: string;
  topics: string[];
}

interface BreakdownRequestBody {
  targetDate: string;
  dayName?: string;
  studyWindowStart?: string;
  studyWindowEnd?: string;
  pacePreference?: string;
  studentName?: string;
  studentMajor?: string;
  existingEvents?: ExistingEventInput[];
  assignments?: AssignmentInput[];
  essays?: EssayInput[];
  upcomingTests?: TestInput[];
  focusAssignmentId?: string;
}

function getAiClient(): GoogleGenAI {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
    const err = new Error(
      'GEMINI_API_KEY is not configured. Please add your Gemini API key in the Settings > Secrets panel.'
    ) as Error & { statusCode?: number };
    err.statusCode = 400;
    throw err;
  }

  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

function isRetryableError(err: unknown): boolean {
  if (!err || typeof err !== 'object') return false;
  const status = (err as { status?: number }).status;
  const message = String((err as { message?: string }).message || '').toLowerCase();
  if (status === 429 || status === 500 || status === 503 || status === 504) {
    return true;
  }
  return message.includes('unavailable') || message.includes('timeout') || message.includes('econnreset');
}

async function generateWithRetry<T>(fn: () => Promise<T>, maxRetries = 2): Promise<T> {
  let lastError: unknown;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (attempt < maxRetries && isRetryableError(err)) {
        const delayMs = 600 * Math.pow(2, attempt);
        await new Promise((resolve) => setTimeout(resolve, delayMs));
        continue;
      }
      throw err;
    }
  }
  throw lastError;
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '1mb' }));

  app.get('/api/health', (_req: Request, res: Response) => {
    res.json({ ok: true, service: 'creativv.cal-api' });
  });

  app.post('/api/ai/breakdown-day', async (req: Request, res: Response) => {
    try {
      const body = (req.body || {}) as BreakdownRequestBody;
      const {
        targetDate,
        dayName = targetDate,
        studyWindowStart = '08:00',
        studyWindowEnd = '22:00',
        pacePreference = 'balanced',
        studentName = 'Student',
        studentMajor = 'University Student',
        existingEvents = [],
        assignments = [],
        essays = [],
        upcomingTests = [],
        focusAssignmentId,
      } = body;

      if (!targetDate) {
        return res.status(400).json({ error: 'targetDate is required.' });
      }

      if (assignments.length === 0 && essays.length === 0 && upcomingTests.length === 0) {
        return res.status(400).json({
          error: 'No pending assignments, essays, or upcoming tests were provided to break down.',
        });
      }

      const ai = getAiClient();

      const paceGuidance: Record<string, string> = {
        balanced: 'Spread work evenly across morning, afternoon, and evening with 10-15 minute transition buffers between blocks and classes.',
        morning_focus: 'Prioritize demanding/urgent cognitive steps in morning and early afternoon free slots, leaving lighter review or wrap-up steps for later.',
        pomodoro_sprints: 'Break assignments into crisp 25-30 minute sprint blocks with short 5-10 minute breaks between consecutive study blocks.',
        evening_sprint: 'Keep daytime light between classes and schedule focused 30-45 minute deep-work blocks in the late afternoon and evening.',
      };

      const focusAssignment = focusAssignmentId
        ? assignments.find((a) => a.id === focusAssignmentId)
        : undefined;

      const systemInstruction = `You are an expert academic coach and time-blocking planner inside creativv.cal.
Your job is to inspect a student's pending assignments (plus optional essays/exams) and break them down into concrete, motivating, bite-sized micro-steps scheduled cleanly across the free time slots of their day (${targetDate}).

STRICT SCHEDULING RULES:
1. NEVER overlap with any fixed existing class, lecture, lab, or exam listed in FIXED SCHEDULE COMMITMENTS. Always leave at least a 5-10 minute buffer around fixed classes.
2. Keep every step strictly inside the student's study window (${studyWindowStart} to ${studyWindowEnd}) using 24-hour HH:mm format (e.g., "09:15", "14:30").
3. Do NOT overlap two study steps with each other. Steps must be strictly chronological by startTime.
4. Each micro-step should be 15 to 50 minutes long and describe a concrete, actionable milestone (e.g., "Outline Lagrangian constraints for Problem 3a-b", NOT vague "Work on homework").
5. Prioritize urgent/high-priority assignments and earliest due dates first.
6. Use the exact assignmentId (or essay/test ID) provided in the input so the app can link each step back to its assignment.
7. Return valid JSON matching the schema.`;

      const promptPayload = {
        student: { name: studentName, major: studentMajor },
        targetDate,
        dayName,
        studyWindow: { start: studyWindowStart, end: studyWindowEnd },
        paceStyle: paceGuidance[pacePreference] || paceGuidance.balanced,
        focusMode: focusAssignment
          ? `FOCUS SPECIFICALLY ON THIS ASSIGNMENT: Break "${focusAssignment.title}" (ID: ${focusAssignment.id}, estimated ${focusAssignment.estimatedMinutes} mins) into 3-5 smaller progressive micro-steps spread across open windows of ${targetDate}.`
          : `Break down the highest-impact pending assignments into smaller manageable steps distributed across the open windows of ${targetDate}. Aim for 5 to 8 total micro-steps so the day feels achievable and well-paced.`,
        fixedScheduleCommitmentsOnDate: existingEvents,
        pendingAssignments: assignments,
        activeEssaysForContext: essays,
        upcomingExamsForContext: upcomingTests,
      };

      const response = await generateWithRetry(() =>
        ai.models.generateContent({
          model: 'gemini-4-hydrogen',
          contents: `Create a realistic, non-overlapping daily step-by-step assignment breakdown for ${dayName} (${targetDate}) based on this academic data:\n\n${JSON.stringify(promptPayload, null, 2)}`,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
            responseMimeType: 'application/json',
            responseSchema: {
              type: Type.OBJECT,
              properties: {
                dailyStrategySummary: {
                  type: Type.STRING,
                  description:
                    'A concise, encouraging 1-2 sentence overview of how the assignments were broken down around classes and priorities.',
                },
                steps: {
                  type: Type.ARRAY,
                  description: 'Chronologically ordered micro-steps scheduled across the free windows of the day.',
                  items: {
                    type: Type.OBJECT,
                    properties: {
                      assignmentId: {
                        type: Type.STRING,
                        description: 'Exact ID of the parent assignment, essay, or test from the input.',
                      },
                      assignmentTitle: {
                        type: Type.STRING,
                        description: 'Title of the parent assignment.',
                      },
                      courseCode: {
                        type: Type.STRING,
                        description: 'Course code such as CS 189, or General if none.',
                      },
                      stepTitle: {
                        type: Type.STRING,
                        description: 'Short action-oriented micro-step title (max 8 words).',
                      },
                      description: {
                        type: Type.STRING,
                        description: 'Specific 1-sentence instruction explaining exactly what to do during this block.',
                      },
                      startTime: {
                        type: Type.STRING,
                        description: '24-hour HH:mm start time, e.g., 11:15',
                      },
                      endTime: {
                        type: Type.STRING,
                        description: '24-hour HH:mm end time, e.g., 11:45',
                      },
                      durationMinutes: {
                        type: Type.INTEGER,
                        description: 'Duration in minutes (15 to 60).',
                      },
                      timeOfDay: {
                        type: Type.STRING,
                        description: 'Must be one of: Morning, Afternoon, Evening',
                      },
                      priority: {
                        type: Type.STRING,
                        description: 'Must be one of: urgent, high, medium, low',
                      },
                      focusTip: {
                        type: Type.STRING,
                        description: 'Brief tactical study tip for this step.',
                      },
                    },
                    required: [
                      'assignmentId',
                      'assignmentTitle',
                      'courseCode',
                      'stepTitle',
                      'description',
                      'startTime',
                      'endTime',
                      'durationMinutes',
                      'timeOfDay',
                      'priority',
                    ],
                  },
                },
              },
              required: ['dailyStrategySummary', 'steps'],
            },
          },
        })
      );

      const rawText = (response.text ?? '').trim();
      if (!rawText) {
        return res.status(502).json({ error: 'Gemini returned an empty response. Please try again.' });
      }

      const parsed = JSON.parse(rawText) as {
        dailyStrategySummary: string;
        steps: Array<{
          assignmentId: string;
          assignmentTitle: string;
          courseCode: string;
          stepTitle: string;
          description: string;
          startTime: string;
          endTime: string;
          durationMinutes: number;
          timeOfDay: string;
          priority: string;
          focusTip?: string;
        }>;
      };

      return res.json({
        date: targetDate,
        dailyStrategySummary: parsed.dailyStrategySummary,
        steps: Array.isArray(parsed.steps) ? parsed.steps : [],
      });
    } catch (err: unknown) {
      console.error('Error in /api/ai/breakdown-day:', err);
      const status =
        (err as { statusCode?: number; status?: number }).statusCode ||
        (err as { status?: number }).status ||
        500;
      const message =
        err instanceof Error ? err.message : 'Failed to generate AI daily breakdown.';

      if (status === 400 || status === 403) {
        return res.status(status).json({
          error: `${message} Please verify your Gemini API key in Settings > Secrets.`,
        });
      }
      if (status === 429) {
        return res.status(429).json({
          error: 'Gemini API rate limit reached. Please wait a moment and try again.',
        });
      }

      return res.status(500).json({ error: message });
    }
  });

  const distDir = path.resolve(__dirname, 'dist');
  const distIndex = path.join(distDir, 'index.html');
  const useStaticProd = process.env.NODE_ENV !== 'development' && fs.existsSync(distIndex);

  if (!useStaticProd) {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(distDir));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(distIndex);
    });
  }

  const port = Number(process.env.PORT) || 3000;
  app.listen(port, '0.0.0.0', () => {
    console.log(`creativv.cal server running on http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start creativv.cal server:', err);
  process.exit(1);
});
