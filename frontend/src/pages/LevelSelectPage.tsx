import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { World, Level } from '../types';
import { BottomNav } from '../components/BottomNav';

// World-themed background decorations
const THEME_DECORATIONS: Record<string, { emoji: string[]; bgClass: string }> = {
  meadow:   { emoji: ['🌸', '🦋', '🌻', '🌿', '🐛'], bgClass: 'from-green-800 via-emerald-900 to-green-950' },
  forest:   { emoji: ['🍄', '🌲', '🦊', '🍃', '🦉'], bgClass: 'from-green-900 via-teal-900 to-emerald-950' },
  ocean:    { emoji: ['🐚', '🐠', '🦀', '🌊', '🐙'], bgClass: 'from-blue-800 via-cyan-900 to-blue-950' },
  mountain: { emoji: ['⛰️', '🦅', '❄️', '🏔️', '🐐'], bgClass: 'from-slate-800 via-gray-900 to-slate-950' },
  castle:   { emoji: ['🏰', '👑', '🗡️', '🛡️', '🕯️'], bgClass: 'from-purple-900 via-indigo-900 to-purple-950' },
  storm:    { emoji: ['⚡', '🌩️', '💨', '🌪️', '🌧️'], bgClass: 'from-gray-800 via-slate-900 to-gray-950' },
};

// Zigzag positions for level nodes (alternating left-right)
const getNodePosition = (index: number, total: number) => {
  const isLeft = index % 2 === 0;
  return {
    x: isLeft ? 25 : 75,
    y: 8 + (index / Math.max(total - 1, 1)) * 80,
  };
};

