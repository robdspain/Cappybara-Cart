import React from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

export const KartModel = () => {
  return (
    <group>
      {/* Kart body */}
      <mesh castShadow position={[0, 0.25, 0]}>
        <boxGeometry args={[1, 0.5, 2]} />
        <meshStandardMaterial color="#FF5722" />
      </mesh>
      
      {/* Driver */}
      <mesh position={[0, 0.75, 0]} castShadow>
        <sphereGeometry args={[0.3, 16, 16]} />
        <meshStandardMaterial color="#8D6E63" />
      </mesh>
      
      {/* Wheels */}
      <mesh position={[0.6, -0.05, 0.7]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[-0.6, -0.05, 0.7]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[0.6, -0.05, -0.7]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#333" />
      </mesh>
      <mesh position={[-0.6, -0.05, -0.7]} castShadow>
        <cylinderGeometry args={[0.3, 0.3, 0.2, 16]} rotation={[Math.PI / 2, 0, 0]} />
        <meshStandardMaterial color="#333" />
      </mesh>
    </group>
  );
}; 