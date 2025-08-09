import React, { useRef } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';

// Simple spinning cube
const SpinningBox = (props) => {
  const meshRef = useRef();
  
  useFrame(() => {
    if (meshRef.current) {
      meshRef.current.rotation.x += 0.01;
      meshRef.current.rotation.y += 0.01;
    }
  });
  
  return (
    <mesh {...props} ref={meshRef}>
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color={'orange'} />
    </mesh>
  );
};

// Simple floor
const Floor = () => {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
      <planeGeometry args={[20, 20]} />
      <meshStandardMaterial color={'#cccccc'} />
    </mesh>
  );
};

// Lights
const Lighting = () => {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight 
        position={[5, 5, 5]} 
        intensity={1} 
        castShadow 
        shadow-mapSize-width={2048} 
        shadow-mapSize-height={2048}
      />
    </>
  );
};

// Main Scene component
const TestScene = () => {
  return (
    <div style={{ width: '100%', height: '100vh' }}>
      <Canvas shadows camera={{ position: [0, 2, 5], fov: 60 }}>
        <color attach="background" args={['#87CEEB']} />
        <Lighting />
        <SpinningBox position={[0, 0, 0]} castShadow />
        <Floor />
        <OrbitControls />
      </Canvas>
    </div>
  );
};

export default TestScene; 