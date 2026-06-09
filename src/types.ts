export type ElementType = 'fire' | 'earth' | 'air' | 'water';

export type MasteryLevel = 'locked' | 'unlocked' | 'mastered';

export interface SkillNode {
  id: string;
  title: string;
  subTitle: string;
  constellationId: string;
  category: string;
  description: string;
  difficulty: number;
  unlockRequirements: string[];
  x: number;
  y: number;
}

export interface Constellation {
  id: string;
  name: string;
  chineseName: string;
  element: ElementType;
  description: string;
  themeColor: string;
}

export interface WoodMaterial {
  id: string;
  name: string;
  chineseName: string;
  description: string;
  weight: string;
  sound: string;
  colorHex: string;
}

export interface PaintFinish {
  id: string;
  name: string;
  chineseName: string;
  description: string;
  tackiness: string;
  colorHex: string;
}

export interface CustomKendama {
  woodType: string;
  paintType: string;
  paintColor: string;
  stringColor: string;
  engraving: string;
}
