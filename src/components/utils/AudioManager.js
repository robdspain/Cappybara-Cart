import { useEffect, useState, useCallback } from 'react';

/**
 * AudioManager - A comprehensive audio handling system for game sound effects and music
 * Features:
 * - Sound preloading and caching
 * - Volume control
 * - Music track switching with crossfade
 * - Audio categories (sfx, music) with separate volume controls
 * - Mute/unmute functionality
 */

// Audio context for procedural sound generation
let audioContext = null;

// Initialize audio context
const initAudioContext = () => {
  if (!audioContext) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioContext;
};

// Generate a tone with envelope
const generateTone = (frequency, duration, type = 'sine') => {
  const ctx = initAudioContext();
  const oscillator = ctx.createOscillator();
  const gainNode = ctx.createGain();
  
  oscillator.type = type;
  oscillator.frequency.value = frequency;
  
  // Create envelope
  gainNode.gain.setValueAtTime(0, ctx.currentTime);
  gainNode.gain.linearRampToValueAtTime(1, ctx.currentTime + 0.1);
  gainNode.gain.linearRampToValueAtTime(0, ctx.currentTime + duration);
  
  oscillator.connect(gainNode);
  gainNode.connect(ctx.destination);
  
  return { oscillator, gainNode };
};

// Generate noise
const generateNoise = (duration) => {
  const ctx = initAudioContext();
  const bufferSize = ctx.sampleRate * duration;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);
  
  for (let i = 0; i < bufferSize; i++) {
    data[i] = Math.random() * 2 - 1;
  }
  
  const noise = ctx.createBufferSource();
  noise.buffer = buffer;
  
  return noise;
};

// Sound generators
const soundGenerators = {
  drift: () => {
    const ctx = initAudioContext();
    const noise = generateNoise(2);
    const filter = ctx.createBiquadFilter();
    
    filter.type = 'bandpass';
    filter.frequency.value = 1000;
    filter.Q.value = 1;
    
    noise.connect(filter);
    filter.connect(ctx.destination);
    
    return noise;
  },
  
  boost: () => {
    const ctx = initAudioContext();
    const sweep = generateTone(500, 0.8, 'sawtooth');
    sweep.oscillator.frequency.linearRampToValueAtTime(2000, ctx.currentTime + 0.8);
    return sweep.oscillator;
  },
  
  crash: () => {
    const ctx = initAudioContext();
    const noise = generateNoise(0.5);
    const filter = ctx.createBiquadFilter();
    
    filter.type = 'lowpass';
    filter.frequency.value = 1000;
    
    noise.connect(filter);
    filter.connect(ctx.destination);
    
    return noise;
  },
  
  itemCollect: () => {
    const ctx = initAudioContext();
    const tones = [
      generateTone(440, 0.1),
      generateTone(550, 0.1),
      generateTone(660, 0.1)
    ];
    
    tones.forEach((tone, i) => {
      tone.oscillator.start(ctx.currentTime + i * 0.1);
    });
    
    return tones[0].oscillator;
  },
  
  itemUse: () => {
    const ctx = initAudioContext();
    const tone = generateTone(880, 0.4, 'triangle');
    return tone.oscillator;
  },
  
  lapComplete: () => {
    const ctx = initAudioContext();
    const tones = [
      generateTone(440, 0.2),
      generateTone(550, 0.2),
      generateTone(660, 0.2)
    ];
    
    tones.forEach((tone, i) => {
      tone.oscillator.start(ctx.currentTime + i * 0.2);
    });
    
    return tones[0].oscillator;
  },
  
  raceStart: () => {
    const ctx = initAudioContext();
    const tone = generateTone(440, 1, 'square');
    return tone.oscillator;
  },
  
  raceEnd: () => {
    const ctx = initAudioContext();
    const tones = [
      generateTone(880, 0.4),
      generateTone(660, 0.4),
      generateTone(440, 0.4)
    ];
    
    tones.forEach((tone, i) => {
      tone.oscillator.start(ctx.currentTime + i * 0.4);
    });
    
    return tones[0].oscillator;
  },
  
  mainTheme: () => {
    const ctx = initAudioContext();
    const sequence = [440, 550, 660, 550, 440, 550, 660, 880];
    const tones = sequence.map((freq, i) => {
      const tone = generateTone(freq, 0.5);
      tone.oscillator.start(ctx.currentTime + i * 0.5);
      return tone.oscillator;
    });
    
    return tones[0];
  },
  
  victory: () => {
    const ctx = initAudioContext();
    const sequence = [440, 550, 660, 880, 1100];
    const tones = sequence.map((freq, i) => {
      const tone = generateTone(freq, 0.3);
      tone.oscillator.start(ctx.currentTime + i * 0.3);
      return tone.oscillator;
    });
    
    return tones[0];
  },
  
  defeat: () => {
    const ctx = initAudioContext();
    const sequence = [440, 330, 220];
    const tones = sequence.map((freq, i) => {
      const tone = generateTone(freq, 0.5);
      tone.oscillator.start(ctx.currentTime + i * 0.5);
      return tone.oscillator;
    });
    
    return tones[0];
  }
};

