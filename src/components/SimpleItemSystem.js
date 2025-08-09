import React, { useRef, useState, useEffect } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Define item types
export const ITEMS = {
  BANANA: 'banana',
  MUSHROOM: 'mushroom',
  SHELL_GREEN: 'shell_green',
  SHELL_RED: 'shell_red',
  STAR: 'star',
  NONE: 'none'
};

// Simple item box that players can collect
export const ItemBox = ({ position, onCollect }) => {
  const meshRef = useRef();
  const [collected, setCollected] = useState(false);
  const [respawnTimer, setRespawnTimer] = useState(0);

  // Spinning animation
  useFrame((state, delta) => {
    if (meshRef.current && !collected) {
      meshRef.current.rotation.y += delta * 2;
      meshRef.current.position.y = position[1] + Math.sin(state.clock.elapsedTime * 2) * 0.2 + 0.5;
    }
  });

  // Check for respawn
  useEffect(() => {
    if (collected) {
      const timer = setTimeout(() => {
        setCollected(false);
      }, 5000); // Respawn after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [collected]);

  // If collected, don't render
  if (collected) return null;

  return (
    <mesh 
      ref={meshRef} 
      position={[position[0], position[1] + 0.5, position[2]]}
      onClick={() => {
        if (!collected) {
          setCollected(true);
          onCollect();
        }
      }}
    >
      <boxGeometry args={[1, 1, 1]} />
      <meshStandardMaterial color="#FFC107" emissive="#FF9800" emissiveIntensity={0.5} />
    </mesh>
  );
};

// Visual representation of the item a player has
export const ItemDisplay = ({ item, position, rotation }) => {
  if (item === ITEMS.NONE) return null;

  const getItemColor = () => {
    switch (item) {
      case ITEMS.BANANA: return '#FFEB3B';
      case ITEMS.MUSHROOM: return '#F44336';
      case ITEMS.SHELL_GREEN: return '#4CAF50';
      case ITEMS.SHELL_RED: return '#F44336';
      case ITEMS.STAR: return '#FFC107';
      default: return '#FFFFFF';
    }
  };

  return (
    <mesh position={position} rotation={rotation}>
      <sphereGeometry args={[0.3, 16, 16]} />
      <meshStandardMaterial color={getItemColor()} />
    </mesh>
  );
};

// Active projectile items in the scene
export const ItemProjectile = ({ position, itemType, direction, onHit }) => {
  const meshRef = useRef();
  
  // Get appropriate geometry and color based on item type
  const getItemProperties = () => {
    switch (itemType) {
      case ITEMS.BANANA:
        return {
          geometry: <sphereGeometry args={[0.5, 8, 8]} />,
          color: '#FFEB3B'
        };
      case ITEMS.SHELL_GREEN:
      case ITEMS.SHELL_RED:
        return {
          geometry: <sphereGeometry args={[0.5, 16, 16]} />,
          color: itemType === ITEMS.SHELL_GREEN ? '#4CAF50' : '#F44336'
        };
      default:
        return {
          geometry: <boxGeometry args={[0.5, 0.5, 0.5]} />,
          color: '#FFFFFF'
        };
    }
  };
  
  const { geometry, color } = getItemProperties();
  
  // Move the projectile
  useFrame((state, delta) => {
    if (meshRef.current) {
      // Move forward in the direction
      meshRef.current.position.x += direction.x * delta * 10;
      meshRef.current.position.z += direction.z * delta * 10;
      
      // Spin the projectile
      meshRef.current.rotation.x += delta * 5;
      meshRef.current.rotation.y += delta * 5;
    }
  });
  
  return (
    <mesh
      ref={meshRef}
      position={[position.x, position.y, position.z]}
      castShadow
    >
      {geometry}
      <meshStandardMaterial color={color} />
    </mesh>
  );
};

// Container for active items
export const ActiveItems = ({ items, onHit }) => {
  return (
    <group>
      {items.map((item, index) => (
        <ItemProjectile
          key={index}
          position={item.position}
          itemType={item.type}
          direction={item.direction}
          onHit={onHit}
        />
      ))}
    </group>
  );
};

// Custom hook to handle item effects
export const useItemSystem = () => {
  const [playerItem, setPlayerItem] = useState(ITEMS.NONE);
  const [activeItems, setActiveItems] = useState([]);
  const [itemBoxes, setItemBoxes] = useState([
    { id: 1, position: [10, 0, 10] },
    { id: 2, position: [-10, 0, -10] },
    { id: 3, position: [30, 0, 0] },
    { id: 4, position: [0, 0, 30] },
    { id: 5, position: [-30, 0, 0] },
    { id: 6, position: [0, 0, -30] }
  ]);
  
  // Generate a random item
  const getRandomItem = () => {
    const items = [
      ITEMS.BANANA,
      ITEMS.MUSHROOM,
      ITEMS.SHELL_GREEN,
      ITEMS.SHELL_RED,
      ITEMS.STAR
    ];
    return items[Math.floor(Math.random() * items.length)];
  };
  
  // Handle item box collection
  const handleItemBoxCollect = (boxId) => {
    if (playerItem === ITEMS.NONE) {
      setPlayerItem(getRandomItem());
      console.log("Collected item box!");
    }
  };
  
  // Use the current item
  const useItem = (playerPosition, playerRotation) => {
    if (playerItem === ITEMS.NONE) return;
    
    // Create direction vector based on player rotation
    const direction = new THREE.Vector3(
      Math.sin(playerRotation.y),
      0,
      Math.cos(playerRotation.y)
    );
    
    // Add the item to active items
    setActiveItems(prev => [
      ...prev,
      {
        id: Date.now(),
        type: playerItem,
        position: new THREE.Vector3(
          playerPosition.x + direction.x,
          playerPosition.y,
          playerPosition.z + direction.z
        ),
        direction
      }
    ]);
    
    // Clear player's item
    setPlayerItem(ITEMS.NONE);
  };
  
  return {
    playerItem,
    setPlayerItem,
    activeItems,
    setActiveItems,
    itemBoxes,
    handleItemBoxCollect,
    useItem
  };
};

export default {
  ItemBox,
  ItemDisplay,
  ItemProjectile,
  ActiveItems,
  useItemSystem,
  ITEMS
}; 