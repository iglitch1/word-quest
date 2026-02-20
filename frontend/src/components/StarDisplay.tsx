import React from 'react';

interface StarDisplayProps {
  count: number;
  maxCount?: number;
  size?: 'sm' | 'md' | 'lg';
  animated?: boolean;
}

export const StarDisplay: React.FC<StarDisplayProps> = ({
  count,
  maxCount = 3,
  size = 'md',
  animated = false,
}) => {
  const sizeMap = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
  };

  const stars = Array.from({ length: maxCount }, (_, i) => i < count);

  return (
    <div className="flex gap-1">
      {stars.map((filled, i) => (
        <div
          key={i}
          className={`${sizeMap[size]} ${
            animated ? `animate-popIn` : ''
          }`}
          style={animated ? { animationDelay: `${i * 100}ms` } : {}}
        >
          {filled ? '⭐' : '☆'}
        </div>
      ))}
    </div>
  );
};
