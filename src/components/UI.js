import React from 'react';
import { ITEMS } from './ItemSystem';

// Position names
const POSITION_NAMES = {
  1: '1st',
  2: '2nd',
  3: '3rd',
  4: '4th',
  5: '5th',
  6: '6th',
  7: '7th',
  8: '8th'
};

// UI Component for the game
export default function UI({ 
  countdown, 
  raceStarted, 
  raceFinished, 
  winner,
  playerLap, 
  playerPosition,
  currentItem,
  totalRacers
}) {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      fontFamily: 'Arial, sans-serif'
    }}>
      {/* Countdown */}
      {!raceStarted && countdown > 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '8rem',
          fontWeight: 'bold',
          color: countdown === 3 ? 'red' : countdown === 2 ? 'yellow' : 'green',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)'
        }}>
          {countdown}
        </div>
      )}
      
      {/* GO! message */}
      {raceStarted && countdown === 0 && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: '8rem',
          fontWeight: 'bold',
          color: 'green',
          textShadow: '2px 2px 4px rgba(0, 0, 0, 0.5)',
          animation: 'fade-out 1s forwards'
        }}>
          GO!
          <style>
            {`
              @keyframes fade-out {
                0% { opacity: 1; }
                100% { opacity: 0; }
              }
            `}
          </style>
        </div>
      )}
      
      {/* Race info panel */}
      <div style={{
        position: 'absolute',
        top: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '10px',
        display: 'flex',
        flexDirection: 'column',
        gap: '5px'
      }}>
        {/* Lap counter */}
        <div style={{
          fontSize: '1.2rem',
          fontWeight: 'bold'
        }}>
          LAP: {playerLap + 1}/3
        </div>
        
        {/* Position */}
        <div style={{
          fontSize: '1.2rem',
          fontWeight: 'bold'
        }}>
          POS: {POSITION_NAMES[playerPosition] || playerPosition}/{totalRacers}
        </div>
      </div>
      
      {/* Item display */}
      <div style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px',
        borderRadius: '50%',
        width: '60px',
        height: '60px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        {currentItem ? renderItemIcon(currentItem) : null}
      </div>
      
      {/* Race finish message */}
      {raceFinished && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          background: 'rgba(0, 0, 0, 0.8)',
          color: 'white',
          padding: '30px',
          borderRadius: '20px',
          textAlign: 'center'
        }}>
          <h1 style={{ marginTop: 0 }}>RACE FINISHED!</h1>
          <h2>{winner === 'Player' ? 'You Win!' : `${winner} Wins!`}</h2>
          <p>Press 'R' to restart</p>
        </div>
      )}
      
      {/* Controls help */}
      <div style={{
        position: 'absolute',
        bottom: '20px',
        left: '20px',
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '10px',
        fontSize: '0.9rem'
      }}>
        <div>Arrow Keys: Drive</div>
        <div>Shift: Drift</div>
        <div>Space: Use Item</div>
      </div>
    </div>
  );
}

// Helper function to render item icons
function renderItemIcon(itemType) {
  let emoji = '';
  let label = '';
  
  switch (itemType) {
    case ITEMS.MUSHROOM:
      emoji = '🍄';
      label = 'Mushroom';
      break;
    case ITEMS.TRIPLE_MUSHROOM:
      emoji = '🍄🍄🍄';
      label = 'Triple';
      break;
    case ITEMS.RED_SHELL:
      emoji = '🔴';
      label = 'Red Shell';
      break;
    case ITEMS.GREEN_SHELL:
      emoji = '🟢';
      label = 'Green Shell';
      break;
    case ITEMS.BANANA:
      emoji = '🍌';
      label = 'Banana';
      break;
    case ITEMS.TRIPLE_BANANA:
      emoji = '🍌🍌🍌';
      label = 'Triple';
      break;
    case ITEMS.STAR:
      emoji = '⭐';
      label = 'Star';
      break;
    case ITEMS.LIGHTNING:
      emoji = '⚡';
      label = 'Lightning';
      break;
    default:
      emoji = '❓';
      label = 'Unknown';
  }
  
  return (
    <div style={{ textAlign: 'center' }}>
      <div style={{ fontSize: '1.8rem' }}>{emoji}</div>
      <div style={{ fontSize: '0.7rem' }}>{label}</div>
    </div>
  );
} 