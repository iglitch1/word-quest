export const SCHEMA = `
-- Users table
CREATE TABLE IF NOT EXISTS users (
  id TEXT PRIMARY KEY,
  username TEXT UNIQUE NOT NULL,
  display_name TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'player',
  created_at BIGINT NOT NULL
);

-- Worlds table
CREATE TABLE IF NOT EXISTS worlds (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  theme TEXT,
  display_order INTEGER,
  icon_emoji TEXT,
  color_primary TEXT,
  color_secondary TEXT,
  unlock_stars_required INTEGER DEFAULT 0
);

-- Levels table
CREATE TABLE IF NOT EXISTS levels (
  id TEXT PRIMARY KEY,
  world_id TEXT NOT NULL,
  level_number INTEGER NOT NULL,
  name TEXT NOT NULL,
  difficulty_tier INTEGER NOT NULL,
  target_word_count INTEGER DEFAULT 8,
  time_limit_seconds INTEGER DEFAULT 120,
  base_coins INTEGER DEFAULT 100,
  FOREIGN KEY (world_id) REFERENCES worlds(id)
);

-- Vocabulary table
CREATE TABLE IF NOT EXISTS vocabulary (
  id TEXT PRIMARY KEY,
  word TEXT NOT NULL,
  definition TEXT NOT NULL,
  part_of_speech TEXT,
  difficulty_tier INTEGER,
  example_sentence TEXT,
  category TEXT,
  world_id TEXT NOT NULL,
  FOREIGN KEY (world_id) REFERENCES worlds(id)
);

-- Word relationships table
CREATE TABLE IF NOT EXISTS word_relationships (
  id TEXT PRIMARY KEY,
  word_id TEXT NOT NULL,
  related_word_id TEXT NOT NULL,
  relationship_type TEXT NOT NULL,
  FOREIGN KEY (word_id) REFERENCES vocabulary(id),
  FOREIGN KEY (related_word_id) REFERENCES vocabulary(id),
  CHECK (relationship_type IN ('synonym', 'antonym'))
);

-- Game sessions table
CREATE TABLE IF NOT EXISTS game_sessions (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  level_id TEXT NOT NULL,
  started_at INTEGER NOT NULL,
  ended_at INTEGER,
  status TEXT NOT NULL,
  score INTEGER DEFAULT 0,
  coins_earned INTEGER DEFAULT 0,
  accuracy REAL DEFAULT 0,
  stars_earned INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (level_id) REFERENCES levels(id)
);

-- Session answers table
CREATE TABLE IF NOT EXISTS session_answers (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  word_id TEXT NOT NULL,
  question_type TEXT NOT NULL,
  correct_answer TEXT NOT NULL,
  user_answer TEXT,
  is_correct BOOLEAN NOT NULL,
  response_time_ms INTEGER,
  points_earned INTEGER DEFAULT 0,
  FOREIGN KEY (session_id) REFERENCES game_sessions(id),
  FOREIGN KEY (word_id) REFERENCES vocabulary(id)
);

-- Player progress table
CREATE TABLE IF NOT EXISTS player_progress (
  user_id TEXT PRIMARY KEY,
  total_coins INTEGER DEFAULT 0,
  total_stars INTEGER DEFAULT 0,
  current_title TEXT DEFAULT 'Word Apprentice',
  words_mastered INTEGER DEFAULT 0,
  FOREIGN KEY (user_id) REFERENCES users(id)
);

-- Level completion table
CREATE TABLE IF NOT EXISTS level_completion (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  level_id TEXT NOT NULL,
  best_stars INTEGER,
  best_score INTEGER,
  times_played INTEGER DEFAULT 1,
  UNIQUE (user_id, level_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (level_id) REFERENCES levels(id)
);

-- Word mastery table
CREATE TABLE IF NOT EXISTS word_mastery (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  word_id TEXT NOT NULL,
  times_correct INTEGER DEFAULT 0,
  times_attempted INTEGER DEFAULT 0,
  mastery_level TEXT DEFAULT 'new',
  UNIQUE (user_id, word_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (word_id) REFERENCES vocabulary(id)
);

-- Character items table
CREATE TABLE IF NOT EXISTS character_items (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  asset_key TEXT NOT NULL,
  cost_coins INTEGER DEFAULT 0,
  is_default BOOLEAN DEFAULT FALSE,
  CHECK (type IN ('base', 'hat', 'outfit', 'pet', 'effect'))
);

-- Player inventory table
CREATE TABLE IF NOT EXISTS player_inventory (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  item_id TEXT NOT NULL,
  equipped BOOLEAN DEFAULT FALSE,
  UNIQUE (user_id, item_id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (item_id) REFERENCES character_items(id)
);
`;
