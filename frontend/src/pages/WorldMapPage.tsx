import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { World } from '../types';
import { BottomNav } from '../components/BottomNav';
import { CoinDisplay } from '../components/CoinDisplay';

// Island positions for the winding path layout (percentage-based for responsiveness)
const ISLAND_POSITIONS = [
  { x: 25, y: 12 },
  { x: 70, y: 22 },
  { x: 20, y: 37 },
  { x: 65, y: 50 },
  { x: 30, y: 63 },
  { x: 68, y: 76 },
];

// World-themed decorations
const WORLD_DECORATIONS: Record<string, { bg: string; particles: string[] }> = {
  meadow:    { bg: '🌸🌻🦋🌿', particles: ['🌸', '🦋', '🌻'] },
  forest:    { bg: '🍄🌲🦊🍃', particles: ['🍃', '🍄', '🌲'] },
  ocean:     { bg: '🐚🌊🐠🦀', particles: ['🐚', '🌊', '🐠'] },
  mountain:  { bg: '⛰️🦅🏔️❄️', particles: ['❄️', '🦅', '⛰️'] },
  castle:    { bg: '🏰👑🗡️🛡️', particles: ['👑', '🏰', '✨'] },
  storm:     { bg: '⚡🌩️🌪️💨', particles: ['⚡', '🌩️', '💨'] },
};

