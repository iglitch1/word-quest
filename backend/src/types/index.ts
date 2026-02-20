export interface User {
  id: string;
  username: string;
  display_name: string;
  password_hash: string;
  role: 'player' | 'parent' | 'admin';
  created_at: number;
}

export interface World {
  id: string;
  name: string;
  description: string;
  theme: string;
  display_order: number;
  icon_emoji: string;
  color_primary: string;
  color_secondary: string;
  unlock_stars_required: number;
}

export interface Level {
  id: string;
  world_id: string;
  level_number: number;
  name: string;
  difficulty_tier: number;
  target_word_count: number;
  time_limit_seconds: number;
  base_coins: number;
}

export interface Vocabulary {
  id: string;
  word: string;
  definition: string;
  part_of_speech: string;
  difficulty_tier: number;
  example_sentence: string;
  category: string;
  world_id: string;
}

export interface WordRelationship {
  id: string;
  word_id: string;
  related_word_id: string;
  relationship_type: 'synonym' | 'antonym';
}

export interface GameSession {
  id: string;
  user_id: string;
  level_id: string;
  started_at: number;
  ended_at: number | null;
  status: 'active' | 'completed' | 'abandoned';
  score: number;
  coins_earned: number;
  accuracy: number;
  stars_earned: number;
}

export interface SessionAnswer {
  id: string;
  session_id: string;
  word_id: string;
  question_type: 'definition' | 'fill_blank' | 'synonym' | 'reverse_definition' | 'true_false' | 'example_sentence' | 'antonym' | 'spelling';
  correct_answer: string;
  user_answer: string;
  is_correct: boolean;
  response_time_ms: number;
  points_earned: number;
}

export interface PlayerProgress {
  user_id: string;
  total_coins: number;
  total_stars: number;
  current_title: string;
  words_mastered: number;
}

export interface LevelCompletion {
  id: string;
  user_id: string;
  level_id: string;
  best_stars: number;
  best_score: number;
  times_played: number;
}

export interface WordMastery {
  id: string;
  user_id: string;
  word_id: string;
  times_correct: number;
  times_attempted: number;
  mastery_level: 'new' | 'learning' | 'proficient' | 'mastered';
}

export interface CharacterItem {
  id: string;
  name: string;
  type: 'base' | 'hat' | 'outfit' | 'pet' | 'effect';
  asset_key: string;
  cost_coins: number;
  is_default: boolean;
}

export interface PlayerInventory {
  id: string;
  user_id: string;
  item_id: string;
  equipped: boolean;
}

export interface Question {
  wordId: string;
  word: string;
  questionType: 'definition' | 'fill_blank' | 'synonym' | 'reverse_definition' | 'true_false' | 'example_sentence' | 'antonym' | 'spelling';
  prompt: string;
  options: string[];
  correctIndex: number;
}

export interface QuestionResponse {
  sessionId: string;
  question: Question;
  nextQuestion?: Question;
}

export interface AnswerResult {
  correct: boolean;
  correctAnswer: string;
  pointsEarned: number;
  explanation: string;
}

export interface SessionSummary {
  sessionId: string;
  levelId: string;
  score: number;
  accuracy: number;
  starsEarned: number;
  coinsEarned: number;
  totalCoins: number;
  totalStars: number;
  wordsLearned: number;
}

export interface WorldStats {
  worldId: string;
  name: string;
  iconEmoji: string;
  starsEarned: number;
  levelsCompleted: number;
  totalLevels: number;
  unlockedAt?: number;
}

export interface ShopItemResponse extends CharacterItem {
  owned: boolean;
  equipped: boolean;
}
