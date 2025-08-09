import React, { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';
import audioManager from './utils/AudioManager';

// Available items in the game
export const ITEMS = {
  MUSHROOM: 'mushroom',
  TRIPLE_MUSHROOM: 'triple_mushroom',
  RED_SHELL: 'red_shell',
  GREEN_SHELL: 'green_shell',
  BANANA: 'banana',
  TRIPLE_BANANA: 'triple_banana',
  STAR: 'star',
  LIGHTNING: 'lightning',
  COIN: 'coin'
};

// Preload item textures for better performance
const itemTextureLoader = new THREE.TextureLoader();
const itemTextures = {
  [ITEMS.MUSHROOM]: itemTextureLoader.load('/imported/assets/sprites/mushroom.png'),
  [ITEMS.RED_SHELL]: itemTextureLoader.load('/imported/assets/sprites/red_shell.png'),
  [ITEMS.GREEN_SHELL]: itemTextureLoader.load('/imported/assets/sprites/green_shell.png'),
  [ITEMS.BANANA]: itemTextureLoader.load('/imported/assets/sprites/banana.png'),
  [ITEMS.STAR]: itemTextureLoader.load('/imported/assets/sprites/star.png'),
  [ITEMS.LIGHTNING]: itemTextureLoader.load('/imported/assets/sprites/lightning.png'),
  itemBox: itemTextureLoader.load('/imported/assets/sprites/item_box.png'),
};

// Make sure all textures use correct settings
Object.values(itemTextures).forEach(texture => {
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
});

// Item box component
export const ItemBox = ({ position = [0, 0, 0], onCollect, id }) => {
  const meshRef = useRef();
  const [collected, setCollected] = useState(false);
  const [respawnTimer, setRespawnTimer] = useState(0);
  
  // Animate the item box
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    if (collected) {
      // Count down respawn timer
      if (respawnTimer > 0) {
        setRespawnTimer(time => time - delta);
      } else {
        setCollected(false);
      }
      return;
    }
    
    // Rotation and bobbing animation
    meshRef.current.rotation.y += delta * 0.5;
    const hoverOffset = Math.sin(state.clock.elapsedTime * 2) * 0.2;
    meshRef.current.position.y = position[1] + 0.5 + hoverOffset;
  });
  
  // Item box collected effect
  const collectItem = () => {
    if (collected) return;
    
    setCollected(true);
    setRespawnTimer(5); // 5 seconds respawn time
    
    // Play item collection sound
    audioManager.playSfx('item_collect');
    
    if (onCollect) {
      // Randomly select an item
      const items = Object.values(ITEMS);
      const randomItem = items[Math.floor(Math.random() * items.length)];
      onCollect(randomItem, id);
    }
  };
  
  // Make available for collision detection
  useEffect(() => {
    if (meshRef.current) {
      meshRef.current.userData = { 
        type: 'item_box', 
        collect: collectItem,
        id: id
      };
    }
  }, [id]);
  
  return (
    <group position={[position[0], position[1], position[2]]}>
      {!collected && (
        <mesh ref={meshRef} position={[0, 0.5, 0]}>
          {/* Use a sprite with the imported item box texture */}
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial 
            map={itemTextures.itemBox}
            transparent
            opacity={1.0}
            emissive="#FFFFFF"
            emissiveIntensity={0.2}
          />
        </mesh>
      )}
    </group>
  );
};

