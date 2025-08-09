import React, { useRef, useState } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import { ItemBox } from './ItemSystem';

// Sample track layout - you can expand this
const trackSegments = [
  { start: [-20, 0, -20], end: [20, 0, -20], width: 10 },
  { start: [20, 0, -20], end: [20, 0, 20], width: 10 },
  { start: [20, 0, 20], end: [-20, 0, 20], width: 10 },
  { start: [-20, 0, 20], end: [-20, 0, -20], width: 10 },
];

// Generate checkpoints around the track
const generateCheckpoints = () => {
  const checkpoints = [];
  
  trackSegments.forEach((segment, index) => {
    const direction = new THREE.Vector3(
      segment.end[0] - segment.start[0],
      segment.end[1] - segment.start[1],
      segment.end[2] - segment.start[2]
    ).normalize();
    
    const length = new THREE.Vector3(
      segment.end[0] - segment.start[0],
      segment.end[1] - segment.start[1],
      segment.end[2] - segment.start[2]
    ).length();
    
    // Add checkpoints along this segment
    const numCheckpoints = Math.max(1, Math.floor(length / 20));
    
    for (let i = 0; i < numCheckpoints; i++) {
      const t = (i + 1) / (numCheckpoints + 1);
      checkpoints.push({
        position: [
          segment.start[0] + direction.x * length * t,
          segment.start[1] + direction.y * length * t,
          segment.start[2] + direction.z * length * t
        ],
        id: `checkpoint-${index}-${i}`,
        segmentIndex: index
      });
    }
  });
  
  return checkpoints;
};

// Generate item box positions
const generateItemBoxes = () => {
  const itemBoxes = [];
  
  trackSegments.forEach((segment, index) => {
    const direction = new THREE.Vector3(
      segment.end[0] - segment.start[0],
      segment.end[1] - segment.start[1],
      segment.end[2] - segment.start[2]
    ).normalize();
    
    const length = new THREE.Vector3(
      segment.end[0] - segment.start[0],
      segment.end[1] - segment.start[1],
      segment.end[2] - segment.start[2]
    ).length();
    
    // Add item boxes along this segment
    const numItemBoxes = Math.max(1, Math.floor(length / 30));
    
    for (let i = 0; i < numItemBoxes; i++) {
      const t = (i + 1) / (numItemBoxes + 1);
      
      // Create a row of 3 item boxes across the track
      for (let j = -1; j <= 1; j++) {
        // Calculate perpendicular direction
        const perpDirection = new THREE.Vector3(-direction.z, 0, direction.x).normalize();
        
        itemBoxes.push({
          position: [
            segment.start[0] + direction.x * length * t + perpDirection.x * j * 2,
            segment.start[1] + direction.y * length * t + 1, // Slightly above ground
            segment.start[2] + direction.z * length * t + perpDirection.z * j * 2
          ],
          id: `itembox-${index}-${i}-${j}`
        });
      }
    }
  });
  
  return itemBoxes;
};

