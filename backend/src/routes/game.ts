import { Router, Response } from 'express';
import { v4 as uuid } from 'uuid';
import { execute, queryOne, queryAll, executeBatch } from '../database/db';
import { AuthRequest, authMiddleware } from '../middleware/auth';
import { QuestionGenerator, calculatePoints, calculateStars } from '../services/questionGenerator';
import { GameSession, SessionAnswer, Level, Vocabulary, PlayerProgress, LevelCompletion, Question } from '../types';

const router = Router();

// In-memory store for generated questions so we can validate answers for
// non-deterministic question types (e.g. true_false).
// Key: "sessionId:wordId" → Question with correctIndex
const sessionQuestions = new Map<string, Question>();

// Clean up questions for a session when it completes
function cleanupSession(sessionId: string) {
  for (const key of sessionQuestions.keys()) {
    if (key.startsWith(sessionId + ':')) {
      sessionQuestions.delete(key);
    }
  }
}

// POST /api/game/start
router.post('/start', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { levelId } = req.body;

    if (!levelId) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'levelId is required',
      });
      return;
    }

    // Get level
    const level = queryOne<Level>(
      'SELECT * FROM levels WHERE id = ?',
      [levelId]
    );

    if (!level) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Level not found',
      });
      return;
    }

    // Create game session
    const sessionId = uuid();
    const now = Date.now();

    execute(
      `INSERT INTO game_sessions (id, user_id, level_id, started_at, status)
       VALUES (?, ?, ?, ?, ?)`,
      [sessionId, req.userId, levelId, now, 'active']
    );

    // Generate questions
    const questions = QuestionGenerator.generateQuestionsForLevel(levelId, level.target_word_count);

    if (questions.length === 0) {
      res.status(500).json({
        error: 'Internal Server Error',
        message: 'Could not generate questions',
      });
      return;
    }

    // Store questions in memory for answer validation
    for (const q of questions) {
      sessionQuestions.set(`${sessionId}:${q.wordId}`, q);
    }

    res.status(201).json({
      session: {
        id: sessionId,
        levelId,
        levelName: level.name,
        difficultyTier: level.difficulty_tier,
        timeLimit: level.time_limit_seconds,
        totalQuestions: questions.length,
        questions: questions.map(q => ({
          wordId: q.wordId,
          word: q.word,
          questionType: q.questionType,
          prompt: q.prompt,
          options: q.options,
        })),
      },
    });
  } catch (error) {
    console.error('Start game error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to start game',
    });
  }
});