// Item display component shown above kart
export const ItemDisplay = ({ item, position, rotation }) => {
  const meshRef = useRef();
  
  useFrame((state) => {
    if (!meshRef.current) return;
    
    // Spin animation
    meshRef.current.rotation.y += 0.02;
  });
  
  // Return appropriate item model based on item type
  const renderItem = () => {
    // Create a sprite with the matching texture
    const texture = itemTextures[item];
    if (!texture) {
      console.warn(`No texture found for item: ${item}`);
      return null;
    }
    
    switch (item) {
      case ITEMS.MUSHROOM:
        return (
          <sprite ref={meshRef} scale={[0.8, 0.8, 1]}>
            <spriteMaterial map={texture} transparent opacity={1.0} />
          </sprite>
        );
      
      case ITEMS.TRIPLE_MUSHROOM:
        return (
          <group ref={meshRef}>
            {[-0.4, 0, 0.4].map((offset, index) => (
              <sprite key={index} position={[offset, 0, 0]} scale={[0.5, 0.5, 1]}>
                <spriteMaterial map={itemTextures[ITEMS.MUSHROOM]} transparent opacity={1.0} />
              </sprite>
            ))}
          </group>
        );
      
      case ITEMS.RED_SHELL:
      case ITEMS.GREEN_SHELL:
      case ITEMS.BANANA:
      case ITEMS.STAR:
      case ITEMS.LIGHTNING:
        return (
          <sprite ref={meshRef} scale={[0.8, 0.8, 1]}>
            <spriteMaterial map={texture} transparent opacity={1.0} />
          </sprite>
        );
        
      case ITEMS.TRIPLE_BANANA:
        return (
          <group ref={meshRef}>
            {[0, 2*Math.PI/3, 4*Math.PI/3].map((angle, index) => (
              <sprite key={index} position={[Math.sin(angle) * 0.3, 0, Math.cos(angle) * 0.3]} scale={[0.5, 0.5, 1]}>
                <spriteMaterial map={itemTextures[ITEMS.BANANA]} transparent opacity={1.0} />
              </sprite>
            ))}
          </group>
        );
      
      default:
        return null;
    }
  };
  
  return (
    <group position={position} rotation={rotation}>
      {renderItem()}
    </group>
  );
};

// Item projectile (for shells, bananas, etc.)
export const ItemProjectile = ({ itemType, position, direction, onHit }) => {
  const meshRef = useRef();
  const velocity = useRef(new THREE.Vector3(0, 0, 0));
  
  // Initialize projectile velocity
  useEffect(() => {
    if (direction) {
      const speed = itemType === ITEMS.RED_SHELL ? 20 : 15;
      velocity.current.set(
        Math.sin(direction) * speed,
        0,
        Math.cos(direction) * speed
      );
    }
  }, [direction, itemType]);
  
  // Update projectile position
  useFrame((state, delta) => {
    if (!meshRef.current) return;
    
    // Move projectile
    meshRef.current.position.x += velocity.current.x * delta;
    meshRef.current.position.z += velocity.current.z * delta;
    
    // Rotation animation
    meshRef.current.rotation.y += delta * 2;
    
    // Red shell homing logic
    if (itemType === ITEMS.RED_SHELL) {
      // TODO: Implement homing behavior
    }
    
    // Check for collisions
    // This would be handled by the parent component via checking positions
  });
  
  return (
    <group position={position} ref={meshRef}>
      <ItemDisplay item={itemType} position={[0, 0, 0]} />
    </group>
  );
};

