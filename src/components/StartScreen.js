import React from 'react';

const StartScreen = ({ onStart }) => {
  return (
    <div className="start-screen">
      <h1>Capybara Kart</h1>
      <p>Race your capybara to victory!</p>
      <div className="instructions">
        <h3>Controls</h3>
        <ul>
          <li><strong>W / Arrow Up</strong> - Accelerate</li>
          <li><strong>S / Arrow Down</strong> - Brake / Reverse</li>
          <li><strong>A/D / Arrow Left/Right</strong> - Steer</li>
          <li><strong>Space</strong> - Drift (hold while turning)</li>
          <li><strong>Z</strong> - Use Item</li>
        </ul>
        <h3>Tips</h3>
        <ul>
          <li>Drift through turns to charge a speed boost</li>
          <li>Collect item boxes for power-ups</li>
          <li>Stay on the track for maximum speed</li>
          <li>Complete 3 laps to finish the race</li>
        </ul>
      </div>
      <button className="start-button" onClick={onStart}>
        Start Racing!
      </button>
    </div>
  );
};

export default StartScreen;
