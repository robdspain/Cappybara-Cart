import React, { useRef, useState, useEffect, useMemo, useCallback, forwardRef } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Sky, Stars, PerspectiveCamera } from '@react-three/drei';
import * as THREE from 'three';
import AIDriver from './AIDriver';
import { RaceTrack, getTrackData } from './RaceTrack';
import RaceUI, { RaceCountdown, RaceResults } from './RaceUI';
import PlayerRacer from './PlayerRacer';
import { 
  ItemBox, 
  ItemProjectile, 
  ItemDisplay, 
  ITEMS,
  useItemEffects,
  ActiveItems
} from './ItemSystem';
import MiniMap from './MiniMap';
import RaceHUD from './RaceHUD';
import CharacterSelect, { CHARACTERS } from './CharacterSelect';
import KartCustomize, { KART_BODIES, KART_WHEELS, KART_GLIDERS } from './KartCustomize';
import { Stats, OrbitControls } from '@react-three/drei';
import AssetPreloader from './utils/AssetPreloader';
import useAudioManager from './utils/AudioManager';
import { useAudio } from './utils/useAudio';
import { TerrainModels, VegetationModels } from './utils/ModelLoader';

// Add this new component here
const KeyboardDebugger = () => {
  const [keys, setKeys] = useState({});
  
  useEffect(() => {
    const handleKeyDown = (e) => {
      setKeys(prev => ({ ...prev, [e.code]: true }));
    };
    
    const handleKeyUp = (e) => {
      setKeys(prev => ({ ...prev, [e.code]: false }));
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);
  
  return (
    <div style={{
      position: 'absolute',
      top: 10,
      left: 10,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      color: 'white',
      padding: 10,
      fontFamily: 'monospace',
      zIndex: 1000
    }}>
      <h3>Keyboard Input Debug</h3>
      <div>
        {Object.entries(keys)
          .filter(([_, isPressed]) => isPressed)
          .map(([key]) => (
            <div key={key} style={{ color: '#00FF00' }}>{key} PRESSED</div>
          ))
        }
        {Object.entries(keys).length === 0 && (
          <div>No keys pressed</div>
        )}
      </div>
    </div>
  );
};

// Add this new component
const MovingDebugObject = () => {
  const ref = useRef();
  const [position, setPosition] = useState([0, 2, 0]);
  
  // Move in a circular pattern
  useFrame((state) => {
    const time = state.clock.getElapsedTime();
    const x = Math.sin(time * 0.5) * 5;
    const z = Math.cos(time * 0.5) * 5;
    setPosition([x, 2, z]);
    
    if (ref.current) {
      ref.current.position.set(x, 2, z);
    }
  });
  
  return (
    <mesh ref={ref} position={position}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="blue" />
    </mesh>
  );
};

// Enhanced Lighting with environment
const AdvancedLighting = () => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1} 
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048}
      />
      <spotLight
        position={[0, 10, 0]}
        angle={0.3}
        penumbra={0.8}
        intensity={1.5}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      {/* Use our custom SkyBox instead of the default Sky */}
      <CustomSkyBox />
      <Stars radius={100} depth={50} count={5000} factor={4} saturation={0} fade />
      
      {/* Add terrain models around the track */}
      <TerrainModels count={15} radius={200} />
      <VegetationModels count={30} radius={80} />
    </>
  );
};

// Custom SkyBox component using our dynamic texture
const CustomSkyBox = () => {
  const [skyMaterial, setSkyMaterial] = useState(null);
  
  useEffect(() => {
    // Check if our dynamic sky texture is available
    if (window.skyTexture && window.skyTexture.image) {
      console.log("Using dynamic sky texture");
      const texture = new THREE.Texture(window.skyTexture.image);
      texture.needsUpdate = true;
      
      // Create a material using the texture
      const material = new THREE.MeshBasicMaterial({
        map: texture,
        side: THREE.BackSide, // Important: render on the inside of the sphere
      });
      
      setSkyMaterial(material);
    }
  }, []);
  
  // If sky material is not available, don't render anything
  if (!skyMaterial) return null;
  
  return (
    <mesh>
      <sphereGeometry args={[100, 32, 16]} />
      {skyMaterial && <primitive object={skyMaterial} attach="material" />}
    </mesh>
  );
};

// Create a SceneLighting component that GameScene can use
const SceneLighting = () => {
  return <AdvancedLighting />;
};

// Engine exhaust particles for the karts
// eslint-disable-next-line no-unused-vars
const EngineExhaust = ({ position }) => {
  const [initialized, setInitialized] = useState(false);
  const particlesRef = useRef();
  const particleCount = 50;
  
  // Initialize particle positions and sizes using state
  const [particles, setParticles] = useState({
    positions: new Float32Array(particleCount * 3),
    sizes: new Float32Array(particleCount)
  });
  
  // Initialize particles only once on component mount
  useEffect(() => {
    const positions = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    
    // Initialize with random positions and sizes
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      positions[i3] = (Math.random() * 2 - 1) * 0.1;
      positions[i3 + 1] = Math.random() * 0.5;
      positions[i3 + 2] = (Math.random() * 2 - 1) * 0.1;
      sizes[i] = Math.random() * 0.5 + 0.1;
    }
    
    setParticles({ positions, sizes });
    setInitialized(true);
  }, []);
  
  // Handle particle animation
  useFrame(() => {
    if (!particlesRef.current || !initialized) return;
    
    const geometry = particlesRef.current.geometry;
    if (!geometry) return;
    
    const positionAttribute = geometry.attributes.position;
    const sizeAttribute = geometry.attributes.size;
    
    if (!positionAttribute || !positionAttribute.array || 
        !sizeAttribute || !sizeAttribute.array) {
      return;
    }
    
    // Update particle positions
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      
      // Only access if the array exists
      if (i3 + 1 < positionAttribute.array.length) {
        // Move particles upward and add some randomness
        positionAttribute.array[i3] *= 1.01; // Spread X
        positionAttribute.array[i3 + 1] += 0.01; // Move up Y
        positionAttribute.array[i3 + 2] *= 1.01; // Spread Z
        
        // Reset particles that go too high
        if (positionAttribute.array[i3 + 1] > 0.5) {
          positionAttribute.array[i3] = (Math.random() * 2 - 1) * 0.1;
          positionAttribute.array[i3 + 1] = 0;
          positionAttribute.array[i3 + 2] = (Math.random() * 2 - 1) * 0.1;
        }
      }
    }
    
    // Mark attributes for update only if they exist
    positionAttribute.needsUpdate = true;
    sizeAttribute.needsUpdate = true;
  });
  
  // Don't render anything until we're initialized
  if (!initialized) return null;
  
  return (
    <points position={[position[0], position[1] - 0.2, position[2] + 0.6]}>
      <bufferGeometry ref={particlesRef}>
        <bufferAttribute
          attach="attributes-position"
          count={particles.positions.length / 3}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-size"
          count={particles.sizes.length}
          array={particles.sizes}
          itemSize={1}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        color="#cccccc"
        sizeAttenuation
        transparent
        opacity={0.8}
      />
    </points>
  );
};

