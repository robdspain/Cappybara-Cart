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
  const groupRef = useRef();
  const [laps, setLaps] = useState(0);

  const aiState = useRef({
    speed: speed * difficultyFactor,
    acceleration: 0.002 * difficultyFactor,
    maxSpeed: 0.18 * difficultyFactor,
    turnSpeed: 0.06 * difficultyFactor,
    currentSpeed: 0,
    currentPathIndex: 0,
    position: initialPosition ? [...initialPosition] : [0, 0, 0],
    rotation: [0, 0, 0],
    lastDistanceToTarget: Infinity,
    stuckTimer: 0,
    isStuck: false
  });

  // Initialize or update state when props change
  useEffect(() => {
    aiState.current.speed = speed * difficultyFactor;
    aiState.current.acceleration = 0.002 * difficultyFactor;
    aiState.current.maxSpeed = 0.18 * difficultyFactor;
    aiState.current.turnSpeed = 0.06 * difficultyFactor;
  }, [speed, difficultyFactor]);

  // AI movement logic
  useFrame((state, delta) => {
    if (!trackPath || trackPath.length === 0 || !groupRef.current) return;

    const ai = aiState.current;
    const targetPoint = trackPath[ai.currentPathIndex];

    // Calculate distance to target
    const dx = targetPoint[0] - ai.position[0];
    const dz = targetPoint[2] - ai.position[2];
    const distanceToTarget = Math.sqrt(dx * dx + dz * dz);

    // Check if we've reached the target point
    if (distanceToTarget < 2.0) {
      const nextIndex = (ai.currentPathIndex + 1) % trackPath.length;
      ai.currentPathIndex = nextIndex;

      // Count lap completion
      if (nextIndex === 0) {
        const newLaps = laps + 1;
        setLaps(newLaps);
        lapCallback(newLaps);
      }
    }

    // Calculate direction to target
    const dirLength = Math.max(distanceToTarget, 0.01);
    const dirX = dx / dirLength;
    const dirZ = dz / dirLength;

    // Calculate desired angle
    const targetAngle = Math.atan2(dirX, dirZ);

    // Current angle
    let currentAngle = ai.rotation[1];

    // Find shortest angle difference
    let angleDifference = targetAngle - currentAngle;
    while (angleDifference > Math.PI) angleDifference -= Math.PI * 2;
    while (angleDifference < -Math.PI) angleDifference += Math.PI * 2;

    // Smooth turning
    const turnAmount = Math.min(Math.abs(angleDifference), ai.turnSpeed) * Math.sign(angleDifference);
    ai.rotation[1] += turnAmount;

    // Acceleration logic
    const shouldSlowForTurn = Math.abs(angleDifference) > 0.5;

    if (shouldSlowForTurn) {
      ai.currentSpeed *= 0.96;
    } else {
      ai.currentSpeed += ai.acceleration;
      if (ai.currentSpeed > ai.maxSpeed) {
        ai.currentSpeed = ai.maxSpeed;
      }
    }

    // Stuck detection - compare distance change over time
    if (Math.abs(distanceToTarget - ai.lastDistanceToTarget) < 0.01) {
      ai.stuckTimer += delta;
      if (ai.stuckTimer > 2.0) {
        ai.isStuck = true;
      }
    } else {
      ai.stuckTimer = 0;
      ai.isStuck = false;
    }
    ai.lastDistanceToTarget = distanceToTarget;

    // Unstuck behavior - skip to next waypoint and boost
    if (ai.isStuck) {
      ai.currentPathIndex = (ai.currentPathIndex + 2) % trackPath.length;
      ai.currentSpeed = ai.maxSpeed * 1.3;
      ai.stuckTimer = 0;
      ai.isStuck = false;
    }

    // Update position
    ai.position[0] += Math.sin(ai.rotation[1]) * ai.currentSpeed;
    ai.position[2] += Math.cos(ai.rotation[1]) * ai.currentSpeed;
    ai.position[1] = 0.5; // Keep on ground

    // Update the Three.js group directly for performance
    groupRef.current.position.set(ai.position[0], ai.position[1], ai.position[2]);
    groupRef.current.rotation.set(0, ai.rotation[1], 0);
  });

  return (
    <group ref={groupRef} position={aiState.current.position} rotation={[0, 0, 0]}>
      <KartModel
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        characterType={characterType}
        isPlayer={false}
      />
    </group>
  );
};

export default AIDriver;
