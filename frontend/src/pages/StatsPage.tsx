import React, { useState, useEffect } from 'react';
import { useApi } from '../hooks/useApi';
import { PlayerStats, MasteryCategory, WordMastery } from '../types';
import { BottomNav } from '../components/BottomNav';

const getTitleProgression = () => [
  { title: 'Word Apprentice', requiredStars: 0 },
  { title: 'Word Scholar', requiredStars: 11 },
  { title: 'Vocabulary Champion', requiredStars: 51 },
  { title: 'Language Master', requiredStars: 101 },
  { title: 'Word Wizard', requiredStars: 201 },
  { title: 'Vocabulary Genius', requiredStars: 301 },
];

const getMasteryColor = (masteryLevel: string | number): string => {
  const level = typeof masteryLevel === 'number' ? ['new','learning','proficient','mastered'][masteryLevel] || 'new' : masteryLevel;
  switch (level) {
    case 'new':
      return 'bg-gray-300';
    case 'learning':
      return 'bg-yellow-300';
    case 'proficient':
      return 'bg-blue-300';
    case 'mastered':
      return 'bg-green-300';
    default:
      return 'bg-gray-300';
  }
};

const getMasteryLabel = (masteryLevel: string | number): string => {
  const level = typeof masteryLevel === 'number' ? ['new','learning','proficient','mastered'][masteryLevel] || 'new' : masteryLevel;
  switch (level) {
    case 'new': return 'New';
    case 'learning': return 'Learning';
    case 'proficient': return 'Proficient';
    case 'mastered': return 'Mastered';
    default: return level.charAt(0).toUpperCase() + level.slice(1);
  }
};

