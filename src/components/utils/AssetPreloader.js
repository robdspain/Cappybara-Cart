import { useEffect } from 'react';

/**
 * AssetPreloader - A utility to preload and check assets
 * This component doesn't render anything but preloads specified assets
 * and logs errors for any that fail to load
 */
const AssetPreloader = () => {
  useEffect(() => {
    console.log('Asset Preloader - Starting validation of game assets');
    
    // Function to preload and validate an image
    const validateImage = (src, description) => {
      return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
          console.log(`✅ Successfully loaded image: ${description} (${src})`);
          resolve({ success: true, src });
        };
        img.onerror = (e) => {
          console.error(`❌ Failed to load image: ${description} (${src})`, e);
          resolve({ success: false, src });
        };
        img.src = src;
      });
    };
    
    // Function to preload and validate an audio file
    const validateAudio = (src, description) => {
      return new Promise((resolve) => {
        const audio = new Audio();
        audio.oncanplaythrough = () => {
          console.log(`✅ Successfully loaded audio: ${description} (${src})`);
          resolve({ success: true, src });
        };
        audio.onerror = (e) => {
          console.error(`❌ Failed to load audio: ${description} (${src})`, e);
          resolve({ success: false, src });
        };
        audio.src = src;
      });
    };
    
    // Function to validate dynamic textures created via JavaScript
    const validateDynamicTexture = (textureObj, description) => {
      return new Promise((resolve) => {
        if (textureObj && textureObj.image) {
          console.log(`✅ Successfully loaded dynamic texture: ${description}`);
          resolve({ success: true, description });
        } else {
          console.error(`❌ Failed to find dynamic texture: ${description}`);
          resolve({ success: false, description });
        }
      });
    };
    
    // List of assets to validate
    const assetsToValidate = [
      // Original audio files
      { type: 'audio', src: '/sounds/drift.mp3', description: 'Drift Sound' },
      { type: 'audio', src: '/sounds/boost.mp3', description: 'Boost Sound' },
      { type: 'audio', src: '/sounds/offtrack.mp3', description: 'Off-track Sound' },
      
      // New audio files from imported assets
      { type: 'audio', src: '/imported/assets/audio/sfx/boost.mp3', description: 'New Boost SFX' },
      { type: 'audio', src: '/imported/assets/audio/sfx/crash.mp3', description: 'Crash SFX' },
      { type: 'audio', src: '/imported/assets/audio/sfx/item_collect.mp3', description: 'Item Collect SFX' },
      { type: 'audio', src: '/imported/assets/audio/sfx/item_use.mp3', description: 'Item Use SFX' },
      { type: 'audio', src: '/imported/assets/audio/sfx/lap_complete.mp3', description: 'Lap Complete SFX' },
      { type: 'audio', src: '/imported/assets/audio/sfx/race_start.mp3', description: 'Race Start SFX' },
      { type: 'audio', src: '/imported/assets/audio/sfx/race_end.mp3', description: 'Race End SFX' },
      { type: 'audio', src: '/imported/assets/audio/music/main_theme.mp3', description: 'Main Theme Music' },
      { type: 'audio', src: '/imported/assets/audio/music/final_lap.mp3', description: 'Final Lap Music' },
      { type: 'audio', src: '/imported/assets/audio/music/victory.mp3', description: 'Victory Music' },
      { type: 'audio', src: '/imported/assets/audio/music/defeat.mp3', description: 'Defeat Music' },
      
      // Item sprites
      { type: 'image', src: '/imported/assets/sprites/mushroom.png', description: 'Mushroom Sprite' },
      { type: 'image', src: '/imported/assets/sprites/banana.png', description: 'Banana Sprite' },
      { type: 'image', src: '/imported/assets/sprites/red_shell.png', description: 'Red Shell Sprite' },
      { type: 'image', src: '/imported/assets/sprites/green_shell.png', description: 'Green Shell Sprite' },
      { type: 'image', src: '/imported/assets/sprites/star.png', description: 'Star Sprite' },
      { type: 'image', src: '/imported/assets/sprites/lightning.png', description: 'Lightning Sprite' },
      { type: 'image', src: '/imported/assets/sprites/item_box.png', description: 'Item Box Sprite' },
      
      // UI elements
      { type: 'image', src: '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/btn/play.png', description: 'Play Button' },
      { type: 'image', src: '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/btn/restart.png', description: 'Restart Button' },
      { type: 'image', src: '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/menu/bg.png', description: 'Menu Background' },
      { type: 'image', src: '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/you_win/bg.png', description: 'Win Screen Background' },
      { type: 'image', src: '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/you_lose/bg.png', description: 'Lose Screen Background' },
      
      // Character assets
      { type: 'image', src: '/imported/assets/cappyincart.png', description: 'Capybara in Kart' },
      { type: 'image', src: '/imported/assets/charlieTheCapybaraAnimationSheet.png', description: 'Charlie Animation Sheet' },
    ];
    
    // Dynamic textures to validate (created via JavaScript)
    const dynamicTexturesToValidate = [
      { type: 'dynamicTexture', obj: window.grassTexture, description: 'Dynamic Grass Texture' },
      { type: 'dynamicTexture', obj: window.trackTexture, description: 'Dynamic Track Texture' },
      { type: 'dynamicTexture', obj: window.skyTexture, description: 'Dynamic Sky Texture' },
      { type: 'dynamicTexture', obj: window.capybaraTexture, description: 'Dynamic Capybara Texture' },
      { type: 'dynamicTexture', obj: window.sandTexture, description: 'Dynamic Sand Texture' },
      { type: 'dynamicTexture', obj: window.waterTexture, description: 'Dynamic Water Texture' },
    ];
    
    // Combine all assets to validate
    const allAssetsToValidate = [
      ...assetsToValidate,
      ...dynamicTexturesToValidate
    ];
    
    // Validate all assets
    Promise.all(
      allAssetsToValidate.map(asset => {
        if (asset.type === 'image') {
          return validateImage(asset.src, asset.description);
        } else if (asset.type === 'audio') {
          return validateAudio(asset.src, asset.description);
        } else if (asset.type === 'dynamicTexture') {
          return validateDynamicTexture(asset.obj, asset.description);
        }
        return Promise.resolve({ success: false, message: 'Unknown asset type' });
      })
    ).then(results => {
      const successCount = results.filter(r => r.success).length;
      const failCount = results.length - successCount;
      
      console.log(`Asset Preloader - Completed validation: ${successCount} successful, ${failCount} failed`);
      
      if (failCount > 0) {
        console.warn('Some assets failed to load. This may cause visual or audio issues in the game.');
        console.warn('Failed assets:', results.filter(r => !r.success));
      }
    });
    
    return () => {
      // Cleanup if needed
    };
  }, []);
  
  // This component doesn't render anything
  return null;
};

export default AssetPreloader; 