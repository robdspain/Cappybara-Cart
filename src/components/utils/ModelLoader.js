import React, { useEffect, useState, useRef, useMemo } from 'react';
import { useLoader } from '@react-three/fiber';
import { FBXLoader } from 'three/examples/jsm/loaders/FBXLoader';
import * as THREE from 'three';

// Cache for loaded models
const modelCache = {};

// Debug flag
const DEBUG_MODEL_LOADING = true;

/**
 * Load a 3D model from the imported assets folder
 * @param {string} modelPath - Path to the model file
 * @param {Object} options - Loading options
 * @returns {THREE.Group} - The loaded model
 */
export const loadModel = (modelPath, options = {}) => {
  if (DEBUG_MODEL_LOADING) {
    console.log(`[ModelLoader] Attempting to load model: ${modelPath}`);
  }
  
  // Check if model path is valid
  if (!modelPath || typeof modelPath !== 'string') {
    console.error(`[ModelLoader] Invalid model path: ${modelPath}`);
    return Promise.reject(new Error(`Invalid model path: ${modelPath}`));
  }
  
  // Check cache first
  if (modelCache[modelPath]) {
    if (DEBUG_MODEL_LOADING) {
      console.log(`[ModelLoader] Using cached model: ${modelPath}`);
    }
    // Return a clone of the cached model to avoid modifications affecting the cache
    return Promise.resolve(modelCache[modelPath].clone());
  }
  
  // Create loader
  const loader = new FBXLoader();
  
  // Load model
  return new Promise((resolve, reject) => {
    try {
      if (DEBUG_MODEL_LOADING) {
        console.log(`[ModelLoader] Loading model from: ${modelPath}`);
      }
      
      loader.load(
        modelPath,
        (fbx) => {
          try {
            if (DEBUG_MODEL_LOADING) {
              console.log(`[ModelLoader] Successfully loaded model: ${modelPath}`);
            }
            
            // Apply default transformations if needed
            if (options.scale) {
              fbx.scale.set(options.scale, options.scale, options.scale);
            }
            
            if (options.position) {
              fbx.position.set(options.position[0], options.position[1], options.position[2]);
            }
            
            if (options.rotation) {
              fbx.rotation.set(options.rotation[0], options.rotation[1], options.rotation[2]);
            }
            
            // Apply custom material if provided
            if (options.material) {
              fbx.traverse((child) => {
                if (child.isMesh) {
                  child.material = options.material;
                }
              });
            }
            
            // Cache the model
            modelCache[modelPath] = fbx.clone();
            
            // Resolve with the loaded model
            resolve(fbx);
          } catch (err) {
            console.error(`[ModelLoader] Error processing loaded model: ${modelPath}`, err);
            reject(err);
          }
        },
        // Progress callback
        (xhr) => {
          if (options.onProgress) {
            options.onProgress(xhr.loaded / xhr.total);
          }
          
          if (DEBUG_MODEL_LOADING) {
            console.log(`[ModelLoader] Loading progress for ${modelPath}: ${Math.round((xhr.loaded / xhr.total) * 100)}%`);
          }
        },
        // Error callback
        (error) => {
          console.error(`[ModelLoader] Error loading model: ${modelPath}`, error);
          
          // Try to provide more helpful error information
          if (error && error.target && error.target.status === 404) {
            console.error(`[ModelLoader] Model file not found (404): ${modelPath}`);
          } else if (error && error.target && error.target.status >= 400) {
            console.error(`[ModelLoader] HTTP error ${error.target.status} loading model: ${modelPath}`);
          }
          
          reject(error);
        }
      );
    } catch (err) {
      console.error(`[ModelLoader] Exception during model loading setup: ${modelPath}`, err);
      reject(err);
    }
  });
};

/**
 * React component to load and render a 3D model
 */