// Helper function to replace getItemForPosition
const getRandomItem = (position = 1, totalRacers = 4) => {
  // Implements rubber-banding: better items for players in lower positions
  if (position === 1) {
    // First place - weaker items
    const items = [
      ITEMS.BANANA,
      ITEMS.GREEN_SHELL,
      ITEMS.MUSHROOM
    ];
    return items[Math.floor(Math.random() * items.length)];
  } else if (position <= Math.ceil(totalRacers / 2)) {
    // Middle positions - balanced items
    const items = [
      ITEMS.BANANA,
      ITEMS.GREEN_SHELL,
      ITEMS.RED_SHELL,
      ITEMS.MUSHROOM,
      ITEMS.TRIPLE_MUSHROOM
    ];
    return items[Math.floor(Math.random() * items.length)];
  } else {
    // Last positions - better items
    const items = [
      ITEMS.RED_SHELL,
      ITEMS.MUSHROOM,
      ITEMS.TRIPLE_MUSHROOM,
      ITEMS.STAR
    ];
    return items[Math.floor(Math.random() * items.length)];
  }
};

// Main game scene
const GameScene = ({ 
  onGameOver, 
  onRaceStart, 
  onRaceDataUpdate, 
  trackRefExternal, 
  parentRaceState,
  characterInfo,
  kartConfig,
  onItemCollected,
  onItemUsed,
  onCrash,
  isDrifting,
  isOffTrack,
  isPaused
}) => {
  // Add camera ref
  const cameraRef = useRef();
  const playerRef = useRef();

  // Camera settings
  const cameraSettings = useMemo(() => ({
    distance: 5,
    height: 2,
    smoothing: 0.1,
    defaultPosition: [0, 2, 10],
    defaultLookAt: [0, 0, 0]
  }), []);

  // Camera position state
  const [cameraPosition, setCameraPosition] = useState([0, cameraSettings.height, cameraSettings.distance]);
  const [cameraLookAt, setCameraLookAt] = useState([0, 0, 0]);

  // Add camera update logic in useFrame
  useFrame(() => {
    if (!cameraRef.current || !playerRef.current) return;

    const playerPosition = playerRef.current.position || new THREE.Vector3();
    const playerRotation = playerRef.current.rotation || new THREE.Euler();

    // Calculate target camera position
    const targetPosition = new THREE.Vector3(
      playerPosition.x - Math.sin(playerRotation.y) * cameraSettings.distance,
      playerPosition.y + cameraSettings.height,
      playerPosition.z - Math.cos(playerRotation.y) * cameraSettings.distance
    );

    // Calculate look-at position (slightly ahead of player)
    const lookAtPosition = new THREE.Vector3(
      playerPosition.x + Math.sin(playerRotation.y) * 2,
      playerPosition.y + 1,
      playerPosition.z + Math.cos(playerRotation.y) * 2
    );

    // Smoothly interpolate camera position
    cameraRef.current.position.lerp(targetPosition, cameraSettings.smoothing);
    
    // Update camera look-at
    const currentLookAt = new THREE.Vector3();
    currentLookAt.lerp(lookAtPosition, cameraSettings.smoothing);
    cameraRef.current.lookAt(currentLookAt);
  });

  // Initialize player position and rotation with safe defaults
  const [playerPosition, setPlayerPosition] = useState([0, 0.5, 10]);
  const [playerRotation, setPlayerRotation] = useState([0, 0, 0]);

  // Race state
  const [raceState, setRaceState] = useState('waiting'); // 'waiting', 'countdown', 'racing', 'finished'
  const [countdown, setCountdown] = useState(3);
  const [raceTime, setRaceTime] = useState(0);
  const [raceStartTime, setRaceStartTime] = useState(0);
  const [racers, setRacers] = useState([]);
  const trackRef = useRef();
  
  // Add access to audio
  const { playMusic, playSfx, stopMusic } = useAudio();
  
  // Add a ref to track if race has started
  const raceStartedRef = useRef(false);
  
  // Share track ref with parent
  useEffect(() => {
    if (trackRef.current && trackRefExternal) {
      trackRefExternal.current = trackRef.current;
    }
  }, [trackRef, trackRefExternal]);
  
  // Item-related state
  const [itemBoxes, setItemBoxes] = useState([]);
  const [activeItems, setActiveItems] = useState([]);
  const [playerItem, setPlayerItem] = useState(null);
  
  // Character types for different racers
  const characterTypes = useMemo(() => ['capybara', 'toad', 'turtle', 'rabbit', 'penguin'], []);
  
  // Race settings
  const totalLaps = 3;
  const aiCount = 4; // Number of AI opponents
  
  // Get track data
  const trackData = getTrackData();
  
  // Setup item boxes and coins around the track
  useEffect(() => {
    // Place item boxes around the track
    const boxes = [];
    const coinItems = [];
    
    // Create item boxes along the track
    const boxCount = 8; // Number of item boxes to place
    for (let i = 0; i < boxCount; i++) {
      // Place boxes evenly around the track
      const pathIndex = Math.floor((i / boxCount) * trackData.path.length);
      const point = trackData.path[pathIndex];
      
      // Offset slightly to prevent placing directly on the path
      const boxPosition = [
        point[0] + (Math.random() * 2 - 1), 
        point[1], 
        point[2] + (Math.random() * 2 - 1)
      ];
      
      boxes.push({
        id: `box-${i}`,
        position: boxPosition
      });
    }
    
    // Create coins along the track
    const coinCount = 20; // Number of coins to place
    for (let i = 0; i < coinCount; i++) {
      // Place coins evenly around the track with some randomness
      const pathIndex = Math.floor((i / coinCount) * trackData.path.length);
      const point = trackData.path[pathIndex];
      
      // Offset to create a pattern
      const angle = (i / coinCount) * Math.PI * 2;
      const radius = 1 + Math.random() * 0.5;
      const coinPosition = [
        point[0] + Math.cos(angle) * radius, 
        point[1], 
        point[2] + Math.sin(angle) * radius
      ];
      
      coinItems.push({
        id: `coin-${i}`,
        position: coinPosition
      });
    }
    
    setItemBoxes(boxes);
    setActiveItems(coinItems);
  }, [trackData.path]);
  
  // Initialize AI racers
  useEffect(() => {
    // Create AI racer data
    const initialRacers = [
      // Player
      {
        id: 'player',
        name: 'Capybara',
        characterType: 'capybara',
        position: 1,
        lap: 0,
        time: 0,
        isPlayer: true,
        angle: 0,
        speed: 0,
        isOnTrack: true,
        coins: 0,
        item: null
      }
    ];
    
    // Add AI racers
    for (let i = 0; i < aiCount; i++) {
      const characterType = characterTypes[i + 1] || characterTypes[i % characterTypes.length];
      initialRacers.push({
        id: `ai-${i}`,
        name: characterType.charAt(0).toUpperCase() + characterType.slice(1),
        characterType,
        position: i + 2,
        lap: 0,
        time: 0,
        isPlayer: false,
        angle: 0,
        speed: 0,
        isOnTrack: true,
        coins: 0,
        item: null,
        // Vary AI difficulty slightly
        difficultyFactor: 0.8 + Math.random() * 0.4
      });
    }
    
    setRacers(initialRacers);
  }, [aiCount, characterTypes]);
  
  // Sync with parent race state
  useEffect(() => {
    if (parentRaceState && parentRaceState !== raceState) {
      console.log(`GameScene: Updating race state from ${raceState} to ${parentRaceState}`);
      console.log(`This should trigger raceActive=${parentRaceState === 'racing'} for PlayerRacer`);
      setRaceState(parentRaceState);
    } else {
      console.log(`GameScene: Race state check - current: ${raceState}, parent: ${parentRaceState}`);
    }
  }, [parentRaceState, raceState]);
  
  // Modified race state transitions
  useEffect(() => {
    if (raceState === 'waiting') {
      // Don't automatically transition to countdown
      // Parent component will control this now
      console.log('GameScene: waiting for parent component signal');
      // Play menu music
      playMusic('main_theme', { fadeIn: 1 });
    }
    
    if (raceState === 'countdown') {
      console.log('GameScene: in countdown state');
      // Let parent component handle the countdown
      playSfx('race_start');
    }
    
    if (raceState === 'racing' && !raceStartedRef.current) {
      console.log('GameScene: race has started');
      raceStartedRef.current = true;
      // Start the race timer
      setRaceStartTime(Date.now());
      onRaceStart && onRaceStart();
      
      // Play race music
      playMusic('furious_fass', { fadeIn: 1 });
    }
    
    if (raceState === 'finished') {
      // Play victory music
      playMusic('victory', { fadeIn: 0.5 });
    }
  }, [raceState, onRaceStart, playMusic, playSfx]);
  
  // Listen for race state updates from parent
  useEffect(() => {
    // Update race state based on parent component updates
    onRaceDataUpdate({
      raceState: raceState,
      countdown: countdown
    });
  }, [raceState, countdown, onRaceDataUpdate]);
  
  // Race timer
  useEffect(() => {
    if (raceState === 'racing') {
      const timer = setInterval(() => {
        setRaceTime(prevTime => prevTime + 0.1);
      }, 100);
      
      return () => clearInterval(timer);
    }
  }, [raceState]);
  
  // Handle collision with track obstacles
  const handleCollision = (collisionData) => {
    // You can implement actual collision logic here
    console.log('Collision detected:', collisionData);
    
    // Example: play sound effect
    // playSound('bump.mp3');
    
    // Example: reduce player speed or apply stun effect
    setRacers(prevRacers => {
      const newRacers = [...prevRacers];
      const playerIndex = newRacers.findIndex(r => r.isPlayer);
      
      if (playerIndex !== -1) {
        // Example: apply some penalty
        // newRacers[playerIndex].speed *= 0.8;
      }
      
      return newRacers;
    });
  };
  
  // Handle player position update
  const handlePlayerPositionUpdate = (playerData) => {
    if (!playerData) return;

    // Ensure playerData has all required properties with safe defaults
    const safePlayerData = {
      position: playerData.position || [0, 0.5, 10],
      angle: playerData.angle || 0,
      lap: playerData.lap || 0,
      speed: playerData.speed || 0,
      isOnTrack: playerData.isOnTrack || false,
      isDrifting: playerData.isDrifting || false,
      driftBoostLevel: playerData.driftBoostLevel || 0
    };

    // Update player position and rotation for minimap with safe values
    setPlayerPosition(safePlayerData.position);
    setPlayerRotation([0, safePlayerData.angle, 0]);
    
    // Update player data in racers array
    setRacers(prevRacers => {
      if (!prevRacers) return [];
      
      const newRacers = [...prevRacers];
      const playerIndex = newRacers.findIndex(r => r.isPlayer);
      
      if (playerIndex !== -1) {
        newRacers[playerIndex] = {
          ...newRacers[playerIndex],
          angle: safePlayerData.angle,
          lap: safePlayerData.lap,
          speed: safePlayerData.speed,
          isOnTrack: safePlayerData.isOnTrack,
          position: safePlayerData.position,
          isDrifting: safePlayerData.isDrifting,
          driftBoostLevel: safePlayerData.driftBoostLevel
        };
        
        // Update race data for HUD with safe values
        onRaceDataUpdate({
          currentLap: safePlayerData.lap
        });
      }
      
      return newRacers;
    });
    
    // Check for item box collisions with safe position values
    itemBoxes.forEach(box => {
      if (!box || !box.position) return;
      
      const distance = new THREE.Vector3(
        box.position[0] - safePlayerData.position[0],
        box.position[1] - safePlayerData.position[1],
        box.position[2] - safePlayerData.position[2]
      ).length();
      
      if (distance < 1.5 && !box.collected) {
        handleItemBoxCollect(box.id);
      }
    });
    
    // Check for coin collisions with safe position values
    activeItems.forEach(coin => {
      if (!coin || !coin.position) return;
      
      const distance = new THREE.Vector3(
        coin.position[0] - safePlayerData.position[0],
        coin.position[1] - safePlayerData.position[1],
        coin.position[2] - safePlayerData.position[2]
      ).length();
      
      if (distance < 1 && !coin.collected) {
        handleCoinCollect(coin.id);
      }
    });
  };
  
  // Handle item box collection
  const handleItemBoxCollect = (itemBoxId) => {
    // Mark item box as collected
    setItemBoxes(prevBoxes => 
      prevBoxes.map(box => 
        box.id === itemBoxId ? { ...box, collected: true } : box
      )
    );
    
    // Give player an item if they don't already have one
    if (!playerItem) {
      const player = racers.find(r => r.isPlayer);
      if (!player) return;
      
      // Determine which item to give based on position
      const newItem = getRandomItem(player.position, racers.length);
      setPlayerItem(newItem);
      
      // Play sound effect
      playSfx('item_collect');
    }
  };
  
  // Handle coin collection
  const handleCoinCollect = (coinId) => {
    // Mark coin as collected
    setActiveItems(prevItems => 
      prevItems.map(item => 
        item.id === coinId ? { ...item, collected: true } : item
      )
    );
    
    // Increase player coins
    setRacers(prevRacers => {
      const newRacers = [...prevRacers];
      const playerIndex = newRacers.findIndex(r => r.isPlayer);
      
      if (playerIndex !== -1) {
        newRacers[playerIndex] = {
          ...newRacers[playerIndex],
          coins: (newRacers[playerIndex].coins || 0) + 1
        };
      }
      
      return newRacers;
    });
    
    // Play sound effect
    playSfx('item_collect', { volume: 0.3 });
  };
  
  // Handle banana hit
  const handleBananaHit = (bananaId) => {
    // Mark banana as hit
    setActiveItems(prevItems => 
      prevItems.map(item => 
        item.id === bananaId ? { ...item, hit: true } : item
      )
    );
    
    // Apply spinning effect to player
    // This would be handled in the PlayerRacer component
    
    // Play sound effect
    playSfx('crash');
  };
  
  // Handle player item use
  const handlePlayerItemUse = () => {
    if (!playerItem) return;
    
    const player = racers.find(r => r.isPlayer);
    if (!player) return;
    
    // Handle different item types
    switch (playerItem) {
      case ITEMS.BANANA:
        // Drop banana behind player
        const bananaPosition = [
          player.position[0] - Math.sin(player.angle) * 2,
          player.position[1],
          player.position[2] - Math.cos(player.angle) * 2
        ];
        
        setActiveItems(prev => [
          ...prev,
          {
            id: `banana-${Date.now()}`,
            position: bananaPosition,
            hit: false
          }
        ]);
        break;
        
      case ITEMS.GREEN_SHELL:
      case ITEMS.RED_SHELL:
        // Fire shell forward
        const shellPosition = [
          player.position[0] + Math.sin(player.angle) * 1,
          player.position[1],
          player.position[2] + Math.cos(player.angle) * 1
        ];
        
        setActiveItems(prev => [
          ...prev,
          {
            id: `projectile-${Date.now()}`,
            position: shellPosition,
            rotation: [0, player.angle, 0],
            type: playerItem,
            velocity: 0.3,
            target: playerItem === ITEMS.RED_SHELL ? getTarget(player) : null
          }
        ]);
        break;
        
      case ITEMS.MUSHROOM:
      case ITEMS.TRIPLE_MUSHROOM:
        // Play boost sound for mushroom
        playSfx('boost');
        break;
        
      case ITEMS.STAR:
        // Play star activation sound
        playSfx('item_use');
        break;
        
      default:
        break;
    }
    
    // Play appropriate sound
    playSfx('item_use');
    
    // Clear the item
    setPlayerItem(null);
  };
  
  // Get target for homing items
  const getTarget = (player) => {
    // Find the next player ahead
    const sortedRacers = [...racers].sort((a, b) => {
      if (a.lap !== b.lap) return b.lap - a.lap;
      return b.position - a.position;
    });
    
    // Find current player index
    const playerIndex = sortedRacers.findIndex(r => r.id === player.id);
    
    // Target is the racer ahead
    if (playerIndex > 0) {
      return sortedRacers[playerIndex - 1];
    }
    
    return null;
  };
  
  // Handle player lap complete
  const handlePlayerLapComplete = (lap) => {
    // setPlayerLap(lap);
    playSfx('lap_complete');
    
    // On final lap, change music
    if (lap === totalLaps - 1) {
      playMusic('final_lap', { fadeIn: 0.5 });
    }
  };
  
  // Handle race finish
  const handleRaceFinish = () => {
    setRaceState('finished');
    
    // Create final results with race times
    const finalResults = racers.map(racer => ({
      ...racer,
      time: racer.isPlayer ? formatTime(raceTime) : generateAITime()
    }));
    
    setRacers(finalResults);
    
    // Play race end sound
    playSfx('race_end');
    
    // Play victory or defeat music based on player position
    const playerResult = finalResults.find(r => r.isPlayer);
    if (playerResult && playerResult.position === 1) {
      playMusic('victory');
    } else {
      playMusic('defeat');
    }
    
    // Notify parent of game over with results
    setTimeout(() => {
      onGameOver(finalResults);
    }, 2000);
  };
  
  // Format time as MM:SS.mmm
  const formatTime = (time) => {
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    const milliseconds = Math.floor((time % 1) * 1000).toString().padStart(3, '0');
    return `${minutes}:${seconds}.${milliseconds}`;
  };
  
  // Generate a realistic race time for AI racers
  const generateAITime = () => {
    const baseTime = raceTime;
    const variation = (Math.random() * 20) - 10; // +/- 10 seconds
    const aiTime = Math.max(0, baseTime + variation);
    return formatTime(aiTime);
  };
  
  // AI difficulty scaling - make AIs tougher as player advances
  const getAIDifficulty = (aiRacer) => {
    // Base difficulty from racer
    const baseDifficulty = aiRacer.difficultyFactor || 1.0;
    
    // Adjust based on player's lap - catch-up mechanic
    const playerRacer = racers.find(r => r.isPlayer);
    if (playerRacer && playerRacer.lap > 0) {
      // Make AI more difficult if player is ahead
      if (playerRacer.position === 1) {
        return baseDifficulty * 1.1;
      }
      // Make trailing AIs a bit faster to keep race tight
      if (aiRacer.position > playerRacer.position + 1) {
        return baseDifficulty * 1.05;
      }
    }
    
    return baseDifficulty;
  };
  
  // Calculate starting positions for racers
  const getStartPosition = (index) => {
    // Grid-style starting positions
    const row = Math.floor(index / 2);
    const col = index % 2;
    
    return [
      col === 0 ? -1 : 1, // Left or right of center
      0,
      10 + row * 2 // Staggered rows
    ];
  };
  
  // Update player positions for minimap with null checks
  useEffect(() => {
    if (!racers || racers.length === 0) return;

    const playerData = racers.map(racer => ({
      position: racer.isPlayer ? (playerPosition || [0, 0.5, 10]) : (racer.position || [0, 0.5, 10]),
      rotation: racer.isPlayer ? (playerRotation || [0, 0, 0]) : ([0, racer.angle || 0, 0])
    }));

    onRaceDataUpdate({
      players: playerData
    });
  }, [racers, playerPosition, playerRotation, onRaceDataUpdate]);
  
  // Add handleProjectileHit function
  const handleProjectileHit = (projectileId) => {
    // Mark projectile as hit/used
    setActiveItems(prevItems => 
      prevItems.map(item => 
        item.id === projectileId ? { ...item, hit: true, lifetime: 0 } : item
      )
    );
    
    // Apply effects to the hit target
    // This would need to be expanded based on your game's collision detection
    
    // Play sound effect
    // playSound('shellHit.mp3');
  };
  
  // Update projectiles
  useFrame((state, delta) => {
    setActiveItems(prevItems => {
      // Update positions of active items
      return prevItems.map(item => {
        // Skip items without direction (static items like bananas)
        if (!item.direction) return item;
        
        // Movement for projectiles
        const newPosition = [...item.position];
        const speed = item.type === ITEMS.RED_SHELL ? 15 : 10;
        
        // Basic movement in the direction
        newPosition[0] += Math.sin(item.direction) * speed * delta;
        newPosition[2] += Math.cos(item.direction) * speed * delta;
        
        // Homing behavior for red shells
        if (item.type === ITEMS.RED_SHELL && item.target) {
          // Add homing logic here
        }
        
        return {
          ...item,
          position: newPosition,
          lifetime: (item.lifetime || 10) - delta
        };
      }).filter(item => (item.lifetime || 0) > 0); // Remove expired items
    });
  });
  
  // Pass character and kart info to PlayerRacer
  return (
    <>
      {/* Add PerspectiveCamera */}
      <PerspectiveCamera
        ref={cameraRef}
        makeDefault
        position={cameraPosition}
        fov={75}
        near={0.1}
        far={1000}
      />

      {/* Lighting setup */}
      <SceneLighting />
      
      {/* Track */}
      <RaceTrack ref={trackRef} onCollision={handleCollision} />
      
      {/* Player character */}
      <PlayerRacer 
        ref={playerRef}
        characterType={characterInfo.id}
        kartConfig={kartConfig}
        position={[0, 0, 10]}
        rotation={[0, 0, 0]}
        lap={0}
        onLapComplete={handlePlayerLapComplete}
        onPositionUpdate={handlePlayerPositionUpdate}
        onItemCollect={handleItemBoxCollect}
        onUseItem={handlePlayerItemUse}
        raceActive={raceState === 'racing'}
        trackData={trackData}
        playerStats={{
          speed: characterInfo.stats.speed + kartConfig.body.stats.speed * 0.3 + kartConfig.wheels.stats.speed * 0.2,
          acceleration: characterInfo.stats.acceleration + kartConfig.body.stats.acceleration * 0.3 + kartConfig.wheels.stats.acceleration * 0.2,
          handling: characterInfo.stats.handling + kartConfig.body.stats.handling * 0.3 + kartConfig.wheels.stats.handling * 0.2,
          weight: characterInfo.stats.weight + kartConfig.body.stats.weight * 0.3
        }}
        onItemCollected={onItemCollected}
        onItemUsed={onItemUsed}
        onCrash={onCrash}
        isDrifting={isDrifting}
        isOffTrack={isOffTrack}
        isPaused={isPaused}
      />
      
      {/* AI racers */}
      {racers.filter(r => !r.isPlayer).map((aiRacer, index) => (
        <AIDriver
          key={aiRacer.id}
          characterType={aiRacer.characterType}
          initialPosition={getStartPosition(index + 1)}
          trackPath={trackData.path}
          speed={0.1}
          difficultyFactor={getAIDifficulty(aiRacer)}
          lapCallback={(lap) => {
            setRacers(prevRacers => {
              const newRacers = [...prevRacers];
              const aiIndex = newRacers.findIndex(r => r.id === aiRacer.id);
              
              if (aiIndex !== -1) {
                newRacers[aiIndex] = {
                  ...newRacers[aiIndex],
                  lap: lap
                };
                
                if (lap >= totalLaps && raceState === 'racing') {
                  const playerRacer = newRacers.find(r => r.isPlayer);
                  if (playerRacer && playerRacer.position > 1) {
                    handleRaceFinish();
                  }
                }
              }
              
              return newRacers;
            });
          }}
        />
      ))}
    </>
  );
};

