import useAudioManager from './AudioManager';

// This is a wrapper around useAudioManager to maintain compatibility
// with code that references useAudio() instead of useAudioManager()
export const useAudio = () => {
  return useAudioManager();
};

export default useAudio; 