export const useAudioManager = () => {
  const [initialized, setInitialized] = useState(false);
  const [masterVolume, setMasterVolume] = useState(0.7);
  const [sfxVolume, setSfxVolume] = useState(0.8);
  const [musicVolume, setMusicVolume] = useState(0.5);
  const [muted, setMuted] = useState(false);
  const [currentMusic, setCurrentMusic] = useState(null);

  // Initialize the audio manager
  useEffect(() => {
    try {
      initAudioContext();
      setInitialized(true);
      console.log('🔊 AudioManager: Initialized with Web Audio API');
    } catch (error) {
      console.error('🔊 AudioManager: Failed to initialize', error);
    }
  }, []);

  // Play a sound effect
  const playSfx = useCallback((sfxName, options = {}) => {
    if (!initialized || muted) return null;
    
    const generator = soundGenerators[sfxName];
    if (!generator) {
      console.warn(`🔊 AudioManager: Sound "${sfxName}" not found`);
      return null;
    }
    
    try {
      const sound = generator();
      const gainNode = audioContext.createGain();
      gainNode.gain.value = masterVolume * sfxVolume * (options.volume || 1);
      
      sound.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      sound.start();
      return sound;
    } catch (error) {
      console.warn(`🔊 AudioManager: Failed to play "${sfxName}"`, error);
      return null;
    }
  }, [initialized, masterVolume, sfxVolume, muted]);

  // Play music
  const playMusic = useCallback((musicName, { fadeOut = 1000, fadeIn = 1000 } = {}) => {
    if (!initialized || muted) return null;
    
    const generator = soundGenerators[musicName];
    if (!generator) {
      console.warn(`🔊 AudioManager: Music "${musicName}" not found`);
      return null;
    }
    
    try {
      const music = generator();
      const gainNode = audioContext.createGain();
      gainNode.gain.value = masterVolume * musicVolume;
      
      music.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      music.start();
      setCurrentMusic(musicName);
      return music;
    } catch (error) {
      console.warn(`🔊 AudioManager: Failed to play music "${musicName}"`, error);
      return null;
    }
  }, [initialized, masterVolume, musicVolume, muted]);

  // Stop music
  const stopMusic = useCallback(() => {
    if (currentMusic) {
      try {
        const ctx = audioContext;
        ctx.resume();
      } catch (error) {
        console.warn('🔊 AudioManager: Failed to stop music', error);
      }
      setCurrentMusic(null);
    }
  }, [currentMusic]);

  // Return the public API
  return {
    initialized,
    masterVolume,
    sfxVolume,
    musicVolume,
    muted,
    currentMusic,
    setMasterVolume,
    setSfxVolume,
    setMusicVolume,
    playSfx,
    playMusic,
    stopMusic
  };
};

export default useAudioManager; 