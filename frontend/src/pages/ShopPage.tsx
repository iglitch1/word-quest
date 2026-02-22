import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApi } from '../hooks/useApi';
import { ShopInventory, ShopItem } from '../types';
import { BottomNav } from '../components/BottomNav';
import { CoinDisplay } from '../components/CoinDisplay';
import { ConfirmModal } from '../components/ConfirmModal';
import { getEmojiForItem } from '../utils/emojiMap';

type TabType = 'bases' | 'hats' | 'outfits' | 'pets' | 'effects';

export const ShopPage: React.FC = () => {
  const { get, post } = useApi();
  const navigate = useNavigate();
  const [inventory, setInventory] = useState<ShopInventory | null>(null);
  const [playerCoins, setPlayerCoins] = useState(0);
  const [activeTab, setActiveTab] = useState<TabType>('bases');
  const [isLoading, setIsLoading] = useState(true);
  const [confirmItem, setConfirmItem] = useState<ShopItem | null>(null);
  const [purchaseSuccess, setPurchaseSuccess] = useState<string | null>(null);

  useEffect(() => {
    const fetchShop = async () => {
      try {
        const data = await get('/api/shop/items');
        setInventory(data.items);
        setPlayerCoins(data.playerCoins || 0);
      } catch (error) {
        console.error('Failed to load shop:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchShop();
  }, []);

  const handlePurchase = async (item: ShopItem) => {
    if (playerCoins < item.cost_coins) return;

    try {
      const result = await post('/api/shop/purchase', { itemId: item.id });
      setPlayerCoins(result.totalCoins ?? playerCoins - item.cost_coins);
      setConfirmItem(null);

      // Show success animation
      setPurchaseSuccess(item.name);
      setTimeout(() => setPurchaseSuccess(null), 2000);

      // Refresh inventory
      const data = await get('/api/shop/items');
      setInventory(data.items);
    } catch (error) {
      console.error('Purchase failed:', error);
    }
  };

  const handleEquipFromShop = async (item: ShopItem) => {
    try {
      await post('/api/shop/equip', { itemId: item.id });
      const data = await get('/api/shop/items');
      setInventory(data.items);
    } catch (error) {
      console.error('Equip failed:', error);
    }
  };

  if (isLoading || !inventory) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-400 to-amber-400 flex items-center justify-center">
        <div className="text-center">
          <div className="text-7xl mb-4 animate-bounce">🏪</div>
          <div className="text-white text-xl font-bold">Opening the Magic Shop...</div>
        </div>
      </div>
    );
  }

  const tabs: { id: TabType; label: string; icon: string }[] = [
    { id: 'bases', label: 'Heroes', icon: '🦸' },
    { id: 'hats', label: 'Hats', icon: '👑' },
    { id: 'outfits', label: 'Outfits', icon: '👗' },
    { id: 'pets', label: 'Pets', icon: '🐾' },
    { id: 'effects', label: 'Magic', icon: '✨' },
  ];

  const items = inventory[activeTab] || [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-500 via-pink-400 to-amber-400 pb-28 safe-area-bottom">
      {/* Header */}
      <div className="bg-white/95 backdrop-blur shadow-lg sticky top-0 z-40">
        <div className="p-4 text-center">
          <h1 className="text-2xl font-black text-purple-700 mb-1">Magic Shop</h1>
          <CoinDisplay amount={playerCoins} />
        </div>

        {/* Tabs */}
        <div className="flex overflow-x-auto gap-1 px-3 pb-3">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-3 py-2 rounded-xl whitespace-nowrap font-bold transition-all flex items-center gap-1.5 text-sm ${
                activeTab === tab.id
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white shadow-lg scale-105'
                  : 'bg-gray-100 text-gray-500'
              }`}
            >
              <span className="text-lg">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Items Grid */}
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {items.map((item) => {
            const emoji = getEmojiForItem(item.asset_key);
            const canAfford = playerCoins >= item.cost_coins;

            return (
              <button
                key={item.id}
                onClick={() => {
                  if (item.owned && !item.equipped) {
                    handleEquipFromShop(item);
                  } else if (!item.owned) {
                    setConfirmItem(item);
                  }
                }}
                className={`rounded-2xl p-4 shadow-lg transition-all active:scale-95 overflow-hidden relative ${
                  item.equipped
                    ? 'bg-gradient-to-br from-purple-100 to-pink-100 ring-2 ring-purple-400'
                    : item.owned
                    ? 'bg-white'
                    : canAfford
                    ? 'bg-white'
                    : 'bg-gray-100 opacity-70'
                }`}
              >
                {item.equipped && (
                  <div className="absolute top-2 right-2 bg-purple-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                    ON
                  </div>
                )}

                {/* Big emoji icon */}
                <div className="text-6xl mb-2 text-center leading-none py-2">
                  {emoji}
                </div>

                {/* Item name */}
                <p className="font-black text-gray-800 text-center mb-2 text-sm">
                  {item.name}
                </p>

                {/* Status / Price */}
                <div className="border-t border-gray-100 pt-2">
                  {item.equipped ? (
                    <p className="text-purple-600 font-bold text-xs text-center">Equipped ✓</p>
                  ) : item.owned ? (
                    <p className="text-green-600 font-bold text-xs text-center">Tap to Equip</p>
                  ) : (
                    <div className="text-center">
                      <p className={`font-black text-sm flex items-center justify-center gap-1 ${
                        canAfford ? 'text-amber-600' : 'text-gray-400'
                      }`}>
                        🪙 {item.cost_coins}
                      </p>
                      {!canAfford && (
                        <p className="text-red-400 text-xs font-bold mt-0.5">
                          Need {item.cost_coins - playerCoins} more
                        </p>
                      )}
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {items.length === 0 && (
          <div className="text-center py-12">
            <div className="text-6xl mb-4">📭</div>
            <p className="text-white font-bold text-lg">No items here yet!</p>
          </div>
        )}

        {/* Link to character page */}
        <button
          onClick={() => navigate('/character')}
          className="w-full mt-6 py-4 bg-white/20 backdrop-blur rounded-2xl text-white font-bold text-center active:scale-95 transition-all"
        >
          View My Character →
        </button>
      </div>

      {/* Purchase Confirmation */}
      {confirmItem && (
        <ConfirmModal
          title="Buy Item?"
          message={`Get "${confirmItem.name}" for ${confirmItem.cost_coins} coins?`}
          confirmText={`Buy for 🪙${confirmItem.cost_coins}`}
          cancelText="Not Now"
          onConfirm={() => handlePurchase(confirmItem)}
          onCancel={() => setConfirmItem(null)}
        />
      )}

      {/* Purchase Success Toast */}
      {purchaseSuccess && (
        <div className="fixed top-20 left-1/2 -translate-x-1/2 z-50 animate-slideDown">
          <div className="bg-green-500 text-white font-bold px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2">
            <span className="text-2xl">🎉</span>
            Got {purchaseSuccess}!
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
};