export const LevelSelectPage: React.FC = () => {
  const { worldId } = useParams<{ worldId: string }>();
  const navigate = useNavigate();
  const { get } = useApi();

  const [world, setWorld] = useState<World | null>(null);
  const [levels, setLevels] = useState<Level[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const data = await get(`/api/worlds/${worldId}/levels`);
        setWorld(data.world);
        setLevels(data.levels);
      } catch (error) {
        console.error('Failed to load levels:', error);
        navigate('/worlds');
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [worldId]);

  if (isLoading || !world) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-purple-900 to-indigo-950 flex items-center justify-center">
        <div className="text-center">
          <img src="/alice.png" alt="Alice" className="w-16 h-auto mx-auto mb-4 animate-bounce" />
          <div className="text-white text-xl font-bold">Entering {world?.name || 'the world'}...</div>
        </div>
      </div>
    );
  }

  const themeConfig = THEME_DECORATIONS[world.theme] || THEME_DECORATIONS.meadow;

  const getDifficultyColor = (tier: number) => {
    switch (tier) {
      case 1: return { ring: 'ring-green-400', bg: 'bg-green-400', text: 'text-green-300' };
      case 2: return { ring: 'ring-blue-400', bg: 'bg-blue-400', text: 'text-blue-300' };
      case 3: return { ring: 'ring-yellow-400', bg: 'bg-yellow-400', text: 'text-yellow-300' };
      case 4: return { ring: 'ring-orange-400', bg: 'bg-orange-400', text: 'text-orange-300' };
      case 5: return { ring: 'ring-red-400', bg: 'bg-red-400', text: 'text-red-300' };
      default: return { ring: 'ring-gray-400', bg: 'bg-gray-400', text: 'text-gray-300' };
    }
  };

  // Find current level (first incomplete unlocked level)
  const currentLevelIndex = levels.findIndex((l, i) => {
    if (i === 0) return !l.completed;
    return levels[i - 1].completed && !l.completed;
  });

  // Build SVG winding path
  const buildPathD = () => {
    if (levels.length === 0) return '';
    const points = levels.map((_, i) => {
      const pos = getNodePosition(i, levels.length);
      return { x: (pos.x / 100) * 400, y: (pos.y / 100) * 600 + 40 };
    });
    let d = `M ${points[0].x} ${points[0].y}`;
    for (let i = 1; i < points.length; i++) {
      const prev = points[i - 1];
      const curr = points[i];
      const midY = (prev.y + curr.y) / 2;
      d += ` C ${prev.x} ${midY}, ${curr.x} ${midY}, ${curr.x} ${curr.y}`;
    }
    return d;
  };

  const mapHeight = Math.max(levels.length * 160, 500);

  return (
    <div className={`min-h-screen bg-gradient-to-b ${themeConfig.bgClass} pb-28 safe-area-bottom overflow-hidden relative`}>
      {/* Floating theme decorations */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {themeConfig.emoji.map((emoji, i) =>
          Array.from({ length: 3 }).map((_, j) => (
            <div
              key={`deco-${i}-${j}`}
              className="absolute level-path-float opacity-20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                fontSize: `${16 + Math.random() * 20}px`,
                animationDelay: `${(i * 3 + j) * 1.5}s`,
                animationDuration: `${8 + Math.random() * 6}s`,
              }}
            >
              {emoji}
            </div>
          ))
        )}
      </div>

      {/* Header */}
      <div className="bg-black/30 backdrop-blur-md sticky top-0 z-40 border-b border-white/10">
        <div className="p-3 sm:p-4 flex items-center gap-4 max-w-lg mx-auto">
          <button
            onClick={() => navigate('/worlds')}
            className="text-white/80 active:scale-75 transition-transform text-2xl"
          >
            ←
          </button>
          <div className="flex-1">
            <h1 className="text-xl sm:text-2xl font-black text-white drop-shadow-lg">{world.name}</h1>
            <p className="text-xs text-purple-200">{world.levelsCompleted}/{world.totalLevels} levels completed</p>
          </div>
          <div className="text-4xl">{world.iconEmoji}</div>
        </div>
      </div>

      {/* Storybook Path */}
      <div className="relative mx-auto max-w-md px-4 mt-4" style={{ height: `${mapHeight}px` }}>
        {/* SVG winding path */}
        <svg
          className="absolute inset-0 w-full pointer-events-none"
          viewBox={`0 0 400 ${mapHeight}`}
          preserveAspectRatio="xMidYMid meet"
          style={{ height: '100%', width: '100%' }}
        >
          <defs>
            <linearGradient id="levelPathGrad" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor={world.colorPrimary} stopOpacity="0.6" />
              <stop offset="100%" stopColor={world.colorSecondary} stopOpacity="0.3" />
            </linearGradient>
          </defs>
          {/* Path shadow */}
          <path
            d={buildPathD()}
            fill="none"
            stroke="rgba(0,0,0,0.3)"
            strokeWidth="8"
            strokeLinecap="round"
            transform="translate(2,2)"
          />
          {/* Main path */}
          <path
            d={buildPathD()}
            fill="none"
            stroke="url(#levelPathGrad)"
            strokeWidth="6"
            strokeDasharray="16 10"
            strokeLinecap="round"
          />
        </svg>

        {/* Level Nodes */}
        {levels.map((level, index) => {
          const isLocked = index > 0 && !levels[index - 1].completed;
          const isNext = index === currentLevelIndex;
          const pos = getNodePosition(index, levels.length);
          const diffColor = getDifficultyColor(level.difficultyTier);
          const isLeft = index % 2 === 0;

          return (
            <div
              key={level.id}
              className="absolute animate-slideUp"
              style={{
                left: `${pos.x}%`,
                top: `${(pos.y / 100) * mapHeight}px`,
                transform: 'translate(-50%, -50%)',
                animationDelay: `${index * 120}ms`,
                zIndex: isNext ? 20 : 10,
              }}
            >
              {/* Alice indicator at current level */}
              {isNext && (
                <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-30">
                  <img src="/alice.png" alt="Alice" className="w-10 h-auto drop-shadow-xl alice-bounce" />
                  <div className="text-center mt-0.5">
                    <span className="text-yellow-300 text-xs font-black animate-pulse">Play!</span>
                  </div>
                </div>
              )}

              <button
                onClick={() => !isLocked && navigate(`/play/${level.id}`, {
                  state: { worldName: world.name, levelName: level.name, levelNumber: level.levelNumber, worldId, levels }
                })}
                disabled={isLocked}
                className={`relative group transition-all duration-300 ${
                  isLocked ? 'cursor-not-allowed' : 'cursor-pointer active:scale-90'
                }`}
              >
                {/* Node glow */}
                {isNext && (
                  <div className="absolute inset-0 rounded-full blur-lg bg-yellow-400/60 level-node-glow" style={{ transform: 'scale(2)' }} />
                )}

                {/* Circle node */}
                <div
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-full flex items-center justify-center font-black text-2xl sm:text-3xl shadow-xl transition-all border-4 ${
                    isLocked
                      ? 'bg-gray-700/80 border-gray-500 text-gray-400'
                      : isNext
                      ? `bg-gradient-to-br from-yellow-300 to-orange-400 border-yellow-200 text-white level-node-pulse`
                      : level.completed
                      ? `bg-gradient-to-br from-white to-gray-100 border-white/80 text-purple-600`
                      : `bg-gradient-to-br from-white/90 to-gray-200 border-white/60 text-purple-500`
                  }`}
                >
                  {isLocked ? (
                    <div className="text-center">
                      <span className="text-2xl">🔒</span>
                    </div>
                  ) : (
                    level.levelNumber
                  )}

                  {/* Difficulty indicator dot */}
                  {!isLocked && (
                    <div className={`absolute -bottom-1 left-1/2 -translate-x-1/2 w-3 h-3 rounded-full ${diffColor.bg} border-2 border-white shadow`} />
                  )}
                </div>

                {/* Stars below node */}
                {!isLocked && (
                  <div className="flex justify-center gap-0.5 mt-1.5">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <span key={i} className={`text-sm ${i < level.bestStars ? '' : 'opacity-30'}`}>
                        {i < level.bestStars ? '⭐' : '☆'}
                      </span>
                    ))}
                  </div>
                )}

                {/* Level info card - shows on the side */}
                <div
                  className={`absolute top-1/2 -translate-y-1/2 ${
                    isLeft ? 'left-full ml-3' : 'right-full mr-3'
                  } w-32 sm:w-36 transition-all ${isLocked ? 'opacity-40' : ''}`}
                >
                  <div className={`rounded-xl p-2.5 backdrop-blur-md ${
                    isNext
                      ? 'bg-yellow-400/20 border border-yellow-300/30'
                      : 'bg-white/10 border border-white/10'
                  }`}>
                    <p className={`font-bold text-sm ${isNext ? 'text-yellow-200' : 'text-white'} truncate`}>
                      {level.name}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className={`text-xs ${diffColor.text} font-bold`}>Lv.{level.difficultyTier}</span>
                      <span className="text-white/40">·</span>
                      <span className="text-xs text-white/60">⏱️ {level.timeLimitSeconds}s</span>
                    </div>
                    {level.bestScore > 0 && (
                      <p className="text-xs text-purple-200 mt-1">Best: {level.bestScore}pts</p>
                    )}
                  </div>
                </div>

                {/* Cloud/fog overlay for locked */}
                {isLocked && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-3xl opacity-40 level-path-float" style={{ animationDuration: '4s' }}>☁️</div>
                  </div>
                )}
              </button>
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
};
