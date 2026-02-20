import { queryAll, queryOne } from '../database/db';
import { Vocabulary, WordRelationship, Question } from '../types';

type QuestionType = 'definition' | 'fill_blank' | 'synonym' | 'reverse_definition' | 'true_false' | 'example_sentence' | 'antonym' | 'spelling';

// Question weights scaled by difficulty tier:
//   Tier 1: Easy — mostly true_false, definition, fill_blank
//   Tier 2: Introduce reverse_definition
//   Tier 3: Add example_sentence and spelling
//   Tier 4: Add synonym, more spelling
//   Tier 5: All types including antonym, harder mix
const QUESTION_WEIGHTS_BY_TIER: Record<number, { type: QuestionType; weight: number }[]> = {
  1: [
    { type: 'true_false', weight: 0.30 },
    { type: 'definition', weight: 0.35 },
    { type: 'fill_blank', weight: 0.35 },
  ],
  2: [
    { type: 'true_false', weight: 0.20 },
    { type: 'definition', weight: 0.25 },
    { type: 'fill_blank', weight: 0.25 },
    { type: 'reverse_definition', weight: 0.20 },
    { type: 'spelling', weight: 0.10 },
  ],
  3: [
    { type: 'true_false', weight: 0.12 },
    { type: 'definition', weight: 0.18 },
    { type: 'fill_blank', weight: 0.18 },
    { type: 'reverse_definition', weight: 0.18 },
    { type: 'spelling', weight: 0.15 },
    { type: 'example_sentence', weight: 0.14 },
    { type: 'synonym', weight: 0.05 },
  ],
  4: [
    { type: 'true_false', weight: 0.08 },
    { type: 'definition', weight: 0.14 },
    { type: 'fill_blank', weight: 0.14 },
    { type: 'reverse_definition', weight: 0.16 },
    { type: 'spelling', weight: 0.16 },
    { type: 'example_sentence', weight: 0.14 },
    { type: 'synonym', weight: 0.10 },
    { type: 'antonym', weight: 0.08 },
  ],
  5: [
    { type: 'true_false', weight: 0.05 },
    { type: 'definition', weight: 0.10 },
    { type: 'fill_blank', weight: 0.12 },
    { type: 'reverse_definition', weight: 0.15 },
    { type: 'spelling', weight: 0.18 },
    { type: 'example_sentence', weight: 0.15 },
    { type: 'synonym', weight: 0.13 },
    { type: 'antonym', weight: 0.12 },
  ],
};

export class QuestionGenerator {
  static generateQuestionsForLevel(levelId: string, targetCount: number = 8): Question[] {
    // Get level info
    const level = queryOne<any>(
      'SELECT * FROM levels WHERE id = ?',
      [levelId]
    );

    if (!level) {
      throw new Error('Level not found');
    }

    // Get vocabulary for the world
    const words = queryAll<Vocabulary>(
      'SELECT * FROM vocabulary WHERE world_id = ? ORDER BY difficulty_tier ASC',
      [level.world_id]
    );

    if (words.length === 0) {
      throw new Error('No vocabulary found for this level');
    }

    // Filter words by difficulty tier and randomize
    const targetWords = this.selectTargetWords(words, level.difficulty_tier, targetCount);

    // Generate questions with rotation guarantee, scaled by difficulty
    const questions: Question[] = [];
    let lastType: QuestionType | null = null;
    const tier = level.difficulty_tier || 1;

    for (const word of targetWords) {
      const question = this.generateQuestionForWord(word, words, lastType, tier);
      if (question) {
        questions.push(question);
        lastType = question.questionType as QuestionType;
      }
    }

    return questions.slice(0, targetCount);
  }

  private static selectTargetWords(
    words: Vocabulary[],
    difficultyTier: number,
    targetCount: number
  ): Vocabulary[] {
    // Select words around the difficulty tier
    const minTier = Math.max(1, difficultyTier - 1);
    const maxTier = difficultyTier;

    const selectedWords = words.filter(w => w.difficulty_tier >= minTier && w.difficulty_tier <= maxTier);

    // Shuffle and select
    return this.shuffle(selectedWords).slice(0, targetCount);
  }

