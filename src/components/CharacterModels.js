import React, { useRef, useState, useEffect, useMemo, forwardRef, useImperativeHandle } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { useGLTF } from '@react-three/drei';

// Rainbow colors for star power effect
const RAINBOW_COLORS = [
  '#FF0000', // Red
  '#FF7F00', // Orange
  '#FFFF00', // Yellow
  '#00FF00', // Green
  '#0000FF', // Blue
  '#4B0082', // Indigo
  '#9400D3'  // Violet
];

// Base character kart model with customizable appearance
const KartModel = forwardRef(({ 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = 0.5, 
  characterType = 'capybara',
  kartType = 'standard',
  wheelType = 'standard',
  gliderType = 'standard',
  isPlayer = false,
  isDrifting = false,
  driftDirection = 0,
  isInvincible = false,
  isStunned = false,
  isOnTrack = true,
  boostLevel = 0,
  isActive = true
}, ref) => {
  const groupRef = useRef();
  const [kartMaterial, setKartMaterial] = useState(null);
  const [characterMaterial, setCharacterMaterial] = useState(null);
  const [loadingComplete, setLoadingComplete] = useState(false);
  const [visualState, setVisualState] = useState({
    driftAngle: 0,
    bounceOffset: 0,
    spinAngle: 0,
    flashColor: false,
    offTrackIntensity: 0 // Add intensity value for off-track visual effect
  });
  
  // Track the last position and rotation for debugging
  const lastPositionRef = useRef(null);
  const positionRef = useRef(position);
  const rotationRef = useRef(rotation);
  const lastRotationRef = useRef(rotation[1]); // Track last rotation for steering detection
  
  // Global debug reference if this is the player
  if (isPlayer) {
    window.kartRef = groupRef;
  }
  
  // Expose the groupRef to parent components through the forwarded ref
  useImperativeHandle(ref, () => ({
    groupRef,
    updatePosition: (x, y, z) => {
      if (groupRef.current) {
        // Validate inputs
        if (typeof x === 'number' && !isNaN(x) &&
            typeof y === 'number' && !isNaN(y) &&
            typeof z === 'number' && !isNaN(z)) {
          
          // Update our position reference
          positionRef.current = [x, y, z];
          
          // CRITICAL: Directly update Three.js object position 
          // without waiting for React to reconcile
          groupRef.current.position.set(x, y, z);
          
          // Check if position has changed significantly for logging
          const hasChanged = !lastPositionRef.current || 
            Math.abs(x - (lastPositionRef.current.x || 0)) > 0.01 ||
            Math.abs(y - (lastPositionRef.current.y || 0)) > 0.01 ||
            Math.abs(z - (lastPositionRef.current.z || 0)) > 0.01;
          
          // Update last position
          if (!lastPositionRef.current) {
            lastPositionRef.current = new THREE.Vector3();
          }
          lastPositionRef.current.set(x, y, z);
          
          // Log significant changes
          if (hasChanged) {
            console.log(`KartModel position set to: [${x.toFixed(2)}, ${y.toFixed(2)}, ${z.toFixed(2)}]`);
          }
          
          return true;
        } else {
          console.error("Invalid position values:", { x, y, z });
          return false;
        }
      }
      return false;
    },
    updateRotation: (x, y, z) => {
      if (groupRef.current) {
        // Validate inputs
        if (typeof x === 'number' && !isNaN(x) &&
            typeof y === 'number' && !isNaN(y) &&
            typeof z === 'number' && !isNaN(z)) {
          
          // Update our rotation reference
          rotationRef.current = [x, y, z];
          lastRotationRef.current = y; // Track Y rotation for steering
          
          // CRITICAL: Directly update Three.js object rotation
          // without waiting for React to reconcile
          groupRef.current.rotation.set(x, y, z);
          return true;
        } else {
          console.error("Invalid rotation values:", { x, y, z });
          return false;
        }
      }
      return false;
    },
    updateState: (state) => {
      // Handle kart state updates like drifting, boost, etc.
      try {
        if (state) {
          // Update visual state based on kart physics state
          setVisualState(prevState => ({
            ...prevState,
            driftAngle: state.isDrifting ? state.driftDirection * 0.2 : 0,
            boostLevel: state.boostLevel || 0,
            isGrounded: state.isGrounded !== undefined ? state.isGrounded : true,
            isOnTrack: state.isOnTrack !== undefined ? state.isOnTrack : true,
            isStunned: state.isStunned || false,
            speed: state.speed || 0
          }));
          
          // Store data in the groupRef for animations to use
          if (groupRef.current) {
            groupRef.current.userData.state = {
              ...groupRef.current.userData.state,
              ...state
            };
          }
          
          return true;
        } else {
          console.warn("updateState called with null or undefined state");
          return false;
        }
      } catch (error) {
        console.error("Error in KartModel.updateState:", error);
        return false;
      }
    }
  }), []);
  
  // Update local refs when props change
  useEffect(() => {
    if (Array.isArray(position) && position.length === 3) {
      positionRef.current = position;
    }
    
    if (Array.isArray(rotation) && rotation.length === 3) {
      rotationRef.current = rotation;
    }
    
    // IMPORTANT: Immediately set initial position and rotation
    if (groupRef.current) {
      // Handle initial position setup
      if (Array.isArray(position) && position.length === 3) {
        const validPosition = position.every(val => typeof val === 'number' && !isNaN(val));
        if (validPosition) {
          groupRef.current.position.set(position[0], position[1], position[2]);
          console.log('KartModel initial position set from props:', position);
        }
      }
      
      // Handle initial rotation setup
      if (Array.isArray(rotation) && rotation.length === 3) {
        const validRotation = rotation.every(val => typeof val === 'number' && !isNaN(val));
        if (validRotation) {
          groupRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
        }
      }
    }
  }, [position, rotation]);
  
  // Character colors based on type - wrapped in useMemo to avoid recreation on every render
  const characterColors = useMemo(() => ({
    capybara: '#8B4513', // Brown
    toad: '#FF0000',     // Red
    turtle: '#00FF00',   // Green
    rabbit: '#FFD700',   // Gold
    penguin: '#000080',  // Navy
    default: '#8B4513'   // Default brown
  }), []);
  
  // Kart colors based on character type - wrapped in useMemo to avoid recreation on every render
  const kartColors = useMemo(() => ({
    capybara: '#FF5722', // Orange
    toad: '#4CAF50',     // Green
    turtle: '#2196F3',   // Blue
    rabbit: '#9C27B0',   // Purple
    penguin: '#FFEB3B',  // Yellow
    default: '#FF5722'   // Default orange
  }), []);
  
  // Load or create textures on component mount
  useEffect(() => {
    let isMounted = true;
    
    // Create materials based on character type
    const createMaterials = () => {
      if (!isMounted) return;
      
      try {
        // Character material
        const charColor = characterColors[characterType] || characterColors.default;
        const charMat = new THREE.MeshStandardMaterial({ 
          color: charColor,
          roughness: 0.7,
          metalness: 0.2
        });
        
        // Kart material
        const kartColor = kartColors[characterType] || kartColors.default;
        const kartMat = new THREE.MeshStandardMaterial({ 
          color: kartColor,
          roughness: 0.5,
          metalness: 0.3
        });
        
        setCharacterMaterial(charMat);
        setKartMaterial(kartMat);
        setLoadingComplete(true);
        
        // Ensure the group ref has wheels initialized for animation
        if (groupRef.current) {
          // Create wheel references if they don't exist yet
          console.log("Initializing wheels in kart model");
          groupRef.current.userData.wheels = groupRef.current.userData.wheels || [];
          
          // Make sure the position and rotation are also set initially
          if (Array.isArray(position) && position.length === 3) {
            groupRef.current.position.set(position[0], position[1], position[2]);
          }
          
          if (Array.isArray(rotation) && rotation.length === 3) {
            groupRef.current.rotation.set(rotation[0], rotation[1], rotation[2]);
          }
          
          console.log("Initial kart position set:", Array.isArray(position) ? position.map(v => typeof v === 'number' ? v.toFixed(2) : v) : position);
        }
      } catch (error) {
        console.error("Error creating materials for kart model:", error);
        // Provide a fallback material in case of error
        const fallbackMaterial = new THREE.MeshBasicMaterial({ color: "#FF0000" });
        setCharacterMaterial(fallbackMaterial);
        setKartMaterial(fallbackMaterial);
        setLoadingComplete(true); // Still mark as complete so rendering can continue
      }
    };
    
    createMaterials();
    
    return () => {
      isMounted = false;
    };
  }, [characterType, characterColors, kartColors, position, rotation]);
  
  // Update animation state for off-track visual feedback
  useEffect(() => {
    if (!isOnTrack) {
      console.log('Kart is off-track!');
    }
  }, [isOnTrack]);
  
  // Animation state
  const animationState = useRef({
    wheelRotation: 0,
    bobHeight: 0,
    spinAngle: 0,
    lastPositionUpdate: Date.now(),
    wheelAngle: 0, // For steering visual
    steeringAmount: 0, // Track steering amount
    shakeOffsetX: 0, // For off-track shaking
    shakeOffsetY: 0  // For off-track shaking
  });
  
  // Animate the kart - bobbing motion and wheel rotation
  useFrame((state, delta) => {
    if (groupRef.current && loadingComplete) {
      try {
        // Calculate bobbing motion - kart slightly bobs up and down for visual appeal
        const time = state.clock.getElapsedTime();
        const bobFrequency = 3; // How fast it bobs
        let bobHeight = Math.sin(time * bobFrequency) * 0.03; // How much it bobs
        
        // Add off-track visual feedback - more intense shaking and uneven bobbing
        let shakeOffsetX = 0;
        let shakeOffsetY = 0;
        
        if (!isOnTrack) {
          // More extreme bobbing when off-track
          bobHeight = Math.sin(time * bobFrequency * 2) * 0.06;
          
          // Add random shaking when off-track
          shakeOffsetX = (Math.random() - 0.5) * 0.04;
          shakeOffsetY = (Math.random() - 0.5) * 0.04;
          
          animationState.current.shakeOffsetX = shakeOffsetX;
          animationState.current.shakeOffsetY = shakeOffsetY;
          
          // Visual color change for off-track - make kart materials dirty
          if (kartMaterial) {
            kartMaterial.color.setRGB(
              kartMaterial.color.r * 0.8,
              kartMaterial.color.g * 0.8,
              kartMaterial.color.b * 0.8
            );
          }
        } else {
          // Reset color when back on track
          if (kartMaterial && characterType) {
            const kartColor = kartColors[characterType] || kartColors.default;
            kartMaterial.color.set(kartColor);
          }
        }
        
        // Calculate rotation to apply
        // Spin effect when stunned
        let rotationY = rotationRef.current[1];
        
        if (isStunned) {
          animationState.current.spinAngle += delta * 10; // Spin when stunned
          rotationY = animationState.current.spinAngle;
        }

        // Apply visual tilt when drifting
        let rotationZ = 0;
        let rotationX = 0;
        
        if (isDrifting) {
          // Tilt into the drift direction
          rotationZ = driftDirection * 0.2;
          // Lean forward slightly when drifting
          rotationX = 0.05;
        }
        
        // Get current position from ref
        const currentPos = positionRef.current;
        
        // Calculate steering wheel visual angle
        // When a car steers, the front wheels turn before the whole vehicle changes direction
        if (isDrifting) {
          // More extreme steering angle when drifting
          animationState.current.steeringAmount = driftDirection * 0.4;
        } else {
          // Smooth steering wheel animation
          // Lerp towards the target angle based on rotation change
          const rotationDelta = rotationY - lastRotationRef.current;
          const targetSteering = Math.sign(rotationDelta) * Math.min(Math.abs(rotationDelta * 5), 0.3);
          
          // Smoothly adjust steering visual
          animationState.current.steeringAmount += (targetSteering - animationState.current.steeringAmount) * delta * 5;
        }
        
        // Validate position values before using them
        if (Array.isArray(currentPos) && currentPos.length === 3 &&
            !isNaN(currentPos[0]) && !isNaN(currentPos[1]) && !isNaN(currentPos[2])) {
          
          // Only log significant position changes to avoid console spam
          const now = Date.now();
          if (now - animationState.current.lastPositionUpdate > 1000) {
            console.log(`Kart position: ${currentPos[0].toFixed(2)}, ${currentPos[1].toFixed(2)}, ${currentPos[2].toFixed(2)}`);
            console.log(`Kart rotation: ${rotationY.toFixed(2)}`);
            animationState.current.lastPositionUpdate = now;
          }
          
          // Apply position with bobbing and off-track shaking
          groupRef.current.position.set(
            currentPos[0] + animationState.current.shakeOffsetX,
            currentPos[1] + bobHeight + animationState.current.shakeOffsetY,
            currentPos[2]
          );
        } else {
          console.error("Invalid kart position:", currentPos);
        }
        
        // Update rotation
        if (groupRef.current) {
          // Validate rotation values
          if (!isNaN(rotationX) && !isNaN(rotationY) && !isNaN(rotationZ)) {
            groupRef.current.rotation.set(
              rotationX,
              rotationY,
              rotationZ
            );
          }
        }
        
        // Track last rotation for detecting changes
        lastRotationRef.current = rotationY;
        
        // Animate wheels
        groupRef.current.userData.wheels.forEach((wheel, index) => {
          if (wheel) {
            // Wheels should spin faster based on speed (estimated from position changes)
            let wheelSpeed = 2; // Base rotation speed
            
            // Wheels spin erratically when off-track
            if (!isOnTrack) {
              wheelSpeed += Math.random() * 2;
            }
            
            // Front wheels (index 0, 1) should turn for steering
            const isFrontWheel = index < 2;
            
            if (isPlayer) {
              // Calculate distance moved since last frame
              const positionDelta = new THREE.Vector3(
                currentPos[0] - wheel.position.x,
                0, // Ignore vertical movement
                currentPos[2] - wheel.position.z
              ).length();
              
              // Increase wheel speed based on kart speed
              wheelSpeed += positionDelta * 100;
            }
            
            // Apply wheel rotation (spinning forward)
            animationState.current.wheelRotation += delta * wheelSpeed;
            wheel.rotation.x = animationState.current.wheelRotation;
            
            // Apply steering angle to front wheels only
            if (isFrontWheel) {
              wheel.rotation.y = animationState.current.steeringAmount;
            }
          }
        });
      } catch (error) {
        console.error("Error in kart animation:", error);
      }
    }
  });
  
  // Expose the model for direct manipulation for debugging
  useEffect(() => {
    if (isPlayer && groupRef.current) {
      window.kartModel = groupRef;
      console.log("KartModel exposed to window for debugging");
    }
    
    return () => {
      if (isPlayer) {
        window.kartModel = null;
      }
    };
  }, [isPlayer]);
  
  // Return simplified placeholder until fully loaded
  if (!loadingComplete || !kartMaterial || !characterMaterial) {
    return (
      <group 
        ref={groupRef} 
        position={[position[0], position[1], position[2]]} 
        rotation={[rotation[0], rotation[1], rotation[2]]}
      >
        <mesh>
          <boxGeometry args={[1, 0.5, 1.5]} />
          <meshStandardMaterial color="#8B4513" />
        </mesh>
      </group>
    );
  }
  
  return (
    <group 
      ref={groupRef} 
      position={[position[0], position[1], position[2]]} 
      rotation={[rotation[0], rotation[1], rotation[2]]}
    >
      {/* Kart Body */}
      <mesh castShadow receiveShadow position={[0, 0.2, 0]}>
        <boxGeometry args={[0.8, 0.3, 1.2]} />
        <primitive object={kartMaterial} attach="material" />
      </mesh>
      
      {/* Character body based on type */}
      {characterType === 'capybara' && (
        <>
          {/* Capybara body */}
          <mesh castShadow receiveShadow position={[0, 0.5, -0.2]}>
            <capsuleGeometry args={[0.3, 0.4, 8, 16]} />
            <primitive object={characterMaterial} attach="material" />
          </mesh>
          
          {/* Capybara head */}
          <mesh castShadow receiveShadow position={[0, 0.7, -0.5]}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <primitive object={characterMaterial} attach="material" />
          </mesh>
          
          {/* Ears */}
          <mesh castShadow receiveShadow position={[-0.15, 0.9, -0.5]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#5D4037" roughness={0.9} />
          </mesh>
          <mesh castShadow receiveShadow position={[0.15, 0.9, -0.5]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#5D4037" roughness={0.9} />
          </mesh>
        </>
      )}
      
      {characterType === 'toad' && (
        <>
          {/* Toad body */}
          <mesh castShadow receiveShadow position={[0, 0.5, -0.2]}>
            <cylinderGeometry args={[0.2, 0.3, 0.5, 16]} />
            <primitive object={characterMaterial} attach="material" />
          </mesh>
          
          {/* Toad head */}
          <mesh castShadow receiveShadow position={[0, 0.8, -0.2]}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          
          {/* Toad mushroom cap */}
          <mesh castShadow receiveShadow position={[0, 1.05, -0.2]}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial color="#FF0000" />
          </mesh>
          
          {/* Mushroom dots */}
          <mesh castShadow receiveShadow position={[0, 1.05, -0.5]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh castShadow receiveShadow position={[0.2, 1.15, -0.2]}>
            <sphereGeometry args={[0.08, 8, 8]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
        </>
      )}
      
      {characterType === 'turtle' && (
        <>
          {/* Turtle body */}
          <mesh castShadow receiveShadow position={[0, 0.5, -0.2]}>
            <boxGeometry args={[0.4, 0.3, 0.6]} />
            <primitive object={characterMaterial} attach="material" />
          </mesh>
          
          {/* Turtle shell */}
          <mesh castShadow receiveShadow position={[0, 0.6, 0]}>
            <sphereGeometry args={[0.35, 16, 16]} />
            <meshStandardMaterial color="#005500" />
          </mesh>
          
          {/* Turtle head */}
          <mesh castShadow receiveShadow position={[0, 0.5, -0.5]}>
            <sphereGeometry args={[0.2, 16, 16]} />
            <primitive object={characterMaterial} attach="material" />
          </mesh>
        </>
      )}
      
      {characterType === 'rabbit' && (
        <>
          {/* Rabbit body */}
          <mesh castShadow receiveShadow position={[0, 0.5, -0.2]}>
            <capsuleGeometry args={[0.25, 0.4, 8, 16]} />
            <primitive object={characterMaterial} attach="material" />
          </mesh>
          
          {/* Rabbit head */}
          <mesh castShadow receiveShadow position={[0, 0.7, -0.5]}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <primitive object={characterMaterial} attach="material" />
          </mesh>
          
          {/* Rabbit ears */}
          <mesh castShadow receiveShadow position={[-0.1, 1.1, -0.5]} rotation={[0, 0, -0.2]}>
            <capsuleGeometry args={[0.05, 0.5, 8, 8]} />
            <primitive object={characterMaterial} attach="material" />
          </mesh>
          <mesh castShadow receiveShadow position={[0.1, 1.1, -0.5]} rotation={[0, 0, 0.2]}>
            <capsuleGeometry args={[0.05, 0.5, 8, 8]} />
            <primitive object={characterMaterial} attach="material" />
          </mesh>
        </>
      )}
      
      {characterType === 'penguin' && (
        <>
          {/* Penguin body */}
          <mesh castShadow receiveShadow position={[0, 0.5, -0.2]}>
            <capsuleGeometry args={[0.3, 0.4, 8, 16]} />
            <primitive object={characterMaterial} attach="material" />
          </mesh>
          
          {/* Penguin head */}
          <mesh castShadow receiveShadow position={[0, 0.8, -0.4]}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <primitive object={characterMaterial} attach="material" />
          </mesh>
          
          {/* Penguin belly */}
          <mesh castShadow receiveShadow position={[0, 0.5, -0.35]}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          
          {/* Penguin beak */}
          <mesh castShadow receiveShadow position={[0, 0.75, -0.7]}>
            <coneGeometry args={[0.1, 0.2, 8]} />
            <meshStandardMaterial color="#FFA500" />
          </mesh>
        </>
      )}
      
      {/* Fallback for unknown character types */}
      {!['capybara', 'toad', 'turtle', 'rabbit', 'penguin'].includes(characterType) && (
        <>
          {/* Generic character */}
          <mesh castShadow receiveShadow position={[0, 0.5, -0.2]}>
            <capsuleGeometry args={[0.3, 0.4, 8, 16]} />
            <primitive object={characterMaterial} attach="material" />
          </mesh>
          
          <mesh castShadow receiveShadow position={[0, 0.7, -0.5]}>
            <sphereGeometry args={[0.25, 16, 16]} />
            <primitive object={characterMaterial} attach="material" />
          </mesh>
        </>
      )}
      
      {/* Front wheels - turn when steering */}
      <group 
        position={[0, 0, 0.4]} 
        rotation={[0, isDrifting ? driftDirection * 0.5 : 0, 0]}
      >
        <mesh
          castShadow
          receiveShadow
          position={[0.4, 0, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          ref={el => {
            if (el && !groupRef.current.userData.wheels) {
              groupRef.current.userData.wheels = [];
            }
            if (el) groupRef.current.userData.wheels?.push(el);
          }}
        >
          <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        
        {/* Wheel rim and details */}
        <mesh
          position={[0.4, 0, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[0.15, 0.02, 8, 16]} />
          <meshStandardMaterial color="#777777" metalness={0.7} />
        </mesh>
        
        <mesh
          castShadow
          receiveShadow
          position={[-0.4, 0, 0]}
          rotation={[Math.PI / 2, 0, 0]}
          ref={el => {
            if (el) groupRef.current.userData.wheels?.push(el);
          }}
        >
          <cylinderGeometry args={[0.2, 0.2, 0.1, 16]} />
          <meshStandardMaterial color="#333333" />
        </mesh>
        
        {/* Wheel rim and details */}
        <mesh
          position={[-0.4, 0, 0]}
          rotation={[Math.PI / 2, 0, 0]}
        >
          <torusGeometry args={[0.15, 0.02, 8, 16]} />
          <meshStandardMaterial color="#777777" metalness={0.7} />
        </mesh>
      </group>
      
      {/* Rear wheels */}
      <mesh
        castShadow
        receiveShadow
        position={[0.4, 0, -0.4]}
        rotation={[Math.PI / 2, 0, 0]}
        ref={el => {
          if (el) groupRef.current.userData.wheels?.push(el);
        }}
      >
        <cylinderGeometry args={[0.2, 0.2, 0.12, 16]} /> {/* Slightly wider rear wheels */}
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Wheel rim and details */}
      <mesh
        position={[0.4, 0, -0.4]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.15, 0.02, 8, 16]} />
        <meshStandardMaterial color="#777777" metalness={0.7} />
      </mesh>
      
      <mesh
        castShadow
        receiveShadow
        position={[-0.4, 0, -0.4]}
        rotation={[Math.PI / 2, 0, 0]}
        ref={el => {
          if (el) groupRef.current.userData.wheels?.push(el);
        }}
      >
        <cylinderGeometry args={[0.2, 0.2, 0.12, 16]} /> {/* Slightly wider rear wheels */}
        <meshStandardMaterial color="#333333" />
      </mesh>
      
      {/* Wheel rim and details */}
      <mesh
        position={[-0.4, 0, -0.4]}
        rotation={[Math.PI / 2, 0, 0]}
      >
        <torusGeometry args={[0.15, 0.02, 8, 16]} />
        <meshStandardMaterial color="#777777" metalness={0.7} />
      </mesh>
      
      {/* Suspension springs */}
      <mesh position={[0.4, -0.1, 0.4]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.2, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.8} />
      </mesh>
      
      <mesh position={[-0.4, -0.1, 0.4]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.2, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.8} />
      </mesh>
      
      <mesh position={[0.4, -0.1, -0.4]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.2, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.8} />
      </mesh>
      
      <mesh position={[-0.4, -0.1, -0.4]} rotation={[0, 0, Math.PI/2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.2, 8]} />
        <meshStandardMaterial color="#555555" metalness={0.8} />
      </mesh>
      
      {/* Exhaust pipes */}
      <mesh position={[0.3, 0.1, -0.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
        <meshStandardMaterial color="#777777" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Exhaust tip with glow */}
      <mesh position={[0.45, 0.1, -0.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.05, 0.05, 8]} />
        <meshStandardMaterial color="#FF3300" emissive="#FF5500" emissiveIntensity={0.5} />
      </mesh>
      
      <mesh position={[-0.3, 0.1, -0.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.05, 0.05, 0.3, 8]} />
        <meshStandardMaterial color="#777777" metalness={0.8} roughness={0.2} />
      </mesh>
      
      {/* Exhaust tip with glow */}
      <mesh position={[-0.45, 0.1, -0.7]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.06, 0.05, 0.05, 8]} />
        <meshStandardMaterial color="#FF3300" emissive="#FF5500" emissiveIntensity={0.5} />
      </mesh>
      
      {/* Kart spoiler for some character types */}
      {['capybara', 'turtle'].includes(characterType) && (
        <mesh position={[0, 0.4, -0.6]} rotation={[0.1, 0, 0]}>
          <boxGeometry args={[0.8, 0.05, 0.2]} />
          <meshStandardMaterial color={kartColors[characterType]} metalness={0.3} roughness={0.7} />
        </mesh>
      )}
      
      {/* Support struts for spoiler */}
      {['capybara', 'turtle'].includes(characterType) && (
        <>
          <mesh position={[0.3, 0.25, -0.6]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.05, 0.3, 0.05]} />
            <meshStandardMaterial color="#444444" metalness={0.5} roughness={0.5} />
          </mesh>
          <mesh position={[-0.3, 0.25, -0.6]} rotation={[0, 0, 0]}>
            <boxGeometry args={[0.05, 0.3, 0.05]} />
            <meshStandardMaterial color="#444444" metalness={0.5} roughness={0.5} />
          </mesh>
        </>
      )}
      
      {/* Add visible effect for drift charge */}
      {isDrifting && (
        <pointLight
          position={[0, 0, -1]} // Light behind the kart
          distance={3}
          intensity={1.5}
          color={driftDirection < 0 ? '#3498db' : '#e67e22'} // Blue for left, orange for right
        />
      )}
      
      {/* Add glow effect when invincible */}
      {isInvincible && (
        <pointLight
          position={[0, 0.5, 0]} // Light in the center of the kart
          distance={5}
          intensity={2}
          color="#FFFF00"
        />
      )}
      
      {/* Add visual indicators above the kart for special states */}
      {isStunned && (
        <sprite position={[0, 1.5, 0]} scale={[1, 1, 1]}>
          <spriteMaterial 
            attach="material" 
            color="#FF0000"
            transparent
            opacity={0.8}
          />
        </sprite>
      )}
      
      {/* Add debug rotation indicator */}
      {isPlayer && (
        <group position={[0, 1.2, 0]}>
          <mesh position={[0, 0, 0.3]}>
            <boxGeometry args={[0.2, 0.05, 0.6]} />
            <meshBasicMaterial color="#FF00FF" transparent opacity={0.5} />
          </mesh>
        </group>
      )}
    </group>
  );
});

export default KartModel; 