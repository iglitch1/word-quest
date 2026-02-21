import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useApi } from '../hooks/useApi';
import { World } from '../types';
import { BottomNav } from '../components/BottomNav';
import { CoinDisplay } from '../components/CoinDisplay';
import { StarDisplay } from '../components/StarDisplay';

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
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">🗺️</div>
          <div className="text-white text-xl font-bold">Loading worlds...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-blue-500 pb-28 safe-area-bottom">
      {/* Top Bar */}
      <div className="bg-white shadow-lg sticky top-0 z-40">
        <div className="p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="text-4xl">👧</div>
            <div>
              <p className="font-bold text-lg text-gray-800">{user?.displayName || 'Maya'}</p>
              <p className="text-xs text-gray-600">Adventurer</p>
            </div>
          </div>

          <div className="flex items-center gap-6">
            <CoinDisplay amount={totalCoins} />
            <div className="flex items-center gap-2">
              <span className="text-2xl">⭐</span>
              <span className="font-bold text-lg text-yellow-600">{totalStars}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Worlds List */}
      <div className="p-4 space-y-4">
        <h2 className="text-3xl font-black text-white mb-6 px-4">Choose Your World</h2>

        {worlds.map((world, index) => {
          const isUnlocked = world.unlocked !== undefined ? world.unlocked : world.starsEarned >= world.unlockStarsRequired;
          const starsNeeded = Math.max(0, world.unlockStarsRequired - world.starsEarned);

          return (
            <div
              key={world.id}
              className="animate-slideUp"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              <button
                onClick={() => isUnlocked && navigate(`/worlds/${world.id}`)}
                disabled={!isUnlocked}
                className={`w-full rounded-2xl p-6 shadow-lg transition-all active:scale-95 disabled:opacity-50 ${
                  isUnlocked ? 'cursor-pointer' : 'cursor-not-allowed'
                }`}
                style={{
                  background: `linear-gradient(135deg, ${world.colorPrimary} 0%, ${world.colorSecondary} 100%)`,
                }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 text-left">
                    <div className="text-6xl mb-3">{world.iconEmoji}</div>
                    <h3 className="text-2xl font-black text-white mb-2">{world.name}</h3>
                    <p className="text-white text-sm opacity-90 mb-4">{world.description}</p>

                    <div className="flex gap-6 flex-wrap">
                      <div>
                        <p className="text-white text-xs font-bold opacity-75">Stars</p>
                        <div className="flex gap-1 mt-1">
                          {Array.from({ length: world.totalLevels }).map((_, i) => (
                            <span key={i}>
                              {i < world.starsEarned ? '⭐' : '☆'}
                            </span>
                          ))}
                        </div>
                        <p className="text-white text-xs font-bold mt-1">
                          {world.starsEarned}/{world.totalLevels}
                        </p>
                      </div>

                      <div>
                        <p className="text-white text-xs font-bold opacity-75">Levels</p>
                        <p className="text-white font-bold text-lg mt-1">
                          {world.levelsCompleted}/{world.totalLevels}
                        </p>
                      </div>
                    </div>
                  </div>

                  {!isUnlocked && (
                    <div className="ml-4 text-center">
                      <div className="text-4xl">🔒</div>
                      <p className="text-white text-xs font-bold mt-2">
                        {starsNeeded} more stars
                      </p>
                    </div>
                  )}
                </div>
              </button>
            </div>
          );
        })}
      </div>

      <BottomNav />
    </div>
  );
};
