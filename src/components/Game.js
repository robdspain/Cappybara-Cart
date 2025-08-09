import React, { useState, useEffect, useRef } from 'react';
import { Canvas } from '@react-three/fiber';
import { Stats, Sky, Environment, PerspectiveCamera } from '@react-three/drei';
import Track from './Track';
import PlayerRacer from './PlayerRacer';
import AIRacer from './AIRacer';
import UI from './UI';

// Define racer attributes
const racers = [
  { name: 'Player', type: 'player', color: '#FF0000', startPosition: [0, 0.5, -15] },
  { name: 'Luigi', type: 'ai', color: '#00FF00', startPosition: [2, 0.5, -15] },
  { name: 'Toad', type: 'ai', color: '#FFFFFF', startPosition: [-2, 0.5, -15] },
  { name: 'Bowser', type: 'ai', color: '#FFD700', startPosition: [4, 0.5, -15] }
];

export default function Game() {
  const [gameState, setGameState] = useState({
    raceStarted: false,
    countdown: 3,
    raceFinished: false,
    winner: null,
    racerPositions: {}
  });
  
  const [playerState, setPlayerState] = useState({
    lap: 0,
    position: 1,
    finishTime: null,
    currentItem: null,
    checkpoints: new Set()
  });
  
  const [aiStates, setAiStates] = useState({});
  const countdownRef = useRef(null);
  
  // Initialize AI states
  useEffect(() => {
    const initialAiStates = {};
    racers.filter(racer => racer.type === 'ai').forEach(racer => {
      initialAiStates[racer.name] = {
        lap: 0,
        position: 1,
        finishTime: null,
        currentItem: null,
        checkpoints: new Set()
      };
    });
    setAiStates(initialAiStates);
  }, []);
  
  // Countdown to race start
  useEffect(() => {
    if (gameState.countdown > 0 && !gameState.raceStarted) {
      countdownRef.current = setTimeout(() => {
        setGameState(prev => ({
          ...prev,
          countdown: prev.countdown - 1
        }));
      }, 1000);
    } else if (gameState.countdown === 0 && !gameState.raceStarted) {
      setGameState(prev => ({
        ...prev,
        raceStarted: true
      }));
    }
    
    return () => {
      if (countdownRef.current) {
        clearTimeout(countdownRef.current);
      }
    };
  }, [gameState.countdown, gameState.raceStarted]);
  
  // Handle checkpoint and lap logic
  const handleCheckpoint = (racerId, checkpointId, segmentIndex) => {
    if (racerId === 'Player') {
      setPlayerState(prev => {
        const newCheckpoints = new Set(prev.checkpoints);
        newCheckpoints.add(segmentIndex);
        
        // Check if all checkpoints for this lap are collected
        const allCheckpointsCollected = Array.from({ length: 4 }).every((_, i) => 
          newCheckpoints.has(i)
        );
        
        return {
          ...prev,
          checkpoints: newCheckpoints
        };
      });
    } else {
      // Handle AI checkpoints
      setAiStates(prev => {
        const aiState = prev[racerId] || { lap: 0, checkpoints: new Set() };
        const newCheckpoints = new Set(aiState.checkpoints);
        newCheckpoints.add(segmentIndex);
        
        return {
          ...prev,
          [racerId]: {
            ...aiState,
            checkpoints: newCheckpoints
          }
        };
      });
    }
    
    // Update race positions based on lap and checkpoint progress
    updatePositions();
  };
  
  // Handle finish line
  const handleFinishLine = (racerId) => {
    if (racerId === 'Player') {
      setPlayerState(prev => {
        // Only increment lap if all checkpoints are collected
        const allCheckpointsCollected = Array.from({ length: 4 }).every((_, i) => 
          prev.checkpoints.has(i)
        );
        
        if (allCheckpointsCollected) {
          const newLap = prev.lap + 1;
          
          // Check for race completion (3 laps)
          if (newLap >= 3 && !gameState.raceFinished) {
            setGameState(prev => ({
              ...prev,
              raceFinished: true,
              winner: 'Player'
            }));
          }
          
          return {
            ...prev,
            lap: newLap,
            checkpoints: new Set() // Reset checkpoints for new lap
          };
        }
        
        return prev;
      });
    } else {
      // Handle AI lap increments
      setAiStates(prev => {
        const aiState = prev[racerId] || { lap: 0, checkpoints: new Set() };
        
        // Only increment lap if all checkpoints are collected
        const allCheckpointsCollected = Array.from({ length: 4 }).every((_, i) => 
          aiState.checkpoints.has(i)
        );
        
        if (allCheckpointsCollected) {
          const newLap = aiState.lap + 1;
          
          // Check for race completion (3 laps)
          if (newLap >= 3 && !gameState.raceFinished) {
            setGameState(prev => ({
              ...prev,
              raceFinished: true,
              winner: racerId
            }));
          }
          
          return {
            ...prev,
            [racerId]: {
              ...aiState,
              lap: newLap,
              checkpoints: new Set() // Reset checkpoints for new lap
            }
          };
        }
        
        return prev;
      });
    }
    
    // Update race positions based on lap progress
    updatePositions();
  };
  
  // Update racer positions based on progress
  const updatePositions = () => {
    const positions = [
      { id: 'Player', lap: playerState.lap, checkpoints: playerState.checkpoints.size },
      ...Object.entries(aiStates).map(([name, state]) => ({
        id: name,
        lap: state.lap,
        checkpoints: state.checkpoints.size
      }))
    ];
    
    // Sort by lap and checkpoint progress
    positions.sort((a, b) => {
      if (a.lap !== b.lap) {
        return b.lap - a.lap; // Higher lap first
      }
      return b.checkpoints - a.checkpoints; // More checkpoints first
    });
    
    // Assign positions
    const positionMap = {};
    positions.forEach((racer, index) => {
      positionMap[racer.id] = index + 1;
    });
    
    // Update position in player state
    setPlayerState(prev => ({
      ...prev,
      position: positionMap['Player']
    }));
    
    // Update AI positions
    setAiStates(prev => {
      const newStates = { ...prev };
      Object.keys(newStates).forEach(name => {
        newStates[name] = {
          ...newStates[name],
          position: positionMap[name]
        };
      });
      return newStates;
    });
    
    // Update global race positions
    setGameState(prev => ({
      ...prev,
      racerPositions: positionMap
    }));
  };
  
  // Handle item collection for player
  const handleItemCollect = (itemType) => {
    setPlayerState(prev => ({
      ...prev,
      currentItem: itemType
    }));
  };
  
  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas shadows>
        <color attach="background" args={['#87CEEB']} />
        <fog attach="fog" args={['#87CEEB', 30, 100]} />
        <ambientLight intensity={0.5} />
        <directionalLight 
          position={[10, 10, 5]} 
          intensity={1}
          castShadow
          shadow-mapSize-width={2048}
          shadow-mapSize-height={2048}
        />
        
        <PerspectiveCamera makeDefault position={[0, 10, 20]} fov={75} />
        
        <Sky 
          distance={450000} 
          sunPosition={[0, 1, 0]} 
          inclination={0.5} 
          azimuth={0.25} 
        />
        
        <Track 
          onCheckpoint={handleCheckpoint}
          onFinishLine={handleFinishLine}
        />
        
        {/* Player kart */}
        <PlayerRacer 
          key="player"
          startPosition={racers[0].startPosition}
          color={racers[0].color}
          isRacing={gameState.raceStarted}
          lap={playerState.lap}
          position={playerState.position}
          onItemCollect={handleItemCollect}
          debug={true}
        />
        
        {/* AI racers */}
        {racers.filter(racer => racer.type === 'ai').map(racer => (
          <AIRacer
            key={racer.name}
            name={racer.name}
            startPosition={racer.startPosition}
            color={racer.color}
            isRacing={gameState.raceStarted}
            lap={aiStates[racer.name]?.lap || 0}
            position={aiStates[racer.name]?.position || 1}
          />
        ))}
        
        <Stats />
      </Canvas>
      
      {/* UI overlay */}
      <UI 
        countdown={gameState.countdown}
        raceStarted={gameState.raceStarted}
        raceFinished={gameState.raceFinished}
        winner={gameState.winner}
        playerLap={playerState.lap}
        playerPosition={playerState.position}
        currentItem={playerState.currentItem}
        totalRacers={racers.length}
      />
    </div>
  );
} 