export const Model = ({ 
  modelPath, 
  position = [0, 0, 0], 
  rotation = [0, 0, 0], 
  scale = 0.01,
  material = null,
  castShadow = true,
  receiveShadow = true,
  ...props 
}) => {
  const [model, setModel] = useState(null);
  const [error, setError] = useState(null);
  const groupRef = useRef();
  
  // Load model on mount
  useEffect(() => {
    let isMounted = true;
    
    const loadModelAsync = async () => {
      try {
        if (DEBUG_MODEL_LOADING) {
          console.log(`[Model] Starting to load: ${modelPath}`);
        }
        
        const loadedModel = await loadModel(modelPath, { 
          scale,
          position: [0, 0, 0], // We'll handle position with the group
          rotation: [0, 0, 0], // We'll handle rotation with the group
          material
        });
        
        // Apply shadow properties
        loadedModel.traverse((child) => {
          if (child.isMesh) {
            child.castShadow = castShadow;
            child.receiveShadow = receiveShadow;
          }
        });
        
        if (isMounted) {
          setModel(loadedModel);
          setError(null);
          if (DEBUG_MODEL_LOADING) {
            console.log(`[Model] Successfully loaded and processed: ${modelPath}`);
          }
        }
      } catch (error) {
        console.error(`[Model] Failed to load model: ${modelPath}`, error);
        if (isMounted) {
          setError(error);
        }
      }
    };
    
    loadModelAsync();
    
    return () => {
      isMounted = false;
    };
  }, [modelPath, scale, material, castShadow, receiveShadow]);
  
  return (
    <group 
      ref={groupRef} 
      position={[position[0], position[1], position[2]]} 
      rotation={[rotation[0], rotation[1], rotation[2]]}
      {...props}
    >
      {model && <primitive object={model} />}
      {error && (
        // Render a simple colored box as a fallback when model fails to load
        <mesh castShadow={castShadow} receiveShadow={receiveShadow}>
          <boxGeometry args={[1, 1, 1]} />
          <meshStandardMaterial color={0xff0000} wireframe={true} opacity={0.7} transparent />
        </mesh>
      )}
    </group>
  );
};

/**
 * Component for creating a terrain using desert and winter mountain models
 */
