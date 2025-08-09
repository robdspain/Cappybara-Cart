# Audio for Capybara Kart Chaos

The game now uses procedurally generated audio instead of external audio files. All audio is generated in real-time using the Web Audio API in the `audio-generator.js` file.

## Generated Audio

### Music
- `main_theme`: 8-bit style background music for racing (10-second loop)
- `final_lap`: Faster, more intense version of the main theme (10-second loop)
- `victory`: Triumphant fanfare when player wins (5 seconds)
- `defeat`: Sad trombone effect when player loses (3 seconds)

### Sound Effects (SFX)
- `engine`: Engine rumble that varies with speed (2-second loop)
- `boost`: Whoosh effect for mac & cheese power-up activation (0.8 seconds)
- `crash`: Impact sound for collisions with obstacles (0.5 seconds)
- `item_collect`: Ascending notes for collecting an item (0.3 seconds)
- `item_use`: Throwing sound for using an item (0.4 seconds)
- `lap_complete`: Three-note jingle for completing a lap (0.6 seconds)
- `race_start`: Countdown sound for race start (1 second)
- `race_end`: Fanfare for race finish (1.2 seconds)
- `trick`: Sparkly effect for performing a trick (0.7 seconds)

## Benefits of Procedural Audio

1. **No External Dependencies**: Eliminates the need for downloading audio files
2. **Smaller File Size**: Reduces the overall game size
3. **Authentic Retro Feel**: Creates genuine 16-bit style sound effects
4. **Dynamic Manipulation**: Allows for real-time audio adjustments (like engine pitch)
5. **Cross-Browser Compatibility**: Ensures consistent audio playback

## Implementation

The audio generation is implemented in `audio-generator.js` using the Web Audio API. Each sound is created by generating waveforms with specific characteristics:

- **Oscillators**: Used for tones and musical notes
- **Noise**: Random values for effects like crashes and engine sounds
- **Envelopes**: Attack and release curves for natural sound shaping
- **Filters**: Used to shape the frequency content of sounds

The `AudioManager` class in `audio.js` then uses these generated sounds for playback during gameplay.
