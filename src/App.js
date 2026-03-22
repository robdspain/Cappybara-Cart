import React, { useState } from 'react';
import Game3DCanvas from './components/Game3DCanvas';
import StartScreen from './components/StartScreen';
import GameOverScreen from './components/GameOverScreen';
import { ErrorBoundary } from './components/ErrorBoundary';
import './styles.css';

function App() {
  const [gameState, setGameState] = useState('start');
  const [score, setScore] = useState(0);

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

  return (
    <div className="App">
      {gameState === 'start' && (
        <StartScreen onStart={startGame} />
      )}
      <ErrorBoundary>
        {gameState === 'playing' && (
          <Game3DCanvas onGameOver={endGame} />
        )}
      </ErrorBoundary>
      {gameState === 'gameOver' && (
        <GameOverScreen score={score} onRestart={startGame} onBack={backToStart} />
      )}
    </div>
  );
}

export default App;
