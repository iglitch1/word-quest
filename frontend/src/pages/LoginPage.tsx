import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export const LoginPage: React.FC = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [username, setUsername] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const { login, register } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);

    try {
      if (isLogin) {
        await login(username, password);
      } else {
        await register(username, displayName, password);
      }
      navigate('/worlds');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  const FloatingWord = ({ word, delay, duration }: { word: string; delay: number; duration: number }) => (
    <div
      className="absolute text-2xl opacity-30 pointer-events-none animate-float"
      style={{
        animationDelay: `${delay}s`,
        animationDuration: `${duration}s`,
        left: `${Math.random() * 100}%`,
        top: `${Math.random() * 100}%`,
      }}
    >
      {word}
    </div>
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-400 via-pink-400 to-blue-500 flex items-center justify-center p-4 relative overflow-hidden">
      {/* Floating words background */}
      <div className="absolute inset-0 overflow-hidden">
        {['📚', '✏️', '🎓', '💡', '🌟', '📖', '🔤', '🎯'].map((word, i) => (
          <FloatingWord
            key={i}
            word={word}
            delay={i * 0.5}
            duration={4 + i}
          />
        ))}
      </div>

      {/* Content */}
      <div className="relative z-10 w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-7xl mb-4 animate-bounce">✨</div>
          <h1 className="text-5xl font-black text-white mb-2">Word Quest</h1>
          <p className="text-xl text-white font-semibold">Maya's Vocabulary Adventure</p>
        </div>

        {/* Card */}
        <div className="bg-white rounded-3xl shadow-2xl p-8 animate-slideUp">
          {/* Mode Toggle */}
          <div className="flex gap-2 mb-8 bg-gray-100 rounded-full p-1">
            <button
              onClick={() => {
                setIsLogin(true);
                setError('');
              }}
              className={`flex-1 py-3 rounded-full font-bold transition-all ${
                isLogin
                  ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-lg'
                  : 'text-gray-600'
              }`}
            >
              Log In
            </button>
            <button
              onClick={() => {
                setIsLogin(false);
                setError('');
              }}
              className={`flex-1 py-3 rounded-full font-bold transition-all ${
                !isLogin
                  ? 'bg-gradient-to-r from-purple-400 to-pink-400 text-white shadow-lg'
                  : 'text-gray-600'
              }`}
            >
              Sign Up
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-100 border-2 border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6 text-center font-semibold">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Username
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose your username"
                className="input text-lg py-4"
                required
                minLength={3}
              />
            </div>

            {!isLogin && (
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">
                  Display Name
                </label>
                <input
                  type="text"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  placeholder="What should we call you?"
                  className="input text-lg py-4"
                  required={!isLogin}
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter a strong password"
                className="input text-lg py-4"
                required
                minLength={6}
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="btn-primary w-full py-4 text-xl font-bold disabled:opacity-50"
            >
              {isLoading ? 'Loading...' : isLogin ? 'Adventure Awaits!' : 'Create Account'}
            </button>
          </form>

          {/* Toggle Text */}
          <div className="text-center mt-6">
            <p className="text-gray-600 text-sm">
              {isLogin ? (
                <>
                  New adventurer?{' '}
                  <button
                    onClick={() => setIsLogin(false)}
                    className="text-purple-600 font-bold hover:underline"
                  >
                    Create account
                  </button>
                </>
              ) : (
                <>
                  Already have an account?{' '}
                  <button
                    onClick={() => setIsLogin(true)}
                    className="text-purple-600 font-bold hover:underline"
                  >
                    Log in
                  </button>
                </>
              )}
            </p>
          </div>
        </div>

        <p className="text-white text-center mt-8 text-sm font-semibold">
          🌟 Learn new words, earn coins, and become a Vocabulary Genius! 🌟
        </p>
      </div>
    </div>
  );
};
