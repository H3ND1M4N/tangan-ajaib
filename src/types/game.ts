export type GradeLevel = 'kelas-1-2' | 'kelas-3-4' | 'kelas-5-6' | 'tantangan-kilat';

export interface PAIQuestionItem {
  id: string;
  category: string;
  question: string;
  arabicSnippet?: string;
  answer: string;
  distractors: string[];
  explanation: string;
  iconName: 'star' | 'book' | 'moon' | 'heart' | 'mosque' | 'hands' | 'cloud' | 'sun' | 'shield';
  azimuthDeg?: number;
  elevationDeg?: number;
  distance?: number;
}

export interface TopicLevel {
  id: string;
  grade: GradeLevel;
  title: string;
  subTitle: string;
  description: string;
  badgeText: string;
  targetCount: number;
  timeLimitSec?: number;
  items: PAIQuestionItem[];
}

export interface PlayerScoreRecord {
  levelId: string;
  levelTitle: string;
  score: number;
  stars: number;
  accuracy: number;
  date: string;
}

export interface HandGestureState {
  isDetected: boolean;
  x: number; // normalized 0 to 1 (mirrored for intuitive control)
  y: number; // normalized 0 to 1
  isPinching: boolean; // thumb and index finger close together
  pinchDistance: number;
  isOpenPalm: boolean;
  rawLandmarks?: Array<{ x: number; y: number; z: number }>;
}
