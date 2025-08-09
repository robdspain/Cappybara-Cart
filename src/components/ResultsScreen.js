import React, { useState, useEffect } from 'react';
import './ResultsScreen.css';

/**
 * ResultsScreen - Displays race results at the end of a race
 * Features:
 * - Shows player position
 * - Shows race time
 * - Shows lap times
 * - Provides restart and menu buttons
 * - Uses jungle UI assets for styling
 */
const ResultsScreen = ({ 
  raceResults = [], 
  playerPosition = 1, 
  raceTime = 0, 
  lapTimes = [],
  onRestart = () => {},
  onMainMenu = () => {}
}) => {
  const [visible, setVisible] = useState(false);
  const [showStars, setShowStars] = useState(false);
  
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
  
  // Calculate star rating based on position and time
  const getStarRating = () => {
    if (playerPosition === 1) return 3;
    if (playerPosition === 2) return 2;
    if (playerPosition === 3) return 1;
    return 0;
  };
  
  // Render star rating
  const renderStars = (rating) => {
    const stars = [];
    
    for (let i = 0; i < 3; i++) {
      stars.push(
        <div 
          key={i} 
          className={`star ${i < rating ? 'filled' : 'empty'}`}
        >
          <img 
            src={i < rating 
              ? '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/rating/star_full.png' 
              : '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/rating/star_empty.png'
            } 
            alt={i < rating ? 'Filled star' : 'Empty star'}
          />
        </div>
      );
    }
    
    return stars;
  };
  
  // Animate in the results screen
  useEffect(() => {
    // Show the screen with a slight delay
    const timer1 = setTimeout(() => {
      setVisible(true);
    }, 500);
    
    // Show stars with a delay for animation
    const timer2 = setTimeout(() => {
      setShowStars(true);
    }, 1500);
    
    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
    };
  }, []);
  
  // Get the appropriate background based on position
  const getBackgroundImage = () => {
    if (playerPosition === 1) {
      return '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/you_win/bg.png';
    }
    return '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/you_lose/bg.png';
  };
  
  // Get the appropriate header text based on position
  const getHeaderText = () => {
    if (playerPosition === 1) {
      return 'Victory!';
    } else if (playerPosition === 2 || playerPosition === 3) {
      return 'Not Bad!';
    }
    return 'Try Again!';
  };
  
  return (
    <div className={`results-screen ${visible ? 'visible' : ''}`}>
      <div 
        className="results-panel"
        style={{ backgroundImage: `url(${getBackgroundImage()})` }}
      >
        <div className="results-header">
          <h2>{getHeaderText()}</h2>
          <div className="position-display">
            <span>You finished </span>
            <span className={`position position-${playerPosition}`}>
              {formatPosition(playerPosition)}
            </span>
          </div>
        </div>
        
        <div className="results-content">
          <div className="race-stats">
            <div className="stat-row">
              <span className="stat-label">Race Time:</span>
              <span className="stat-value">{formatRaceTime(raceTime)}</span>
            </div>
            
            <div className="stat-row">
              <span className="stat-label">Best Lap:</span>
              <span className="stat-value">
                {lapTimes.length > 0 
                  ? formatRaceTime(Math.min(...lapTimes)) 
                  : '00:00.00'
                }
              </span>
            </div>
          </div>
          
          <div className={`star-rating ${showStars ? 'animate' : ''}`}>
            {renderStars(getStarRating())}
          </div>
          
          <div className="results-table">
            <h3>Race Results</h3>
            <table>
              <thead>
                <tr>
                  <th>Pos</th>
                  <th>Racer</th>
                  <th>Time</th>
                </tr>
              </thead>
              <tbody>
                {raceResults.map((result, index) => (
                  <tr 
                    key={index}
                    className={result.isPlayer ? 'player-row' : ''}
                  >
                    <td>{formatPosition(result.position)}</td>
                    <td>{result.name}</td>
                    <td>{formatRaceTime(result.time)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        
        <div className="results-buttons">
          <button 
            className="restart-button"
            onClick={onRestart}
            style={{ 
              backgroundImage: `url('/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/btn/restart.png')` 
            }}
          >
            <span>Restart</span>
          </button>
          
          <button 
            className="menu-button"
            onClick={onMainMenu}
            style={{ 
              backgroundImage: `url('/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/btn/menu.png')` 
            }}
          >
            <span>Main Menu</span>
          </button>
        </div>
      </div>
    </div>
  );
};

export default ResultsScreen; 