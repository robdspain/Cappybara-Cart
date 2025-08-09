import React, { useState } from 'react';
import GameCanvas from './components/GameCanvas';
import Game3DCanvas from './components/Game3DCanvas';
import StartScreen from './components/StartScreen';
import GameOverScreen from './components/GameOverScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import TestScene from './components/TestScene';
import SimpleGame3D from './components/SimpleGame3D';
import './styles.css';

function App() {
  const [gameState, setGameState] = useState('start');
  const [score, setScore] = useState(0);
  const [mode, setMode] = useState('3d'); // '2d', '3d', 'test', or 'simple3d' mode

  const startGame = () => {
    setGameState('playing');
    setScore(0);
  };

  const endGame = (finalScore) => {
    setScore(finalScore);
    setGameState('gameOver');
  };

  const backToStart = () => {
    setGameState('start');
  };

  const toggleMode = () => {
    // Cycle through modes: 2d -> 3d -> simple3d -> test -> 2d
    if (mode === '2d') setMode('3d');
    else if (mode === '3d') setMode('simple3d');
    else if (mode === 'simple3d') setMode('test');
    else setMode('2d');
  };

  // Add a function to get the mode button text
  const getModeButtonText = () => {
    switch (mode) {
      case '2d': return 'Switch to 3D Mode';
      case '3d': return 'Switch to Simple 3D Mode';
      case 'simple3d': return 'Switch to Test Scene';
      case 'test': return 'Switch to 2D Mode';
      default: return 'Switch Mode';
    }
  };

  return (
    <div className="App">
      {/* Add error log div for debugging */}
      <div 
        id="error-log"
        style={{
          position: 'fixed',
          bottom: '10px',
          right: '10px',
          width: '400px',
          maxHeight: '300px',
          overflowY: 'auto',
          background: 'rgba(0,0,0,0.8)',
          color: 'white',
          padding: '10px',
          zIndex: 10000,
          fontSize: '12px',
          display: 'none' // Initially hidden, will be shown when errors occur
        }}
      >
        <h3>Error Log</h3>
      </div>

      {gameState === 'start' && (
        <div>
          <StartScreen onStart={startGame} />
          <button 
            className="mode-toggle"
            onClick={toggleMode}
          >
            {getModeButtonText()}
          </button>
        </div>
      )}
      <ErrorBoundary>
        {gameState === 'playing' && mode === '2d' && (
          <GameCanvas onGameOver={endGame} />
        )}
        {gameState === 'playing' && mode === '3d' && (
          <Game3DCanvas onGameOver={endGame} />
        )}
        {gameState === 'playing' && mode === 'simple3d' && (
          <SimpleGame3D onGameOver={endGame} />
        )}
        {gameState === 'playing' && mode === 'test' && (
          <TestScene />
        )}
      </ErrorBoundary>
      {gameState === 'gameOver' && (
        <GameOverScreen score={score} onRestart={startGame} onBack={backToStart} />
      )}
    </div>
  );
}

export default App; 