  private static pickQuestionType(lastType: QuestionType | null, tier: number = 3): QuestionType {
    // Get weights for this difficulty tier (clamp to 1-5)
    const clampedTier = Math.max(1, Math.min(5, tier));
    const weights = QUESTION_WEIGHTS_BY_TIER[clampedTier] || QUESTION_WEIGHTS_BY_TIER[3];

    // Weighted random selection, guaranteeing no consecutive repeats
    const maxAttempts = 20;
    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      const rand = Math.random();
      let cumulative = 0;
      for (const entry of weights) {
        cumulative += entry.weight;
        if (rand < cumulative) {
          if (entry.type !== lastType || attempt === maxAttempts - 1) {
            return entry.type;
          }
          break; // re-roll
        }
      }
    }
    // Fallback: pick any type that isn't lastType
    const fallback = weights.find(e => e.type !== lastType);
    return fallback ? fallback.type : 'definition';
  }

  private static generateQuestionForWord(
    word: Vocabulary,
    allWords: Vocabulary[],
    lastType: QuestionType | null,
    tier: number = 3
  ): Question | null {
    const chosenType = this.pickQuestionType(lastType, tier);

    // Try the chosen type, then fall back through alternatives
    const fallbackOrder: QuestionType[] = [
      chosenType,
      'definition',
      'reverse_definition',
      'fill_blank',
      'spelling',
      'true_false',
      'example_sentence',
      'synonym',
      'antonym',
    ];

    for (const type of fallbackOrder) {
      // Skip if it would repeat the last type (unless it's the only option left)
      if (type === lastType && type !== chosenType) continue;

      const question = this.tryGenerateQuestion(type, word, allWords);
      if (question) return question;
    }

    // Absolute fallback
    return this.generateDefinitionQuestion(word, allWords);
  }

  private static tryGenerateQuestion(
    type: QuestionType,
    word: Vocabulary,
    allWords: Vocabulary[]
  ): Question | null {
    switch (type) {
      case 'definition':
        return this.generateDefinitionQuestion(word, allWords);
      case 'fill_blank':
        return this.generateFillBlankQuestion(word, allWords);
      case 'synonym':
        return this.generateSynonymQuestion(word);
      case 'reverse_definition':
        return this.generateReverseDefinitionQuestion(word, allWords);
      case 'true_false':
        return this.generateTrueFalseQuestion(word, allWords);
      case 'example_sentence':
        return this.generateExampleSentenceQuestion(word, allWords);
      case 'antonym':
        return this.generateAntonymQuestion(word, allWords);
      case 'spelling':
        return this.generateSpellingQuestion(word);
      default:
        return null;
    }
  }

  // --- EXISTING QUESTION TYPES ---

  private static generateDefinitionQuestion(word: Vocabulary, allWords: Vocabulary[]): Question {
    // Get wrong options from same category/difficulty
    const wrongWords = allWords.filter(
      w => w.id !== word.id &&
        ((w.category === word.category && Math.abs(w.difficulty_tier - word.difficulty_tier) <= 1) ||
        (w.difficulty_tier === word.difficulty_tier))
    );

    const shuffledWrong = this.shuffle(wrongWords).slice(0, 3);
    const wrongDefinitions = shuffledWrong.map(w => w.definition);

    const options = [word.definition, ...wrongDefinitions];
    const shuffledOptions = this.shuffle(options);
    const correctIndex = shuffledOptions.indexOf(word.definition);

    return {
      wordId: word.id,
      word: word.word,
      questionType: 'definition',
      prompt: `What does "${word.word}" mean?`,
      options: shuffledOptions,
      correctIndex,
    };
  }

  private static generateFillBlankQuestion(word: Vocabulary, allWords: Vocabulary[]): Question {
    const sentence = word.example_sentence.replace(word.word, '___');

    // Get wrong options from same part of speech
    const wrongWords = allWords.filter(
      w => w.id !== word.id && w.part_of_speech === word.part_of_speech
    );

    const shuffledWrong = this.shuffle(wrongWords).slice(0, 3);
    const wrongWords_list = shuffledWrong.map(w => w.word);

    const options = [word.word, ...wrongWords_list];
    const shuffledOptions = this.shuffle(options);
    const correctIndex = shuffledOptions.indexOf(word.word);

    return {
      wordId: word.id,
      word: word.word,
      questionType: 'fill_blank',
      prompt: `Fill in the blank: "${sentence}"`,
      options: shuffledOptions,
      correctIndex,
    };
  }

  private static generateSynonymQuestion(word: Vocabulary): Question | null {
    // Look for synonyms
    const relationships = queryAll<WordRelationship>(
      'SELECT * FROM word_relationships WHERE word_id = ? AND relationship_type = ?',
      [word.id, 'synonym']
    );

    if (relationships.length === 0) {
      return null;
    }

    // Get related words
    const relatedIds = relationships.map(r => r.related_word_id);
    if (relatedIds.length === 0) {
      return null;
    }

    const relatedWords = queryAll<Vocabulary>(
      `SELECT * FROM vocabulary WHERE id IN (${relatedIds.map(() => '?').join(',')})`,
      relatedIds
    );

    if (relatedWords.length === 0) {
      return null;
    }

    // Get some wrong options from same category
    const wrongWords = queryAll<Vocabulary>(
      'SELECT * FROM vocabulary WHERE world_id = ? AND id NOT IN (?, ?) LIMIT 3',
      [word.world_id, word.id, ...relatedIds.slice(0, 1)]
    );

    const synonym = relatedWords[0];
    const options = [synonym.word, ...wrongWords.map(w => w.word)];
    const shuffledOptions = this.shuffle(options);
    const correctIndex = shuffledOptions.indexOf(synonym.word);

    return {
      wordId: word.id,
      word: word.word,
      questionType: 'synonym',
      prompt: `Which word is closest in meaning to "${word.word}"?`,
      options: shuffledOptions,
      correctIndex,
    };
  }

  // --- NEW QUESTION TYPES ---

  /**
   * Reverse Definition: Show a definition, player picks the correct word.
   * "Which word means 'bright and strong'?"
   */
  private static generateReverseDefinitionQuestion(word: Vocabulary, allWords: Vocabulary[]): Question {
    const wrongWords = allWords.filter(
      w => w.id !== word.id &&
        Math.abs(w.difficulty_tier - word.difficulty_tier) <= 1
    );

    const shuffledWrong = this.shuffle(wrongWords).slice(0, 3);
    const options = [word.word, ...shuffledWrong.map(w => w.word)];
    const shuffledOptions = this.shuffle(options);
    const correctIndex = shuffledOptions.indexOf(word.word);

    return {
      wordId: word.id,
      word: word.word,
      questionType: 'reverse_definition',
      prompt: `Which word means "${word.definition}"?`,
      options: shuffledOptions,
      correctIndex,
    };
  }

  /**
   * True/False: Show a word + definition pairing, player says if it's correct.
   * "'Vivid' means 'extremely cold' — True or False?"
   */
  private static generateTrueFalseQuestion(word: Vocabulary, allWords: Vocabulary[]): Question | null {
    const isCorrectPairing = Math.random() < 0.5;

    let displayedDefinition: string;
    if (isCorrectPairing) {
      displayedDefinition = word.definition;
    } else {
      // Pick a wrong definition from a different word
      const otherWords = allWords.filter(w => w.id !== word.id);
      if (otherWords.length === 0) return null;
      const wrongWord = this.shuffle(otherWords)[0];
      displayedDefinition = wrongWord.definition;
    }

    const correctAnswer = isCorrectPairing ? 'True' : 'False';
    const options = ['True', 'False'];
    const correctIndex = options.indexOf(correctAnswer);

    return {
      wordId: word.id,
      word: word.word,
      questionType: 'true_false',
      prompt: `"${word.word}" means "${displayedDefinition}" — True or False?`,
      options,
      correctIndex,
    };
  }

  /**
   * Example Sentence: Show a word, pick which sentence uses it correctly.
   * "Which sentence uses 'vivid' correctly?"
   */
  private static generateExampleSentenceQuestion(word: Vocabulary, allWords: Vocabulary[]): Question | null {
    if (!word.example_sentence) return null;

    // Get other words with example sentences to create wrong options
    const otherWords = allWords.filter(
      w => w.id !== word.id && w.example_sentence
    );

    if (otherWords.length < 3) return null;

    const wrongWords = this.shuffle(otherWords).slice(0, 3);

    // Create wrong sentences by swapping their word for the target word
    const wrongSentences = wrongWords.map(w => {
      // Replace the other word's word with the target word in their sentence
      const regex = new RegExp(w.word, 'gi');
      return w.example_sentence.replace(regex, word.word);
    });

    const options = [word.example_sentence, ...wrongSentences];
    const shuffledOptions = this.shuffle(options);
    const correctIndex = shuffledOptions.indexOf(word.example_sentence);

    return {
      wordId: word.id,
      word: word.word,
      questionType: 'example_sentence',
      prompt: `Which sentence uses "${word.word}" correctly?`,
      options: shuffledOptions,
      correctIndex,
    };
  }

  /**
   * Antonym: Pick the word with the opposite meaning.
   * "Which word means the OPPOSITE of 'gentle'?"
   */
  private static generateAntonymQuestion(word: Vocabulary, allWords: Vocabulary[]): Question | null {
    // Look for antonyms
    const relationships = queryAll<WordRelationship>(
      'SELECT * FROM word_relationships WHERE word_id = ? AND relationship_type = ?',
      [word.id, 'antonym']
    );

    if (relationships.length === 0) {
      return null; // fallback will handle it
    }

    const relatedIds = relationships.map(r => r.related_word_id);
    const relatedWords = queryAll<Vocabulary>(
      `SELECT * FROM vocabulary WHERE id IN (${relatedIds.map(() => '?').join(',')})`,
      relatedIds
    );

    if (relatedWords.length === 0) {
      return null;
    }

    // Get wrong options (words that are NOT antonyms)
    const wrongWords = allWords.filter(
      w => w.id !== word.id && !relatedIds.includes(w.id)
    );
    const shuffledWrong = this.shuffle(wrongWords).slice(0, 3);

    const antonym = relatedWords[0];
    const options = [antonym.word, ...shuffledWrong.map(w => w.word)];
    const shuffledOptions = this.shuffle(options);
    const correctIndex = shuffledOptions.indexOf(antonym.word);

    return {
      wordId: word.id,
      word: word.word,
      questionType: 'antonym',
      prompt: `Which word means the OPPOSITE of "${word.word}"?`,
      options: shuffledOptions,
      correctIndex,
    };
  }

  /**
   * Spelling: Show the definition, pick the correctly spelled word.
   * "Which is the correct spelling of the word that means 'bright and strong'?"
   * Options: ["vivid", "vivd", "vivvid", "vived"]
   */
  private static generateSpellingQuestion(word: Vocabulary): Question | null {
    if (word.word.length < 3) return null;

    const misspellings = this.generateMisspellings(word.word, 3);
    if (misspellings.length < 3) return null;

    const options = [word.word, ...misspellings];
    const shuffledOptions = this.shuffle(options);
    const correctIndex = shuffledOptions.indexOf(word.word);

    return {
      wordId: word.id,
      word: word.word,
      questionType: 'spelling',
      prompt: `Which is the correct spelling of the word that means "${word.definition}"?`,
      options: shuffledOptions,
      correctIndex,
    };
  }

  /**
   * Generate plausible misspellings of a word.
   */
  private static generateMisspellings(word: string, count: number): string[] {
    const misspellings = new Set<string>();
    const lower = word.toLowerCase();
    const attempts = count * 10;

    for (let i = 0; i < attempts && misspellings.size < count; i++) {
      const strategy = Math.floor(Math.random() * 6);
      let misspelled = '';

      switch (strategy) {
        case 0: {
          // Remove a letter (not first)
          const pos = 1 + Math.floor(Math.random() * (lower.length - 1));
          misspelled = lower.slice(0, pos) + lower.slice(pos + 1);
          break;
        }
        case 1: {
          // Double a letter
          const pos = Math.floor(Math.random() * lower.length);
          misspelled = lower.slice(0, pos) + lower[pos] + lower.slice(pos);
          break;
        }
        case 2: {
          // Swap two adjacent letters
          const pos = Math.floor(Math.random() * (lower.length - 1));
          const chars = lower.split('');
          [chars[pos], chars[pos + 1]] = [chars[pos + 1], chars[pos]];
          misspelled = chars.join('');
          break;
        }
        case 3: {
          // Replace a vowel with another vowel
          const vowels = 'aeiou';
          const vowelPositions = [];
          for (let j = 0; j < lower.length; j++) {
            if (vowels.includes(lower[j])) vowelPositions.push(j);
          }
          if (vowelPositions.length > 0) {
            const pos = vowelPositions[Math.floor(Math.random() * vowelPositions.length)];
            const otherVowels = vowels.replace(lower[pos], '');
            const newVowel = otherVowels[Math.floor(Math.random() * otherVowels.length)];
            misspelled = lower.slice(0, pos) + newVowel + lower.slice(pos + 1);
          }
          break;
        }
        case 4: {
          // Add a random letter
          const pos = 1 + Math.floor(Math.random() * (lower.length - 1));
          const letter = 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
          misspelled = lower.slice(0, pos) + letter + lower.slice(pos);
          break;
        }
        case 5: {
          // Replace a consonant with a similar-sounding one
          const similar: Record<string, string> = {
            b: 'p', p: 'b', d: 't', t: 'd', g: 'k', k: 'g',
            s: 'c', c: 's', f: 'v', v: 'f', m: 'n', n: 'm',
            l: 'r', r: 'l', j: 'g', z: 's', w: 'v', h: '',
          };
          const positions = [];
          for (let j = 0; j < lower.length; j++) {
            if (similar[lower[j]]) positions.push(j);
          }
          if (positions.length > 0) {
            const pos = positions[Math.floor(Math.random() * positions.length)];
            misspelled = lower.slice(0, pos) + similar[lower[pos]] + lower.slice(pos + 1);
          }
          break;
        }
      }

      // Only add if it's different from the real word and has reasonable length
      if (misspelled && misspelled !== lower && misspelled.length >= 2 && misspelled.length <= lower.length + 2) {
        misspellings.add(misspelled);
      }
    }

    return Array.from(misspellings).slice(0, count);
  }

  // --- UTILITIES ---

  private static shuffle<T>(array: T[]): T[] {
    const arr = [...array];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

export function calculatePoints(
  isCorrect: boolean,
  responseTimeMs: number,
  difficultyTier: number,
  streak: number
): number {
  if (!isCorrect) {
    return 0;
  }

  let points = 10 * difficultyTier;

  // Speed bonus
  if (responseTimeMs < 3000) {
    points += 20;
  } else if (responseTimeMs < 8000) {
    points += 10;
  } else if (responseTimeMs < 15000) {
    points += 5;
  }

  // Streak bonus
  if (streak >= 3) {
    points += 5 * Math.floor(streak / 3);
  }

  return points;
}

export function calculateStars(accuracy: number): number {
  if (accuracy >= 0.95) {
    return 3;
  } else if (accuracy >= 0.8) {
    return 2;
  } else if (accuracy >= 0.6) {
    return 1;
  }
  return 0;
}
