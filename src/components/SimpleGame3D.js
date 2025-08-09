import React, { useRef, useEffect, useState, useMemo } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { OrbitControls, Sky, Stars } from '@react-three/drei';
import * as THREE from 'three';
import { TerrainModels, VegetationModels } from './utils/ModelLoader';
import { LoadingScreen } from './LoadingScreen';
import { ErrorBoundary } from './ErrorBoundary';
import { KartModel } from './KartModel';
import { ItemBox, ItemDisplay, ActiveItems, useItemSystem, ITEMS } from './SimpleItemSystem';

// Track path points - forms a closed loop
const TRACK_POINTS = [
  new THREE.Vector3(0, 0, 0),
  new THREE.Vector3(30, 0, 30),
  new THREE.Vector3(60, 0, 0),
  new THREE.Vector3(30, 0, -30),
  new THREE.Vector3(-30, 0, -30),
  new THREE.Vector3(-60, 0, 0),
  new THREE.Vector3(-30, 0, 30),
];

// Create a smooth curve from track points
const createTrackCurve = (points) => {
  const curve = new THREE.CatmullRomCurve3(points);
  curve.closed = true;
  return curve;
};

// RaceTrack component
const RaceTrack = () => {
  const trackCurve = useMemo(() => createTrackCurve(TRACK_POINTS), []);
  
  // Create track geometry
  const trackGeometry = useMemo(() => {
    // Path shape (rectangle)
    const shape = new THREE.Shape();
    shape.moveTo(-5, 0);
    shape.lineTo(5, 0);
    shape.lineTo(5, 0.1);
    shape.lineTo(-5, 0.1);
    shape.lineTo(-5, 0);
    
    // Extrusion settings
    const extrudeSettings = {
      steps: 100,
      bevelEnabled: false,
      extrudePath: trackCurve
    };
    
    return new THREE.ExtrudeGeometry(shape, extrudeSettings);
  }, [trackCurve]);
  
  // Start line with checker pattern
  const startLineMaterial = useMemo(() => {
    const size = 0.5;
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const context = canvas.getContext('2d');
    
    // Create checker pattern
    for (let i = 0; i < canvas.width; i += size * 32) {
      for (let j = 0; j < canvas.height; j += size * 32) {
        context.fillStyle = ((i / 32 + j / 32) % 2 === 0) ? 'black' : 'white';
        context.fillRect(i, j, size * 32, size * 32);
      }
    }
    
    const texture = new THREE.CanvasTexture(canvas);
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;
    
    return new THREE.MeshStandardMaterial({
      map: texture,
      side: THREE.DoubleSide
    });
  }, []);
  
  return (
    <group>
      {/* Track */}
      <mesh geometry={trackGeometry} receiveShadow>
        <meshStandardMaterial color="#555555" roughness={0.8} />
      </mesh>
      
      {/* Ground plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.1, 0]} receiveShadow>
        <planeGeometry args={[500, 500]} />
        <meshStandardMaterial color="#8BC34A" roughness={1} />
      </mesh>
      
      {/* Start line */}
      <mesh position={[0, 0.05, -5]} rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[10, 2]} />
        {startLineMaterial ? <primitive object={startLineMaterial} /> : null}
      </mesh>
    </group>
  );
};