export const TerrainModels = ({ count = 10, radius = 200 }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState([]);
  
  // Models to try loading
  const models = [
    // Desert mountains
    '/imported/assets/craftpix-773180-free-desert-mountain-3d-low-poly-models/Fbx/Mountain_desert_001.fbx',
    '/imported/assets/craftpix-773180-free-desert-mountain-3d-low-poly-models/Fbx/Mountain_desert_002.fbx',
    '/imported/assets/craftpix-773180-free-desert-mountain-3d-low-poly-models/Fbx/Mountain_desert_003.fbx',
    '/imported/assets/craftpix-773180-free-desert-mountain-3d-low-poly-models/Fbx/Mountain_desert_004.fbx',
    '/imported/assets/craftpix-773180-free-desert-mountain-3d-low-poly-models/Fbx/Hill_desert_001.fbx',
    '/imported/assets/craftpix-773180-free-desert-mountain-3d-low-poly-models/Fbx/Hill_desert_002.fbx',
    
    // Winter mountains
    '/imported/assets/craftpix-671192-free-winter-mountain-3d-low-poly-models/Fbx/Mountain_winter_001.fbx',
    '/imported/assets/craftpix-671192-free-winter-mountain-3d-low-poly-models/Fbx/Mountain_winter_002.fbx',
    '/imported/assets/craftpix-671192-free-winter-mountain-3d-low-poly-models/Fbx/Mountain_winter_003.fbx',
    '/imported/assets/craftpix-671192-free-winter-mountain-3d-low-poly-models/Fbx/Hill_winter_001.fbx',
    '/imported/assets/craftpix-671192-free-winter-mountain-3d-low-poly-models/Fbx/Hill_winter_002.fbx',
  ];
  
  // Try alternative paths if the original paths fail
  const alternativeModels = [
    // Try without the 'imported' prefix
    '/assets/craftpix-773180-free-desert-mountain-3d-low-poly-models/Fbx/Mountain_desert_001.fbx',
    '/assets/craftpix-671192-free-winter-mountain-3d-low-poly-models/Fbx/Mountain_winter_001.fbx',
    // Try with lowercase 'fbx' directory
    '/imported/assets/craftpix-773180-free-desert-mountain-3d-low-poly-models/fbx/Mountain_desert_001.fbx',
    '/imported/assets/craftpix-671192-free-winter-mountain-3d-low-poly-models/fbx/Mountain_winter_001.fbx',
  ];
  
  // Test loading the first model to verify paths
  useEffect(() => {
    const testLoading = async () => {
      // Clear previous errors
      setLoadErrors([]);
      setIsLoading(true);
      
      // Try to load test models from the main list
      let loadedAny = false;
      
      for (let i = 0; i < models.length; i++) {
        try {
          await loadModel(models[i], { scale: 0.1 });
          loadedAny = true;
          console.log(`[TerrainModels] Successfully loaded test model: ${models[i]}`);
          break;
        } catch (error) {
          console.error(`[TerrainModels] Failed to load test model: ${models[i]}`, error);
          setLoadErrors(prev => [...prev, { path: models[i], error: error.message }]);
        }
      }
      
      // If main models failed, try alternatives
      if (!loadedAny) {
        console.warn('[TerrainModels] Main models failed to load, trying alternatives...');
        for (let i = 0; i < alternativeModels.length; i++) {
          try {
            await loadModel(alternativeModels[i], { scale: 0.1 });
            loadedAny = true;
            console.log(`[TerrainModels] Successfully loaded alternative model: ${alternativeModels[i]}`);
            break;
          } catch (error) {
            console.error(`[TerrainModels] Failed to load alternative model: ${alternativeModels[i]}`, error);
            setLoadErrors(prev => [...prev, { path: alternativeModels[i], error: error.message }]);
          }
        }
      }
      
      setIsLoading(false);
    };
    
    testLoading();
  }, []);
  
  // Generate random positions in a circle around the track
  const positions = useMemo(() => {
    const pos = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      const r = radius + Math.random() * 50; // Vary distance from center
      pos.push([
        Math.cos(angle) * r,
        -5 + Math.random() * 10, // Vary height
        Math.sin(angle) * r
      ]);
    }
    return pos;
  }, [count, radius]);
  
  // If we're still loading or had errors for all models, return a simplified representation
  if (isLoading) {
    return <group />;
  }
  
  // If we had errors for all models, use simple boxes instead
  if (loadErrors.length === models.length + alternativeModels.length) {
    console.error('[TerrainModels] All model loading failed, using fallback boxes');
    return (
      <>
        {positions.map((pos, index) => (
          <mesh
            key={`fallback-terrain-${index}`}
            position={[pos[0], pos[1], pos[2]]}
            rotation={[0, Math.random() * Math.PI * 2, 0]}
            castShadow
            receiveShadow
          >
            <boxGeometry args={[5 + Math.random() * 10, 3 + Math.random() * 5, 5 + Math.random() * 10]} />
            <meshStandardMaterial color={0x996633} roughness={0.8} />
          </mesh>
        ))}
      </>
    );
  }
  
  return (
    <>
      {positions.map((pos, index) => {
        // Pick a random model from the list
        const randomModelIndex = Math.floor(Math.random() * models.length);
        const modelPath = models[randomModelIndex];
        
        // Randomize scale and rotation
        const modelScale = 0.2 + Math.random() * 0.4;
        const rotation = [0, Math.random() * Math.PI * 2, 0];
        
        return (
          <Model
            key={`terrain-${index}`}
            modelPath={modelPath}
            position={pos}
            rotation={rotation}
            scale={modelScale}
            castShadow={true}
            receiveShadow={true}
          />
        );
      })}
    </>
  );
};

/**
 * Component for creating vegetation using farming crops models
 */
