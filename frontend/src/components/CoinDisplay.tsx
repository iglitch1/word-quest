import React, { useEffect, useState } from 'react';

interface CoinDisplayProps {
  amount: number;
  animated?: boolean;
}

export const CoinDisplay: React.FC<CoinDisplayProps> = ({ amount, animated = false }) => {
  const [displayAmount, setDisplayAmount] = useState(amount);
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (animated && displayAmount !== amount) {
      setIsAnimating(true);
      const timeout = setTimeout(() => {
        setDisplayAmount(amount);
        setIsAnimating(false);
      }, 300);
      return () => clearTimeout(timeout);
    } else {
      setDisplayAmount(amount);
    }
  }, [amount, animated]);

  return (
    <div className={`flex items-center gap-2 font-bold text-lg ${isAnimating ? 'scale-110' : 'scale-100'} transition-transform`}>
      <span className="text-2xl">🪙</span>
      <span className="text-yellow-600">{displayAmount}</span>
    </div>
  );
};
