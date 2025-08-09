import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import KartModel from './CharacterModels';

// AI driver component that controls a kart racer
const AIDriver = ({ 
  characterType, 
  initialPosition, 
  trackPath, 
  speed = 0.08, 
  difficultyFactor = 1.0, 
  lapCallback = () => {} 
}) => {
  const [position, setPosition] = useState(initialPosition || [0, 0, 0]);
  const [rotation, setRotation] = useState([0, 0, 0]);
  const [currentPathIndex, setCurrentPathIndex] = useState(0);
  const [laps, setLaps] = useState(0);
  
  const aiState = useRef({
    speed: speed * difficultyFactor,
    acceleration: 0.001 * difficultyFactor,
    maxSpeed: 0.12 * difficultyFactor,
    turnSpeed: 0.05 * difficultyFactor,
    currentSpeed: 0,
    currentTarget: null,
    distanceToTarget: 0,
    isStuck: false,
    stuckTime: 0
  });
  
  // Initialize or update state when props change
  useEffect(() => {
    aiState.current.speed = speed * difficultyFactor;
    aiState.current.acceleration = 0.001 * difficultyFactor;
    aiState.current.maxSpeed = 0.12 * difficultyFactor;
    aiState.current.turnSpeed = 0.05 * difficultyFactor;
  }, [speed, difficultyFactor]);
  
  // AI movement logic
  useFrame((state, delta) => {
    // Skip if no track path is provided
    if (!trackPath || trackPath.length === 0) return;
    
    // Calculate next target point on the track
    const targetPoint = trackPath[currentPathIndex];
    aiState.current.currentTarget = targetPoint;
    
    // Calculate distance to target
    const distanceToTarget = new THREE.Vector3(
      targetPoint[0] - position[0],
      0,
      targetPoint[2] - position[2]
    ).length();
    
    aiState.current.distanceToTarget = distanceToTarget;
    
    // Check if we've reached the target point
    if (distanceToTarget < 1) {
      // Move to next target
      const nextIndex = (currentPathIndex + 1) % trackPath.length;
      setCurrentPathIndex(nextIndex);
      
      // Count lap completion
      if (nextIndex === 0) {
        const newLaps = laps + 1;
        setLaps(newLaps);
        lapCallback(newLaps);
      }
    }
    
    // Calculate direction to target
    const directionToTarget = new THREE.Vector3(
      targetPoint[0] - position[0],
      0,
      targetPoint[2] - position[2]
    ).normalize();
    
    // Calculate desired angle
    const targetAngle = Math.atan2(directionToTarget.x, directionToTarget.z);
    
    // Current angle
    let currentAngle = rotation[1] % (Math.PI * 2);
    if (currentAngle < 0) currentAngle += Math.PI * 2;
    
    // Find shortest angle difference
    let angleDifference = targetAngle - currentAngle;
    if (angleDifference > Math.PI) angleDifference -= Math.PI * 2;
    if (angleDifference < -Math.PI) angleDifference += Math.PI * 2;
    
    // Determine turning direction and amount
    const turnAmount = Math.min(Math.abs(angleDifference), aiState.current.turnSpeed) * Math.sign(angleDifference);
    
    // Update rotation
    const newRotation = [...rotation];
    newRotation[1] += turnAmount;
    setRotation(newRotation);
    
    // AI acceleration logic with some randomness
    let currentSpeed = aiState.current.currentSpeed;
    
    // Random variations for more natural AI driving
    const shouldSlowForTurn = Math.abs(angleDifference) > 0.5 && Math.random() > 0.7;
    const randomBoost = Math.random() > 0.95 ? 0.02 : 0;
    
    if (shouldSlowForTurn) {
      // Slow down for sharp turns
      currentSpeed *= 0.95;
    } else {
      // Accelerate to max speed
      currentSpeed += aiState.current.acceleration + randomBoost;
      if (currentSpeed > aiState.current.maxSpeed) {
        currentSpeed = aiState.current.maxSpeed;
      }
    }
    
    // Check if stuck and apply unstuck behavior
    if (distanceToTarget === aiState.current.distanceToTarget) {
      aiState.current.stuckTime += delta;
      if (aiState.current.stuckTime > 3) {
        aiState.current.isStuck = true;
      }
    } else {
      aiState.current.stuckTime = 0;
      aiState.current.isStuck = false;
    }
    
    // Unstuck behavior - wiggle and boost
    if (aiState.current.isStuck) {
      // Random direction change
      newRotation[1] += (Math.random() - 0.5) * 0.5;
      setRotation(newRotation);
      
      // Temporary speed boost
      currentSpeed = aiState.current.maxSpeed * 1.5;
      
      // Reset stuck state after a short time
      if (aiState.current.stuckTime > 5) {
        aiState.current.stuckTime = 0;
        aiState.current.isStuck = false;
      }
    }
    
    aiState.current.currentSpeed = currentSpeed;
    
    // Update position based on speed and rotation
    const newPosition = [...position];
    newPosition[0] += Math.sin(newRotation[1]) * currentSpeed;
    newPosition[2] += Math.cos(newRotation[1]) * currentSpeed;
    
    setPosition(newPosition);
  });
  
  return (
    <KartModel 
      position={position} 
      rotation={rotation} 
      characterType={characterType} 
      isPlayer={false} 
    />
  );
};

export default AIDriver; 