export const VegetationModels = ({ count = 20, radius = 60 }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [loadErrors, setLoadErrors] = useState([]);
  
  const models = [
    '/imported/assets/craftpix-891167-free-farming-crops-3d-low-poly-models/fbx/corn.fbx',
    '/imported/assets/craftpix-891167-free-farming-crops-3d-low-poly-models/fbx/sunflower.fbx',
    '/imported/assets/craftpix-891167-free-farming-crops-3d-low-poly-models/fbx/brokoly.fbx',
    '/imported/assets/craftpix-891167-free-farming-crops-3d-low-poly-models/fbx/cabbage.fbx',
    '/imported/assets/craftpix-891167-free-farming-crops-3d-low-poly-models/fbx/carrot.fbx',
    '/imported/assets/craftpix-891167-free-farming-crops-3d-low-poly-models/fbx/pumpkin.fbx',
  ];
  
  // Alternative paths to try if the normal ones fail
  const alternativeModels = [
    // Try without 'imported' prefix
    '/assets/craftpix-891167-free-farming-crops-3d-low-poly-models/fbx/corn.fbx',
    // Try with 'Fbx' instead of 'fbx'
    '/imported/assets/craftpix-891167-free-farming-crops-3d-low-poly-models/Fbx/corn.fbx',
  ];
  
  // Test loading the first model to verify paths
  useEffect(() => {
    const testLoading = async () => {
      // Clear previous errors
      setLoadErrors([]);
      setIsLoading(true);
      
      // Try to load test models from the main list
      let loadedAny = false;
      
      for (let i = 0; i < models.length; i++) {
        try {
          await loadModel(models[i], { scale: 0.01 });
          loadedAny = true;
          console.log(`[VegetationModels] Successfully loaded test model: ${models[i]}`);
          break;
        } catch (error) {
          console.error(`[VegetationModels] Failed to load test model: ${models[i]}`, error);
          setLoadErrors(prev => [...prev, { path: models[i], error: error.message }]);
        }
      }
      
      // If main models failed, try alternatives
      if (!loadedAny) {
        console.warn('[VegetationModels] Main models failed to load, trying alternatives...');
        for (let i = 0; i < alternativeModels.length; i++) {
          try {
            await loadModel(alternativeModels[i], { scale: 0.01 });
            loadedAny = true;
            console.log(`[VegetationModels] Successfully loaded alternative model: ${alternativeModels[i]}`);
            break;
          } catch (error) {
            console.error(`[VegetationModels] Failed to load alternative model: ${alternativeModels[i]}`, error);
            setLoadErrors(prev => [...prev, { path: alternativeModels[i], error: error.message }]);
          }
        }
      }
      
      setIsLoading(false);
    };
    
    testLoading();
  }, []);
  
  // Generate random positions in a circle around the track
  const positions = useMemo(() => {
    const pos = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const r = 20 + Math.random() * radius;
      pos.push([
        Math.cos(angle) * r,
        0,
        Math.sin(angle) * r
      ]);
    }
    return pos;
  }, [count, radius]);
  
  // If we're still loading, return empty group
  if (isLoading) {
    return <group />;
  }
  
  // If we had errors for all models, use simple boxes instead
  if (loadErrors.length === models.length + alternativeModels.length) {
    console.error('[VegetationModels] All model loading failed, using fallback boxes');
    return (
      <>
        {positions.map((pos, index) => (
          <mesh
            key={`fallback-veg-${index}`}
            position={[pos[0], pos[1] + 1, pos[2]]}
            rotation={[0, Math.random() * Math.PI * 2, 0]}
            castShadow
            receiveShadow
          >
            <capsuleGeometry args={[0.3, 1.5, 4, 8]} />
            <meshStandardMaterial color={0x33cc33} roughness={0.7} />
          </mesh>
        ))}
      </>
    );
  }
  
  return (
    <>
      {positions.map((pos, index) => {
        // Pick a random model from the list
        const randomModelIndex = Math.floor(Math.random() * models.length);
        const modelPath = models[randomModelIndex];
        
        // Randomize scale and rotation
        const modelScale = 0.03 + Math.random() * 0.02;
        const rotation = [0, Math.random() * Math.PI * 2, 0];
        
        return (
          <Model
            key={`veg-${index}`}
            modelPath={modelPath}
            position={pos}
            rotation={rotation}
            scale={modelScale}
            castShadow={true}
            receiveShadow={true}
          />
        );
      })}
    </>
  );
};

export default Model; 