// POST /api/game/answer
router.post('/answer', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { sessionId, wordId, questionType, answer } = req.body;

    if (!sessionId || !wordId || !questionType || answer === undefined) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'sessionId, wordId, questionType, and answer are required',
      });
      return;
    }

    // Verify session exists and belongs to user
    const session = queryOne<GameSession>(
      'SELECT * FROM game_sessions WHERE id = ? AND user_id = ?',
      [sessionId, req.userId]
    );

    if (!session) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Session not found',
      });
      return;
    }

    if (session.status !== 'active') {
      res.status(400).json({
        error: 'Bad Request',
        message: 'Session is not active',
      });
      return;
    }

    // Get word
    const word = queryOne<Vocabulary>(
      'SELECT * FROM vocabulary WHERE id = ?',
      [wordId]
    );

    if (!word) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Word not found',
      });
      return;
    }

    // Get level for points calculation
    const level = queryOne<Level>(
      'SELECT * FROM levels WHERE id = ?',
      [session.level_id]
    );

    // Look up the stored question for this session+word
    const storedQuestion = sessionQuestions.get(`${sessionId}:${wordId}`);

    // Determine correct answer based on question type
    let correctAnswer = '';
    let isCorrect = false;

    switch (questionType) {
      case 'definition':
        correctAnswer = word.definition;
        isCorrect = answer === word.definition;
        break;
      case 'fill_blank':
        correctAnswer = word.word;
        isCorrect = answer.toLowerCase() === word.word.toLowerCase();
        break;
      case 'synonym': {
        const synRelation = queryOne<any>(
          'SELECT wr.related_word_id FROM word_relationships wr WHERE wr.word_id = ? AND wr.relationship_type = ?',
          [wordId, 'synonym']
        );
        if (synRelation) {
          const synonym = queryOne<Vocabulary>(
            'SELECT * FROM vocabulary WHERE id = ?',
            [synRelation.related_word_id]
          );
          if (synonym) {
            correctAnswer = synonym.word;
            isCorrect = answer.toLowerCase() === synonym.word.toLowerCase();
          }
        }
        break;
      }
      case 'reverse_definition':
        correctAnswer = word.word;
        isCorrect = answer.toLowerCase() === word.word.toLowerCase();
        break;
      case 'true_false': {
        // true_false correct answer depends on what was randomly generated.
        // Use the stored question to validate.
        if (storedQuestion) {
          correctAnswer = storedQuestion.options[storedQuestion.correctIndex];
          isCorrect = answer === correctAnswer;
        }
        break;
      }
      case 'example_sentence':
        correctAnswer = word.example_sentence;
        isCorrect = answer === word.example_sentence;
        break;
      case 'antonym': {
        const antRelation = queryOne<any>(
          'SELECT wr.related_word_id FROM word_relationships wr WHERE wr.word_id = ? AND wr.relationship_type = ?',
          [wordId, 'antonym']
        );
        if (antRelation) {
          const antonym = queryOne<Vocabulary>(
            'SELECT * FROM vocabulary WHERE id = ?',
            [antRelation.related_word_id]
          );
          if (antonym) {
            correctAnswer = antonym.word;
            isCorrect = answer.toLowerCase() === antonym.word.toLowerCase();
          }
        }
        break;
      }
      case 'spelling':
        // Correct answer is the exact spelling of the word
        correctAnswer = word.word;
        isCorrect = answer === word.word;
        break;
    }

    // Calculate points
    const responseTimeMs = Date.now() - session.started_at;
    const previousAnswers = queryAll<SessionAnswer>(
      'SELECT is_correct FROM session_answers WHERE session_id = ?',
      [sessionId]
    );

    let streak = 0;
    if (isCorrect) {
      for (let i = previousAnswers.length - 1; i >= 0; i--) {
        if (previousAnswers[i].is_correct) {
          streak++;
        } else {
          break;
        }
      }
      streak++;
    }

    const pointsEarned = calculatePoints(isCorrect, responseTimeMs, level?.difficulty_tier || 1, streak);

    // Save answer
    const answerId = uuid();
    execute(
      `INSERT INTO session_answers (id, session_id, word_id, question_type, correct_answer, user_answer, is_correct, response_time_ms, points_earned)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [answerId, sessionId, wordId, questionType, correctAnswer, answer, isCorrect ? 1 : 0, responseTimeMs, pointsEarned]
    );

    res.json({
      correct: isCorrect,
      correctAnswer,
      pointsEarned,
      streakCount: streak,
      explanation: isCorrect ? 'Correct!' : `The correct answer is: ${correctAnswer}`,
    } as any);
  } catch (error) {
    console.error('Answer error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to process answer',
    });
  }
});

// POST /api/game/complete
router.post('/complete', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.body;

    if (!sessionId) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'sessionId is required',
      });
      return;
    }

    // Get session
    const session = queryOne<GameSession>(
      'SELECT * FROM game_sessions WHERE id = ? AND user_id = ?',
      [sessionId, req.userId]
    );

    if (!session) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Session not found',
      });
      return;
    }

    // Get all answers
    const answers = queryAll<SessionAnswer>(
      'SELECT * FROM session_answers WHERE session_id = ?',
      [sessionId]
    );

    // Calculate statistics
    const correctCount = answers.filter(a => a.is_correct).length;
    const totalCount = answers.length;
    const accuracy = totalCount > 0 ? correctCount / totalCount : 0;
    const score = answers.reduce((sum, a) => sum + a.points_earned, 0);
    const starsEarned = calculateStars(accuracy);
    const baseCoins = queryOne<Level>(
      'SELECT base_coins FROM levels WHERE id = ?',
      [session.level_id]
    )?.base_coins || 100;
    const coinsEarned = Math.floor(baseCoins * (0.5 + accuracy * 0.5));

    const now = Date.now();

    // Get or create level completion
    const existingCompletion = queryOne<LevelCompletion>(
      'SELECT * FROM level_completion WHERE user_id = ? AND level_id = ?',
      [req.userId, session.level_id]
    );

    const statements = [];

    // Update session
    statements.push({
      sql: `UPDATE game_sessions SET ended_at = ?, status = ?, score = ?, coins_earned = ?, accuracy = ?, stars_earned = ?
            WHERE id = ?`,
      params: [now, 'completed', score, coinsEarned, accuracy, starsEarned, sessionId],
    });

    // Update or create level completion
    if (existingCompletion) {
      statements.push({
        sql: `UPDATE level_completion SET best_stars = MAX(?, best_stars), best_score = MAX(?, best_score), times_played = times_played + 1
              WHERE id = ?`,
        params: [starsEarned, score, existingCompletion.id],
      });
    } else {
      statements.push({
        sql: `INSERT INTO level_completion (id, user_id, level_id, best_stars, best_score, times_played)
              VALUES (?, ?, ?, ?, ?, ?)`,
        params: [uuid(), req.userId, session.level_id, starsEarned, score, 1],
      });
    }

    // Update word mastery for each answer
    for (const answer of answers) {
      const existingMastery = queryOne<any>(
        'SELECT * FROM word_mastery WHERE user_id = ? AND word_id = ?',
        [req.userId, answer.word_id]
      );

      if (existingMastery) {
        const newTimesCorrect = existingMastery.times_correct + (answer.is_correct ? 1 : 0);
        const newTimesAttempted = existingMastery.times_attempted + 1;
        const masteryLevel = newTimesCorrect >= newTimesAttempted * 0.8 ? 'mastered' :
                            newTimesCorrect >= newTimesAttempted * 0.5 ? 'proficient' :
                            newTimesCorrect > 0 ? 'learning' : 'new';

        statements.push({
          sql: `UPDATE word_mastery SET times_correct = ?, times_attempted = ?, mastery_level = ?
                WHERE id = ?`,
          params: [newTimesCorrect, newTimesAttempted, masteryLevel, existingMastery.id],
        });
      } else {
        statements.push({
          sql: `INSERT INTO word_mastery (id, user_id, word_id, times_correct, times_attempted, mastery_level)
                VALUES (?, ?, ?, ?, ?, ?)`,
          params: [
            uuid(),
            req.userId,
            answer.word_id,
            answer.is_correct ? 1 : 0,
            1,
            answer.is_correct ? 'learning' : 'new',
          ],
        });
      }
    }

    // Get current progress
    const currentProgress = queryOne<PlayerProgress>(
      'SELECT * FROM player_progress WHERE user_id = ?',
      [req.userId]
    );

    const newTotalCoins = (currentProgress?.total_coins || 0) + coinsEarned;
    const newTotalStars = (currentProgress?.total_stars || 0) + starsEarned;
    const wordsMastered = queryAll<any>(
      'SELECT COUNT(*) as count FROM word_mastery WHERE user_id = ? AND mastery_level = ?',
      [req.userId, 'mastered']
    )[0]?.count || 0;

    // Update player progress
    statements.push({
      sql: `UPDATE player_progress SET total_coins = ?, total_stars = ?, words_mastered = ?
            WHERE user_id = ?`,
      params: [newTotalCoins, newTotalStars, wordsMastered, req.userId],
    });

    executeBatch(statements);

    // Clean up in-memory question store for this session
    cleanupSession(sessionId);

    // Get updated progress
    const updatedProgress = queryOne<PlayerProgress>(
      'SELECT * FROM player_progress WHERE user_id = ?',
      [req.userId]
    );

    // Determine title
    const titles = [
      { threshold: 301, title: 'Vocabulary Genius' },
      { threshold: 201, title: 'Word Wizard' },
      { threshold: 101, title: 'Language Master' },
      { threshold: 51, title: 'Vocabulary Champion' },
      { threshold: 11, title: 'Word Scholar' },
      { threshold: 0, title: 'Word Apprentice' },
    ];
    const newTitle = titles.find(t => newTotalStars >= t.threshold)?.title || 'Word Apprentice';
    const oldTitle = currentProgress?.current_title || 'Word Apprentice';
    const titleChanged = newTitle !== oldTitle;

    if (titleChanged) {
      execute('UPDATE player_progress SET current_title = ? WHERE user_id = ?', [newTitle, req.userId]);
    }

    res.json({
      summary: {
        sessionId,
        levelId: session.level_id,
        score,
        accuracy: Math.round(accuracy * 100),
        starsEarned,
        coinsEarned,
        totalCoins: updatedProgress?.total_coins || 0,
        totalStars: updatedProgress?.total_stars || 0,
        wordsLearned: answers.length,
        questionsCorrect: correctCount,
        totalQuestions: totalCount,
        newTitle,
        titleChanged,
      },
    });
  } catch (error) {
    console.error('Complete game error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to complete game',
    });
  }
});

// GET /api/game/session/:sessionId
router.get('/session/:sessionId', authMiddleware, (req: AuthRequest, res: Response) => {
  try {
    const { sessionId } = req.params;

    const session = queryOne<GameSession>(
      'SELECT * FROM game_sessions WHERE id = ? AND user_id = ?',
      [sessionId, req.userId]
    );

    if (!session) {
      res.status(404).json({
        error: 'Not Found',
        message: 'Session not found',
      });
      return;
    }

    const level = queryOne<Level>(
      'SELECT * FROM levels WHERE id = ?',
      [session.level_id]
    );

    const answers = queryAll<SessionAnswer>(
      'SELECT * FROM session_answers WHERE session_id = ?',
      [sessionId]
    );

    res.json({
      session: {
        id: session.id,
        levelId: session.level_id,
        levelName: level?.name,
        startedAt: session.started_at,
        endedAt: session.ended_at,
        status: session.status,
        score: session.score,
        coinsEarned: session.coins_earned,
        accuracy: session.accuracy,
        starsEarned: session.stars_earned,
        answersCount: answers.length,
      },
    });
  } catch (error) {
    console.error('Get session error:', error);
    res.status(500).json({
      error: 'Internal Server Error',
      message: 'Failed to get session',
    });
  }
});

export default router;
