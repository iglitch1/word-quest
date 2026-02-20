import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { GameSession, Question, AnswerResult, GameSummary } from '../types';
import { AliceChase } from '../components/AliceChase';
import { WonderlandMusic } from '../components/WonderlandMusic';

const QUESTION_TIME_LIMIT = 20; // seconds per question

export const GamePlayPage: React.FC = () => {
  const { levelId } = useParams<{ levelId: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { post } = useApi();

  const [session, setSession] = useState<GameSession | null>(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, AnswerResult>>(new Map());
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [feedback, setFeedback] = useState<AnswerResult | null>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [questionTimeLeft, setQuestionTimeLeft] = useState(QUESTION_TIME_LIMIT);
  const [isAnswering, setIsAnswering] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [showExitConfirm, setShowExitConfirm] = useState(false);
  const [streak, setStreak] = useState(0);
  const [totalCoinsEarned, setTotalCoinsEarned] = useState(0);
  const [wrongAnswerCount, setWrongAnswerCount] = useState(0);
  const [correctAnswerCount, setCorrectAnswerCount] = useState(0);
  const [lastAnswerCorrect, setLastAnswerCorrect] = useState<boolean | null>(null);
  const [musicOn, setMusicOn] = useState(true);
  const levelTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const questionTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const worldName = location.state?.worldName || 'Unknown World';
  const levelName = location.state?.levelName || 'Level';
  const levelNumber = location.state?.levelNumber || 1;

  // Start game session
  useEffect(() => {
    const startGame = async () => {
      try {
        const data = await post('/api/game/start', { levelId });
        setSession(data.session);
        setTimeLeft(data.session.timeLimit);
        setQuestionTimeLeft(QUESTION_TIME_LIMIT);
      } catch (error) {
        console.error('Failed to start game:', error);
        navigate('/worlds');
      }
    };

    startGame();
  }, [levelId]);

  // Level timer countdown
  useEffect(() => {
    if (!session || timeLeft <= 0) return;

    levelTimerRef.current = setInterval(() => {
      if (!isPaused) {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            completeGame(true);
            return 0;
          }
          return prev - 1;
        });
      }
    }, 1000);

    return () => {
      if (levelTimerRef.current) clearInterval(levelTimerRef.current);
    };
  }, [session, isPaused]);

  // Per-question timer countdown
  useEffect(() => {
    if (!session || isAnswering || isPaused) return;

    questionTimerRef.current = setInterval(() => {
      setQuestionTimeLeft((prev) => {
        if (prev <= 1) {
          // Time's up for this question — auto-skip as wrong
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    };
  }, [session, currentQuestionIndex, isAnswering, isPaused]);

  const handleTimeUp = useCallback(async () => {
    if (!session || isAnswering) return;

    const question = session.questions[currentQuestionIndex];
    setIsAnswering(true);

    try {
      // Submit a wrong answer (empty string — will always be wrong)
      const result = await post('/api/game/answer', {
        sessionId: session.id,
        wordId: question.wordId,
        questionType: question.questionType,
        answer: '__TIME_UP__',
      });

      setFeedback(result);
      setLastAnswerCorrect(false);
      setStreak(0);
      setWrongAnswerCount((prev) => prev + 1);

      setTimeout(() => {
        if (currentQuestionIndex + 1 < session.questions.length) {
          setCurrentQuestionIndex((prev) => prev + 1);
          setSelectedAnswer(null);
          setFeedback(null);
          setIsAnswering(false);
          setLastAnswerCorrect(null);
          setQuestionTimeLeft(QUESTION_TIME_LIMIT);
        } else {
          completeGame();
        }
      }, 1500);
    } catch (error) {
      console.error('Failed to submit timeout:', error);
      setIsAnswering(false);
    }
  }, [session, currentQuestionIndex, isAnswering]);

  const completeGame = async (timeExpired = false) => {
    if (!session) return;

    if (levelTimerRef.current) clearInterval(levelTimerRef.current);
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);

    try {
      const data = await post('/api/game/complete', { sessionId: session.id });
      const summary: GameSummary = data.summary;

      navigate(`/results/${session.id}`, {
        state: {
          summary,
          worldName,
          levelName,
          timeExpired,
        },
      });
    } catch (error) {
      console.error('Failed to complete game:', error);
    }
  };

  const handleAnswer = async (selectedIndex: number) => {
    if (!session || isAnswering || isPaused) return;

    const question = session.questions[currentQuestionIndex];
    setSelectedAnswer(selectedIndex);
    setIsAnswering(true);

    // Stop question timer
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);

    try {
      const result = await post('/api/game/answer', {
        sessionId: session.id,
        wordId: question.wordId,
        questionType: question.questionType,
        answer: question.options[selectedIndex],
      });

      setFeedback(result);
      setAnswers((prev) => new Map(prev).set(question.wordId, result));
      setLastAnswerCorrect(result.correct);

      if (result.correct) {
        setStreak(result.streakCount);
        setTotalCoinsEarned((prev) => prev + result.pointsEarned);
        setCorrectAnswerCount((prev) => prev + 1);
      } else {
        setStreak(0);
        setWrongAnswerCount((prev) => prev + 1);
      }

      // Auto-advance after 1.5 seconds
      setTimeout(() => {
        if (currentQuestionIndex + 1 < session.questions.length) {
          setCurrentQuestionIndex((prev) => prev + 1);
          setSelectedAnswer(null);
          setFeedback(null);
          setIsAnswering(false);
          setLastAnswerCorrect(null);
          setQuestionTimeLeft(QUESTION_TIME_LIMIT);
        } else {
          completeGame();
        }
      }, 1500);
    } catch (error) {
      console.error('Failed to submit answer:', error);
      setIsAnswering(false);
    }
  };

  const togglePause = () => {
    setIsPaused((prev) => !prev);
  };

  const handleExitGame = () => {
    setShowExitConfirm(true);
    setIsPaused(true);
  };

  const confirmExit = () => {
    if (levelTimerRef.current) clearInterval(levelTimerRef.current);
    if (questionTimerRef.current) clearInterval(questionTimerRef.current);
    navigate('/worlds');
  };

  const cancelExit = () => {
    setShowExitConfirm(false);
    setIsPaused(false);
  };

  if (!session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-600 via-teal-700 to-amber-600 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-2 animate-bounce">👧</div>
          {levelNumber % 2 === 1 ? (
            <img src="/bunny.png" alt="Bunny" className="w-16 h-20 object-contain mx-auto mb-4 animate-bounce" style={{ animationDelay: '0.2s' }} />
          ) : (
            <img src="/budgie.png" alt="Budgie" className="w-20 h-16 object-contain mx-auto mb-4 animate-bounce" style={{ animationDelay: '0.2s' }} />
          )}
          <div className="text-white text-xl font-bold">Entering Wonderland...</div>
          <div className="text-yellow-200 text-sm mt-2">
            Help Alice rescue {levelNumber % 2 === 1 ? 'Bunny' : 'Budgie'}!
          </div>
        </div>
      </div>
    );
  }

  const question = session.questions[currentQuestionIndex];
  const isCorrect = feedback?.correct;
  const timerPercentage = (timeLeft / session.timeLimit) * 100;
  const questionTimerPercent = (questionTimeLeft / QUESTION_TIME_LIMIT) * 100;
  const isTrueFalse = question.questionType === 'true_false';
  const hideWord = ['fill_blank', 'reverse_definition', 'spelling'].includes(question.questionType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-teal-700 to-amber-600 p-4 safe-area-top relative">
      {/* Background Music */}
      <WonderlandMusic isPlaying={musicOn} isPaused={isPaused} />

      {/* Top Bar */}
      <div className="mb-3">
        <div className="flex items-center justify-between mb-2">
          {/* Back button */}
          <button
            onClick={handleExitGame}
            className="text-white/70 active:text-white active:scale-95 transition-all p-1"
          >
            <span className="text-2xl">←</span>
          </button>

          <div className="text-white text-center flex-1">
            <p className="text-sm font-bold opacity-75">
              {worldName} • {levelName}
            </p>
            <p className="text-xs text-gray-200">
              Q {currentQuestionIndex + 1}/{session.totalQuestions}
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Music toggle */}
            <button
              onClick={() => setMusicOn((prev) => !prev)}
              className="text-white/70 active:text-white active:scale-95 transition-all p-1"
            >
              <span className="text-2xl">{musicOn ? '🔊' : '🔇'}</span>
            </button>

            {/* Pause button */}
            <button
              onClick={togglePause}
              className="text-white/70 active:text-white active:scale-95 transition-all p-1"
            >
              <span className="text-2xl">{isPaused ? '▶️' : '⏸️'}</span>
            </button>

            {/* Level timer */}
            <div className="text-right">
              <p className={`text-xl font-black ${
                timeLeft > 10 ? 'text-white' : 'text-red-300 animate-pulse'
              }`}>
                {String(Math.floor(timeLeft / 60)).padStart(2, '0')}:
                {String(timeLeft % 60).padStart(2, '0')}
              </p>
            </div>
          </div>
        </div>

        {/* Level Timer Bar */}
        <div className="w-full h-1.5 bg-white bg-opacity-20 rounded-full overflow-hidden mb-2">
          <div
            className={`h-full transition-all duration-300 ${
              timerPercentage > 30
                ? 'bg-gradient-to-r from-green-400 to-green-500'
                : 'bg-gradient-to-r from-orange-400 to-red-500'
            }`}
            style={{ width: `${timerPercentage}%` }}
          ></div>
        </div>

        {/* Per-question Timer Bar */}
        {!isAnswering && (
          <div className="w-full h-2.5 bg-white bg-opacity-20 rounded-full overflow-hidden mb-3">
            <div
              className={`h-full transition-all duration-1000 linear ${
                questionTimerPercent > 40
                  ? 'bg-gradient-to-r from-cyan-400 to-blue-400'
                  : questionTimerPercent > 20
                  ? 'bg-gradient-to-r from-yellow-400 to-orange-400'
                  : 'bg-gradient-to-r from-red-400 to-red-600 animate-pulse'
              }`}
              style={{ width: `${questionTimerPercent}%` }}
            ></div>
          </div>
        )}

        {/* Question timer seconds display when low */}
        {!isAnswering && questionTimeLeft <= 5 && (
          <div className="text-center -mt-1 mb-1">
            <span className="text-red-300 text-xs font-black animate-pulse">
              {questionTimeLeft}s left!
            </span>
          </div>
        )}

        {/* Alice Chase Animation */}
        <AliceChase
          currentQuestion={currentQuestionIndex}
          totalQuestions={session.totalQuestions}
          correctAnswers={correctAnswerCount}
          wrongAnswers={wrongAnswerCount}
          lastAnswerCorrect={lastAnswerCorrect}
          levelNumber={levelNumber}
        />
      </div>

      {/* Main Game Area */}
      <div className="flex flex-col items-center justify-center py-4">
        {/* Word Badge — hidden when the word is the answer */}
        {!hideWord && (
          <div className="bg-white rounded-full px-8 py-5 shadow-xl mb-8 text-center">
            <p className="text-sm font-bold text-gray-600 mb-1">Word</p>
            <p className="text-3xl font-black text-purple-600">{question.word}</p>
          </div>
        )}

        {/* Question Prompt */}
        <p className="text-white text-lg font-bold text-center mb-8 px-4 leading-relaxed">
          {question.prompt}
        </p>

        {/* Options */}
        <div className={`w-full max-w-sm mb-6 ${
          isTrueFalse ? 'flex gap-4' : 'space-y-3'
        }`}>
          {question.options.map((option, index) => (
            <button
              key={index}
              onClick={() => !feedback && handleAnswer(index)}
              disabled={isAnswering || isPaused}
              className={`${isTrueFalse ? 'flex-1' : 'w-full'} py-4 rounded-2xl font-bold text-lg transition-all active:scale-95 shadow-lg transform ${
                feedback
                  ? option === feedback.correctAnswer
                    ? 'bg-green-400 text-white scale-105'
                    : index === selectedAnswer
                    ? 'bg-red-400 text-white'
                    : 'bg-white bg-opacity-40 text-white opacity-50'
                  : selectedAnswer === index
                  ? 'bg-yellow-300 text-white scale-105'
                  : isTrueFalse
                  ? index === 0
                    ? 'bg-green-100 text-green-700 border-2 border-green-300'
                    : 'bg-red-100 text-red-700 border-2 border-red-300'
                  : 'bg-white text-purple-600'
              } ${isTrueFalse ? 'text-xl' : ''}`}
            >
              {isTrueFalse && (
                <span className="mr-2">{index === 0 ? '✅' : '❌'}</span>
              )}
              {option}
            </button>
          ))}
        </div>

        {/* Feedback Messages */}
        {feedback && (
          <div className="text-center mb-4 animate-slideUp">
            {isCorrect ? (
              <>
                <div className="text-4xl mb-2">✨</div>
                <p className="text-white text-2xl font-black mb-1">Correct!</p>
                <p className="text-yellow-200 font-bold">+{feedback.pointsEarned} points</p>
                <p className="text-green-200 text-sm mt-1">Alice leaps ahead!</p>
                {streak > 2 && (
                  <p className="text-orange-300 font-black mt-2">
                    🔥 {streak} in a row! 🔥
                  </p>
                )}
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">😰</div>
                <p className="text-white text-2xl font-black mb-1">
                  {selectedAnswer === null ? "Time's up!" : 'Not quite!'}
                </p>
                <p className="text-red-200 text-sm mb-1">The Queen gets closer!</p>
                <p className="text-gray-100 text-sm mb-2">{feedback.explanation}</p>
                <p className="text-yellow-200 font-bold">
                  Correct answer: <span className="text-white">{feedback.correctAnswer}</span>
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* Streak and Coins Counter */}
      {(streak > 0 || totalCoinsEarned > 0) && (
        <div className="flex justify-center gap-6 mt-4">
          {streak > 0 && (
            <div className="bg-orange-400 text-white font-bold px-4 py-2 rounded-full text-sm">
              🔥 Streak: {streak}
            </div>
          )}
          {totalCoinsEarned > 0 && (
            <div className="bg-yellow-300 text-white font-bold px-4 py-2 rounded-full text-sm">
              🪙 +{totalCoinsEarned}
            </div>
          )}
        </div>
      )}

      {/* Pause Overlay */}
      {isPaused && !showExitConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 mx-6 text-center shadow-2xl">
            <div className="text-5xl mb-4">⏸️</div>
            <h2 className="text-2xl font-black text-purple-600 mb-2">Game Paused</h2>
            <p className="text-gray-500 mb-6">Take a breather!</p>
            <div className="space-y-3">
              <button
                onClick={togglePause}
                className="w-full py-3 bg-gradient-to-r from-green-400 to-green-500 text-white font-bold text-lg rounded-2xl active:scale-95 transition-all shadow-lg"
              >
                ▶️ Resume
              </button>
              <button
                onClick={handleExitGame}
                className="w-full py-3 bg-gray-100 text-gray-600 font-bold rounded-2xl active:scale-95 transition-all"
              >
                ← Back to Map
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Exit Confirmation Modal */}
      {showExitConfirm && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-white rounded-3xl p-8 mx-6 text-center shadow-2xl">
            <div className="text-5xl mb-4">🏃‍♀️</div>
            <h2 className="text-xl font-black text-purple-600 mb-2">Leave Wonderland?</h2>
            <p className="text-gray-500 mb-6 text-sm">
              Alice and {levelNumber % 2 === 1 ? 'Bunny' : 'Budgie'} still need your help!
              <br />Your progress won't be saved.
            </p>
            <div className="space-y-3">
              <button
                onClick={cancelExit}
                className="w-full py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold text-lg rounded-2xl active:scale-95 transition-all shadow-lg"
              >
                Keep Playing!
              </button>
              <button
                onClick={confirmExit}
                className="w-full py-3 bg-gray-100 text-gray-500 font-bold rounded-2xl active:scale-95 transition-all"
              >
                Leave Game
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
