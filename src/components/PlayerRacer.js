import React, { useRef, useState, useEffect, useCallback, forwardRef, useImperativeHandle } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { PointerLockControls } from 'three/examples/jsm/controls/PointerLockControls';
import KartModel from './CharacterModels';
import { ItemDisplay } from './ItemSystem';
import { useKeyboardControls } from '@react-three/drei';
import * as ItemSystem from './ItemSystem'; // Import the item system

// Enhanced player racer component with realistic kart physics
const PlayerRacer = forwardRef(({ 
  characterType = 'capybara', 
  onPositionUpdate, 
  onLapComplete, 
  onRaceFinish,
  onCollision,
  onItemUse,
  currentItem,
  totalLaps = 3,
  kartConfig = {
    body: { id: 'standard', stats: { speed: 3, acceleration: 3, handling: 3, weight: 3 } },
    wheels: { id: 'standard', stats: { speed: 3, acceleration: 3, handling: 3, traction: 3 } },
    glider: { id: 'standard', stats: { airTime: 3, airControl: 3 } }
  },
  playerStats = {
    speed: 3,
    acceleration: 3,
    handling: 3,
    weight: 3
  },
  raceActive = false,
  trackData,
  onItemCollected,
  onItemUsed,
  onCrash,
  isDrifting,
  isOffTrack,
  isPaused,
  initialPosition = [0, 0.5, 10],
  initialRotation = [0, 0, 0]
}, ref) => {
  // Get the scene and camera from react-three-fiber
  const { scene, camera } = useThree();
  
  // Create refs for direct Three.js manipulation instead of React state
  const groupRef = useRef(null);
  const positionRef = useRef(new THREE.Vector3(...initialPosition));
  const rotationRef = useRef(new THREE.Euler(...initialRotation));
  
  // Reference to the KartModel component
  const kartRef = useRef();
  
  // Reference to the controls
  const controlsRef = useRef();
  
  // Keep state for UI and game logic
  const [position, setPosition] = useState([0, 0.5, 10]);
  const [rotation, setRotation] = useState([0, 0, 0]);
  const [speed, setSpeed] = useState(0);
  const [lap, setLap] = useState(0);
  const [checkpoints, setCheckpoints] = useState([false, false, false, false]);
  const [isOnTrack, setIsOnTrack] = useState(true);
  const [isRaceStarted, setIsRaceStarted] = useState(false);
  const [driftState, setDriftState] = useState({
    isDrifting: false,
    direction: 0, // -1 left, 1 right
    charge: 0,
    boostLevel: 0, // 0 = no boost, 1 = blue, 2 = orange, 3 = purple
    boostTime: 0
  });
  // eslint-disable-next-line no-unused-vars
  const [coins, setCoins] = useState(0);
  const [boostTime, setBoostTime] = useState(0);
  // eslint-disable-next-line no-unused-vars
  const [invincible, setInvincible] = useState(false);
  const [stunTime, setStunTime] = useState(0);
  
  // Track data (will be provided from parent)
  const trackDataRef = useRef({
    path: [],
    width: 12,
    outerRadius: 20,
    innerRadius: 8
  }).current;

  // Add a lastValidPosition ref to store the last position that was on the track
  const lastValidPositionRef = useRef([0, 0.5, 10]);

  // Add a ref for key debug logging
  const lastKeyDebugLog = useRef(0);

  // Calculate kart stats based on character and kart selection
  const calculateKartStats = useCallback(() => {
    // Base stats from character
    const baseSpeed = playerStats.speed;
    const baseAcceleration = playerStats.acceleration;
    const baseHandling = playerStats.handling;
    const baseWeight = playerStats.weight;
    
    // Contributions from kart parts
    const bodySpeed = kartConfig.body.stats.speed * 0.6;
    const bodyAcceleration = kartConfig.body.stats.acceleration * 0.6;
    const bodyHandling = kartConfig.body.stats.handling * 0.4;
    const bodyWeight = kartConfig.body.stats.weight;
    
    const wheelSpeed = kartConfig.wheels.stats.speed * 0.4;
    const wheelAcceleration = kartConfig.wheels.stats.acceleration * 0.4;
    const wheelHandling = kartConfig.wheels.stats.handling * 0.6;
    const wheelTraction = kartConfig.wheels.stats.traction;
    
    // Calculate combined stats
    const combinedSpeed = (baseSpeed + bodySpeed + wheelSpeed) / 3;
    const combinedAcceleration = (baseAcceleration + bodyAcceleration + wheelAcceleration) / 3;
    const combinedHandling = (baseHandling + bodyHandling + wheelHandling) / 3;
    const combinedWeight = (baseWeight + bodyWeight) / 2;
    
    return {
      maxSpeed: 20 + (combinedSpeed * 3), // 20 to 35
      acceleration: 15 + (combinedAcceleration * 2), // 15 to 25
      handling: 2.0 + (combinedHandling * 0.3), // 2.0 to 3.5
      weight: 100 + (combinedWeight * 20), // 100 to 200 kg
      traction: 0.5 + (wheelTraction * 0.1), // 0.5 to 1.0
      driftEfficiency: 0.5 + (combinedHandling * 0.1), // How quickly drift charges
    };
  }, [playerStats, kartConfig]);

  // Kart physics properties
  const kartPhysics = useRef({
    // Forces and motion
    velocity: new THREE.Vector3(0, 0, 0),
    acceleration: new THREE.Vector3(0, 0, 0),
    
    // Driver inputs
    throttle: 0,  // 0 to 1
    brake: 0,     // 0 to 1
    steering: 0,  // -1 to 1
    
    // Performance characteristics (will be set from calculated stats)
    maxSpeed: 30,
    engineAcceleration: 20,
    deceleration: 15, // Natural deceleration when not accelerating
    brakeStrength: 30,
    steeringSpeed: 2.5,
    steeringReturn: 3, // How quickly steering returns to center
    
    // Physics properties
    mass: 150, // kg
    gravity: 20, // m/s²
    drag: 0.3,  // Air resistance
    rollingResistance: 0.2,
    groundFriction: 0.7,
    
    // Suspension
    groundHeight: 0.5, // Distance to maintain from ground
    suspensionStrength: 30, // How strongly to push back up
    suspensionDamping: 5,  // Damping to prevent bouncing
    suspensionTravel: 0.3, // How much the suspension can compress/extend
    suspensionRestLength: 0.5,
    
    // Steering and handling
    corneringStiffness: 5, // How well the kart grips in turns
    wheelBase: 1.2, // Distance between front and rear wheels
    rearWeightBias: 0.45, // Weight distribution (percentage on rear)
    
    // Weight transfer
    lateralWeightTransfer: 0.2, // Side-to-side weight shift in turns
    longitudinalWeightTransfer: 0.15, // Front-to-back weight shift during accel/braking
    
    // Drift mechanics
    driftThreshold: 0.7, // How hard you need to turn to initiate drift
    driftDampingFactor: 0.85, // How much drifting reduces lateral grip
    driftChargeRate: 40, // How fast drift charge accumulates
    
    // Boost settings
    boostMultipliers: [1.0, 1.2, 1.4, 1.6], // No boost, Mini, Super, Ultra
    boostDurations: [0, 1.0, 2.0, 3.0], // Duration in seconds for each level
    
    // State tracking
    isGrounded: true,
    lastGroundY: 0.5,
    wheelContacts: [true, true, true, true], // FL, FR, RL, RR
    
    // Drift tracking
    isDrifting: false,
    driftDirection: 0, // -1 left, 1 right
    driftCharge: 0,
    boostLevel: 0,
    boostTimeRemaining: 0,
    
    // Debug tracking
    debugInfo: {}
  }).current;
  
  // Update kart physics properties based on calculated stats
  useEffect(() => {
    const stats = calculateKartStats();
    
    kartPhysics.maxSpeed = stats.maxSpeed;
    kartPhysics.engineAcceleration = stats.acceleration;
    kartPhysics.steeringSpeed = stats.handling;
    kartPhysics.mass = stats.weight;
    kartPhysics.groundFriction = stats.traction;
    kartPhysics.driftChargeRate = stats.driftEfficiency * 40;
    
    console.log("Kart stats set:", stats);
  }, [calculateKartStats]);
  
  // Reference to keys pressed
  const keysPressed = useRef({
    ArrowUp: false,
    ArrowDown: false,
    ArrowLeft: false,
    ArrowRight: false,
    Space: false,
    ShiftLeft: false,
    ShiftRight: false,
    z: false
  });
  
  // Direct reference for debugging
  window.playerObject = groupRef;
  window.playerPosition = positionRef;
  window.keysPressed = keysPressed;
  window.kartPhysics = kartPhysics;
  
  // Update race state from props
  useEffect(() => {
    console.log(`Race active state changed to: ${raceActive}`);
    
    // Update local state
    setIsRaceStarted(raceActive);
    
    // If the race has started, ensure we're listening for key events properly
    if (raceActive) {
      console.log("Race started - ensuring keyboard controls are active");
      
      // Force re-register event listeners for keyboard to ensure they're active
      const dummyKeyDown = new KeyboardEvent('keydown', { code: 'ArrowUp' });
      const dummyKeyUp = new KeyboardEvent('keyup', { code: 'ArrowUp' });
      
      // Dispatch dummy events to ensure listeners are active
      window.dispatchEvent(dummyKeyDown);
      window.dispatchEvent(dummyKeyUp);
    }
  }, [raceActive]);
  
  // Initialize camera and controls
  useEffect(() => {
    if (!controlsRef.current) {
      // Create a simple fixed camera position instead of pointer lock controls
      // This will make it easier to control without clicking focus
      camera.position.set(0, 3, 15); // Position behind and above the kart
      camera.lookAt(0, 0, 0);
      
      // Expose for debugging
      window.camera = camera;
      
      // Automatically enable keyboard input without needing focus
      const canvasElement = document.querySelector('canvas');
      if (canvasElement) {
        canvasElement.focus();
        console.log("Canvas focused automatically");
      }
      
      return () => {
        // Cleanup
      };
    }
  }, [camera]);
  
  // Remove auto-acceleration, as it might interfere with manual controls
  useEffect(() => {
    console.log('Initializing player racer controls');
    
    // Instead of auto-accelerating, make a log to check initialization
    console.log('Player racer controls initialized, waiting for input');
    
    // Ensure the keysPressed ref is initialized properly
    keysPressed.current = {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false, 
      ArrowRight: false,
      Space: false,
      ShiftLeft: false,
      KeyZ: false
    };
    
    // Log the current state for debugging
    console.log('Initial key state:', keysPressed.current);
    
    return () => {
      // Reset key state if component unmounts
      console.log('Cleaning up player racer controls');
    };
  }, []);

  // Global key debugging - make this more visible
  useEffect(() => {
    // Global keydown listener for debugging
    const debugKeyListener = (e) => {
      console.log(`GLOBAL KEY DEBUG: ${e.code} pressed`);
      
      // Force update the keysPressed ref directly
      if (e.code in keysPressed.current) {
        console.log(`Updating key state for ${e.code} to true`);
        keysPressed.current[e.code] = true;
      }
    };
    
    const debugKeyUpListener = (e) => {
      console.log(`GLOBAL KEY DEBUG: ${e.code} released`);
      
      // Force update the keysPressed ref directly
      if (e.code in keysPressed.current) {
        console.log(`Updating key state for ${e.code} to false`);
        keysPressed.current[e.code] = false;
      }
    };
    
    window.addEventListener('keydown', debugKeyListener);
    window.addEventListener('keyup', debugKeyUpListener);
    
    return () => {
      window.removeEventListener('keydown', debugKeyListener);
      window.removeEventListener('keyup', debugKeyUpListener);
    };
  }, []);
  
  // Handle keyboard input
  useEffect(() => {
    console.log('Setting up keyboard event handlers for kart physics');
    
    // Use a simpler, direct approach for key detection
    const keysRef = keysPressed.current;
    
    const handleKeyDown = (e) => {
      // Map keys to our internal representation
      switch(e.code) {
        case 'ArrowUp':
        case 'KeyW':
          keysRef.ArrowUp = true;
          console.log('Accelerate');
          break;
        case 'ArrowDown':
        case 'KeyS':
          keysRef.ArrowDown = true;
          console.log('Brake');
          break;
        case 'ArrowLeft':
        case 'KeyA':
          keysRef.ArrowLeft = true;
          console.log('Turn left');
          break;
        case 'ArrowRight':
        case 'KeyD':
          keysRef.ArrowRight = true;
          console.log('Turn right');
          break;
        case 'Space':
          keysRef.Space = true; // Handbrake/drift
          console.log('Drift initiated');
          
          // Start drifting if we're turning
          if (keysRef.ArrowLeft || keysRef.ArrowRight) {
            startDrift();
          }
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keysRef.ShiftLeft = true; // Boost
          break;
        case 'KeyZ':
          keysRef.z = true;
          if (currentItem) {
            onItemUse && onItemUse();
          }
          break;
        default:
          return; // Don't prevent default for other keys
      }
      
      // Prevent default browser behavior for game controls
      e.preventDefault();
    };
    
    const handleKeyUp = (e) => {
      // Map keys to our internal representation
      switch(e.code) {
        case 'ArrowUp':
        case 'KeyW':
          keysRef.ArrowUp = false;
          break;
        case 'ArrowDown':
        case 'KeyS':
          keysRef.ArrowDown = false;
          break;
        case 'ArrowLeft':
        case 'KeyA':
          keysRef.ArrowLeft = false;
          break;
        case 'ArrowRight':
        case 'KeyD':
          keysRef.ArrowRight = false;
          break;
        case 'Space':
          keysRef.Space = false;
          
          // End drift and possibly trigger boost
          if (kartPhysics.isDrifting) {
            endDrift();
          }
          break;
        case 'ShiftLeft':
        case 'ShiftRight':
          keysRef.ShiftLeft = false;
          break;
        case 'KeyZ':
          keysRef.z = false;
          break;
        default:
          return; // Don't prevent default for other keys
      }
      
      e.preventDefault();
    };
    
    // Handle visibility changes (tab switching, etc.)
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // Reset all keys if tab is hidden
        Object.keys(keysRef).forEach(key => {
          keysRef[key] = false;
        });
        
        // End drift if tab is switched
        if (kartPhysics.isDrifting) {
          endDrift();
        }
      }
    };
    
    // Register event listeners
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Clean up
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [onItemUse, currentItem]);
  
  // Drift start function
  const startDrift = () => {
    // Only start drift if we're moving at a minimum speed
    if (kartPhysics.velocity.length() > 5) {
      kartPhysics.isDrifting = true;
      
      // Set drift direction based on current steering
      if (keysPressed.current.ArrowLeft) {
        kartPhysics.driftDirection = -1;
      } else if (keysPressed.current.ArrowRight) {
        kartPhysics.driftDirection = 1;
      } else {
        kartPhysics.driftDirection = 0;
      }
      
      // Reset drift charge
      kartPhysics.driftCharge = 0;
      
      // Update state for UI
      setDriftState({
        isDrifting: true,
        direction: kartPhysics.driftDirection,
        charge: 0,
        boostLevel: 0,
        boostTime: 0
      });
      
      // Play drift sound - with enhanced error handling
      try {
        const driftSound = new Audio('/sounds/drift.mp3');
        driftSound.volume = 0.2;
        
        // Add error event handler
        driftSound.onerror = (e) => {
          console.warn("Error loading drift sound:", e);
          // Continue game logic even if sound fails
        };
        
        // Only try to play if not muted
        const playPromise = driftSound.play();
        
        // Handle the promise returned by play()
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn("Drift sound failed to play:", error);
            // Sound playback failed - continue game logic
          });
        }
      } catch (e) {
        console.warn("Drift sound system error:", e);
        // Continue game logic even if sound system fails
      }
      
      console.log(`Drift started: direction ${kartPhysics.driftDirection}`);
    }
  };
  
  // Drift end function
  const endDrift = () => {
    if (!kartPhysics.isDrifting) return;
    
    kartPhysics.isDrifting = false;
    
    // Determine boost level based on drift charge
    let boostLevel = 0;
    let boostTime = 0;
    
    if (kartPhysics.driftCharge > 60) {
      // Mini-Turbo (Blue)
      boostLevel = 1;
      boostTime = kartPhysics.boostDurations[1];
    }
    
    if (kartPhysics.driftCharge > 120) {
      // Super Mini-Turbo (Orange)
      boostLevel = 2;
      boostTime = kartPhysics.boostDurations[2];
    }
    
    if (kartPhysics.driftCharge > 180) {
      // Ultra Mini-Turbo (Purple)
      boostLevel = 3;
      boostTime = kartPhysics.boostDurations[3];
    }
    
    if (boostLevel > 0) {
      // Apply boost
      kartPhysics.boostLevel = boostLevel;
      kartPhysics.boostTimeRemaining = boostTime;
      
      // Play boost sound - with enhanced error handling
      try {
        const boostSound = new Audio('/sounds/boost.mp3');
        boostSound.volume = 0.3;
        
        // Add error event handler
        boostSound.onerror = (e) => {
          console.warn("Error loading boost sound:", e);
          // Continue game logic even if sound fails
        };
        
        // Only try to play if not muted
        const playPromise = boostSound.play();
        
        // Handle the promise returned by play()
        if (playPromise !== undefined) {
          playPromise.catch(error => {
            console.warn("Boost sound failed to play:", error);
            // Sound playback failed - continue game logic
          });
        }
      } catch (e) {
        console.warn("Boost sound system error:", e);
        // Continue game logic even if sound system fails
      }
      
      console.log(`Boost activated: Level ${boostLevel}, Duration ${boostTime}s`);
    }
    
    // Update state for UI
    setDriftState({
      isDrifting: false,
      direction: 0,
      charge: 0,
      boostLevel: boostLevel,
      boostTime: boostTime
    });
    
    // Reset drift charge
    kartPhysics.driftCharge = 0;
  };
  
  // Main physics update loop
  useFrame((state, delta) => {
    if (!groupRef.current) return;
    
    // Get references for cleaner code
    const playerGroup = groupRef.current;
    const keysRef = keysPressed.current;
    
    // Log key states periodically for debugging
    const now = Date.now();
    if (now - lastKeyDebugLog.current > 2000) { // Log every 2 seconds
      console.log("Current key states:", JSON.stringify(keysRef));
      lastKeyDebugLog.current = now;
      
      // If no keys are pressed, forcibly check keyboard listeners are working
      const anyKeyPressed = Object.values(keysRef).some(v => v);
      if (!anyKeyPressed && raceActive) {
        console.log("No keys detected as pressed - keyboard events may not be working");
      }
    }
    
    // PERMANENT FIX: Allow movement regardless of race state
    // Skip if stunned
    if (stunTime > 0) {
      setStunTime(prev => Math.max(0, prev - delta));
      return;
    }
    
    // We already have the keys and playerGroup from above - no need to redeclare
    // Just check if playerGroup still exists
    if (!playerGroup) return;
    
    // Handle throttle input
    if (keysRef.ArrowUp) {
      kartPhysics.throttle = Math.min(1, kartPhysics.throttle + delta * 2);
    } else {
      kartPhysics.throttle = Math.max(0, kartPhysics.throttle - delta * 3);
    }
    
    // Handle brake input
    if (keysRef.ArrowDown) {
      kartPhysics.brake = Math.min(1, kartPhysics.brake + delta * 4);
    } else {
      kartPhysics.brake = Math.max(0, kartPhysics.brake - delta * 6);
    }
    
    // Handle steering input
    let targetSteering = 0;
    
    if (keysRef.ArrowLeft) {
      targetSteering = -1;
    } else if (keysRef.ArrowRight) {
      targetSteering = 1;
    }
    
    // Adjust steering based on drifting
    if (kartPhysics.isDrifting) {
      // When drifting, steering is less responsive but maintains drift direction
      const driftFactor = 0.3; // How much steering is allowed while drifting
      
      // Blend between drift direction and steering input
      targetSteering = (kartPhysics.driftDirection * (1.0 - driftFactor)) + (targetSteering * driftFactor);
      
      // Increment drift charge
      kartPhysics.driftCharge += delta * kartPhysics.driftChargeRate;
      
      // Update drift state for UI
      setDriftState(prev => ({
        ...prev,
        charge: kartPhysics.driftCharge
      }));
      
      // Add sparks or other visual effects based on drift charge
    }
    
    // Smoothly adjust steering toward target
    const steeringDelta = targetSteering - kartPhysics.steering;
    const steeringSpeed = keysRef.Space ? kartPhysics.steeringSpeed * 0.7 : kartPhysics.steeringSpeed;
    
    if (Math.abs(steeringDelta) > 0.001) {
      kartPhysics.steering += steeringDelta * Math.min(1, delta * steeringSpeed);
    } else {
      kartPhysics.steering = targetSteering;
    }
    
    // Cap steering based on speed (less steering at high speed)
    const speedFactor = Math.min(1, kartPhysics.velocity.length() / (kartPhysics.maxSpeed * 0.7));
    const maxSteering = 1.0 - (speedFactor * 0.3);
    kartPhysics.steering = THREE.MathUtils.clamp(kartPhysics.steering, -maxSteering, maxSteering);
    
    // Calculate forward direction based on current rotation
    const forward = new THREE.Vector3(0, 0, 1).applyAxisAngle(new THREE.Vector3(0, 1, 0), playerGroup.rotation.y);
    
    // Calculate right direction
    const right = new THREE.Vector3(forward.z, 0, -forward.x);
    
    // Calculate acceleration
    let accelerationForce = new THREE.Vector3();
    
    if (kartPhysics.throttle > 0) {
      // Apply engine acceleration in the forward direction
      const currentSpeed = forward.dot(kartPhysics.velocity);
      const speedRatio = currentSpeed / kartPhysics.maxSpeed;
      
      // Calculate engine force (more force at lower speeds)
      const engineForce = kartPhysics.engineAcceleration * (1.0 - Math.max(0, speedRatio * 0.8));
      
      // Apply boost multiplier if active
      const boostMultiplier = kartPhysics.boostLevel > 0 ? 
                              kartPhysics.boostMultipliers[kartPhysics.boostLevel] : 1.0;
      
      // Add acceleration force
      accelerationForce.add(forward.clone().multiplyScalar(engineForce * kartPhysics.throttle * boostMultiplier));
    }
    
    // Apply braking force
    if (kartPhysics.brake > 0) {
      // Calculate brake force against velocity direction
      const brakeForce = kartPhysics.brakeStrength * kartPhysics.brake;
      
      // Create a braking force in the opposite direction of movement
      if (kartPhysics.velocity.lengthSq() > 0.1) {
        const velocityDir = kartPhysics.velocity.clone().normalize();
        accelerationForce.add(velocityDir.multiplyScalar(-brakeForce));
      }
    }
    
    // Apply air and rolling resistance
    if (kartPhysics.velocity.lengthSq() > 0.01) {
      const dragForce = kartPhysics.velocity.clone().normalize()
                        .multiplyScalar(-kartPhysics.drag * kartPhysics.velocity.lengthSq());
      
      const rollingForce = kartPhysics.velocity.clone().normalize()
                          .multiplyScalar(-kartPhysics.rollingResistance * kartPhysics.velocity.length());
      
      accelerationForce.add(dragForce);
      accelerationForce.add(rollingForce);
    }
    
    // Apply steering force (cornering)
    const steeringForce = kartPhysics.steering * kartPhysics.corneringStiffness;
    
    // Calculate lateral force based on steering input
    const lateralForce = right.clone().multiplyScalar(steeringForce * kartPhysics.velocity.length() * 0.1);
    
    // Reduce lateral force when drifting
    if (kartPhysics.isDrifting) {
      lateralForce.multiplyScalar(kartPhysics.driftDampingFactor);
    }
    
    accelerationForce.add(lateralForce);
    
    // Apply forces to velocity
    const acceleration = accelerationForce.divideScalar(kartPhysics.mass);
    kartPhysics.velocity.add(acceleration.multiplyScalar(delta));
    
    // Limit maximum speed
    const currentSpeed = kartPhysics.velocity.length();
    const maxSpeedWithBoost = kartPhysics.maxSpeed * 
                             (kartPhysics.boostLevel > 0 ? 
                              kartPhysics.boostMultipliers[kartPhysics.boostLevel] : 1.0);
    
    if (currentSpeed > maxSpeedWithBoost) {
      kartPhysics.velocity.normalize().multiplyScalar(maxSpeedWithBoost);
    }
    
    // Update player position based on velocity
    playerGroup.position.x += kartPhysics.velocity.x * delta;
    playerGroup.position.z += kartPhysics.velocity.z * delta;
    
    // Ground position
    const groundPos = checkGroundHeight(playerGroup.position);
    playerGroup.position.y = groundPos + kartPhysics.groundHeight;
    
    // Update visual position reference
    const newPosition = [
      playerGroup.position.x,
      playerGroup.position.y,
      playerGroup.position.z
    ];
    
    // Update position reference
    positionRef.current = new THREE.Vector3(...newPosition);
    
    // Track boundaries check
    const trackResult = checkTrackBoundaries(newPosition);
    
    if (trackResult.isOnTrack !== isOnTrack) {
      setIsOnTrack(trackResult.isOnTrack);
      
      // Store last valid position if on track
      if (trackResult.isOnTrack) {
        lastValidPositionRef.current = [...newPosition];
      } else {
        // Play off-track sound - with enhanced error handling
        try {
          const offTrackSound = new Audio('/sounds/offtrack.mp3');
          offTrackSound.volume = 0.1;
          
          // Add error event handler
          offTrackSound.onerror = (e) => {
            console.warn("Error loading offtrack sound:", e);
            // Continue game logic even if sound fails
          };
          
          // Only try to play if not muted
          const playPromise = offTrackSound.play();
          
          // Handle the promise returned by play()
          if (playPromise !== undefined) {
            playPromise.catch(error => {
              console.warn("Off track sound failed to play:", error);
              // Sound playback failed - continue game logic
            });
          }
        } catch (e) {
          console.warn("Off track sound system error:", e);
          // Continue game logic even if sound system fails
        }
      }
    }
    
    // Apply off-track physics
    if (!trackResult.isOnTrack) {
      // Reduce velocity when off track
      kartPhysics.velocity.multiplyScalar(0.98);
    }
    
    // Calculate target facing direction from velocity
    let targetRotationY = playerGroup.rotation.y;
    
    if (kartPhysics.velocity.lengthSq() > 0.1) {
      targetRotationY = Math.atan2(kartPhysics.velocity.x, kartPhysics.velocity.z);
    }
    
    // Progressively rotate toward movement direction
    let rotationDelta = THREE.MathUtils.degToRad(100) * delta; // 100 deg/sec rotation speed
    
    // Adjust for drifting - less rotation toward movement direction
    if (kartPhysics.isDrifting) {
      rotationDelta *= 0.2;
    }
    
    playerGroup.rotation.y = THREE.MathUtils.lerp(
      playerGroup.rotation.y,
      targetRotationY,
      rotationDelta
    );
    
    // Update rotation reference
    rotationRef.current = new THREE.Euler(0, playerGroup.rotation.y, 0);
    
    // Update kart model's visuals
    if (kartRef.current) {
      try {
        // Pass positions and rotations to the kart model
        if (typeof kartRef.current.updatePosition === 'function') {
          kartRef.current.updatePosition(newPosition);
        }
        
        // Calculate lean/tilt based on steering and drift
        let leanAngle = 0;
        
        if (kartPhysics.isDrifting) {
          // Deep lean when drifting
          leanAngle = kartPhysics.driftDirection * 0.3; 
        } else {
          // Smaller lean when just turning
          leanAngle = -kartPhysics.steering * 0.15;
        }
        
        // Calculate a rotation with lean
        const tiltedRotation = [0, playerGroup.rotation.y, leanAngle];
        
        if (typeof kartRef.current.updateRotation === 'function') {
          kartRef.current.updateRotation(tiltedRotation);
        }
        
        // Update kart state (drift effects, boost state, etc)
        if (typeof kartRef.current.updateState === 'function') {
          kartRef.current.updateState({
            speed: kartPhysics.velocity.length(),
            isDrifting: kartPhysics.isDrifting,
            driftDirection: kartPhysics.driftDirection,
            driftCharge: kartPhysics.driftCharge,
            boostLevel: kartPhysics.boostLevel,
            isGrounded: kartPhysics.isGrounded,
            isOnTrack: trackResult.isOnTrack,
            isStunned: stunTime > 0
          });
        } else {
          console.warn("KartModel missing updateState method");
        }
      } catch (error) {
        console.error("Error updating kart model:", error);
      }
    }
    
    // Update UI state
    setPosition(newPosition);
    setRotation([0, playerGroup.rotation.y, 0]);
    setSpeed(kartPhysics.velocity.length());
    
    // Update boost time
    if (kartPhysics.boostTimeRemaining > 0) {
      kartPhysics.boostTimeRemaining -= delta;
      
      if (kartPhysics.boostTimeRemaining <= 0) {
        kartPhysics.boostLevel = 0;
        kartPhysics.boostTimeRemaining = 0;
        
        // Update drift state
        setDriftState(prev => ({
          ...prev,
          boostLevel: 0,
          boostTime: 0
        }));
      } else {
        // Update boost time display
        setDriftState(prev => ({
          ...prev,
          boostTime: kartPhysics.boostTimeRemaining
        }));
      }
    }
    
    // Report position to parent for camera following, minimap, etc.
    if (onPositionUpdate) {
      onPositionUpdate(newPosition, [0, playerGroup.rotation.y, 0]);
    }
  });
  
  // Check height at a given position (for ground detection)
  const checkGroundHeight = (position) => {
    // For now, just a simple flat ground
    // In a real game, you'd raycast downwards or check a heightmap
    return 0;
  };
  
  // Check if player is on the track
  const checkTrackBoundaries = (position) => {
    // Extract x and z coordinates
    const x = position[0];
    const z = position[2];
    
    // Calculate distance from center (0, 0)
    // Since our track is oval, we need to adjust for the x stretch factor
    const xFactor = 1.5; // This should match the track's xFactor in RaceTrack.js
    const adjustedX = x / xFactor;
    
    // Calculate distance from track center
    const distanceFromCenter = Math.sqrt(adjustedX * adjustedX + z * z);
    
    // Calculate track inner and outer boundaries
    const outerBoundary = trackDataRef.outerRadius;
    const innerBoundary = trackDataRef.innerRadius;
    
    // Check if position is outside track boundaries
    const isOutsideTrack = distanceFromCenter > outerBoundary || distanceFromCenter < innerBoundary;
    
    // Return the result 
    return {
      isOnTrack: !isOutsideTrack,
      distanceFromCenter,
      innerBoundary,
      outerBoundary
    };
  };
  
  // Get color for boost sparks based on drift charge
  const getBoostColor = (driftCharge) => {
    if (driftCharge > 180) {
      return "#9C27B0"; // Purple for Ultra Mini-Turbo
    } else if (driftCharge > 120) {
      return "#FF9800"; // Orange for Super Mini-Turbo
    } else {
      return "#2196F3"; // Blue for Mini-Turbo
    }
  };

  // Add a periodic key state logger to help debug keyboard issues
  useEffect(() => {
    if (!raceActive) return;

    // Set up a periodic logger to check key states
    const keyStateLogInterval = setInterval(() => {
      // Use keysPressed.current directly without redeclaring
      console.log("Current key states:", JSON.stringify(keysPressed.current));
      
      // If no keys are pressed, forcibly check keyboard listeners are working
      const anyKeyPressed = Object.values(keysPressed.current).some(v => v);
      if (!anyKeyPressed && raceActive) {
        console.log("No keys detected as pressed - keyboard events may not be working");
      }
    }, 2000); // Log every 2 seconds
    
    return () => {
      clearInterval(keyStateLogInterval);
    };
  }, [raceActive]);

  // Initialize the group ref with a new THREE.Group
  useEffect(() => {
    if (!groupRef.current) {
      groupRef.current = new THREE.Group();
      groupRef.current.position.set(...initialPosition);
      groupRef.current.rotation.set(...initialRotation);
    }
  }, []);

  // Forward the ref to the parent component with safe access
  useImperativeHandle(ref, () => ({
    position: positionRef.current,
    rotation: rotationRef.current,
    getWorldPosition: () => {
      if (!groupRef.current) return new THREE.Vector3();
      const worldPos = new THREE.Vector3();
      groupRef.current.getWorldPosition(worldPos);
      return worldPos;
    },
    getWorldRotation: () => {
      if (!groupRef.current) return new THREE.Euler();
      const worldQuat = new THREE.Quaternion();
      groupRef.current.getWorldQuaternion(worldQuat);
      const worldEuler = new THREE.Euler();
      worldEuler.setFromQuaternion(worldQuat);
      return worldEuler;
    }
  }), []);

  // Update position for camera tracking with null checks
  useFrame(() => {
    if (!groupRef.current || !ref.current) return;

    try {
      // Safely update the ref's position and rotation
      ref.current.position.copy(groupRef.current.position);
      ref.current.rotation.copy(groupRef.current.rotation);
    } catch (error) {
      console.warn('Error updating position/rotation:', error);
    }
  });

  // Return the component with safe initial values
  return (
    <group 
      ref={groupRef}
      position={initialPosition}
      rotation={initialRotation}
    >
      <mesh ref={kartRef} position={position || [0, 0.5, 10]} rotation={rotation || [0, 0, 0]}>
        {/* Kart model with character */}
        <KartModel 
          ref={kartRef}
          characterType={characterType}
          kartType={kartConfig.body.id} 
          wheelType={kartConfig.wheels.id}
          gliderType={kartConfig.glider.id}
          position={[0, 0, 0]} 
          rotation={[0, 0, 0]} 
          isActive={true}
        />
        
        {/* Drift visual effects */}
        {kartPhysics.isDrifting && kartPhysics.driftCharge > 20 && (
          <>
            {/* Left wheel spark trail */}
            <mesh 
              position={[-0.5, 0.1, -0.5]} 
              rotation={[0, -Math.PI / 2, 0]}
            >
              <planeGeometry args={[1, 0.2]} />
              <meshBasicMaterial 
                color={getBoostColor(kartPhysics.driftCharge)} 
                transparent 
                opacity={0.7} 
              />
            </mesh>
            
            {/* Right wheel spark trail */}
            <mesh 
              position={[0.5, 0.1, -0.5]} 
              rotation={[0, -Math.PI / 2, 0]}
            >
              <planeGeometry args={[1, 0.2]} />
              <meshBasicMaterial 
                color={getBoostColor(kartPhysics.driftCharge)} 
                transparent 
                opacity={0.7} 
              />
            </mesh>
          </>
        )}
        
        {/* Boost visual effect */}
        {kartPhysics.boostLevel > 0 && (
          <mesh 
            position={[0, 0.5, -1]} 
            rotation={[0, 0, 0]}
          >
            <coneGeometry args={[0.5, 2, 16]} />
            <meshBasicMaterial 
              color={
                kartPhysics.boostLevel === 3 ? "#9C27B0" : 
                kartPhysics.boostLevel === 2 ? "#FF9800" : 
                "#2196F3"
              } 
              transparent 
              opacity={0.7} 
            />
          </mesh>
        )}
        
        {/* Item floating above kart */}
        {currentItem && (
          <mesh position={[0, 2, 0]}>
            <sphereGeometry args={[0.5, 16, 16]} />
            <meshBasicMaterial color="#FF0000" />
          </mesh>
        )}
      </mesh>
      
      {/* Drift charge indicator (UI element) */}
      {driftState.isDrifting && driftState.charge > 60 && (
        <mesh 
          position={[0, 5, 0]} 
          rotation={[0, 0, 0]}
        >
          <boxGeometry args={[
            Math.min(4, driftState.charge / 50), 
            0.3, 
            0.3
          ]} />
          <meshBasicMaterial color={getBoostColor(driftState.charge)} />
        </mesh>
      )}
      
      {/* Debug visualization */}
      {true && ( 
        <mesh position={[0, 0, 0]}>
          <sphereGeometry args={[0.5, 16, 16]} />
          <meshBasicMaterial color="blue" wireframe={true} />
        </mesh>
      )}
    </group>
  );
});

export default PlayerRacer; 