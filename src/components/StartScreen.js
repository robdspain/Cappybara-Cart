import React from 'react';

const StartScreen = ({ onStart }) => {
  return (
    <div className="start-screen">
      <h1>Capybara Kart</h1>
      <p>Race your capybara around the track!</p>
      <div className="instructions">
        <h3>How to Play:</h3>
        <ul>
          <li>Use arrow keys to drive</li>
          <li>↑ Accelerate, ↓ Brake/Reverse</li>
          <li>← Turn Left, → Turn Right</li>
          <li>Avoid obstacles and track boundaries</li>
          <li>The game ends after 60 seconds</li>
        </ul>
        <h3>3D Mode Features:</h3>
        <ul>
          <li>Immersive 3D environment with sky and stars</li>
          <li>Realistic physics with acceleration and drift</li>
          <li>Particle effects for engine exhaust</li>
          <li>Advanced lighting and shadows</li>
          <li>Detailed capybara model with animations</li>
        </ul>
      </div>
      <button className="start-button" onClick={onStart}>
        Start Racing!
      </button>
    </div>
  );
};

export default StartScreen; 