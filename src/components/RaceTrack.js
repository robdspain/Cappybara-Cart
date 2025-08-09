import React, { useRef, useState, useEffect, forwardRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

// Race track component with ground, boundaries, and decorations
const RaceTrack = forwardRef(({ onCollision }, ref) => {
  const [trackMaterial, setTrackMaterial] = useState(null);
  const [grassMaterial, setGrassMaterial] = useState(null);
  const [sandMaterial, setSandMaterial] = useState(null);
  const [waterMaterial, setWaterMaterial] = useState(null);
  const [loadingComplete, setLoadingComplete] = useState(false);
  
  // Track layout
  const trackRef = useRef();
  const obstacleRefs = useRef([]);
  const itemBoxRefs = useRef([]);
  
  // Store decorative elements in a ref to prevent regeneration
  const decorativeElements = useRef(null);
  
  // Minimap data
  const [minimapData, setMinimapData] = useState(null);
  
  // Helper function to create checker pattern for the start/finish line
  const createCheckerPattern = () => {
    const canvas = document.createElement('canvas');
    canvas.width = 512;
    canvas.height = 512;
    const ctx = canvas.getContext('2d');
    
    // Draw checkered pattern
    const squareSize = 64;
    for (let x = 0; x < canvas.width; x += squareSize) {
      for (let y = 0; y < canvas.height; y += squareSize) {
        ctx.fillStyle = ((x / squareSize) + (y / squareSize)) % 2 === 0 ? '#FFFFFF' : '#000000';
        ctx.fillRect(x, y, squareSize, squareSize);
      }
    }
    
    return canvas;
  };
  
  // Create and load materials for track and surroundings
  useEffect(() => {
    let isMounted = true;
    
    const createTrackMaterials = () => {
      if (!isMounted) return;
      
      // Create a racing track texture using canvas
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 512;
      const ctx = canvas.getContext('2d');
      
      // Track asphalt background
      ctx.fillStyle = '#555555';
      ctx.fillRect(0, 0, 512, 512);
      
      // Add racing stripes
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 6;
      
      // Checkered pattern for finish line
      for (let i = 0; i < 512; i += 32) {
        for (let j = 0; j < 512; j += 32) {
          if ((i + j) % 64 === 0) {
            ctx.fillStyle = '#FFFFFF';
            ctx.fillRect(i, j, 32, 32);
          }
        }
      }
      
      // Edge markers
      for (let i = 0; i < 512; i += 64) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(16, i);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(496, i);
        ctx.lineTo(512, i);
        ctx.stroke();
      }
      
      // Create the track texture
      const trackTexture = new THREE.CanvasTexture(canvas);
      trackTexture.wrapS = THREE.RepeatWrapping;
      trackTexture.wrapT = THREE.RepeatWrapping;
      trackTexture.repeat.set(10, 10);
      
      // Create grass texture
      const grassCanvas = document.createElement('canvas');
      grassCanvas.width = 128;
      grassCanvas.height = 128;
      const grassCtx = grassCanvas.getContext('2d');
      
      // Base green
      grassCtx.fillStyle = '#4CAF50';
      grassCtx.fillRect(0, 0, 128, 128);
      
      // Add texture/noise
      for (let i = 0; i < 1000; i++) {
        const x = Math.random() * 128;
        const y = Math.random() * 128;
        const size = Math.random() * 3 + 1;
        
        grassCtx.fillStyle = Math.random() > 0.5 ? '#388E3C' : '#81C784';
        grassCtx.fillRect(x, y, size, size);
      }
      
      const grassTexture = new THREE.CanvasTexture(grassCanvas);
      grassTexture.wrapS = THREE.RepeatWrapping;
      grassTexture.wrapT = THREE.RepeatWrapping;
      grassTexture.repeat.set(20, 20);
      
      // Create sand texture
      const sandCanvas = document.createElement('canvas');
      sandCanvas.width = 128;
      sandCanvas.height = 128;
      const sandCtx = sandCanvas.getContext('2d');
      
      // Base sand color
      sandCtx.fillStyle = '#E0C9A6';
      sandCtx.fillRect(0, 0, 128, 128);
      
      // Add texture/noise
      for (let i = 0; i < 1000; i++) {
        const x = Math.random() * 128;
        const y = Math.random() * 128;
        const size = Math.random() * 2 + 1;
        
        sandCtx.fillStyle = Math.random() > 0.5 ? '#D4BE92' : '#EDD9B4';
        sandCtx.fillRect(x, y, size, size);
      }
      
      const sandTexture = new THREE.CanvasTexture(sandCanvas);
      sandTexture.wrapS = THREE.RepeatWrapping;
      sandTexture.wrapT = THREE.RepeatWrapping;
      sandTexture.repeat.set(20, 20);
      
      // Create water texture
      const waterCanvas = document.createElement('canvas');
      waterCanvas.width = 256;
      waterCanvas.height = 256;
      const waterCtx = waterCanvas.getContext('2d');
      
      // Base water color
      waterCtx.fillStyle = '#1E88E5';
      waterCtx.fillRect(0, 0, 256, 256);
      
      // Add waves
      for (let i = 0; i < 10; i++) {
        waterCtx.beginPath();
        waterCtx.moveTo(0, i * 25 + Math.sin(i) * 5);
        
        for (let x = 0; x < 256; x += 10) {
          const y = i * 25 + Math.sin(x / 30 + i) * 5;
          waterCtx.lineTo(x, y);
        }
        
        waterCtx.lineTo(256, i * 25);
        waterCtx.strokeStyle = '#64B5F6';
        waterCtx.lineWidth = 2;
        waterCtx.stroke();
      }
      
      const waterTexture = new THREE.CanvasTexture(waterCanvas);
      waterTexture.wrapS = THREE.RepeatWrapping;
      waterTexture.wrapT = THREE.RepeatWrapping;
      waterTexture.repeat.set(10, 10);
      
      // Create materials
      const trackMat = new THREE.MeshStandardMaterial({
        map: trackTexture,
        roughness: 0.8,
        metalness: 0.2
      });
      
      const grassMat = new THREE.MeshStandardMaterial({
        map: grassTexture,
        roughness: 0.9,
        metalness: 0.1
      });
      
      const sandMat = new THREE.MeshStandardMaterial({
        map: sandTexture,
        roughness: 1.0,
        metalness: 0.0
      });
      
      const waterMat = new THREE.MeshStandardMaterial({
        map: waterTexture,
        roughness: 0.3,
        metalness: 0.6,
        transparent: true,
        opacity: 0.8
      });
      
      setTrackMaterial(trackMat);
      setGrassMaterial(grassMat);
      setSandMaterial(sandMat);
      setWaterMaterial(waterMat);
      setLoadingComplete(true);
    };
    
    // Try to use dynamic textures created in our script tags
    if (window.trackTexture && window.grassTexture && window.sandTexture && window.waterTexture) {
      // Set up texture wrapping and repeats
      const createThreeJSTexture = (textureObj) => {
        const texture = new THREE.Texture(textureObj.image);
        texture.needsUpdate = true;
        texture.wrapS = THREE.RepeatWrapping;
        texture.wrapT = THREE.RepeatWrapping;
        return texture;
      };
      
      const trackTexture = createThreeJSTexture(window.trackTexture);
      const grassTexture = createThreeJSTexture(window.grassTexture);
      const sandTexture = createThreeJSTexture(window.sandTexture);
      const waterTexture = createThreeJSTexture(window.waterTexture);
      
      // Set appropriate repeats
      trackTexture.repeat.set(10, 10);
      grassTexture.repeat.set(20, 20);
      sandTexture.repeat.set(20, 20);
      waterTexture.repeat.set(10, 10);
      
      // Create materials with the dynamic textures
      const trackMat = new THREE.MeshStandardMaterial({
        map: trackTexture,
        roughness: 0.8,
        metalness: 0.2
      });
      
      const grassMat = new THREE.MeshStandardMaterial({
        map: grassTexture,
        roughness: 0.9,
        metalness: 0.1
      });
      
      const sandMat = new THREE.MeshStandardMaterial({
        map: sandTexture,
        roughness: 1.0,
        metalness: 0.0
      });
      
      const waterMat = new THREE.MeshStandardMaterial({
        map: waterTexture,
        roughness: 0.3,
        metalness: 0.6,
        transparent: true,
        opacity: 0.8
      });
      
      setTrackMaterial(trackMat);
      setGrassMaterial(grassMat);
      setSandMaterial(sandMat);
      setWaterMaterial(waterMat);
      setLoadingComplete(true);
      
      console.log("Using dynamic textures for race track");
      return;
    }
    
    // Try to load textures from files first
    const textureLoader = new THREE.TextureLoader();
    try {
      Promise.all([
        new Promise((resolve, reject) => {
          textureLoader.load(
            `${process.env.PUBLIC_URL}/textures/track.jpg`,
            resolve,
            undefined,
            reject
          );
        }),
        new Promise((resolve, reject) => {
          textureLoader.load(
            `${process.env.PUBLIC_URL}/textures/grass.jpg`,
            resolve,
            undefined,
            reject
          );
        }),
        new Promise((resolve, reject) => {
          textureLoader.load(
            `${process.env.PUBLIC_URL}/textures/sand.jpg`,
            resolve,
            undefined,
            reject
          );
        }),
        new Promise((resolve, reject) => {
          textureLoader.load(
            `${process.env.PUBLIC_URL}/textures/water.jpg`,
            resolve,
            undefined,
            reject
          );
        })
      ]).then(([trackTexture, grassTexture, sandTexture, waterTexture]) => {
        if (!isMounted) return;
        
        trackTexture.wrapS = THREE.RepeatWrapping;
        trackTexture.wrapT = THREE.RepeatWrapping;
        trackTexture.repeat.set(10, 10);
        
        grassTexture.wrapS = THREE.RepeatWrapping;
        grassTexture.wrapT = THREE.RepeatWrapping;
        grassTexture.repeat.set(20, 20);
        
        sandTexture.wrapS = THREE.RepeatWrapping;
        sandTexture.wrapT = THREE.RepeatWrapping;
        sandTexture.repeat.set(20, 20);
        
        waterTexture.wrapS = THREE.RepeatWrapping;
        waterTexture.wrapT = THREE.RepeatWrapping;
        waterTexture.repeat.set(10, 10);
        
        // Create materials
        const trackMat = new THREE.MeshStandardMaterial({
          map: trackTexture,
          roughness: 0.8,
          metalness: 0.2
        });
        
        const grassMat = new THREE.MeshStandardMaterial({
          map: grassTexture,
          roughness: 0.9,
          metalness: 0.1
        });
        
        const sandMat = new THREE.MeshStandardMaterial({
          map: sandTexture,
          roughness: 1.0,
          metalness: 0.0
        });
        
        const waterMat = new THREE.MeshStandardMaterial({
          map: waterTexture,
          roughness: 0.3,
          metalness: 0.6,
          transparent: true,
          opacity: 0.8
        });
        
        setTrackMaterial(trackMat);
        setGrassMaterial(grassMat);
        setSandMaterial(sandMat);
        setWaterMaterial(waterMat);
        setLoadingComplete(true);
      }).catch(() => {
        if (isMounted) {
          createTrackMaterials();
        }
      });
    } catch (error) {
      if (isMounted) {
        createTrackMaterials();
      }
    }
    
    return () => {
      isMounted = false;
    };
  }, []);
  
  // Create minimap data
  useEffect(() => {
    // Only create minimap data once the track is fully loaded
    if (!loadingComplete) return;
    
    const trackOuterRadius = 20;
    const trackInnerRadius = 8;
    const trackShape = createOvalTrack(32);
    
    const minimapCanvas = document.createElement('canvas');
    minimapCanvas.width = 200;
    minimapCanvas.height = 200;
    const ctx = minimapCanvas.getContext('2d');
    
    // Background
    ctx.fillStyle = '#388E3C';
    ctx.fillRect(0, 0, 200, 200);
    
    // Draw track
    ctx.save();
    ctx.translate(100, 100);
    ctx.scale(1.5, 1); // Oval shape factor
    
    // Track outline
    ctx.beginPath();
    ctx.arc(0, 0, trackOuterRadius * 5, 0, Math.PI * 2);
    ctx.fillStyle = '#555555';
    ctx.fill();
    
    // Track inner cut-out
    ctx.beginPath();
    ctx.arc(0, 0, trackInnerRadius * 5, 0, Math.PI * 2);
    ctx.fillStyle = '#388E3C';
    ctx.fill();
    
    // Add checkpoint markers
    ctx.restore();
    
    // Create texture
    const minimapTexture = new THREE.CanvasTexture(minimapCanvas);
    
    // Provide minimap data to parent component
    setMinimapData({
      texture: minimapTexture,
      checkpoints: [
        { x: 0, z: 10, angle: 0 },
        { x: 15, z: 0, angle: Math.PI / 2 },
        { x: 0, z: -10, angle: Math.PI },
        { x: -15, z: 0, angle: Math.PI * 3 / 2 }
      ],
      trackShape: trackShape
    });
  }, [loadingComplete]);
  
  // Track boundaries (outer and inner)
  const trackOuterRadius = 20;
  const trackInnerRadius = 8;
  const trackWidth = trackOuterRadius - trackInnerRadius;
  
  // Create oval track shape
  const createOvalTrack = (segments = 32) => {
    const outerPoints = [];
    const innerPoints = [];
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      const xFactor = 1.5; // Make it more oval by stretching X
      
      // Outer edge
      outerPoints.push({
        x: Math.cos(angle) * trackOuterRadius * xFactor,
        y: Math.sin(angle) * trackOuterRadius
      });
      
      // Inner edge
      innerPoints.push({
        x: Math.cos(angle) * trackInnerRadius * xFactor,
        y: Math.sin(angle) * trackInnerRadius
      });
    }
    
    // Close the loop
    outerPoints.push(outerPoints[0]);
    innerPoints.push(innerPoints[0]);
    
    return { outerPoints, innerPoints };
  };
  
  // Track path for AI drivers - follow center of the track
  const createTrackPath = (segments = 32) => {
    const pathPoints = [];
    const xFactor = 1.5; // Match the oval shape
    const centerRadius = trackInnerRadius + trackWidth / 2;
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      
      // Add some variation to make multiple lanes
      const laneVariation = (i % 3 - 1) * (trackWidth * 0.2);
      const radius = centerRadius + laneVariation;
      
      pathPoints.push([
        Math.cos(angle) * radius * xFactor,
        0,
        Math.sin(angle) * radius
      ]);
    }
    
    return pathPoints;
  };
  
  // Track data
  const trackData = {
    path: createTrackPath(32),
    outerRadius: trackOuterRadius,
    innerRadius: trackInnerRadius,
    width: trackWidth
  };
  
  // Create track boundaries from the oval shape
  const createTrackBoundaries = () => {
    const { outerPoints, innerPoints } = createOvalTrack(32);
    const boundaries = [];
    
    // Outer edge segments
    for (let i = 0; i < outerPoints.length - 1; i++) {
      boundaries.push({
        start: { x: outerPoints[i].x, y: outerPoints[i].y },
        end: { x: outerPoints[i + 1].x, y: outerPoints[i + 1].y }
      });
    }
    
    // Inner edge segments
    for (let i = 0; i < innerPoints.length - 1; i++) {
      boundaries.push({
        start: { x: innerPoints[i].x, y: innerPoints[i].y },
        end: { x: innerPoints[i + 1].x, y: innerPoints[i + 1].y }
      });
    }
    
    return boundaries;
  };
  
  // Track boundaries
  const boundaries = createTrackBoundaries();
  
  // Create scenic elements - like a Mario Kart course
  const scenicElements = useMemo(() => {
    const elements = [
      // Water elements
      { type: 'water', position: [30, -1, 30], size: [50, 1, 50] },
      
      // Sand/beach areas
      { type: 'sand', position: [25, -0.4, 25], size: [10, 1, 10] },
      { type: 'sand', position: [-25, -0.4, -25], size: [15, 1, 15] },
      
      // Raised platforms
      { type: 'elevated', position: [0, 0, 0], size: [trackInnerRadius * 3, 1, trackInnerRadius * 2] },
      
      // Jump ramps
      { type: 'ramp', position: [15, 0, 0], rotation: [0, 0, Math.PI / 12], size: [3, 0.5, 4] },
      { type: 'ramp', position: [-15, 0, 0], rotation: [0, 0, -Math.PI / 12], size: [3, 0.5, 4] },
    ];
    return elements;
  }, []);
  
  // Item box positions
  const itemBoxPositions = [
    // Spread around the track
    { position: [0, 0, 15], id: 'itembox-1' },
    { position: [18, 0, 0], id: 'itembox-2' },
    { position: [0, 0, -15], id: 'itembox-3' },
    { position: [-18, 0, 0], id: 'itembox-4' },
    
    // Additional boxes at strategic points
    { position: [12, 0, 8], id: 'itembox-5' },
    { position: [-12, 0, -8], id: 'itembox-6' },
  ];
  
  // Create obstacles (like Thwomps, barriers, etc.)
  const obstacles = [
    // Obstacles near corners
    { position: [17, 0, 7], size: [1.5, 2, 1.5], type: 'thwomp' },
    { position: [-17, 0, -7], size: [1.5, 2, 1.5], type: 'thwomp' },
    
    // Barriers
    { position: [10, 0, 5], size: [2, 1, 0.5], type: 'barrier' },
    { position: [-10, 0, -5], size: [2, 1, 0.5], type: 'barrier' },
    
    // Pipes
    { position: [5, 0, 12], size: [1, 1.5, 1], type: 'pipe' },
    { position: [-5, 0, -12], size: [1, 1.5, 1], type: 'pipe' },
  ];
  
  // Water animation
  useFrame((state) => {
    if (waterMaterial) {
      waterMaterial.map.offset.y = state.clock.elapsedTime * 0.05;
      waterMaterial.map.needsUpdate = true;
    }
  });
  
  // Generate decorative elements only once
  useEffect(() => {
    // Only generate if it hasn't been done already
    if (decorativeElements.current === null) {
      const trees = [];
      const mushrooms = [];
      
      // Generate 30 decorative items
      for (let i = 0; i < 30; i++) {
        const angle = (i / 30) * Math.PI * 2;
        const distance = trackOuterRadius + 5 + Math.random() * 15;
        const xPos = Math.cos(angle) * distance * 1.5;
        const zPos = Math.sin(angle) * distance;
        
        if (Math.random() > 0.3) {
          // Tree
          trees.push({
            id: `tree-${i}`,
            position: [xPos, 0, zPos],
            scale: 0.8 + Math.random() * 0.4,
            rotation: Math.random() * Math.PI * 2
          });
        } else {
          // Mushroom
          mushrooms.push({
            id: `mushroom-${i}`,
            position: [xPos, 0, zPos],
            color: Math.random() > 0.5 ? "#F44336" : "#4CAF50",
            scale: 0.7 + Math.random() * 0.6
          });
        }
      }
      
      decorativeElements.current = {
        trees,
        mushrooms
      };
    }
  }, [trackOuterRadius]);
  
  // Simplified placeholder until materials are ready
  if (!loadingComplete || !trackMaterial || !grassMaterial) {
    return (
      <group>
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.5, 0]} receiveShadow>
          <planeGeometry args={[100, 100]} />
          <meshStandardMaterial color="#4CAF50" />
        </mesh>
      </group>
    );
  }
  
  return (
    <group ref={ref}>
      {/* Ground - grass */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.55, 0]} receiveShadow>
        <planeGeometry args={[150, 150]} />
        <primitive object={grassMaterial} attach="material" />
      </mesh>
      
      {/* Scenic elements */}
      {scenicElements.map((element, index) => {
        if (element.type === 'water') {
          return (
            <mesh 
              key={`water-${index}`}
              rotation={[-Math.PI / 2, 0, 0]} 
              position={element.position} 
              receiveShadow
            >
              <planeGeometry args={[element.size[0], element.size[2]]} />
              <primitive object={waterMaterial} attach="material" />
            </mesh>
          );
        } else if (element.type === 'sand') {
          return (
            <mesh 
              key={`sand-${index}`}
              rotation={[-Math.PI / 2, 0, 0]} 
              position={element.position} 
              receiveShadow
            >
              <planeGeometry args={[element.size[0], element.size[2]]} />
              <primitive object={sandMaterial} attach="material" />
            </mesh>
          );
        } else if (element.type === 'elevated') {
          return (
            <group key={`elevated-${index}`} position={element.position}>
              <mesh 
                rotation={[-Math.PI / 2, 0, 0]} 
                position={[0, element.size[1] / 2, 0]} 
                receiveShadow
              >
                <boxGeometry args={[element.size[0], element.size[2], element.size[1]]} />
                <meshStandardMaterial color="#A1887F" />
              </mesh>
              <mesh 
                rotation={[-Math.PI / 2, 0, 0]} 
                position={[0, element.size[1], 0]} 
                receiveShadow
              >
                <planeGeometry args={[element.size[0], element.size[2]]} />
                <primitive object={grassMaterial} attach="material" />
              </mesh>
            </group>
          );
        } else if (element.type === 'ramp') {
          return (
            <group 
              key={`ramp-${index}`} 
              position={element.position}
              rotation={element.rotation}
            >
              <mesh receiveShadow>
                <boxGeometry args={element.size} />
                <meshStandardMaterial color="#795548" />
              </mesh>
            </group>
          );
        }
        return null;
      })}
      
      {/* Track - create a custom shape for the oval track */}
      <mesh 
        ref={trackRef} 
        rotation={[-Math.PI / 2, 0, 0]} 
        position={[0, -0.5, 0]} 
        receiveShadow
      >
        <ringGeometry args={[trackInnerRadius * 1.5, trackOuterRadius * 1.5, 64, 1]} />
        <primitive object={trackMaterial} attach="material" />
      </mesh>
      
      {/* Track obstacles - Thwomps, barriers, pipes */}
      {obstacles.map((obstacle, index) => {
        let color = "#D32F2F"; // default red
        
        if (obstacle.type === 'thwomp') {
          color = "#607D8B"; // Blue grey
        } else if (obstacle.type === 'pipe') {
          color = "#4CAF50"; // Green
        } else if (obstacle.type === 'barrier') {
          color = "#FF9800"; // Orange
        }
        
        return (
          <mesh
            key={`obstacle-${index}`}
            position={obstacle.position}
            castShadow
            receiveShadow
            ref={el => {
              if (!obstacleRefs.current) obstacleRefs.current = [];
              obstacleRefs.current[index] = el;
            }}
          >
            <boxGeometry args={obstacle.size} />
            <meshStandardMaterial color={color} roughness={0.7} />
          </mesh>
        );
      })}
      
      {/* Item box placeholders - will be replaced by actual item boxes in parent */}
      {itemBoxPositions.map((itemBox, index) => (
        <mesh
          key={`itembox-placeholder-${index}`}
          position={itemBox.position}
          ref={el => {
            if (!itemBoxRefs.current) itemBoxRefs.current = [];
            itemBoxRefs.current[index] = el;
          }}
        >
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color="#64B5F6" transparent opacity={0.5} />
        </mesh>
      ))}
      
      {/* Starting line */}
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, -0.49, trackInnerRadius + trackWidth/2]}
        receiveShadow
      >
        <planeGeometry args={[trackWidth, 1]} />
        <meshStandardMaterial color="#FFFFFF" />
      </mesh>
      
      {/* Checkpoint markers */}
      {[0, 0.25, 0.5, 0.75].map((fraction, index) => {
        const angle = fraction * Math.PI * 2;
        const xPos = Math.cos(angle) * (trackInnerRadius + trackWidth/2) * 1.5;
        const zPos = Math.sin(angle) * (trackInnerRadius + trackWidth/2);
        
        // The first checkpoint (index 0) is the start/finish line
        if (index === 0) {
          return (
            <group key="start-finish-line" position={[xPos, 0, zPos]} rotation={[0, angle + Math.PI/2, 0]}>
              {/* Large checkered arch over the track */}
              <group position={[0, 0, 0]}>
                {/* Left pillar */}
                <mesh position={[-trackWidth/2 - 1, 2.5, 0]} castShadow>
                  <boxGeometry args={[1, 5, 1]} />
                  <meshStandardMaterial color="#F44336" />
                </mesh>
                
                {/* Right pillar */}
                <mesh position={[trackWidth/2 + 1, 2.5, 0]} castShadow>
                  <boxGeometry args={[1, 5, 1]} />
                  <meshStandardMaterial color="#F44336" />
                </mesh>
                
                {/* Top arch */}
                <mesh position={[0, 5.5, 0]} castShadow>
                  <boxGeometry args={[trackWidth + 4, 1, 1]} />
                  <meshStandardMaterial color="#F44336" />
                </mesh>
                
                {/* Start/Finish text */}
                <group position={[0, 6.5, 0]}>
                  <mesh castShadow>
                    <boxGeometry args={[trackWidth, 1.5, 0.2]} />
                    <meshStandardMaterial color="#FFFFFF" />
                  </mesh>
                  {/* We'd add Text3D here in a full implementation */}
                </group>
                
                {/* Checkered flag pattern on ground */}
                <mesh rotation={[-Math.PI/2, 0, 0]} position={[0, 0.01, 0]}>
                  <planeGeometry args={[trackWidth, 2]} />
                  <meshStandardMaterial>
                    <canvasTexture attach="map" args={[createCheckerPattern()]} />
                  </meshStandardMaterial>
                </mesh>
                
                {/* Start lights */}
                {[-3, -1, 1, 3].map((pos, i) => (
                  <mesh key={`light-${i}`} position={[pos, 4.5, 0.6]} castShadow>
                    <sphereGeometry args={[0.3, 16, 16]} />
                    <meshStandardMaterial color="#FFEB3B" emissive="#FFEB3B" emissiveIntensity={0.8} />
                  </mesh>
                ))}
                
                {/* Decorative flags */}
                {[-trackWidth/2 - 0.5, trackWidth/2 + 0.5].map((xPos, i) => (
                  <group key={`flag-${i}`} position={[xPos, 5, 0]}>
                    <mesh position={[0, 1, 0]} castShadow>
                      <boxGeometry args={[0.1, 2, 0.1]} />
                      <meshStandardMaterial color="#333333" />
                    </mesh>
                    <mesh position={[0.5, 1.8, 0]} castShadow>
                      <planeGeometry args={[1, 0.6]} />
                      <meshStandardMaterial color="#F44336" side={THREE.DoubleSide} />
                    </mesh>
                  </group>
                ))}
              </group>
            </group>
          );
        }
        
        // Regular checkpoints
        return (
          <group key={`checkpoint-${index}`} position={[xPos, 0, zPos]}>
            <mesh position={[0, 1, 0]} castShadow>
              <boxGeometry args={[0.5, 2, 0.5]} />
              <meshStandardMaterial color="#2196F3" />
            </mesh>
            <mesh position={[0, 2.5, 0]} castShadow>
              <boxGeometry args={[3, 0.5, 0.5]} />
              <meshStandardMaterial color="#2196F3" />
            </mesh>
          </group>
        );
      })}
      
      {/* Decorative items - trees, spectators, etc. */}
      {decorativeElements.current && decorativeElements.current.trees.map((tree) => (
        <group key={tree.id} position={tree.position} rotation={[0, tree.rotation, 0]}>
          <mesh position={[0, 1.5, 0]} castShadow>
            <cylinderGeometry args={[0.2, 0.4, 3, 8]} />
            <meshStandardMaterial color="#5D4037" />
          </mesh>
          <mesh position={[0, 3.5, 0]} castShadow>
            <coneGeometry args={[2 * tree.scale, 4 * tree.scale, 8]} />
            <meshStandardMaterial color="#388E3C" />
          </mesh>
        </group>
      ))}
      
      {decorativeElements.current && decorativeElements.current.mushrooms.map((mushroom) => (
        <group key={mushroom.id} position={mushroom.position}>
          <mesh position={[0, 0.5, 0]} castShadow>
            <cylinderGeometry args={[0.3, 0.3, 1, 8]} />
            <meshStandardMaterial color="#FFFFFF" />
          </mesh>
          <mesh position={[0, 1.3, 0]} castShadow>
            <sphereGeometry args={[1 * mushroom.scale, 16, 16, 0, Math.PI * 2, 0, Math.PI / 2]} />
            <meshStandardMaterial color={mushroom.color} />
          </mesh>
        </group>
      ))}
      
      {/* Grandstands */}
      <group position={[25, 0, 0]}>
        {Array.from({ length: 10 }).map((_, i) => (
          <group key={`stand-right-${i}`} position={[0, i * 0.5, i * 1.2]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[10, 0.5, 1]} />
              <meshStandardMaterial color="#9E9E9E" />
            </mesh>
          </group>
        ))}
      </group>
      
      <group position={[-25, 0, 0]}>
        {Array.from({ length: 10 }).map((_, i) => (
          <group key={`stand-left-${i}`} position={[0, i * 0.5, i * 1.2]}>
            <mesh castShadow receiveShadow>
              <boxGeometry args={[10, 0.5, 1]} />
              <meshStandardMaterial color="#9E9E9E" />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
});

// Export both the component and track data
export { RaceTrack };

// Export track data for AI pathing
export const getTrackData = () => {
  const trackOuterRadius = 20;
  const trackInnerRadius = 8;
  const trackWidth = trackOuterRadius - trackInnerRadius;
  
  const createTrackPath = (segments = 32) => {
    const pathPoints = [];
    const xFactor = 1.5; // Match the oval shape
    const centerRadius = trackInnerRadius + trackWidth / 2;
    
    for (let i = 0; i < segments; i++) {
      const angle = (i / segments) * Math.PI * 2;
      
      // Add some variation to make multiple lanes
      const laneVariation = (i % 3 - 1) * (trackWidth * 0.2);
      const radius = centerRadius + laneVariation;
      
      pathPoints.push([
        Math.cos(angle) * radius * xFactor,
        0,
        Math.sin(angle) * radius
      ]);
    }
    
    return pathPoints;
  };
  
  return {
    path: createTrackPath(32),
    outerRadius: trackOuterRadius,
    innerRadius: trackInnerRadius,
    width: trackWidth
  };
};

// Export minimap data for HUD
export const getMinimapData = (trackRef) => {
  if (!trackRef || !trackRef.current) return null;
  
  const trackOuterRadius = 20;
  const trackInnerRadius = 8;
  
  // Create a minimap texture
  const canvas = document.createElement('canvas');
  canvas.width = 200;
  canvas.height = 200;
  const ctx = canvas.getContext('2d');
  
  // Background
  ctx.fillStyle = '#388E3C';
  ctx.fillRect(0, 0, 200, 200);
  
  // Track
  ctx.save();
  ctx.translate(100, 100);
  
  // Outer track
  ctx.beginPath();
  ctx.ellipse(0, 0, trackOuterRadius * 3, trackOuterRadius * 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#555555';
  ctx.fill();
  
  // Inner cutout
  ctx.beginPath();
  ctx.ellipse(0, 0, trackInnerRadius * 3, trackInnerRadius * 2, 0, 0, Math.PI * 2);
  ctx.fillStyle = '#388E3C';
  ctx.fill();
  
  // Checkpoints
  ctx.restore();
  
  const texture = new THREE.CanvasTexture(canvas);
  
  return {
    texture,
    size: [200, 200]
  };
}; 