// Enhanced KartPhysics and controls
const KartPhysics = ({ position: initialPosition = new THREE.Vector3(0, 0.5, 0) }) => {
  const kartRef = useRef();
  const [speed, setSpeed] = useState(0);
  const [rotationY, setRotationY] = useState(0);
  const [position, setPosition] = useState({ 
    x: initialPosition.x, 
    y: initialPosition.y, 
    z: initialPosition.z 
  });
  const maxSpeed = 0.5;
  const acceleration = 0.01;
  const deceleration = 0.005;
  const turnSpeed = 0.03;
  const { camera } = useThree();
  
  // Item system integration
  const { 
    playerItem, 
    activeItems, 
    itemBoxes, 
    handleItemBoxCollect, 
    useItem 
  } = useItemSystem();
  
  // Update physics
  useFrame(() => {
    if (!kartRef.current) return;
    
    // Update position based on speed and rotation
    if (speed !== 0) {
      const newX = position.x + Math.sin(rotationY) * speed;
      const newZ = position.z + Math.cos(rotationY) * speed;
      setPosition({ x: newX, y: position.y, z: newZ });
    }
    
    // Update kart position and rotation
    kartRef.current.position.set(position.x, position.y, position.z);
    kartRef.current.rotation.y = rotationY;
    
    // Update camera to follow kart
    const cameraOffset = new THREE.Vector3(
      -Math.sin(rotationY) * 10,
      7,
      -Math.cos(rotationY) * 10
    );
    camera.position.copy(position).add(cameraOffset);
    camera.lookAt(position.x, position.y, position.z);
    
    // Check for item box collisions
    itemBoxes.forEach(box => {
      const boxPos = new THREE.Vector3(box.position[0], box.position[1], box.position[2]);
      const kartPos = new THREE.Vector3(position.x, position.y, position.z);
      const distance = boxPos.distanceTo(kartPos);
      
      if (distance < 2) {
        handleItemBoxCollect(box.id);
      }
    });
  });
  
  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e) => {
      switch (e.key) {
        case 'w':
        case 'W':
        case 'ArrowUp':
          setSpeed(prev => Math.min(prev + acceleration, maxSpeed));
          break;
        case 's':
        case 'S':
        case 'ArrowDown':
          setSpeed(prev => Math.max(prev - acceleration, -maxSpeed / 2));
          break;
        case 'a':
        case 'A':
        case 'ArrowLeft':
          setRotationY(prev => prev + turnSpeed);
          break;
        case 'd':
        case 'D':
        case 'ArrowRight':
          setRotationY(prev => prev - turnSpeed);
          break;
        case 'e':
        case 'E':
          useItem(new THREE.Vector3(position.x, position.y, position.z), { y: rotationY });
          break;
        default:
          break;
      }
    };
    
    const handleKeyUp = (e) => {
      switch (e.key) {
        case 'w':
        case 'W':
        case 'ArrowUp':
        case 's':
        case 'S':
        case 'ArrowDown':
          // Decelerate when keys are released
          const decel = () => {
            setSpeed(prev => {
              if (Math.abs(prev) < deceleration) return 0;
              return prev > 0 ? prev - deceleration : prev + deceleration;
            });
            
            if (speed !== 0) {
              requestAnimationFrame(decel);
            }
          };
          requestAnimationFrame(decel);
          break;
        default:
          break;
      }
    };
    
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [speed, rotationY, useItem]);
  
  return (
    <group ref={kartRef}>
      <ErrorBoundary fallback={<mesh><boxGeometry args={[1, 1, 1]} /><meshStandardMaterial color="red" /></mesh>}>
        <KartModel />
      </ErrorBoundary>
      
      {/* Display current item above the kart */}
      <ItemDisplay 
        item={playerItem} 
        position={[0, 2, 0]} 
        rotation={[0, 0, 0]} 
      />
    </group>
  );
};

// Advanced lighting setup
const AdvancedLighting = () => {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight
        position={[50, 100, 50]}
        intensity={1}
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
        shadow-camera-left={-100}
        shadow-camera-right={100}
        shadow-camera-top={100}
        shadow-camera-bottom={-100}
      />
    </>
  );
};

// Environment elements like stars, clouds, etc.
const Environment = () => {
  const starsRef = useRef();
  
  useEffect(() => {
    // Create stars
    if (starsRef.current) {
      const vertices = [];
      for (let i = 0; i < 1000; i++) {
        const x = (Math.random() - 0.5) * 2000;
        const y = Math.random() * 1000;
        const z = (Math.random() - 0.5) * 2000;
        vertices.push(x, y, z);
      }
      
      const geometry = new THREE.BufferGeometry();
      geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
      
      starsRef.current.geometry = geometry;
    }
  }, []);
  
  return (
    <>
      <points ref={starsRef}>
        <pointsMaterial color="#FFFFFF" size={0.5} sizeAttenuation />
      </points>
      
      {/* Fog for atmospheric effect */}
      <fog attach="fog" args={['#87CEEB', 100, 500]} />
    </>
  );
};

// Simplified Game Scene
function GameScene() {
  // Use our custom ItemSystem hook for managing item boxes
  const { itemBoxes } = useItemSystem();
  
  return (
    <>
      {/* Set sky color */}
      <color attach="background" args={['#87CEEB']} />
      
      {/* Advanced lighting */}
      <AdvancedLighting />
      
      {/* Environment elements */}
      <Environment />
      
      {/* Race track */}
      <RaceTrack />
      
      {/* Kart with physics */}
      <KartPhysics />
      
      {/* Item boxes */}
      {itemBoxes.map((box) => (
        <ItemBox 
          key={box.id}
          position={box.position}
          onCollect={() => {}}
        />
      ))}
    </>
  );
}

// Main component
export default function SimpleGame3D() {
  return (
    <div className="game-canvas" style={{ width: '100%', height: '100vh' }}>
      <Canvas shadows>
        <ErrorBoundary>
          <GameScene />
        </ErrorBoundary>
      </Canvas>
      
      <div className="help-text" style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        backgroundColor: 'rgba(0,0,0,0.7)',
        color: 'white',
        padding: '15px',
        borderRadius: '5px'
      }}>
        <h2>Game Controls</h2>
        <p>W/A/S/D - Move kart</p>
        <p>E - Use item</p>
        <p>Find item boxes around the track to collect power-ups!</p>
      </div>
    </div>
  );
} 