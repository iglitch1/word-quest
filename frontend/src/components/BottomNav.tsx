import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export const BottomNav: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();

  const tabs = [
    { path: '/worlds', icon: '🗺️', label: 'Worlds' },
    { path: '/shop', icon: '🛍️', label: 'Shop' },
    { path: '/character', icon: '👤', label: 'Character' },
    { path: '/stats', icon: '📊', label: 'Stats' },
  ];

  const isActive = (path: string) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t-4 border-purple-500 shadow-2xl safe-area-bottom">
      <div className="flex justify-around">
        {tabs.map((tab) => (
          <button
            key={tab.path}
            onClick={() => navigate(tab.path)}
            className={`flex-1 py-3 flex flex-col items-center justify-center gap-1 active:scale-95 transition-all h-20 ${
              isActive(tab.path)
                ? 'bg-purple-100 border-b-4 border-purple-500'
                : 'border-b-4 border-transparent'
            }`}
          >
            <span className="text-2xl">{tab.icon}</span>
            <span
              className={`text-xs font-bold ${
                isActive(tab.path) ? 'text-purple-600' : 'text-gray-600'
              }`}
            >
              {tab.label}
            </span>
          </button>
        ))}
      </div>
    </nav>
  );
};
