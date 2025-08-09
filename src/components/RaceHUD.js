import React from 'react';
import './RaceHUD.css';
import ItemDisplay from './ItemDisplay';

/**
 * RaceHUD - Heads-up display for the racing game
 * Shows race information like:
 * - Current lap
 * - Race timer
 * - Current position
 * - Speedometer
 * - Current item
 */
const RaceHUD = ({ 
  currentLap = 1, 
  totalLaps = 3, 
  raceTime = 0, 
  playerPosition = 1, 
  speed = 0,
  currentItem = null,
  showItemObtainedAnimation = false,
  boostRemaining = 0,
  maxBoost = 3000,
  lapTimes = []
}) => {
  // Format race time (milliseconds to MM:SS.mmm)
  const formatRaceTime = (time) => {
    const totalSeconds = Math.floor(time / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const milliseconds = Math.floor((time % 1000) / 10);
    
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };
  
  // Format player position (1 -> 1st, 2 -> 2nd, etc.)
  const formatPosition = (position) => {
    if (position === 1) return '1st';
    if (position === 2) return '2nd';
    if (position === 3) return '3rd';
    return `${position}th`;
  };
  
  // Calculate speed percentage (0-100)
  const speedPercentage = Math.min(100, Math.max(0, Math.floor((speed / 0.3) * 100)));
  
  // Calculate boost percentage (0-100)
  const boostPercentage = Math.min(100, Math.max(0, (boostRemaining / maxBoost) * 100));
  
  // Get best lap time
  const getBestLapTime = () => {
    if (!lapTimes || lapTimes.length === 0) return '00:00.00';
    return formatRaceTime(Math.min(...lapTimes));
  };
  
  // Get last lap time
  const getLastLapTime = () => {
    if (!lapTimes || lapTimes.length === 0) return '00:00.00';
    return formatRaceTime(lapTimes[lapTimes.length - 1]);
  };
  
  return (
    <div className="race-hud">
      <div className="hud-section hud-top">
        <div className="lap-counter">
          <div className="counter-label">LAP</div>
          <div className="counter-value">{currentLap}/{totalLaps}</div>
        </div>
        
        <div className="race-timer">
          <div className="timer-label">TIME</div>
          <div className="timer-value">{formatRaceTime(raceTime)}</div>
        </div>
        
        <div className="player-position">
          <div className="position-label">POS</div>
          <div className="position-value">{formatPosition(playerPosition)}</div>
        </div>
      </div>
      
      <div className="hud-section hud-center">
        <div className="item-section">
          <ItemDisplay 
            currentItem={currentItem}
            showItemObtainedAnimation={showItemObtainedAnimation}
          />
        </div>
      </div>
      
      <div className="hud-section hud-bottom">
        <div className="speedometer">
          <div className="speed-label">SPEED</div>
          <div className="speed-bar-container">
            <div 
              className="speed-bar" 
              style={{ width: `${speedPercentage}%` }}
            ></div>
          </div>
          <div className="speed-value">{Math.floor(speed * 100)} km/h</div>
        </div>
        
        {boostRemaining > 0 && (
          <div className="boost-meter">
            <div className="boost-label">BOOST</div>
            <div className="boost-bar-container">
              <div 
                className="boost-bar" 
                style={{ width: `${boostPercentage}%` }}
              ></div>
            </div>
          </div>
        )}
        
        <div className="lap-times">
          <div className="lap-times-label">LAPS</div>
          <div className="lap-time-row">
            <span>Best:</span>
            <span>{getBestLapTime()}</span>
          </div>
          <div className="lap-time-row">
            <span>Last:</span>
            <span>{getLastLapTime()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RaceHUD; 