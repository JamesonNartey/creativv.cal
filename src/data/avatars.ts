import alexAvatar from '../assets/images/avatar_student_alex_1791826826080.jpg';
import marcusAvatar from '../assets/images/avatar_student_marcus_1791887585546.jpg';
import elenaAvatar from '../assets/images/avatar_student_elena_1791887586124.jpg';
import mayaAvatar from '../assets/images/avatar_student_maya_1791887732498.jpg';
import liamAvatar from '../assets/images/avatar_student_liam_1791887748177.jpg';

export interface AvatarPreset {
  id: string;
  name: string;
  roleHint: string;
  url: string;
}

export const PRESET_AVATARS: AvatarPreset[] = [
  {
    id: 'alex',
    name: 'Alex',
    roleHint: 'Cognitive Science',
    url: alexAvatar,
  },
  {
    id: 'maya',
    name: 'Maya',
    roleHint: 'Data Science',
    url: mayaAvatar,
  },
  {
    id: 'liam',
    name: 'Liam',
    roleHint: 'Architecture & Design',
    url: liamAvatar,
  },
  {
    id: 'elena',
    name: 'Elena',
    roleHint: 'Literature & Philosophy',
    url: elenaAvatar,
  },
  {
    id: 'marcus',
    name: 'Marcus',
    roleHint: 'Bioengineering',
    url: marcusAvatar,
  },
];

export const DEFAULT_AVATAR = alexAvatar;
