import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { GameSummary, QuestionReview, Level } from '../types';
import { StarDisplay } from '../components/StarDisplay';
import { CoinDisplay } from '../components/CoinDisplay';

export const ResultsPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const {
    summary,
    worldName,
    levelName,
    timeExpired,
    questionResults,
    worldId,
    levelNumber,
    levelId,
    levels,
  } = location.state || {};

  const [showReview, setShowReview] = useState(false);

  if (!summary) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4">❓</div>
          <div className="text-white text-xl font-bold">No results found</div>
          <button
            onClick={() => navigate('/worlds')}
            className="btn-primary mt-6 px-8 py-3"
          >
            Back to Home
          </button>
        </div>
      </div>
    );
  }

  const summary_typed: GameSummary = summary;
  const typedQuestionResults: QuestionReview[] = questionResults || [];
  const typedLevels: Level[] = levels || [];
  const isSuccess = summary_typed.starsEarned > 0;
  const accuracy = Math.round((summary_typed.questionsCorrect / summary_typed.totalQuestions) * 100);
  const hasConfetti = summary_typed.starsEarned === 3;

  // Compute next level
  const currentLevelNum = levelNumber || 0;
  const nextLevel = typedLevels.find((l: Level) => l.levelNumber === currentLevelNum + 1);
  const hasNextLevel = !!nextLevel && isSuccess;

  const handleNextLevel = () => {
    if (!nextLevel || !worldId) return;
    navigate(`/play/${nextLevel.id}`, {
      state: {
        worldName,
        levelName: nextLevel.name,
        levelNumber: nextLevel.levelNumber,
        worldId,
        levels: typedLevels,
      },
    });
  };

  const handlePlayAgain = () => {
    if (levelId && worldId) {
      navigate(`/play/${levelId}`, {
        state: {
          worldName,
          levelName,
          levelNumber,
          worldId,
          levels: typedLevels,
        },
      });
    } else {
      navigate(-1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-blue-500 p-4 flex flex-col items-center justify-start safe-area-bottom overflow-y-auto">
      {/* Confetti Effect */}
      {hasConfetti && (
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
          {Array.from({ length: 30 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-confetti"
              style={{
                left: `${Math.random() * 100}%`,
                top: `-10px`,
                width: `${20 + Math.random() * 20}px`,
                height: `${20 + Math.random() * 20}px`,
                backgroundColor: ['#FFD700', '#FFA500', '#FF69B4', '#00CED1', '#32CD32'][
                  Math.floor(Math.random() * 5)
                ],
                borderRadius: '50%',
                animationDelay: `${i * 50}ms`,
                animationDuration: '3s',
              }}
            ></div>
          ))}
        </div>
      )}

      {/* Main Card */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-slideUp mt-8 mb-4">
        {/* Header */}
        <div className="text-center mb-8">
          <p className="text-sm font-bold text-gray-600 mb-2">
            {worldName} • {levelName}
          </p>
          {isSuccess ? (
            <>
              <div className="text-6xl mb-3 animate-bounce">🎉</div>
              <h1 className="text-3xl font-black text-gray-800 mb-2">Level Complete!</h1>
            </>
          ) : (
            <>
              <div className="text-6xl mb-3">💪</div>
              <h1 className="text-3xl font-black text-gray-800 mb-2">Keep Trying!</h1>
            </>
          )}
          {timeExpired && (
            <p className="text-sm text-orange-600 font-bold">Time's up! ⏰</p>
          )}
        </div>

        {/* Stars Display */}
        <div className="flex justify-center mb-8">
          <StarDisplay count={summary_typed.starsEarned} size="lg" animated />
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-8">
          <div className="bg-blue-100 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-blue-600 mb-1">Correct</p>
            <p className="text-2xl font-black text-blue-700">
              {summary_typed.questionsCorrect}/{summary_typed.totalQuestions}
            </p>
          </div>

          <div className="bg-purple-100 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-purple-600 mb-1">Accuracy</p>
            <p className="text-2xl font-black text-purple-700">{accuracy}%</p>
          </div>

          <div className="bg-yellow-100 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-yellow-600 mb-1">Coins</p>
            <p className="text-2xl font-black text-yellow-700">
              +{summary_typed.coinsEarned}
            </p>
          </div>

          <div className="bg-green-100 rounded-2xl p-4 text-center">
            <p className="text-xs font-bold text-green-600 mb-1">Score</p>
            <p className="text-2xl font-black text-green-700">{summary_typed.score}</p>
          </div>
        </div>

        {/* New Title */}
        {summary_typed.titleChanged && (
          <div className="bg-gradient-to-r from-pink-300 to-purple-300 rounded-2xl p-6 mb-8 text-center animate-slideUp">
            <p className="text-sm font-bold text-purple-700 mb-2">🏆 New Achievement!</p>
            <p className="text-lg font-black text-white">
              {summary_typed.newTitle}
            </p>
          </div>
        )}

        {/* Question Review */}
        {typedQuestionResults.length > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setShowReview(!showReview)}
              className="w-full bg-gray-100 rounded-2xl p-4 flex items-center justify-between font-bold text-gray-700 active:scale-95 transition-all"
            >
              <span>📝 Review Answers ({summary_typed.questionsCorrect}/{summary_typed.totalQuestions} correct)</span>
              <span className="text-lg">{showReview ? '▲' : '▼'}</span>
            </button>

            {showReview && (
              <div className="mt-3 space-y-3 animate-slideDown">
                {typedQuestionResults.map((qr: QuestionReview, i: number) => (
                  <div
                    key={i}
                    className={`rounded-2xl p-4 border-2 ${
                      qr.wasCorrect
                        ? 'bg-green-50 border-green-200'
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm ${
                        qr.wasCorrect ? 'bg-green-400' : 'bg-red-400'
                      }`}>
                        {qr.wasCorrect ? '✓' : '✗'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-black text-gray-800 text-base">{qr.word}</p>
                        <p className="text-xs text-gray-500 mt-0.5 leading-snug">{qr.prompt}</p>

                        {qr.wasCorrect ? (
                          <p className="text-sm text-green-600 font-bold mt-2">
                            ✅ {qr.correctAnswer}
                          </p>
                        ) : (
                          <div className="mt-2 space-y-1">
                            {qr.selectedAnswer ? (
                              <p className="text-sm text-red-500 font-bold">
                                ❌ Your answer: {qr.selectedAnswer}
                              </p>
                            ) : (
                              <p className="text-sm text-orange-500 font-bold">
                                ⏰ Time ran out
                              </p>
                            )}
                            <p className="text-sm text-green-600 font-bold">
                              ✅ Correct: {qr.correctAnswer}
                            </p>
                            {qr.explanation && (
                              <p className="text-xs text-gray-500 mt-1 italic">{qr.explanation}</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-3">
          {/* Next Level — prominent, only when available */}
          {hasNextLevel && (
            <button
              onClick={handleNextLevel}
              className="w-full py-4 bg-gradient-to-r from-green-400 to-emerald-500 text-white font-black text-lg rounded-2xl active:scale-95 transition-all shadow-lg"
            >
              Next Level →
            </button>
          )}

          <div className="flex gap-3">
            <button
              onClick={() => worldId ? navigate(`/worlds/${worldId}`) : navigate('/worlds')}
              className="btn-secondary flex-1 py-4 font-bold text-base"
            >
              Back to Map
            </button>
            <button
              onClick={handlePlayAgain}
              className="btn-primary flex-1 py-4 font-bold text-base"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
