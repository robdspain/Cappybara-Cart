import React from 'react';
import ItemDisplay from './ItemDisplay';

/**
 * RaceHUD - SNES Mario Kart-inspired heads-up display
 * Clean, prominent display of position, lap, coins, and item
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
  lapTimes = [],
  coins = 0
}) => {
  // Format race time
  const formatRaceTime = (time) => {
    const totalSeconds = Math.floor(time / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    const ms = Math.floor((time % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  };

  const formatPosition = (pos) => {
    if (pos === 1) return '1st';
    if (pos === 2) return '2nd';
    if (pos === 3) return '3rd';
    return `${pos}th`;
  };

  const positionColor = playerPosition === 1 ? '#FFD700' : playerPosition === 2 ? '#C0C0C0' : playerPosition === 3 ? '#CD7F32' : '#FFFFFF';

  return (
    <div style={{
      position: 'absolute',
      top: 0, left: 0, width: '100%', height: '100%',
      pointerEvents: 'none',
      zIndex: 10,
      fontFamily: "'Arial Black', 'Impact', sans-serif"
    }}>
      {/* Large position indicator - top right (SNES style) */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '30px',
        color: positionColor,
        fontSize: '72px',
        fontWeight: '900',
        textShadow: '3px 3px 6px rgba(0,0,0,0.8), -1px -1px 0 rgba(0,0,0,0.5)',
        lineHeight: 1
      }}>
        {formatPosition(playerPosition)}
      </div>

      {/* Lap counter - top left */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0,0,0,0.5)',
        padding: '8px 20px',
        borderRadius: '8px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        backdropFilter: 'blur(4px)'
      }}>
        <div style={{ color: '#FFD700', fontSize: '12px', fontWeight: 'bold', letterSpacing: '2px' }}>LAP</div>
        <div style={{ color: '#FFFFFF', fontSize: '32px', fontWeight: '900' }}>
          {currentLap}<span style={{ fontSize: '18px', color: '#AAA' }}>/{totalLaps}</span>
        </div>
      </div>

      {/* Timer - top center */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'rgba(0,0,0,0.5)',
        padding: '8px 24px',
        borderRadius: '8px',
        backdropFilter: 'blur(4px)'
      }}>
        <div style={{ color: '#FFFFFF', fontSize: '24px', fontWeight: 'bold', fontFamily: 'monospace', letterSpacing: '1px' }}>
          {formatRaceTime(raceTime)}
        </div>
      </div>

      {/* Coin counter - top left, below lap */}
      <div style={{
        position: 'absolute',
        top: '90px',
        left: '20px',
        background: 'rgba(0,0,0,0.5)',
        padding: '6px 16px',
        borderRadius: '8px',
        display: 'flex',
        alignItems: 'center',
        gap: '8px',
        backdropFilter: 'blur(4px)'
      }}>
        <div style={{
          width: '18px',
          height: '18px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #FFD700, #FFA000)',
          border: '2px solid #FFE082',
          boxShadow: '0 0 6px rgba(255,215,0,0.5)'
        }} />
        <span style={{ color: '#FFD700', fontSize: '20px', fontWeight: 'bold' }}>
          {coins}
        </span>
      </div>

      {/* Item display - center top area */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '140px',
        width: '70px',
        height: '70px',
        background: 'rgba(0,0,0,0.6)',
        borderRadius: '10px',
        border: '2px solid rgba(255,255,255,0.2)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backdropFilter: 'blur(4px)'
      }}>
        <ItemDisplay
          currentItem={currentItem}
          showItemObtainedAnimation={showItemObtainedAnimation}
        />
      </div>

      {/* Speed bar - bottom center */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        display: 'flex',
        alignItems: 'center',
        gap: '12px',
        background: 'rgba(0,0,0,0.4)',
        padding: '8px 20px',
        borderRadius: '20px',
        backdropFilter: 'blur(4px)'
      }}>
        <span style={{ color: '#AAA', fontSize: '12px', fontWeight: 'bold' }}>SPD</span>
        <div style={{
          width: '200px',
          height: '8px',
          background: 'rgba(255,255,255,0.15)',
          borderRadius: '4px',
          overflow: 'hidden'
        }}>
          <div style={{
            width: `${Math.min(100, Math.max(0, (speed / 35) * 100))}%`,
            height: '100%',
            background: speed > 25 ? 'linear-gradient(90deg, #4CAF50, #FF9800, #F44336)' :
                       speed > 15 ? 'linear-gradient(90deg, #4CAF50, #FF9800)' :
                       '#4CAF50',
            borderRadius: '4px',
            transition: 'width 0.1s ease-out'
          }} />
        </div>
        <span style={{ color: '#FFF', fontSize: '14px', fontWeight: 'bold', minWidth: '50px' }}>
          {Math.floor(speed * 10)} km/h
        </span>
      </div>

      {/* Boost indicator */}
      {boostRemaining > 0 && (
        <div style={{
          position: 'absolute',
          bottom: '55px',
          left: '50%',
          transform: 'translateX(-50%)',
          color: '#FF9800',
          fontSize: '16px',
          fontWeight: 'bold',
          textShadow: '0 0 10px rgba(255,152,0,0.8)',
          animation: 'pulse 0.3s ease-in-out infinite alternate'
        }}>
          BOOST!
        </div>
      )}
    </div>
  );
};

export default RaceHUD;
