import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

import { LoginPage } from './pages/LoginPage';
import { WorldMapPage } from './pages/WorldMapPage';
import { LevelSelectPage } from './pages/LevelSelectPage';
import { GamePlayPage } from './pages/GamePlayPage';
import { ResultsPage } from './pages/ResultsPage';
import { ShopPage } from './pages/ShopPage';
import { CharacterPage } from './pages/CharacterPage';
import { StatsPage } from './pages/StatsPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  return user ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  const { user } = useAuth();

  return (
    <Routes>
      <Route
        path="/"
        element={user ? <Navigate to="/worlds" replace /> : <Navigate to="/login" replace />}
      />

      <Route path="/login" element={<LoginPage />} />

      <Route
        path="/worlds"
        element={
          <ProtectedRoute>
            <WorldMapPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/worlds/:worldId"
        element={
          <ProtectedRoute>
            <LevelSelectPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/play/:levelId"
        element={
          <ProtectedRoute>
            <GamePlayPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/results/:sessionId"
        element={
          <ProtectedRoute>
            <ResultsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/shop"
        element={
          <ProtectedRoute>
            <ShopPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/character"
        element={
          <ProtectedRoute>
            <CharacterPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/stats"
        element={
          <ProtectedRoute>
            <StatsPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default App;
