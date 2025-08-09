import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Advanced 3D Capybara model made from primitive shapes
const CapybaraModel = ({ position, rotation }) => {
  const groupRef = useRef();
  const [bodyMaterial, setBodyMaterial] = useState(null);
  const [loadingComplete, setLoadingComplete] = useState(false);
  
  // Load or create textures on component mount
  useEffect(() => {
    // Cleanup function to handle component unmounting
    let isMounted = true;
    
    // Check if our dynamic texture is available
    if (window.capybaraTexture && window.capybaraTexture.image) {
      console.log("Using dynamic capybara texture");
      const texture = new THREE.Texture(window.capybaraTexture.image);
      texture.needsUpdate = true;
      const mat = new THREE.MeshStandardMaterial({
        map: texture,
        roughness: 0.7,
        metalness: 0.2
      });
      setBodyMaterial(mat);
      setLoadingComplete(true);
      return;
    }
    
    const createFallbackMaterial = () => {
      if (!isMounted) return;
      
      // Try to get texture from localStorage if available
      const storedTexture = localStorage.getItem('fallbackCapybaraTexture');
      
      if (storedTexture) {
        console.log("Using stored capybara texture from localStorage");
        const texture = new THREE.TextureLoader().load(storedTexture);
        texture.needsUpdate = true;
        const mat = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.7,
          metalness: 0.2
        });
        setBodyMaterial(mat);
        setLoadingComplete(true);
        return;
      }
      
      // If localStorage doesn't have it, and window.createFallbackTextures exists, use it
      if (window.createFallbackTextures) {
        console.log("Creating new fallback textures");
        const textures = window.createFallbackTextures();
        const texture = new THREE.TextureLoader().load(textures.capybara);
        texture.needsUpdate = true;
        const mat = new THREE.MeshStandardMaterial({
          map: texture,
          roughness: 0.7,
          metalness: 0.2
        });
        setBodyMaterial(mat);
        setLoadingComplete(true);
        return;
      }
      
      // Last resort fallback - simple color
      console.log("Using simple color material fallback");
      const mat = new THREE.MeshStandardMaterial({ 
        color: '#8B4513', // Brown color for capybara
        roughness: 0.8,
        metalness: 0.2
      });
      setBodyMaterial(mat);
      setLoadingComplete(true);
    };
    
    // First try to load the actual texture file
    const textureLoader = new THREE.TextureLoader();
    try {
      textureLoader.load(
        `${process.env.PUBLIC_URL}/textures/capybara.jpg`,
        (texture) => {
          if (!isMounted) return;
          
          console.log("Successfully loaded capybara texture");
          texture.needsUpdate = true;
          const mat = new THREE.MeshStandardMaterial({
            map: texture,
            roughness: 0.7,
            metalness: 0.2
          });
          setBodyMaterial(mat);
          setLoadingComplete(true);
        },
        undefined, // onProgress not used
        (error) => {
          if (!isMounted) return;
          
          console.warn("Failed to load capybara texture:", error);
          createFallbackMaterial();
        }
      );
    } catch (error) {
      console.error("Error in texture loading setup:", error);
      createFallbackMaterial();
    }
    
    // Cleanup function
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Animate the capybara - always runs, but only updates when ready
  useFrame((state) => {
    if (groupRef.current && loadingComplete) {
      // Add a slight bobbing motion
      groupRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 3) * 0.05;
    }
  });
  
  // Return simplified placeholder until fully loaded
  if (!loadingComplete || !bodyMaterial) {
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
      {/* Body */}
      <mesh castShadow receiveShadow position={[0, 0.3, 0]}>
        <capsuleGeometry args={[0.5, 0.8, 8, 16]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>
      
      {/* Head */}
      <mesh castShadow receiveShadow position={[0, 0.5, -0.7]}>
        <sphereGeometry args={[0.4, 16, 16]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>
      
      {/* Ears - left */}
      <mesh castShadow receiveShadow position={[-0.25, 0.8, -0.75]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} />
      </mesh>
      
      {/* Ears - right */}
      <mesh castShadow receiveShadow position={[0.25, 0.8, -0.75]}>
        <sphereGeometry args={[0.1, 8, 8]} />
        <meshStandardMaterial color="#5D4037" roughness={0.9} />
      </mesh>
      
      {/* Eyes - left */}
      <mesh castShadow receiveShadow position={[-0.15, 0.6, -1]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="black" roughness={0.3} />
      </mesh>
      
      {/* Eyes - right */}
      <mesh castShadow receiveShadow position={[0.15, 0.6, -1]}>
        <sphereGeometry args={[0.08, 8, 8]} />
        <meshStandardMaterial color="black" roughness={0.3} />
      </mesh>
      
      {/* Nose */}
      <mesh castShadow receiveShadow position={[0, 0.45, -1.05]}>
        <boxGeometry args={[0.2, 0.15, 0.1]} />
        <meshStandardMaterial color="#3E2723" roughness={0.5} />
      </mesh>
      
      {/* Legs - front left */}
      <mesh castShadow receiveShadow position={[-0.3, -0.1, -0.4]}>
        <cylinderGeometry args={[0.1, 0.15, 0.6, 8]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>
      
      {/* Legs - front right */}
      <mesh castShadow receiveShadow position={[0.3, -0.1, -0.4]}>
        <cylinderGeometry args={[0.1, 0.15, 0.6, 8]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>
      
      {/* Legs - back left */}
      <mesh castShadow receiveShadow position={[-0.3, -0.1, 0.4]}>
        <cylinderGeometry args={[0.1, 0.15, 0.6, 8]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>
      
      {/* Legs - back right */}
      <mesh castShadow receiveShadow position={[0.3, -0.1, 0.4]}>
        <cylinderGeometry args={[0.1, 0.15, 0.6, 8]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>
      
      {/* Tail */}
      <mesh castShadow receiveShadow position={[0, 0.3, 0.7]} rotation={[0.3, 0, 0]}>
        <cylinderGeometry args={[0.05, 0.08, 0.3, 8]} />
        <primitive object={bodyMaterial} attach="material" />
      </mesh>
    </group>
  );
};

export default CapybaraModel; 