import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import KartModel from './CharacterModels';
import { isPointOnTrack } from './Track';
import { ItemDisplay } from './ItemSystem';
import { ITEMS } from './ItemSystem';

// Waypoints for AI to follow around the track
const trackWaypoints = [
  [-15, 0.5, -15], // Starting area
  [0, 0.5, -15],   // Middle of the first straight
  [15, 0.5, -15],  // First corner approach
  [15, 0.5, 0],    // Middle of second straight
  [15, 0.5, 15],   // Second corner approach
  [0, 0.5, 15],    // Middle of third straight
  [-15, 0.5, 15],  // Third corner approach
  [-15, 0.5, 0],   // Middle of fourth straight
  [-15, 0.5, -15]  // Back to start
];

export default function AIRacer({ 
  name, 
  startPosition, 
  color = '#00FF00', 
  isRacing = false,
  difficulty = 'medium' // 'easy', 'medium', 'hard'
}) {
  const position = useRef(startPosition || [0, 0.5, 0]);
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  const rotation = useRef([0, 0, 0]);
  const targetWaypoint = useRef(0);
  const lapCount = useRef(0);
  const [stunTime, setStunTime] = useState(0);
  const [currentItem, setCurrentItem] = useState(null);
  const [driftState, setDriftState] = useState({
    isDrifting: false,
    direction: null,
    charge: 0
  });
  const [isInvincible, setIsInvincible] = useState(false);
  
  // Set AI difficulty parameters
  const difficultySettings = {
    easy: {
      maxSpeed: 7,
      acceleration: 0.05,
      braking: 0.8,
      handling: 0.02,
      waypointThreshold: 5,
      itemUseDelay: 2000
    },
    medium: {
      maxSpeed: 10,
      acceleration: 0.08,
      braking: 0.85,
      handling: 0.03,
      waypointThreshold: 4,
      itemUseDelay: 1500
    },
    hard: {
      maxSpeed: 13,
      acceleration: 0.1,
      braking: 0.9,
      handling: 0.04,
      waypointThreshold: 3,
      itemUseDelay: 1000
    }
  };
  
  const settings = difficultySettings[difficulty] || difficultySettings.medium;
  
  // Use item after a delay
  useEffect(() => {
    if (currentItem && isRacing) {
      const timer = setTimeout(() => {
        console.log(`${name} used ${currentItem}`);
        
        // Apply item effects
        if (currentItem === ITEMS.MUSHROOM) {
          // Boost
          velocity.current.multiplyScalar(1.5);
        } else if (currentItem === ITEMS.STAR) {
          // Star power
          setIsInvincible(true);
          setTimeout(() => setIsInvincible(false), 5000);
        }
        
        setCurrentItem(null);
      }, settings.itemUseDelay);
      
      return () => clearTimeout(timer);
    }
  }, [currentItem, isRacing, name, settings.itemUseDelay]);
  
  // Randomly get items
  useEffect(() => {
    if (isRacing) {
      const itemTimer = setInterval(() => {
        if (!currentItem && Math.random() < 0.2) {
          // Randomly select an item
          const items = Object.values(ITEMS);
          const randomItem = items[Math.floor(Math.random() * items.length)];
          setCurrentItem(randomItem);
        }
      }, 5000);
      
      return () => clearInterval(itemTimer);
    }
  }, [isRacing, currentItem]);
  
  // AI movement logic
  useFrame((state, delta) => {
    if (!isRacing) return;
    
    // Skip if stunned
    if (stunTime > 0) {
      setStunTime(prev => Math.max(0, prev - delta));
      velocity.current.multiplyScalar(0.9); // Slow down when stunned
      return;
    }
    
    // Get current waypoint target
    const currentWaypoint = trackWaypoints[targetWaypoint.current];
    
    // Calculate direction to waypoint
    const direction = new THREE.Vector3(
      currentWaypoint[0] - position.current[0],
      0,
      currentWaypoint[2] - position.current[2]
    ).normalize();
    
    // Calculate distance to waypoint
    const distanceToWaypoint = Math.sqrt(
      Math.pow(currentWaypoint[0] - position.current[0], 2) +
      Math.pow(currentWaypoint[2] - position.current[2], 2)
    );
    
    // Update target waypoint if we're close enough
    if (distanceToWaypoint < settings.waypointThreshold) {
      targetWaypoint.current = (targetWaypoint.current + 1) % trackWaypoints.length;
      
      // Increment lap if we're back at the start
      if (targetWaypoint.current === 0) {
        lapCount.current++;
        console.log(`${name} completed lap ${lapCount.current}`);
      }
    }
    
    // Calculate angle to waypoint
    const targetAngle = Math.atan2(direction.x, direction.z);
    let currentAngle = rotation.current[1];
    
    // Smoothly rotate towards the target
    const angleDiff = targetAngle - currentAngle;
    
    // Handle wrap-around for angles
    let shortestAngle = angleDiff;
    if (Math.abs(angleDiff) > Math.PI) {
      shortestAngle = angleDiff - Math.sign(angleDiff) * Math.PI * 2;
    }
    
    // Update rotation
    rotation.current[1] += shortestAngle * settings.handling;
    
    // Calculate forward vector based on rotation
    const forwardX = Math.sin(rotation.current[1]);
    const forwardZ = Math.cos(rotation.current[1]);
    
    // Accelerate forwards
    const speed = velocity.current.length();
    const accelerationVector = new THREE.Vector3(forwardX, 0, forwardZ).multiplyScalar(settings.acceleration);
    
    // Add acceleration if we're below max speed
    if (speed < settings.maxSpeed) {
      velocity.current.add(accelerationVector);
    }
    
    // Apply friction
    velocity.current.multiplyScalar(0.98);
    
    // Handle drifting around corners
    if (Math.abs(shortestAngle) > Math.PI / 4 && speed > settings.maxSpeed / 2) {
      // Start drift
      setDriftState({
        isDrifting: true,
        direction: shortestAngle > 0 ? 'right' : 'left',
        charge: driftState.charge + delta * 0.5
      });
      
      // Add drift boost if charged enough
      if (driftState.charge > 1.5) {
        velocity.current.multiplyScalar(1.2);
        setDriftState(prev => ({ ...prev, charge: 0 }));
      }
    } else {
      // Stop drifting
      if (driftState.isDrifting) {
        setDriftState({
          isDrifting: false,
          direction: null,
          charge: 0
        });
      }
    }
    
    // Update position based on velocity
    position.current[0] += velocity.current.x * delta;
    position.current[2] += velocity.current.z * delta;
    
    // Keep AI on track
    if (!isPointOnTrack(position.current)) {
      // If off track, slow down and steer back towards the nearest waypoint
      velocity.current.multiplyScalar(0.9);
      position.current[0] -= velocity.current.x * delta * 0.5;
      position.current[2] -= velocity.current.z * delta * 0.5;
    }
  });
  
  return (
    <group>
      <KartModel 
        position={position.current}
        rotation={[0, rotation.current[1], 0]}
        isStunned={stunTime > 0}
        isDrifting={driftState.isDrifting}
        driftDirection={driftState.direction}
        boostLevel={driftState.charge / 1.5} // 0-1 scale
        isInvincible={isInvincible}
      />
      
      {/* Item Display */}
      {currentItem && (
        <ItemDisplay 
          item={currentItem} 
          position={[
            position.current[0],
            position.current[1] + 3,
            position.current[2]
          ]}
          rotation={[0, rotation.current[1], 0]}
        />
      )}
      
      {/* Name Tag */}
      <mesh
        position={[
          position.current[0],
          position.current[1] + 2.5,
          position.current[2]
        ]}
        rotation={[0, 0, 0]}
      >
        <planeGeometry args={[1.5, 0.5]} />
        <meshBasicMaterial color="#000000" opacity={0.7} transparent />
      </mesh>
    </group>
  );
} 