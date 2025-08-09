import React, { useState, useRef, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import { useGLTF, useTexture } from '@react-three/drei';
import * as THREE from 'three';

/**
 * ItemBox - Represents a floating, rotating item box that gives items when collected
 * Features:
 * - Rotating animation
 * - Floating up/down motion
 * - Collection animation (scale down and fade out)
 * - Respawn after delay
 */
const ItemBox = ({ 
  position = [0, 0, 0], 
  onCollect = () => {}, 
  respawnTime = 5000, 
  itemList = ['mushroom', 'banana', 'red_shell', 'green_shell', 'star', 'lightning']
}) => {
  const [collected, setCollected] = useState(false);
  const [scale, setScale] = useState(1);
  const [opacity, setOpacity] = useState(1);
  const boxRef = useRef();
  const textureRef = useRef();
  const floatOffset = useRef(Math.random() * Math.PI * 2).current; // Random starting offset

  // Load item box texture
  const itemBoxTexture = useTexture('/imported/assets/sprites/item_box.png');
  
  // Create material with transparency
  const material = new THREE.MeshBasicMaterial({
    map: itemBoxTexture,
    transparent: true,
    opacity: opacity,
    side: THREE.DoubleSide
  });
  
  // Animation using useFrame
  useFrame((state, delta) => {
    if (boxRef.current && !collected) {
      // Rotate the item box
      boxRef.current.rotation.y += delta * 2;
      
      // Float up and down
      boxRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime + floatOffset) * 0.2;
      
      // Scale pulse effect
      const scalePulse = 1 + Math.sin(state.clock.elapsedTime * 3 + floatOffset) * 0.05;
      boxRef.current.scale.set(scalePulse, scalePulse, scalePulse);
      
      // Update texture rotation for extra visual effect
      if (textureRef.current) {
        textureRef.current.offset.x = (state.clock.elapsedTime * 0.1) % 1;
      }
    }
  });
  
  // Handle collection animation
  useEffect(() => {
    if (collected) {
      // Animation for collection (scale down and fade out)
      const duration = 500; // ms
      const startTime = Date.now();
      
      const animate = () => {
        const elapsed = Date.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Update scale and opacity based on progress
        setScale(1 - progress);
        setOpacity(1 - progress);
        
        if (progress < 1) {
          requestAnimationFrame(animate);
        }
      };
      
      animate();
      
      // Respawn after delay
      const respawnTimer = setTimeout(() => {
        setCollected(false);
        setScale(1);
        setOpacity(1);
      }, respawnTime);
      
      return () => clearTimeout(respawnTimer);
    }
  }, [collected, respawnTime]);
  
  // Handle collision detection (to be called from parent/game logic)
  const checkCollision = (playerPosition, collisionRadius = 2) => {
    if (collected) return false;
    
    const dx = position[0] - playerPosition.x;
    const dy = boxRef.current ? (boxRef.current.position.y - playerPosition.y) : (position[1] - playerPosition.y);
    const dz = position[2] - playerPosition.z;
    const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
    
    if (distance < collisionRadius) {
      // Item box collected!
      setCollected(true);
      
      // Select random item from the item list
      const randomItemIndex = Math.floor(Math.random() * itemList.length);
      const selectedItem = itemList[randomItemIndex];
      
      // Call the onCollect callback with the selected item
      onCollect(selectedItem);
      
      return true;
    }
    
    return false;
  };
  
  // Make the checkCollision function accessible from outside
  React.useImperativeHandle(boxRef, () => ({
    checkCollision,
    ...boxRef.current
  }));
  
  return (
    <group ref={boxRef} position={[position[0], position[1], position[2]]}>
      {!collected || opacity > 0 ? (
        <>
          {/* Box face 1 (front) */}
          <mesh scale={[scale, scale, scale]} position={[0, 0, 0.5]}>
            <planeGeometry args={[1, 1]} />
            <primitive object={material.clone()} ref={textureRef} />
          </mesh>
          
          {/* Box face 2 (back) */}
          <mesh scale={[scale, scale, scale]} position={[0, 0, -0.5]} rotation={[0, Math.PI, 0]}>
            <planeGeometry args={[1, 1]} />
            <primitive object={material.clone()} />
          </mesh>
          
          {/* Box face 3 (left) */}
          <mesh scale={[scale, scale, scale]} position={[-0.5, 0, 0]} rotation={[0, Math.PI/2, 0]}>
            <planeGeometry args={[1, 1]} />
            <primitive object={material.clone()} />
          </mesh>
          
          {/* Box face 4 (right) */}
          <mesh scale={[scale, scale, scale]} position={[0.5, 0, 0]} rotation={[0, -Math.PI/2, 0]}>
            <planeGeometry args={[1, 1]} />
            <primitive object={material.clone()} />
          </mesh>
          
          {/* Box face 5 (top) */}
          <mesh scale={[scale, scale, scale]} position={[0, 0.5, 0]} rotation={[-Math.PI/2, 0, 0]}>
            <planeGeometry args={[1, 1]} />
            <primitive object={material.clone()} />
          </mesh>
          
          {/* Box face 6 (bottom) */}
          <mesh scale={[scale, scale, scale]} position={[0, -0.5, 0]} rotation={[Math.PI/2, 0, 0]}>
            <planeGeometry args={[1, 1]} />
            <primitive object={material.clone()} />
          </mesh>
        </>
      ) : null}
    </group>
  );
};

// Preload component to improve performance
export const ItemBoxCollection = ({ positions, onCollect, respawnTime, itemList }) => {
  return (
    <group>
      {positions.map((position, index) => (
        <ItemBox 
          key={`item-box-${index}`} 
          position={position} 
          onCollect={onCollect} 
          respawnTime={respawnTime}
          itemList={itemList}
        />
      ))}
    </group>
  );
};

export default ItemBox; 