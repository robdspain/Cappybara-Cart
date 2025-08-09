import React from 'react';

const GameOverScreen = ({ score, onRestart, onBack }) => {
  return (
    <div className="screen">
      <h1 className="game-over">Game Over!</h1>
      <div className="final-score">Final Score: {score}</div>
      <div>
        <button onClick={onRestart}>Race Again</button>
        <button onClick={onBack}>Back to Start</button>
      </div>
    </div>
  );
};

export default GameOverScreen; 