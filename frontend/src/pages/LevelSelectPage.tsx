import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { World, Level } from '../types';
import { BottomNav } from '../components/BottomNav';

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
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">⏳</div>
          <div className="text-white text-xl font-bold">Loading levels...</div>
        </div>
      </div>
    );
  }

  const getDifficultyColor = (tier: number) => {
    switch (tier) {
      case 1:
        return 'from-green-300 to-green-500';
      case 2:
        return 'from-blue-300 to-blue-500';
      case 3:
        return 'from-yellow-300 to-yellow-500';
      case 4:
        return 'from-orange-300 to-orange-500';
      case 5:
        return 'from-red-300 to-red-500';
      default:
        return 'from-gray-300 to-gray-500';
    }
  };

  return (
    <div className="min-h-screen pb-28 safe-area-bottom" style={{
      background: `linear-gradient(135deg, ${world.colorPrimary} 0%, ${world.colorSecondary} 100%)`
    }}>
      {/* Header */}
      <div className="bg-white bg-opacity-90 shadow-lg sticky top-0 z-40">
        <div className="p-4 flex items-center gap-4">
          <button
            onClick={() => navigate('/worlds')}
            className="text-3xl active:scale-75 transition-transform"
          >
            ◀️
          </button>
          <div className="flex-1">
            <h1 className="text-2xl font-black text-gray-800">{world.name}</h1>
            <p className="text-sm text-gray-600">{world.totalLevels} levels</p>
          </div>
          <div className="text-4xl">{world.iconEmoji}</div>
        </div>
      </div>

      {/* Levels Path */}
      <div className="p-6 space-y-4">
        <div className="relative">
          {/* Connecting line */}
          <div className="absolute left-8 top-0 bottom-0 w-1 bg-white bg-opacity-50 rounded-full"></div>

          {/* Level Nodes */}
          {levels.map((level, index) => {
            const isLocked = index > 0 && levels[index - 1].bestStars === 0;
            const isNext = index > 0 && levels[index - 1].bestStars > 0 && level.bestStars === 0;

            return (
              <div key={level.id} className="relative mb-6">
                <div className="flex gap-6 items-start">
                  {/* Node */}
                  <div className={`w-16 h-16 rounded-full flex items-center justify-center font-bold text-2xl relative z-10 transition-all ${
                    isLocked
                      ? 'bg-gray-400 text-gray-600'
                      : isNext
                      ? 'bg-yellow-400 text-white animate-pulse-scale'
                      : 'bg-white text-purple-600 shadow-lg'
                  }`}>
                    {isLocked ? '🔒' : level.levelNumber}
                  </div>

                  {/* Content */}
                  <button
                    onClick={() => !isLocked && navigate(`/play/${level.id}`, {
                      state: { worldName: world.name, levelName: level.name, levelNumber: level.levelNumber }
                    })}
                    disabled={isLocked}
                    className={`flex-1 rounded-2xl p-4 transition-all active:scale-95 disabled:opacity-50 ${
                      isLocked ? 'cursor-not-allowed' : 'cursor-pointer'
                    } ${
                      isNext
                        ? 'bg-yellow-300 bg-opacity-90'
                        : 'bg-white bg-opacity-90'
                    }`}
                  >
                    <div className="text-left">
                      <p className="font-bold text-lg text-gray-800">{level.name}</p>

                      <div className="flex gap-4 mt-3 text-sm text-gray-600">
                        <span>
                          <span className={`inline-block w-3 h-3 rounded-full mr-1 bg-gradient-to-r ${getDifficultyColor(level.difficultyTier)}`}></span>
                          Difficulty {level.difficultyTier}/5
                        </span>
                        <span>⏱️ {level.timeLimitSeconds}s</span>
                      </div>

                      <div className="flex gap-2 mt-3">
                        {level.bestStars > 0 ? (
                          <>
                            <div className="flex gap-1">
                              {Array.from({ length: 3 }).map((_, i) => (
                                <span key={i}>
                                  {i < level.bestStars ? '⭐' : '☆'}
                                </span>
                              ))}
                            </div>
                            <span className="text-xs text-gray-600 ml-2">
                              Best: {level.bestScore} points
                            </span>
                          </>
                        ) : (
                          <span className="text-xs text-gray-600">Not started</span>
                        )}
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
