import React, { useEffect, useState } from 'react';

interface AliceChaseProps {
  currentQuestion: number;
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  lastAnswerCorrect: boolean | null;
  levelNumber?: number; // odd = bunny, even = budgie
}

export const AliceChase: React.FC<AliceChaseProps> = ({
  currentQuestion,
  totalQuestions,
  correctAnswers,
  wrongAnswers,
  lastAnswerCorrect,
  levelNumber = 1,
}) => {
  const [sparkles, setSparkles] = useState<{ id: number; x: number; y: number }[]>([]);
  const [shakeScreen, setShakeScreen] = useState(false);

  // Which pet to rescue? Odd levels = bunny, even levels = budgie
  const isBunny = levelNumber % 2 === 1;
  const petName = isBunny ? 'Bunny' : 'Budgie';
  const petEmoji = isBunny ? '🐇' : '🦜';

  // ALICE only moves forward on CORRECT answers
  const alicePercent = 8 + (correctAnswers / totalQuestions) * 82;

  // QUEEN advances on every WRONG answer
  const queenRawPercent = wrongAnswers * (85 / totalQuestions);

  // Queen stops right behind Alice — never jumps through her
  const queenPercent = Math.min(queenRawPercent, alicePercent - 3);

  // Did the Queen catch Alice?
  const queenCaught = queenRawPercent >= alicePercent;
  const gap = alicePercent - queenRawPercent;
  const isClose = gap < 20 && gap > 0;
  const isDanger = gap < 10 || queenCaught;

  // Pet hops ahead of Alice near the door
  const petPercent = Math.min(90, alicePercent + 6);

  // Spawn sparkles on correct answer
  useEffect(() => {
    if (lastAnswerCorrect === true) {
      const newSparkles = Array.from({ length: 8 }, (_, i) => ({
        id: Date.now() + i,
        x: Math.random() * 80 - 40,
        y: Math.random() * -80 - 20,
      }));
      setSparkles(newSparkles);
      const timer = setTimeout(() => setSparkles([]), 900);
      return () => clearTimeout(timer);
    }
  }, [lastAnswerCorrect, currentQuestion]);

  // Screen shake on wrong answer
  useEffect(() => {
    if (lastAnswerCorrect === false) {
      setShakeScreen(true);
      const timer = setTimeout(() => setShakeScreen(false), 600);
      return () => clearTimeout(timer);
    }
  }, [lastAnswerCorrect, currentQuestion]);

  const aliceAnimClass =
    lastAnswerCorrect === true
      ? 'alice-mega-leap'
      : lastAnswerCorrect === false
      ? 'alice-trip'
      : '';

  const queenAnimClass =
    lastAnswerCorrect === false
      ? 'queen-charge'
      : lastAnswerCorrect === true
      ? 'queen-frustrated'
      : '';

  const questionsAnswered = correctAnswers + wrongAnswers;
  const sceneryOffset = (questionsAnswered / totalQuestions) * 300;

  return (
    <div className={`chase-container ${shakeScreen ? 'chase-shake' : ''}`}>
      {/* ===== LARGE CHASE SCENE ===== */}
      <div className="relative w-full h-48 rounded-3xl overflow-hidden border-2 border-yellow-400/70 shadow-2xl">
        {/* Sky gradient */}
        <div className="absolute inset-0 bg-gradient-to-b from-indigo-900 via-purple-800 to-teal-700" />

        {/* Moon */}
        <div className="absolute top-3 right-8 w-10 h-10 rounded-full bg-yellow-200/80 shadow-lg shadow-yellow-200/30" />

        {/* Stars twinkling in sky */}
        {[10, 20, 35, 50, 65, 80].map((pos, i) => (
          <div
            key={i}
            className="absolute text-sm chase-twinkle"
            style={{ top: `${8 + (i % 3) * 8}%`, left: `${pos}%`, animationDelay: `${i * 0.4}s` }}
          >
            *
          </div>
        ))}

        {/* Rolling hills background */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-green-900 via-green-800/90 to-transparent" />
        <div
          className="absolute bottom-16 left-0 w-[200%] h-12 opacity-30"
          style={{
            borderRadius: '50% 50% 0 0',
            background: 'linear-gradient(to right, #065f46, #047857, #065f46, #047857)',
            transform: `translateX(-${sceneryOffset * 0.15}px)`,
          }}
        />

        {/* Scrolling path */}
        <div
          className="absolute bottom-0 left-0 h-8 w-[200%] chase-ground-scroll"
          style={{
            backgroundImage: 'repeating-linear-gradient(90deg, #92400e 0px, #92400e 24px, #78350f 24px, #78350f 48px)',
            transform: `translateX(-${sceneryOffset % 48}px)`,
          }}
        />

        {/* Scrolling Wonderland landmarks — BIGGER */}
        <div className="absolute bottom-8 w-full" style={{ transform: `translateX(-${sceneryOffset * 0.3}px)` }}>
          <span className="absolute text-4xl opacity-30" style={{ left: '5%' }}>🍄</span>
          <span className="absolute text-3xl opacity-25" style={{ left: '20%' }}>🌹</span>
          <span className="absolute text-4xl opacity-30" style={{ left: '40%' }}>🫖</span>
          <span className="absolute text-3xl opacity-25" style={{ left: '55%' }}>🃏</span>
          <span className="absolute text-4xl opacity-30" style={{ left: '75%' }}>🍄</span>
          <span className="absolute text-3xl opacity-25" style={{ left: '90%' }}>🌹</span>
          <span className="absolute text-4xl opacity-30" style={{ left: '110%' }}>🫖</span>
          <span className="absolute text-3xl opacity-25" style={{ left: '130%' }}>🃏</span>
        </div>

        {/* Danger zone overlay */}
        {isDanger && (
          <div className="absolute inset-0 bg-red-600/20 chase-danger-pulse" />
        )}

        {/* === QUEEN OF HEARTS — BIG === */}
        <div
          className={`absolute bottom-7 transition-all duration-1000 ease-out ${queenAnimClass}`}
          style={{ left: `${Math.min(90, Math.max(1, queenPercent))}%` }}
        >
          {(isClose || isDanger) && (
            <div className="absolute -inset-5 bg-red-500/30 rounded-full blur-xl chase-danger-pulse" />
          )}
          {/* Dust trail */}
          <div className="absolute -left-10 bottom-0 flex gap-2">
            <span className="text-lg opacity-40 chase-dust">💨</span>
            <span className="text-sm opacity-25 chase-dust" style={{ animationDelay: '0.15s' }}>💨</span>
          </div>
          <div className="relative queen-bounce">
            <img src="/queen.png" alt="Queen" className="h-16 w-auto drop-shadow-lg" />
            {lastAnswerCorrect === false && (
              <>
                <span className="absolute -top-3 -right-4 text-xl chase-heart-burst">❤️</span>
                <span className="absolute -top-6 left-1 text-sm chase-heart-burst" style={{ animationDelay: '0.1s' }}>❤️</span>
                <span className="absolute -top-2 -left-5 text-sm chase-heart-burst" style={{ animationDelay: '0.2s' }}>♥️</span>
              </>
            )}
          </div>
        </div>

        {/* === ALICE — BIG === */}
        <div
          className={`absolute bottom-7 transition-all duration-1000 ease-out ${aliceAnimClass}`}
          style={{ left: `${Math.min(85, alicePercent)}%` }}
        >
          {sparkles.map((s) => (
            <span
              key={s.id}
              className="absolute text-lg chase-sparkle-burst"
              style={{ left: s.x, top: s.y }}
            >
              ✨
            </span>
          ))}
          <div className="absolute -left-10 bottom-0 flex gap-2">
            <span className="text-lg opacity-30 chase-dust">💨</span>
            <span className="text-sm opacity-15 chase-dust" style={{ animationDelay: '0.1s' }}>💨</span>
          </div>
          <div className="relative alice-bounce">
            <img src="/alice.png" alt="Alice" className="h-16 w-auto drop-shadow-lg" />
            {lastAnswerCorrect === true && (
              <>
                <span className="absolute -top-7 -right-3 text-2xl chase-star-pop">⭐</span>
                <span className="absolute -top-5 -left-5 text-lg chase-star-pop" style={{ animationDelay: '0.15s' }}>✨</span>
                <span className="absolute -top-8 left-3 text-lg chase-star-pop" style={{ animationDelay: '0.3s' }}>💫</span>
              </>
            )}
            {queenCaught && (
              <span className="absolute -top-7 left-1/2 -translate-x-1/2 text-3xl animate-bounce">😱</span>
            )}
          </div>
        </div>

        {/* === PET TO RESCUE — Bunny (photo) or Budgie (emoji) === */}
        <div
          className="absolute bottom-8 transition-all duration-1000 ease-out"
          style={{ left: `${petPercent}%` }}
        >
          <div className="relative bunny-hop">
            {isBunny ? (
              <img
                src="/bunny.png"
                alt="Bunny"
                className="w-12 h-16 object-contain drop-shadow-lg"
              />
            ) : (
              <img
                src="/budgie.png"
                alt="Budgie"
                className="w-14 h-11 object-contain drop-shadow-lg"
              />
            )}
            {/* Pet calls for help when Queen is close */}
            {isDanger && (
              <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-xs font-black animate-bounce whitespace-nowrap bg-white/90 text-red-600 rounded-full px-2 py-0.5 shadow-md">
                Help me!
              </span>
            )}
            {/* Happy pet when Alice answers correctly */}
            {lastAnswerCorrect === true && (
              <span className="absolute -top-5 left-1/2 -translate-x-1/2 text-lg chase-star-pop">💕</span>
            )}
          </div>
        </div>

        {/* Escape door — BIG */}
        <div className="absolute bottom-6 right-3">
          <div className="relative">
            <span className="text-5xl chase-door-glow">🚪</span>
            {alicePercent > 75 && !queenCaught && (
              <span className="absolute -top-3 -right-2 text-sm chase-twinkle">✨</span>
            )}
          </div>
        </div>

        {/* Warning messages — larger text */}
        {queenCaught && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-600/90 text-white text-sm font-black px-4 py-1.5 rounded-full animate-pulse whitespace-nowrap shadow-lg">
            Save {petName}! Answer correctly!
          </div>
        )}
        {isDanger && !queenCaught && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-red-600/80 text-white text-sm font-black px-4 py-1.5 rounded-full animate-pulse whitespace-nowrap shadow-lg">
            OFF WITH HER HEAD!
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="flex justify-between items-center mt-2 px-1">
        <div className="flex items-center gap-2">
          <img src="/queen.png" alt="Queen" className="h-5 w-auto" />
          <span className={`text-xs font-black tracking-wide ${
            queenCaught
              ? 'text-red-400 animate-pulse'
              : isDanger
              ? 'text-red-400 animate-pulse'
              : isClose
              ? 'text-orange-300'
              : 'text-purple-300'
          }`}>
            {queenCaught ? 'THE QUEEN CAUGHT ALICE!' : isDanger ? 'SHE\'S RIGHT BEHIND YOU!' : isClose ? 'Queen is catching up!' : 'Queen of Hearts'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-xs font-black tracking-wide ${
            queenCaught
              ? 'text-red-300'
              : alicePercent > 75
              ? 'text-green-300 animate-pulse'
              : 'text-yellow-200'
          }`}>
            {queenCaught ? `Save ${petName}!` : alicePercent > 75 ? 'ALMOST TO THE DOOR!' : `Rescue ${petName}!`}
          </span>
          <span className="text-base">{petEmoji}</span>
        </div>
      </div>
    </div>
  );
};
