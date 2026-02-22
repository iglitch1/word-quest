import React, { useEffect, useRef } from 'react';

interface WonderlandMusicProps {
  isPlaying: boolean;
  isPaused: boolean;
}

export const WonderlandMusic: React.FC<WonderlandMusicProps> = ({ isPlaying, isPaused }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const wantPlayRef = useRef(false);
  const unlockedRef = useRef(false);

  useEffect(() => {
    if (!audioRef.current) {
      audioRef.current = new Audio('/game-music.mp3');
      audioRef.current.loop = true;
      audioRef.current.volume = 0.3;
    }

    const audio = audioRef.current;

    if (isPlaying && !isPaused) {
      wantPlayRef.current = true;
      const promise = audio.play();
      if (promise !== undefined) {
        promise.then(() => {
          unlockedRef.current = true;
        }).catch(() => {
          // Autoplay blocked — will retry on first user interaction
        });
      }
    } else if (isPaused) {
      wantPlayRef.current = false;
      audio.pause();
    } else {
      wantPlayRef.current = false;
      audio.pause();
      audio.currentTime = 0;
    }

    return () => {
      audio.pause();
      audio.currentTime = 0;
    };
  }, [isPlaying, isPaused]);

  // Unlock audio on first user interaction (tap/click/keypress)
  useEffect(() => {
    const unlockAudio = () => {
      if (unlockedRef.current) return;
      const audio = audioRef.current;
      if (audio && wantPlayRef.current) {
        audio.play().then(() => {
          unlockedRef.current = true;
        }).catch(() => {});
      }
    };

    document.addEventListener('click', unlockAudio, { once: false });
    document.addEventListener('touchstart', unlockAudio, { once: false });
    document.addEventListener('keydown', unlockAudio, { once: false });

    return () => {
      document.removeEventListener('click', unlockAudio);
      document.removeEventListener('touchstart', unlockAudio);
      document.removeEventListener('keydown', unlockAudio);
    };
  }, []);

  return null;
};