// Main exported component
const Game3DCanvas = ({ onGameOver }) => {
  // Add audio hook
  const { playMusic, playSfx, stopMusic, setMusicVolume, setSfxVolume } = useAudio();
  const audioManager = useAudioManager();

  // Game state
  const [gameState, setGameState] = useState({
    phase: 'character_select',
    results: [],
    positions: [],
    countdown: 3,
    playerItem: null,
    raceTime: 0
  });

  // Race state
  const [isDrifting, setIsDrifting] = useState(false);
  const [isOffTrack, setIsOffTrack] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [isRacing, setIsRacing] = useState(false);
  const [raceTimer, setRaceTimer] = useState(0);
  const [playerPosition, setPlayerPosition] = useState(1);
  const [countdownValue, setCountdownValue] = useState(3);
  const [raceStartTime, setRaceStartTime] = useState(null);
  const [currentRaceData, setCurrentRaceData] = useState(null);
  const [selectedCharacter, setSelectedCharacter] = useState('capybara');
  const [selectedKartConfig, setSelectedKartConfig] = useState({
    body: { id: 'standard', stats: { speed: 3, acceleration: 3, handling: 3, weight: 3 } },
    wheels: { id: 'standard', stats: { speed: 3, acceleration: 3, handling: 3, traction: 3 } },
    glider: { id: 'standard', stats: { speed: 3, acceleration: 3, handling: 3, airTime: 3 } }
  });

  // Game flow state
  const [gameFlow, setGameFlow] = useState({
    currentPhase: 'character-select',
    character: null,
    kartConfig: null
  });

  // Setup global key handler
  const globalKeys = useRef({});
  
  // Track ref for MiniMap
  const trackRef = useRef();

  // Player data for MiniMap
  const [playerData, setPlayerData] = useState({
    players: []
  });
  
  // Add a direct global keyboard test
  const [keyState, setKeyState] = useState({
    ArrowUp: false,
    ArrowDown: false, 
    ArrowLeft: false,
    ArrowRight: false,
    Space: false
  });

  // Handle container click for focus
  const handleContainerClick = useCallback((e) => {
    e.currentTarget.focus();
  }, []);

  // Handle canvas click
  const handleCanvasClick = useCallback((e) => {
    e.stopPropagation();
  }, []);

  // Handle canvas created
  const handleCanvasCreated = useCallback(({ gl }) => {
    gl.shadowMap.enabled = true;
    gl.shadowMap.type = THREE.PCFSoftShadowMap;
  }, []);

  // Handle focus click
  const handleFocusClick = useCallback(() => {
    const canvas = document.getElementById('game-canvas');
    if (canvas) {
      canvas.focus();
    }
  }, []);

  // Handle force start click
  const handleForceStartClick = useCallback(() => {
    // Start countdown phase first
    setGameState(prev => ({ ...prev, phase: 'countdown' }));
    
    // Start countdown from 3
    setCountdownValue(3);
    
    // Create countdown timer
    const countdownInterval = setInterval(() => {
      setCountdownValue(prev => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          // After countdown, start the race
          setGameState(prev => ({ ...prev, phase: 'racing' }));
          setIsRacing(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    
    // Play countdown sound
    if (audioManager.initialized) {
      audioManager.playSfx('countdown');
    }
    
    // Cleanup interval on component unmount
    return () => clearInterval(countdownInterval);
  }, [audioManager]);

  // Handle race data update
  const handleRaceDataUpdate = useCallback((data) => {
    setCurrentRaceData(prev => ({ ...prev, ...data }));
  }, []);

  // After all the useState calls, add this useEffect:
  // Initialize background music when game starts
  useEffect(() => {
    if (audioManager.initialized) {
      audioManager.playMusic('mainTheme');
    }
  }, [audioManager.initialized]);

  // In handleRaceStart:
  const handleRaceStart = useCallback(() => {
    setGameFlow(prev => ({
      ...prev,
      currentPhase: 'racing'
    }));
    setIsRacing(true);
    
    // Play race start sound
    if (audioManager.initialized) {
      audioManager.playSfx('raceStart');
    }
    
    // Reset race timer and start it
    setRaceStartTime(Date.now());
    setRaceTimer(0);
    
    // Reset player position to 1st
    setPlayerPosition(1);
  }, [audioManager]);

  // In handleGameOver:
  const handleGameOver = useCallback((results) => {
    setGameFlow(prev => ({
      ...prev,
      currentPhase: 'finished'
    }));
    setIsRacing(false);
    
    // Update game state with results
    setGameState(prev => ({
      ...prev,
      phase: 'finished',
      results: results
    }));
    
    // Play appropriate end music based on player position
    if (audioManager.initialized) {
      audioManager.playSfx('raceEnd');
      
      // Slight delay before playing victory/defeat music
      setTimeout(() => {
        if (results.playerPosition === 1) {
          audioManager.playMusic('victory');
        } else {
          audioManager.playMusic('defeat');
        }
      }, 1000);
    }
    
    // Notify parent component
    if (onGameOver) {
      onGameOver(results);
    }
  }, [audioManager, onGameOver]);

  // In handleLapCompleted:
  const handleLapCompleted = useCallback((racer, lap) => {
    if (racer === 'player') {
      setGameState(prevState => ({
        ...prevState,
        currentLap: lap
      }));
      
      // Play lap complete sound
      if (audioManager.initialized) {
        audioManager.playSfx('lapComplete');
        
        // If this is the final lap, switch to final lap music
        if (lap === 3) { // Use the hardcoded value 3 instead of TOTAL_LAPS
          audioManager.playMusic('finalLap', { fadeOut: 1500, fadeIn: 1500 });
        }
      }
      
      // For lap timing, use raceStartTime directly
      if (lap > 1 && raceStartTime) {
        const currentTime = Date.now();
        const lapTime = currentTime - raceStartTime;
        
        // Just log the lap time for now
        console.log(`Lap ${lap} completed in ${lapTime}ms`);
        
        // Update race start time for next lap
        setRaceStartTime(currentTime);
      }
    }
  }, [audioManager, raceStartTime]);

  // Add state for sound effects
  const [driftSoundRef, setDriftSoundRef] = useState(null);
  const [offTrackSoundRef, setOffTrackSoundRef] = useState(null);
  const [wasDrifting, setWasDrifting] = useState(false);
  const [wasOffTrack, setWasOffTrack] = useState(false);
  const [wasPaused, setWasPaused] = useState(false);
  const [crashAnimationActive, setCrashAnimationActive] = useState(false);

  // Add sound effect for drifting
  useEffect(() => {
    if (isDrifting && !wasDrifting && audioManager.initialized) {
      // Start drift sound when drift begins
      const driftSound = audioManager.playSfx('drift', { volume: 0.5 });
      setDriftSoundRef(driftSound);
    } else if (!isDrifting && wasDrifting && driftSoundRef && audioManager.initialized) {
      // Stop drift sound when drift ends
      driftSoundRef.pause();
      setDriftSoundRef(null);
    }
    
    setWasDrifting(isDrifting);
  }, [isDrifting, wasDrifting, audioManager, driftSoundRef]);

  // Add sound for item collection
  const handleItemCollected = useCallback((item) => {
    // Store the collected item in the game state
    setGameState(prevState => ({
      ...prevState,
      playerItem: item
    }));
    
    // Play item collect sound
    if (audioManager.initialized) {
      audioManager.playSfx('itemCollect');
    }
    
    // Show item obtained notification
    console.log(`Item collected: ${item}`);
  }, [audioManager]);

  // Add sound for item use
  const handleItemUsed = useCallback(() => {
    // Get current item from game state
    const currentItem = gameState.playerItem;
    
    // Don't attempt to use if no item
    if (!currentItem) return;
    
    // Play item use sound
    if (audioManager.initialized) {
      audioManager.playSfx('itemUse');
    }
    
    console.log(`Item used: ${currentItem}`);
    
    // Clear current item
    setGameState(prevState => ({
      ...prevState,
      playerItem: null
    }));
  }, [audioManager, gameState]);

  // Add off-track sound effect
  useEffect(() => {
    if (isOffTrack && !wasOffTrack && audioManager.initialized) {
      // Start off-track sound when going off-track
      const offTrackSound = audioManager.playSfx('offtrack', { volume: 0.5, loop: true });
      setOffTrackSoundRef(offTrackSound);
    } else if (!isOffTrack && wasOffTrack && offTrackSoundRef && audioManager.initialized) {
      // Stop off-track sound when back on track
      offTrackSoundRef.pause();
      setOffTrackSoundRef(null);
    }
    
    setWasOffTrack(isOffTrack);
  }, [isOffTrack, wasOffTrack, audioManager, offTrackSoundRef]);

  // Add crash sound
  const handleCrash = useCallback(() => {
    if (audioManager.initialized) {
      audioManager.playSfx('crash');
    }
    
    // Add crash animation/effect here
    setCrashAnimationActive(true);
    
    // Reset after 1 second
    setTimeout(() => {
      setCrashAnimationActive(false);
    }, 1000);
  }, [audioManager]);

  // Pause/resume audio when game is paused
  useEffect(() => {
    if (isPaused && audioManager.initialized) {
      audioManager.pauseAll();
    } else if (!isPaused && wasPaused && audioManager.initialized) {
      audioManager.resumeAll();
    }
    
    setWasPaused(isPaused);
  }, [isPaused, wasPaused, audioManager]);
  
  // Handle character selection
  const handleCharacterSelect = useCallback((character) => {
    setGameFlow(prev => ({
      ...prev,
      currentPhase: 'kart-customize',
      character: character
    }));
    
    setSelectedCharacter(character);
    
    // Play selection sound
    if (audioManager.initialized) {
      audioManager.playSfx('select');
    }
  }, [audioManager]);

  // Handle kart customization
  const handleKartCustomize = useCallback((kartConfig) => {
    setGameFlow(prev => ({
      ...prev,
      currentPhase: 'race',
      kartConfig: kartConfig
    }));
    
    setSelectedKartConfig(kartConfig);
    
    // Start countdown phase
    setGameState(prev => ({
      ...prev,
      phase: 'countdown'
    }));
    
    // Play confirmation sound
    if (audioManager.initialized) {
      audioManager.playSfx('confirm');
    }
  }, [audioManager]);

  // Add character info for GameScene
  const characterInfo = useMemo(() => {
    const character = CHARACTERS.find(c => c.id === selectedCharacter) || CHARACTERS[0];
    return {
      id: character.id,
      name: character.name,
      stats: character.stats
    };
  }, [selectedCharacter]);

  // Add kart config for GameScene
  const kartConfigForGameScene = useMemo(() => {
    return {
      body: selectedKartConfig.body || KART_BODIES[0],
      wheels: selectedKartConfig.wheels || KART_WHEELS[0],
      glider: selectedKartConfig.glider || KART_GLIDERS[0]
    };
  }, [selectedKartConfig]);

  // Create a function to conditionally render content based on gameFlow.currentPhase
  const renderContent = () => {
    if (gameFlow.currentPhase === 'character-select') {
      return <CharacterSelect onConfirm={handleCharacterSelect} />;
    }
    
    if (gameFlow.currentPhase === 'kart-customize') {
      return <KartCustomize onConfirm={handleKartCustomize} />;
    }
    
    // Now we're in the race phase
    return (
      <div className="game-container" 
        style={{ width: '100%', height: '100vh', position: 'relative' }}
        onClick={handleContainerClick}
        tabIndex={-1}
      >
        <AssetPreloader />
        
        <KeyboardDebugger />
        
        {/* Race UI Elements */}
        {gameState.phase === 'racing' && (
          <RaceUI 
            position={gameState.results.length > 0 ? gameState.results.find(r => r.isPlayer)?.position || 1 : 1}
            lap={gameState.results.length > 0 ? gameState.results.find(r => r.isPlayer)?.lap || 0 : 0}
            totalLaps={3}
            time={gameState.raceTime}
            players={gameState.results}
          />
        )}
        
        {/* Countdown overlay */}
        {gameState.phase === 'countdown' && (
          <div style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            fontSize: '120px',
            fontWeight: 'bold',
            color: 'white',
            textShadow: '0 0 10px rgba(0,0,0,0.5)',
            zIndex: 1000
          }}>
            {countdownValue === 0 ? 'GO!' : countdownValue}
          </div>
        )}
        
        {/* Results screen */}
        {gameState.phase === 'finished' && (
          <RaceResults 
            players={gameState.results} 
            playerTime={gameState.raceTime} 
            onRestart={() => {
              // Go back to character selection on restart
              setGameFlow({
                currentPhase: 'character-select',
                character: null,
                kartConfig: null
              });
            }}
          />
        )}
        
        {/* MiniMap - Outside the Canvas */}
        <MiniMap 
          players={playerData.players}
          trackRef={trackRef}
          position="top-right"
        />
        
        {/* Race HUD - Outside the Canvas */}
        <RaceHUD 
          playerPosition={currentRaceData?.playerPosition} 
          currentLap={currentRaceData?.currentLap}
          totalLaps={currentRaceData?.totalLaps}
          raceTime={currentRaceData?.raceTime}
          raceState={currentRaceData?.raceState}
          playerItem={currentRaceData?.playerItem}
          countdown={currentRaceData?.countdown}
          character={characterInfo}
          kartConfig={kartConfigForGameScene}
        />
        
        {/* Key State Debug Display */}
        <div style={{
          position: 'absolute',
          top: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          zIndex: 9999
        }}>
          <div>Race State: {gameState.phase}</div>
          <div>⬆️ UP: {keyState.ArrowUp ? 'PRESSED' : 'not pressed'}</div>
          <div>⬇️ DOWN: {keyState.ArrowDown ? 'PRESSED' : 'not pressed'}</div>
          <div>⬅️ LEFT: {keyState.ArrowLeft ? 'PRESSED' : 'not pressed'}</div>
          <div>➡️ RIGHT: {keyState.ArrowRight ? 'PRESSED' : 'not pressed'}</div>
          <div>SPACE: {keyState.Space ? 'PRESSED' : 'not pressed'}</div>
        </div>
        
        {/* Add the focus button back at the bottom */}
        <div style={{
          position: 'absolute',
          bottom: '10px',
          left: '10px',
          background: 'rgba(0,0,0,0.7)',
          color: 'white',
          padding: '10px',
          borderRadius: '5px',
          fontSize: '12px',
          display: 'flex',
          flexDirection: 'column',
          gap: '5px',
          zIndex: 9999
        }}>
          <button 
            onClick={handleFocusClick}
            style={{
              background: '#4CAF50',
              border: 'none',
              color: 'white',
              padding: '5px 10px',
              cursor: 'pointer',
              borderRadius: '3px'
            }}
          >
            CLICK HERE TO FOCUS
          </button>
          <button
            onClick={handleForceStartClick}
            style={{
              background: '#FF5722',
              border: 'none',
              color: 'white',
              padding: '5px 10px',
              cursor: 'pointer',
              borderRadius: '3px',
              marginTop: '5px'
            }}
          >
            FORCE RACE START
          </button>
        </div>
        
        {/* 3D Canvas */}
        <Canvas 
          shadows
          id="game-canvas"
          tabIndex={1}
          style={{ 
            outline: 'none',
            width: '100%',
            height: '100%'
          }}
          onClick={handleCanvasClick}
          onCreated={handleCanvasCreated}
          camera={false} // Important: let GameScene control the camera
        >
          <GameScene 
            onGameOver={handleGameOver} 
            onRaceStart={handleRaceStart}
            trackRefExternal={trackRef}
            parentRaceState={gameState.phase}
            characterInfo={characterInfo}
            kartConfig={kartConfigForGameScene}
            onRaceDataUpdate={handleRaceDataUpdate}
            onItemCollected={handleItemCollected}
            onItemUsed={handleItemUsed}
            onCrash={handleCrash}
            isDrifting={isDrifting}
            isOffTrack={isOffTrack}
            isPaused={isPaused}
          />
        </Canvas>
      </div>
    );
  };
  
  // Return the rendered content
  return renderContent();
};

export default Game3DCanvas; 