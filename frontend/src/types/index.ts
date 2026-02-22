// Auth Types
export interface User {
  id: string;
  username: string;
  displayName: string;
  role: string;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  progress: any;
  login: (username: string, password: string) => Promise<void>;
  register: (username: string, displayName: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

// World Types (matches backend camelCase response)
export interface World {
  id: string;
  worldId?: string;
  name: string;
  description: string;
  theme: string;
  iconEmoji: string;
  colorPrimary: string;
  colorSecondary: string;
  unlockStarsRequired: number;
  starsEarned: number;
  levelsCompleted: number;
  totalLevels: number;
  unlocked: boolean;
}

// Level Types (matches backend camelCase response)
export interface Level {
  id: string;
  levelNumber: number;
  name: string;
  difficultyTier: number;
  targetWordCount: number;
  timeLimitSeconds: number;
  baseCoins: number;
  completed: boolean;
  bestStars: number;
  bestScore: number;
  timesPlayed: number;
}

// Game Types
export interface GameSession {
  id: string;
  questions: Question[];
  levelName: string;
  worldName: string;
  timeLimit: number;
  totalQuestions: number;
}

export interface Question {
  wordId: string;
  word: string;
  questionType: string;
  prompt: string;
  options: string[];
  correctIndex?: number; // no longer sent from server
}

export interface GameAnswer {
  sessionId: string;
  wordId: string;
  questionType: string;
  answer: string;
}

export interface AnswerResult {
  correct: boolean;
  correctAnswer: string;
  pointsEarned: number;
  explanation: string;
  streakCount: number;
}

export interface GameSummary {
  score: number;
  coinsEarned: number;
  starsEarned: number;
  accuracy: number;
  questionsCorrect: number;
  totalQuestions: number;
  newTitle: string | null;
  titleChanged: boolean;
  wordsLearned: number;
  totalCoins: number;
  totalStars: number;
}

// Shop Types
export interface ShopItem {
  id: string;
  name: string;
  cost_coins: number;
  asset_key: string;
  type: string;
  owned: boolean;
  equipped: boolean;
  is_default: boolean;
}

export interface ShopInventory {
  bases: ShopItem[];
  hats: ShopItem[];
  outfits: ShopItem[];
  pets: ShopItem[];
  effects: ShopItem[];
}

export interface CharacterEquipment {
  base: string | null;
  hat: string | null;
  outfit: string | null;
  pet: string | null;
  effect: string | null;
}

// Question Review Types (for end-of-level answer review)
export interface QuestionReview {
  word: string;
  prompt: string;
  selectedAnswer: string | null;
  correctAnswer: string;
  wasCorrect: boolean;
  explanation: string;
}

// Stats Types
export interface PlayerStats {
  totalCoins: number;
  totalStars: number;
  wordsLearned: number;
  wordsMastered: number;
  currentTitle: string;
  levelsCompleted: number;
  totalLevels: number;
}

export interface WordMastery {
  word: string;
  mastery_level: string;
  times_correct: number;
  times_attempted: number;
}

export interface MasteryCategory {
  category: string;
  words: WordMastery[];
}