// Track component
export default function Track({ onCheckpoint, onFinishLine }) {
  const trackRef = useRef();
  const [checkpoints] = useState(generateCheckpoints());
  const [itemBoxes] = useState(generateItemBoxes());
  
  // Helper function to check if a point is on the track
  const isPointOnTrack = (point) => {
    for (const segment of trackSegments) {
      const start = new THREE.Vector3(segment.start[0], segment.start[1], segment.start[2]);
      const end = new THREE.Vector3(segment.end[0], segment.end[1], segment.end[2]);
      
      // Get closest point on line segment
      const line = new THREE.Line3(start, end);
      const closestPoint = new THREE.Vector3();
      line.closestPointToPoint(new THREE.Vector3(point[0], point[1], point[2]), true, closestPoint);
      
      // Check distance to closest point
      const distance = new THREE.Vector3(point[0], point[1], point[2]).distanceTo(closestPoint);
      if (distance <= segment.width / 2) {
        return true;
      }
    }
    return false;
  };

  return (
    <group ref={trackRef}>
      {/* Render track segments */}
      {trackSegments.map((segment, index) => {
        // Calculate segment properties
        const start = new THREE.Vector3(segment.start[0], segment.start[1], segment.start[2]);
        const end = new THREE.Vector3(segment.end[0], segment.end[1], segment.end[2]);
        const direction = end.clone().sub(start).normalize();
        const length = end.clone().sub(start).length();
        
        // Calculate perpendicular direction for track width
        const perpDirection = new THREE.Vector3(-direction.z, 0, direction.x);
        
        // Calculate corners of the track segment
        const corner1 = start.clone().add(perpDirection.clone().multiplyScalar(segment.width / 2));
        const corner2 = start.clone().add(perpDirection.clone().multiplyScalar(-segment.width / 2));
        const corner3 = end.clone().add(perpDirection.clone().multiplyScalar(-segment.width / 2));
        const corner4 = end.clone().add(perpDirection.clone().multiplyScalar(segment.width / 2));
        
        return (
          <group key={`segment-${index}`}>
            {/* Track surface */}
            <mesh position={[
              (corner1.x + corner2.x + corner3.x + corner4.x) / 4,
              (corner1.y + corner2.y + corner3.y + corner4.y) / 4,
              (corner1.z + corner2.z + corner3.z + corner4.z) / 4
            ]}>
              <planeGeometry 
                attach="geometry" 
                args={[segment.width, length]}
              />
              <meshStandardMaterial 
                attach="material" 
                color="#444444" 
                roughness={0.8}
              />
            </mesh>
            
            {/* Track edges */}
            <mesh position={[
              (corner1.x + corner4.x) / 2,
              (corner1.y + corner4.y) / 2 + 0.1,
              (corner1.z + corner4.z) / 2
            ]}>
              <boxGeometry 
                attach="geometry" 
                args={[1, 0.5, length]}
              />
              <meshStandardMaterial 
                attach="material" 
                color="#FF0000" 
                roughness={0.5}
              />
            </mesh>
            
            <mesh position={[
              (corner2.x + corner3.x) / 2,
              (corner2.y + corner3.y) / 2 + 0.1,
              (corner2.z + corner3.z) / 2
            ]}>
              <boxGeometry 
                attach="geometry" 
                args={[1, 0.5, length]}
              />
              <meshStandardMaterial 
                attach="material" 
                color="#FF0000" 
                roughness={0.5}
              />
            </mesh>
          </group>
        );
      })}
      
      {/* Start/Finish line */}
      <mesh 
        position={[0, 0.01, -20]} 
        rotation={[Math.PI / 2, 0, 0]}
        userData={{ type: 'finish_line' }}
      >
        <planeGeometry args={[10, 1]} />
        <meshStandardMaterial color="white" />
      </mesh>
      
      {/* Checkpoints */}
      {checkpoints.map((checkpoint) => (
        <mesh 
          key={checkpoint.id}
          position={checkpoint.position}
          userData={{ 
            type: 'checkpoint', 
            id: checkpoint.id,
            segmentIndex: checkpoint.segmentIndex
          }}
          visible={false} // invisible but collidable
        >
          <boxGeometry args={[1, 5, 1]} />
          <meshBasicMaterial color="blue" wireframe opacity={0.5} transparent />
        </mesh>
      ))}
      
      {/* Item Boxes */}
      {itemBoxes.map((itemBox) => (
        <ItemBox 
          key={itemBox.id}
          id={itemBox.id}
          position={itemBox.position}
          onCollect={(itemType, id) => console.log(`Collected ${itemType} from ${id}`)}
        />
      ))}
      
      {/* Ground */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]}>
        <planeGeometry args={[200, 200]} />
        <meshStandardMaterial color="#336633" roughness={0.8} />
      </mesh>
      
      {/* Sky */}
      <mesh>
        <sphereGeometry args={[100, 32, 32]} />
        <meshStandardMaterial color="#87CEEB" side={THREE.BackSide} />
      </mesh>
      
      {/* Ambient light */}
      <ambientLight intensity={0.5} />
      
      {/* Directional light (sun) */}
      <directionalLight 
        position={[10, 10, 5]} 
        intensity={1} 
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
    </group>
  );
}

// Export utility functions
export const isPointOnTrack = (point) => {
  for (const segment of trackSegments) {
    const start = new THREE.Vector3(segment.start[0], segment.start[1], segment.start[2]);
    const end = new THREE.Vector3(segment.end[0], segment.end[1], segment.end[2]);
    
    // Get closest point on line segment
    const line = new THREE.Line3(start, end);
    const closestPoint = new THREE.Vector3();
    line.closestPointToPoint(new THREE.Vector3(point[0], point[1], point[2]), true, closestPoint);
    
    // Check distance to closest point
    const distance = new THREE.Vector3(point[0], point[1], point[2]).distanceTo(closestPoint);
    if (distance <= segment.width / 2) {
      return true;
    }
  }
  return false;
}; 