import React, { useState } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { GameSummary } from '../types';
import { StarDisplay } from '../components/StarDisplay';
import { CoinDisplay } from '../components/CoinDisplay';

export const ResultsPage: React.FC = () => {
  const { sessionId } = useParams<{ sessionId: string }>();
  const location = useLocation();
  const navigate = useNavigate();

  const { summary, worldName, levelName, timeExpired } = location.state || {};
  const [showWords, setShowWords] = useState(false);

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
  const isSuccess = summary_typed.starsEarned > 0;
  const accuracy = Math.round((summary_typed.questionsCorrect / summary_typed.totalQuestions) * 100);
  const hasConfetti = summary_typed.starsEarned === 3;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-blue-500 p-4 flex flex-col items-center justify-center safe-area-bottom">
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
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8 animate-slideUp">
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

        {/* Words Learned */}
        {summary_typed.wordsLearned > 0 && (
          <div className="mb-8">
            <button
              onClick={() => setShowWords(!showWords)}
              className="w-full bg-gray-100 rounded-lg p-3 flex items-center justify-between font-bold text-gray-700"
            >
              <span>📚 Words Learned: {summary_typed.wordsLearned}</span>
              <span>{showWords ? '▲' : '▼'}</span>
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-4">
          <button
            onClick={() => navigate('/worlds')}
            className="btn-secondary flex-1 py-4 font-bold text-lg"
          >
            Back to Map
          </button>
          <button
            onClick={() => navigate(-1)}
            className="btn-primary flex-1 py-4 font-bold text-lg"
          >
            Play Again
          </button>
        </div>
      </div>
    </div>
  );
};
