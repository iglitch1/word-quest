import React, { useEffect, useRef } from 'react';

interface WonderlandMusicProps {
  isPlaying: boolean;
  isPaused: boolean;
}

export const WonderlandMusic: React.FC<WonderlandMusicProps> = ({ isPlaying, isPaused }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/game-music.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
    }

    const audio = audioRef.current;

    if (isPlaying && !isPaused) {
      audio.play().catch(() => {
        // Browser may block autoplay until user interaction
      });
    } else if (isPaused) {
      audio.pause();
    } else {
      audio.pause();
      audio.currentTime = 0;
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [isPlaying, isPaused]);

  return null;
};