// Item effects hook - handles item usage logic
export const useItemEffects = (player, setPlayerState) => {
  // Use this hook in the main game component to handle item effects
  const [activeItems, setActiveItems] = useState([]);
  const [pendingItems, setPendingItems] = useState([]);
  
  // Apply item effects
  const useItem = useCallback((itemType) => {
    switch (itemType) {
      case ITEMS.MUSHROOM:
        // Boost player speed
        console.log("Using mushroom boost!");
        setPlayerState(prev => ({
          ...prev,
          boostTime: prev.boostTime + 1.5 // 1.5 seconds of boost
        }));
        break;
        
      case ITEMS.TRIPLE_MUSHROOM:
        // Three consecutive boosts
        console.log("Using triple mushroom boost!");
        setActiveItems(prev => [...prev, {
          type: ITEMS.MUSHROOM,
          count: 3,
          useDelay: 0.8 // Use one mushroom every 0.8 seconds
        }]);
        break;
        
      case ITEMS.STAR:
        // Invincibility and speed boost
        console.log("Using star power!");
        setPlayerState(prev => ({
          ...prev,
          isInvincible: true,
          boostTime: prev.boostTime + 5, // 5 seconds of boost
          starPowerTime: 10 // 10 seconds of invincibility
        }));
        break;
        
      case ITEMS.RED_SHELL:
      case ITEMS.GREEN_SHELL:
        // Create shell projectile
        console.log(`Firing ${itemType}!`);
        // Launch projectile in forward direction
        const direction = player.rotation[1];
        setActiveItems(prev => [...prev, {
          type: itemType,
          position: [
            player.position[0] + Math.sin(direction) * 2,
            player.position[1],
            player.position[2] + Math.cos(direction) * 2
          ],
          direction: direction,
          lifetime: 10 // 10 seconds before disappearing
        }]);
        break;
        
      case ITEMS.BANANA:
        // Drop banana behind
        console.log("Dropping banana!");
        const backDirection = player.rotation[1] + Math.PI;
        setActiveItems(prev => [...prev, {
          type: ITEMS.BANANA,
          position: [
            player.position[0] + Math.sin(backDirection) * 2,
            player.position[1],
            player.position[2] + Math.cos(backDirection) * 2
          ],
          lifetime: 30 // 30 seconds before disappearing
        }]);
        break;
        
      case ITEMS.TRIPLE_BANANA:
        // Three bananas in formation
        console.log("Using triple bananas!");
        const baseAngle = player.rotation[1] + Math.PI;
        [0, 2*Math.PI/3, 4*Math.PI/3].forEach((angleOffset, index) => {
          const angle = baseAngle + angleOffset;
          const distance = 2 + index * 0.5;
          setActiveItems(prev => [...prev, {
            type: ITEMS.BANANA,
            position: [
              player.position[0] + Math.sin(angle) * distance,
              player.position[1],
              player.position[2] + Math.cos(angle) * distance
            ],
            lifetime: 30 // 30 seconds before disappearing
          }]);
        });
        break;
        
      case ITEMS.LIGHTNING:
        // Affect all other players (would need multiplayer)
        console.log("Using lightning!");
        // This would affect other players in multiplayer
        break;
        
      default:
        console.log(`Unknown item: ${itemType}`);
    }
  }, [player, setPlayerState]);
  
  // Process any pending items that need to be used
  useEffect(() => {
    if (pendingItems.length > 0) {
      // Take the first item from the queue and use it
      const itemType = pendingItems[0];
      useItem(itemType);
      
      // Remove the processed item from the queue
      setPendingItems(prev => prev.slice(1));
    }
  }, [pendingItems, useItem]);
  
  // Update active items (projectiles, etc.)
  useFrame((state, delta) => {
    // Process active items
    setActiveItems(prevItems => {
      const updatedItems = prevItems.map(item => {
        // Decrement countdowns
        if (item.useDelay) {
          return {
            ...item,
            useDelay: item.useDelay - delta
          };
        }
        
        if (item.lifetime) {
          return {
            ...item,
            lifetime: item.lifetime - delta
          };
        }
        
        return item;
      });
      
      // Check for items that need to be used
      let shouldQueueMushroom = false;
      updatedItems.forEach(item => {
        if (item.type === ITEMS.MUSHROOM && item.count > 0 && item.useDelay <= 0) {
          // Mark that we should queue a mushroom (don't modify state in the loop)
          shouldQueueMushroom = true;
          item.count--;
          item.useDelay = 0.8;
        }
      });
      
      // Queue mushroom for usage after the loop is complete
      if (shouldQueueMushroom) {
        setPendingItems(prev => [...prev, ITEMS.MUSHROOM]);
      }
      
      // Filter out expired items
      return updatedItems.filter(item => 
        (item.count === undefined || item.count > 0) && 
        (item.lifetime === undefined || item.lifetime > 0)
      );
    });
    
    // Update player effects
    setPlayerState(prev => {
      if (prev.starPowerTime > 0) {
        return {
          ...prev,
          starPowerTime: prev.starPowerTime - delta,
          isInvincible: prev.starPowerTime - delta > 0
        };
      }
      return prev;
    });
  });
  
  return {
    useItem,
    activeItems
  };
};

// Render the active items in the scene
export const ActiveItems = ({ items, onHit }) => {
  return (
    <>
      {items.map((item, index) => {
        // Only render items with positions (projectiles, bananas, etc.)
        if (!item.position) return null;
        
        return (
          <ItemProjectile 
            key={`projectile-${index}`}
            itemType={item.type}
            position={item.position}
            direction={item.direction}
            onHit={onHit}
          />
        );
      })}
    </>
  );
};

export default {
  ITEMS,
  ItemBox,
  ItemDisplay,
  ItemProjectile,
  useItemEffects,
  ActiveItems
}; 