export const WorldMapPage: React.FC = () => {
  const { user } = useAuth();
  const { get } = useApi();
  const navigate = useNavigate();

  const [worlds, setWorlds] = useState<World[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalStars, setTotalStars] = useState(0);
  const [totalCoins, setTotalCoins] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const worldsData = await get('/api/worlds');
        const statsData = await get('/api/stats/overview');

        setWorlds(worldsData.worlds);
        setTotalStars(statsData.stats.totalStars);
        setTotalCoins(statsData.stats.totalCoins);
      } catch (error) {
        console.error('Failed to load worlds:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-800 to-blue-900 flex items-center justify-center">
        <div className="text-center">
          <img src="/alice.png" alt="Alice" className="w-16 h-auto mx-auto mb-4 animate-bounce" />
          <div className="text-white text-xl font-bold">Exploring Wonderland...</div>
        </div>
      </div>
    );
  }

  // Find highest unlocked world index for Alice position
  const currentWorldIndex = worlds.reduce((highest, w, i) => {
    const isUnlocked = w.unlocked !== undefined ? w.unlocked : w.starsEarned >= w.unlockStarsRequired;
    return isUnlocked ? i : highest;
  }, 0);

  // Build SVG path through all island positions
  const buildPathD = () => {
    if (worlds.length === 0) return '';
    const points = worlds.map((_, i) => {
      const pos = ISLAND_POSITIONS[i % ISLAND_POSITIONS.length];
      return { x: (pos.x / 100) * 400, y: 60 + (pos.y / 100) * 700 };
    });
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const cpx1 = prev.x + (curr.x - prev.x) * 0.5;
      const cpy1 = prev.y;
      const cpx2 = prev.x + (curr.x - prev.x) * 0.5;
      const cpy2 = curr.y;
      d += ` C ${cpx1} ${cpy1}, ${cpx2} ${cpy2}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-indigo-900 via-purple-900 to-blue-950 pb-28 safe-area-bottom overflow-hidden relative">
      {/* Animated sky background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Twinkling stars */}
        {Array.from({ length: 25 }).map((_, i) => (
          <div
            key={`star-${i}`}
            className="absolute rounded-full bg-white world-map-twinkle"
            style={{
              width: `${2 + Math.random() * 3}px`,
              height: `${2 + Math.random() * 3}px`,
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 40}%`,
              animationDelay: `${Math.random() * 4}s`,
              opacity: 0.6,
            }}
          />
        ))}
        {/* Floating clouds */}
        {Array.from({ length: 5 }).map((_, i) => (
          <div
            key={`cloud-${i}`}
            className="absolute text-4xl world-map-cloud-drift opacity-20"
            style={{
              top: `${5 + Math.random() * 30}%`,
              left: `${-10 + Math.random() * 20}%`,
              animationDelay: `${i * 6}s`,
              animationDuration: `${25 + Math.random() * 15}s`,
            }}
          >
            ☁️
          </div>
        ))}
      </div>

      {/* Top Bar */}
      <div className="bg-black/30 backdrop-blur-md sticky top-0 z-40 border-b border-white/10">
        <div className="p-3 sm:p-4 flex items-center justify-between max-w-lg mx-auto">
          <div className="flex items-center gap-3">
            <img src="/alice.png" alt="Alice" className="w-10 h-auto drop-shadow-lg" />
            <div>
              <p className="font-bold text-base text-white">{user?.displayName || 'Maya'}</p>
              <p className="text-xs text-purple-200">Wonderland Explorer</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <CoinDisplay amount={totalCoins} />
            <div className="flex items-center gap-1.5 bg-yellow-400/20 px-3 py-1 rounded-full">
              <span className="text-lg">⭐</span>
              <span className="font-black text-base text-yellow-300">{totalStars}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Title */}
      <div className="text-center pt-4 pb-2 relative z-10">
        <h2 className="text-2xl sm:text-3xl font-black text-white drop-shadow-lg">Wonderland Map</h2>
        <p className="text-purple-200 text-xs mt-1">Choose your adventure!</p>
      </div>

      {/* Map Area */}
      <div className="relative mx-auto max-w-md px-4" style={{ minHeight: `${Math.max(worlds.length * 150, 600)}px` }}>
        {/* SVG winding path */}
        <svg
          className="absolute inset-0 w-full h-full pointer-events-none"
          viewBox={`0 0 400 ${60 + (ISLAND_POSITIONS.length / 100) * 700 + 200}`}
          preserveAspectRatio="none"
          style={{ height: '100%', width: '100%' }}
        >
          <defs>
            <linearGradient id="pathGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#fbbf24" stopOpacity="0.7" />
              <stop offset="100%" stopColor="#a855f7" stopOpacity="0.4" />
            </linearGradient>
          </defs>
          {/* Dotted path line */}
          <path
            d={buildPathD()}
            fill="none"
            stroke="url(#pathGrad)"
            strokeWidth="4"
            strokeDasharray="12 8"
            strokeLinecap="round"
          />
        </svg>

        {/* World Islands */}
        {worlds.map((world, index) => {
          const pos = ISLAND_POSITIONS[index % ISLAND_POSITIONS.length];
          const isUnlocked = world.unlocked !== undefined ? world.unlocked : world.starsEarned >= world.unlockStarsRequired;
          const starsNeeded = Math.max(0, world.unlockStarsRequired - totalStars);
          const isCurrent = index === currentWorldIndex;
          const theme = WORLD_DECORATIONS[world.theme] || WORLD_DECORATIONS.meadow;
          const isCompleted = world.levelsCompleted === world.totalLevels && world.totalLevels > 0;

          return (
            <div
              key={world.id}
              className="absolute animate-slideUp"
              style={{
                left: `${pos.x}%`,
                top: `${pos.y}%`,
                transform: 'translate(-50%, -50%)',
                animationDelay: `${index * 150}ms`,
                zIndex: isCurrent ? 20 : 10,
              }}
            >
              {/* Alice indicator at current world */}
              {isCurrent && (
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 z-30">
                  <img src="/alice.png" alt="Alice" className="w-10 h-auto drop-shadow-xl alice-bounce" />
                </div>
              )}

              <button
                onClick={() => isUnlocked && navigate(`/worlds/${world.id}`)}
                disabled={!isUnlocked}
                className={`relative group transition-all duration-300 ${
                  isUnlocked ? 'cursor-pointer active:scale-90' : 'cursor-not-allowed'
                }`}
              >
                {/* Island glow for unlocked */}
                {isUnlocked && (
                  <div
                    className={`absolute inset-0 rounded-full blur-xl ${isCurrent ? 'world-map-glow' : 'opacity-30'}`}
                    style={{ background: world.colorPrimary, transform: 'scale(1.5)' }}
                  />
                )}

                {/* Island body */}
                <div
                  className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full flex flex-col items-center justify-center shadow-2xl border-4 transition-all ${
                    isUnlocked
                      ? isCurrent
                        ? 'border-yellow-300 world-map-island-pulse'
                        : 'border-white/40'
                      : 'border-gray-600 grayscale opacity-60'
                  }`}
                  style={{
                    background: isUnlocked
                      ? `radial-gradient(circle at 30% 30%, ${world.colorPrimary}, ${world.colorSecondary})`
                      : 'linear-gradient(135deg, #374151, #1f2937)',
                  }}
                >
                  {/* Locked overlay */}
                  {!isUnlocked && (
                    <div className="absolute inset-0 rounded-full bg-black/40 flex items-center justify-center z-10">
                      <div className="text-center">
                        <div className="text-3xl mb-0.5">🔒</div>
                        <p className="text-white text-xs font-bold">{starsNeeded}⭐</p>
                      </div>
                    </div>
                  )}

                  {/* World icon */}
                  <div className={`text-4xl sm:text-5xl ${isUnlocked ? '' : 'opacity-40'}`}>
                    {world.iconEmoji}
                  </div>

                  {/* Completion badge */}
                  {isCompleted && (
                    <div className="absolute -top-1 -right-1 w-7 h-7 bg-yellow-400 rounded-full flex items-center justify-center shadow-lg border-2 border-white">
                      <span className="text-sm">✓</span>
                    </div>
                  )}
                </div>

                {/* World name + star progress below island */}
                <div className="mt-2 text-center" style={{ width: '140px', marginLeft: '-6px' }}>
                  <p className={`font-black text-sm drop-shadow-lg ${isUnlocked ? 'text-white' : 'text-gray-400'}`}>
                    {world.name}
                  </p>
                  {isUnlocked && (
                    <div className="flex items-center justify-center gap-0.5 mt-0.5">
                      {Array.from({ length: Math.min(world.totalLevels * 3, 15) }).map((_, i) => (
                        <span key={i} className="text-xs">
                          {i < world.starsEarned ? '⭐' : '·'}
                        </span>
                      ))}
                    </div>
                  )}
                  {isUnlocked && (
                    <p className="text-purple-200 text-xs mt-0.5">
                      {world.levelsCompleted}/{world.totalLevels} levels
                    </p>
                  )}
                </div>
              </button>

              {/* Floating decoration particles */}
              {isUnlocked && theme.particles.map((emoji, pi) => (
                <div
                  key={pi}
                  className="absolute pointer-events-none world-map-particle"
                  style={{
                    top: `${-15 + Math.random() * 30}%`,
                    left: `${70 + pi * 25}%`,
                    animationDelay: `${pi * 1.2}s`,
                    fontSize: '14px',
                  }}
                >
                  {emoji}
                </div>
              ))}
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
};
