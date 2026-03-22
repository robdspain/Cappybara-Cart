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
  speedClass = '100cc',
  playerLap = 0,
  playerPosition = 1,
  lapCallback = () => {}
}) => {
  const groupRef = useRef();
  const lapsRef = useRef(0);

  // Speed class multiplier
  const ccMultiplier = speedClass === '150cc' ? 1.4 : speedClass === '50cc' ? 0.7 : 1.0;

  const aiState = useRef({
    speed: speed * difficultyFactor,
    acceleration: 0.003 * difficultyFactor,
    maxSpeed: 0.22 * difficultyFactor,
    turnSpeed: 0.08 * difficultyFactor,
    currentSpeed: 0,
    currentPathIndex: 0,
    position: initialPosition ? [...initialPosition] : [0, 0, 0],
    rotation: [0, 0, 0],
    lastDistanceToTarget: Infinity,
    stuckTimer: 0,
    isStuck: false,
    // Visual state
    leanAngle: 0,
    isDrifting: false,
    driftDirection: 0,
    // Personality - random variations per AI
    personality: {
      aggression: 0.8 + Math.random() * 0.4,    // 0.8-1.2
      consistency: 0.85 + Math.random() * 0.15,  // 0.85-1.0
      bravery: 0.7 + Math.random() * 0.3,        // How fast through turns
    }
  });

  // Initialize or update state when props change (including rubber-banding)
  useEffect(() => {
    const ai = aiState.current;

    // Rubber-band: AI gets faster when player is ahead, slower when behind
    let rubberBand = 1.0;
    if (playerPosition === 1) {
      rubberBand = 1.15; // Player is winning, AI speeds up
    } else if (playerPosition >= 4) {
      rubberBand = 0.9; // Player is losing, AI slows down
    }

    ai.speed = speed * difficultyFactor * ccMultiplier;
    ai.acceleration = 0.003 * difficultyFactor * ai.personality.aggression * ccMultiplier * rubberBand;
    ai.maxSpeed = 0.22 * difficultyFactor * ai.personality.aggression * ccMultiplier * rubberBand;
    ai.turnSpeed = 0.08 * difficultyFactor * ccMultiplier;
  }, [speed, difficultyFactor, ccMultiplier, playerPosition]);

  // AI movement logic
  useFrame((state, delta) => {
    if (!trackPath || trackPath.length === 0 || !groupRef.current) return;

    const ai = aiState.current;
    const targetPoint = trackPath[ai.currentPathIndex];

    // Look ahead 2 waypoints for smoother pathing
    const lookAheadIndex = (ai.currentPathIndex + 2) % trackPath.length;
    const lookAheadPoint = trackPath[lookAheadIndex];

    // Calculate distance to current target
    const dx = targetPoint[0] - ai.position[0];
    const dz = targetPoint[2] - ai.position[2];
    const distanceToTarget = Math.sqrt(dx * dx + dz * dz);

    // Check if we've reached the target point
    if (distanceToTarget < 2.5) {
      const nextIndex = (ai.currentPathIndex + 1) % trackPath.length;
      ai.currentPathIndex = nextIndex;

      // Count lap completion
      if (nextIndex === 0) {
        lapsRef.current += 1;
        lapCallback(lapsRef.current);
      }
    }

    // Blend between current target and look-ahead for smoother movement
    const blendFactor = 0.3;
    const blendedX = dx * (1 - blendFactor) + (lookAheadPoint[0] - ai.position[0]) * blendFactor;
    const blendedZ = dz * (1 - blendFactor) + (lookAheadPoint[2] - ai.position[2]) * blendFactor;

    // Calculate desired angle from blended direction
    const blendedLen = Math.max(Math.sqrt(blendedX * blendedX + blendedZ * blendedZ), 0.01);
    const targetAngle = Math.atan2(blendedX / blendedLen, blendedZ / blendedLen);

    // Current angle
    let currentAngle = ai.rotation[1];

    // Find shortest angle difference
    let angleDifference = targetAngle - currentAngle;
    while (angleDifference > Math.PI) angleDifference -= Math.PI * 2;
    while (angleDifference < -Math.PI) angleDifference += Math.PI * 2;

    // Smooth turning with easing
    const turnStrength = Math.min(Math.abs(angleDifference), ai.turnSpeed) * Math.sign(angleDifference);
    ai.rotation[1] += turnStrength;

    // Calculate lean angle for visual feedback
    const targetLean = -turnStrength * 3;
    ai.leanAngle += (targetLean - ai.leanAngle) * 0.1;

    // Visual drift state for sharp turns
    const isSharpTurn = Math.abs(angleDifference) > 0.4;
    ai.isDrifting = isSharpTurn && ai.currentSpeed > ai.maxSpeed * 0.5;
    ai.driftDirection = Math.sign(angleDifference);

    // Acceleration logic with turn-speed coupling
    const turnPenalty = Math.abs(angleDifference) * ai.personality.bravery;
    const shouldSlowForTurn = turnPenalty > 0.4;

    if (shouldSlowForTurn) {
      // Brake proportional to turn sharpness
      const brakeFactor = 0.92 + (1 - turnPenalty) * 0.06;
      ai.currentSpeed *= brakeFactor;
    } else {
      // Accelerate with slight randomness for natural feel
      const accelNoise = 1.0 + (Math.random() - 0.5) * 0.1;
      ai.currentSpeed += ai.acceleration * accelNoise;
      if (ai.currentSpeed > ai.maxSpeed) {
        ai.currentSpeed = ai.maxSpeed;
      }
    }

    // Occasional random boost for variety
    if (Math.random() > 0.998) {
      ai.currentSpeed = Math.min(ai.currentSpeed * 1.3, ai.maxSpeed * 1.2);
    }

    // Stuck detection
    if (Math.abs(distanceToTarget - ai.lastDistanceToTarget) < 0.005) {
      ai.stuckTimer += delta;
      if (ai.stuckTimer > 1.5) {
        ai.isStuck = true;
      }
    } else {
      ai.stuckTimer = 0;
      ai.isStuck = false;
    }
    ai.lastDistanceToTarget = distanceToTarget;

    // Unstuck behavior - skip ahead and boost
    if (ai.isStuck) {
      ai.currentPathIndex = (ai.currentPathIndex + 3) % trackPath.length;
      ai.currentSpeed = ai.maxSpeed * 1.4;
      ai.stuckTimer = 0;
      ai.isStuck = false;
    }

    // Ensure minimum speed (no complete stops)
    if (ai.currentSpeed < ai.maxSpeed * 0.15) {
      ai.currentSpeed = ai.maxSpeed * 0.15;
    }

    // Update position with delta-time for frame-rate independence
    const moveSpeed = ai.currentSpeed * Math.min(delta * 60, 3); // Cap at 3x for lag spikes
    ai.position[0] += Math.sin(ai.rotation[1]) * moveSpeed;
    ai.position[2] += Math.cos(ai.rotation[1]) * moveSpeed;
    ai.position[1] = 0.5; // Keep on ground

    // Update the Three.js group directly for performance
    groupRef.current.position.set(ai.position[0], ai.position[1], ai.position[2]);
    groupRef.current.rotation.set(0, ai.rotation[1], ai.leanAngle * 0.5);
  });

  return (
    <group ref={groupRef} position={aiState.current.position} rotation={[0, 0, 0]}>
      <KartModel
        position={[0, 0, 0]}
        rotation={[0, 0, 0]}
        characterType={characterType}
        isPlayer={false}
        isDrifting={aiState.current.isDrifting}
        driftDirection={aiState.current.driftDirection}
      />
    </group>
  );
};

export default AIDriver;
