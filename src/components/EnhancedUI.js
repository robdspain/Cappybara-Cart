import React from 'react';
import './EnhancedUI.css';

/**
 * Enhanced UI Button component using the jungle cartoon UI assets
 */
export const Button = ({ onClick, children, type = 'primary', className = '' }) => {
  // Determine which button image to use based on the button type
  const buttonImage = (() => {
    switch (type) {
      case 'play':
        return '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/btn/play.png';
      case 'restart':
        return '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/btn/restart.png';
      case 'close':
        return '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/btn/close.png';
      case 'settings':
        return '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/btn/settings.png';
      case 'menu':
        return '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/btn/menu.png';
      case 'next':
        return '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/btn/next.png';
      case 'prev':
        return '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/btn/prew.png';
      default:
        return '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/btn/01.png';
    }
  })();

  return (
    <button 
      className={`enhanced-button ${className}`} 
      onClick={onClick}
      style={{ backgroundImage: `url(${buttonImage})` }}
    >
      <span className="enhanced-button-text">{children}</span>
    </button>
  );
};

/**
 * Enhanced UI Panel component
 */
export const Panel = ({ children, title, type = 'default', className = '' }) => {
  // Determine which panel background to use
  const panelBg = (() => {
    switch (type) {
      case 'win':
        return '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/you_win/bg.png';
      case 'lose':
        return '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/you_lose/bg.png';
      case 'shop':
        return '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/shop/bg.png';
      case 'pause':
        return '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/pause/bg.png';
      case 'level':
        return '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/level_select/bg.png';
      default:
        return '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/menu/bg.png';
    }
  })();

  // Determine which header to use
  const headerBg = (() => {
    switch (type) {
      case 'win':
        return '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/you_win/header.png';
      case 'lose':
        return '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/you_lose/header.png';
      case 'shop':
        return '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/shop/header.png';
      case 'pause':
        return '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/pause/header.png';
      case 'level':
        return '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/level_select/header.png';
      default:
        return null;
    }
  })();

  return (
    <div className={`enhanced-panel ${className}`} style={{ backgroundImage: `url(${panelBg})` }}>
      {headerBg && (
        <div className="enhanced-panel-header" style={{ backgroundImage: `url(${headerBg})` }}>
          <h2>{title}</h2>
        </div>
      )}
      {!headerBg && title && <h2 className="enhanced-panel-title">{title}</h2>}
      <div className="enhanced-panel-content">
        {children}
      </div>
    </div>
  );
};

/**
 * Star rating component
 */
export const StarRating = ({ rating, maxRating = 3 }) => {
  const stars = [];
  
  // Determine which star images to use
  const fullStar = '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/you_win/star_1.png';
  const emptyStar = '/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/you_win/star_4.png';
  
  for (let i = 1; i <= maxRating; i++) {
    stars.push(
      <img 
        key={i}
        src={i <= rating ? fullStar : emptyStar} 
        alt={i <= rating ? 'Full star' : 'Empty star'} 
        className="star-rating-star"
      />
    );
  }
  
  return <div className="star-rating">{stars}</div>;
};

/**
 * Race countdown component using the new UI style
 */
export const EnhancedCountdown = ({ value }) => {
  const countdownStyle = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    fontSize: '6rem',
    fontWeight: 'bold',
    color: value === 0 ? '#4CAF50' : 'white',
    textShadow: '0 0 10px rgba(0, 0, 0, 0.8)',
    animation: 'countdown-pulse 1s infinite'
  };
  
  return (
    <div className="enhanced-countdown">
      <div className="countdown-background"></div>
      <div style={countdownStyle}>
        {value === 0 ? 'GO!' : value}
      </div>
    </div>
  );
};

/**
 * Main menu component
 */
export const MainMenu = ({ onPlay, onSettings }) => {
  return (
    <Panel className="main-menu-panel">
      <img 
        src="/imported/assets/craftpix-895410-free-jungle-cartoon-2d-game-ui/PNG/menu/logo.png" 
        alt="Cappybara Kart" 
        className="main-menu-logo"
      />
      <div className="main-menu-buttons">
        <Button type="play" onClick={onPlay}>Play</Button>
        <Button type="settings" onClick={onSettings}>Settings</Button>
      </div>
    </Panel>
  );
};

/**
 * Results screen component
 */
export const EnhancedResults = ({ position, time, onRestart, onMainMenu }) => {
  // Determine panel type based on player position
  const panelType = position === 1 ? 'win' : 'lose';
  const title = position === 1 ? 'You Win!' : 'Try Again!';
  
  return (
    <Panel type={panelType} title={title} className="results-panel">
      <div className="results-content">
        <p className="results-position">Position: {position}</p>
        <p className="results-time">Time: {time}</p>
        <StarRating rating={4 - Math.min(position, 3)} />
      </div>
      <div className="results-buttons">
        <Button type="restart" onClick={onRestart}>Restart</Button>
        <Button type="menu" onClick={onMainMenu}>Main Menu</Button>
      </div>
    </Panel>
  );
};

/**
 * Pause menu component
 */
export const PauseMenu = ({ onResume, onRestart, onMainMenu }) => {
  return (
    <Panel type="pause" title="Paused" className="pause-menu-panel">
      <div className="pause-menu-buttons">
        <Button onClick={onResume}>Resume</Button>
        <Button type="restart" onClick={onRestart}>Restart</Button>
        <Button type="menu" onClick={onMainMenu}>Main Menu</Button>
      </div>
    </Panel>
  );
};

export default {
  Button,
  Panel,
  StarRating,
  EnhancedCountdown,
  MainMenu,
  EnhancedResults,
  PauseMenu
}; 