export const StatsPage: React.FC = () => {
  const { get } = useApi();
  const [stats, setStats] = useState<PlayerStats | null>(null);
  const [masteryData, setMasteryData] = useState<MasteryCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const statsData = await get('/api/stats/overview');
        const masteryDataRes = await get('/api/stats/mastery');

        setStats(statsData.overview || statsData.stats || statsData);
        // mastery comes as { mastery: { categoryName: { words: [...] } } }
        const m = masteryDataRes.mastery || masteryDataRes.categories || {};
        const cats = Array.isArray(m) ? m : Object.entries(m).map(([cat, data]: [string, any]) => ({
          category: cat,
          words: data.words || [],
        }));
        setMasteryData(cats);
      } catch (error) {
        console.error('Failed to load stats:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, []);

  if (isLoading || !stats) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center">
        <div className="text-center">
          <div className="text-6xl mb-4 animate-bounce">📊</div>
          <div className="text-white text-xl font-bold">Loading stats...</div>
        </div>
      </div>
    );
  }

  const titleProgression = getTitleProgression();
  const currentTitleIndex = titleProgression.findIndex(
    (t) => t.requiredStars <= stats.totalStars
  );
  const currentTitle = titleProgression[currentTitleIndex];
  const nextTitle = titleProgression[currentTitleIndex + 1];
  const starsToNextTitle = nextTitle
    ? nextTitle.requiredStars - stats.totalStars
    : 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 to-blue-500 pb-28 safe-area-bottom">
      {/* Header */}
      <div className="bg-white shadow-lg sticky top-0 z-40 text-center p-6">
        <h1 className="text-3xl font-black text-gray-800">My Stats</h1>
      </div>

      <div className="p-4 space-y-6">
        {/* Title Section */}
        <div className="bg-white rounded-3xl shadow-lg p-6">
          <div className="text-center mb-4">
            <p className="text-sm font-bold text-gray-600 mb-2">Current Title</p>
            <h2 className="text-2xl font-black text-purple-600 mb-4">
              🏆 {currentTitle.title}
            </h2>

            {nextTitle && (
              <>
                <div className="w-full h-3 bg-gray-200 rounded-full overflow-hidden mb-2">
                  <div
                    className="h-full bg-gradient-to-r from-yellow-400 to-orange-400 transition-all"
                    style={{
                      width: `${Math.max(
                        0,
                        ((stats.totalStars - currentTitle.requiredStars) /
                          (nextTitle.requiredStars - currentTitle.requiredStars)) *
                          100
                      )}%`,
                    }}
                  ></div>
                </div>
                <p className="text-xs font-bold text-gray-600">
                  {starsToNextTitle} stars to {nextTitle.title}
                </p>
              </>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-gradient-to-br from-yellow-300 to-yellow-500 rounded-2xl p-6 text-center shadow-lg">
            <p className="text-xs font-bold text-yellow-700 mb-1">Total Stars</p>
            <p className="text-4xl font-black text-white">⭐</p>
            <p className="text-2xl font-black text-white mt-2">{stats.totalStars}</p>
          </div>

          <div className="bg-gradient-to-br from-blue-300 to-blue-500 rounded-2xl p-6 text-center shadow-lg">
            <p className="text-xs font-bold text-blue-700 mb-1">Total Coins</p>
            <p className="text-4xl font-black text-white">🪙</p>
            <p className="text-2xl font-black text-white mt-2">{stats.totalCoins}</p>
          </div>

          <div className="bg-gradient-to-br from-purple-300 to-purple-500 rounded-2xl p-6 text-center shadow-lg">
            <p className="text-xs font-bold text-purple-700 mb-1">Words Learned</p>
            <p className="text-4xl font-black text-white">📚</p>
            <p className="text-2xl font-black text-white mt-2">{stats.wordsLearned}</p>
          </div>

          <div className="bg-gradient-to-br from-green-300 to-green-500 rounded-2xl p-6 text-center shadow-lg">
            <p className="text-xs font-bold text-green-700 mb-1">Words Mastered</p>
            <p className="text-4xl font-black text-white">✨</p>
            <p className="text-2xl font-black text-white mt-2">{stats.wordsMastered}</p>
          </div>

          <div className="bg-gradient-to-br from-pink-300 to-pink-500 rounded-2xl p-6 text-center shadow-lg col-span-2">
            <p className="text-xs font-bold text-pink-700 mb-1">Levels Completed</p>
            <p className="text-4xl font-black text-white">🎮</p>
            <p className="text-2xl font-black text-white mt-2">
              {stats.levelsCompleted}/{stats.totalLevels}
            </p>
          </div>
        </div>

        {/* Word Mastery by Category */}
        <div>
          <h3 className="text-xl font-black text-white mb-4 px-2">Word Mastery</h3>

          <div className="space-y-3">
            {masteryData.map((category) => (
              <div key={category.category} className="bg-white rounded-2xl shadow-lg overflow-hidden">
                <button
                  onClick={() =>
                    setExpandedCategory(
                      expandedCategory === category.category
                        ? null
                        : category.category
                    )
                  }
                  className="w-full p-4 flex items-center justify-between font-bold text-gray-800 active:bg-gray-100"
                >
                  <span className="text-lg">📖 {category.category}</span>
                  <span>
                    {expandedCategory === category.category ? '▲' : '▼'}
                  </span>
                </button>

                {expandedCategory === category.category && (
                  <div className="border-t border-gray-200 p-4 space-y-2">
                    {category.words.map((word: WordMastery) => (
                      <div
                        key={word.word}
                        className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                      >
                        <div>
                          <p className="font-bold text-gray-800">{word.word}</p>
                          <p className="text-xs text-gray-600">
                            {word.times_correct}/{word.times_attempted} correct
                          </p>
                        </div>
                        <div
                          className={`px-3 py-1 rounded-full text-xs font-bold text-white ${getMasteryColor(
                            word.mastery_level
                          )}`}
                        >
                          {getMasteryLabel(word.mastery_level)}
                        </div>
                      </div>
                    ))}

                    {category.words.length === 0 && (
                      <p className="text-center text-gray-600 py-4">
                        No words learned yet
                      </p>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <BottomNav />
    </div>
  );
};
