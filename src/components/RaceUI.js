import React, { useState, useEffect } from 'react';

// Race UI overlay with lap counter, timer, position, and other race information
const RaceUI = ({ 
  position = 1, 
  lap = 1, 
  totalLaps = 3, 
  time = 0, 
  players = [] 
}) => {
  const [formattedTime, setFormattedTime] = useState('00:00.000');
  
  // Format race time as MM:SS.mmm
  useEffect(() => {
    const minutes = Math.floor(time / 60).toString().padStart(2, '0');
    const seconds = Math.floor(time % 60).toString().padStart(2, '0');
    const milliseconds = Math.floor((time % 1) * 1000).toString().padStart(3, '0');
    setFormattedTime(`${minutes}:${seconds}.${milliseconds}`);
  }, [time]);
  
  return (
    <div className="race-ui" style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      pointerEvents: 'none',
      zIndex: 100,
      fontFamily: 'Arial, sans-serif',
      textShadow: '2px 2px 4px rgba(0,0,0,0.5)'
    }}>
      {/* Top bar with position, lap counter and timer */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        padding: '20px',
        color: 'white',
        fontSize: '24px',
        fontWeight: 'bold'
      }}>
        <div style={{ 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          padding: '10px 20px',
          borderRadius: '10px'
        }}>
          Position: {position}/{players.length}
        </div>
        
        <div style={{ 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          padding: '10px 20px',
          borderRadius: '10px'
        }}>
          Lap: {lap}/{totalLaps}
        </div>
        
        <div style={{ 
          backgroundColor: 'rgba(0,0,0,0.5)', 
          padding: '10px 20px',
          borderRadius: '10px'
        }}>
          Time: {formattedTime}
        </div>
      </div>
      
      {/* Leaderboard - shown at the side */}
      <div style={{
        position: 'absolute',
        top: '100px',
        right: '20px',
        backgroundColor: 'rgba(0,0,0,0.5)',
        padding: '15px',
        borderRadius: '10px',
        color: 'white',
        minWidth: '200px'
      }}>
        <h3 style={{ margin: '0 0 10px 0', textAlign: 'center' }}>Race Positions</h3>
        <ol style={{ margin: 0, paddingLeft: '25px' }}>
          {players.sort((a, b) => a.position - b.position).map((player, index) => (
            <li key={player.id} style={{
              padding: '5px 0',
              color: player.isPlayer ? '#FFEB3B' : 'white',
              fontWeight: player.isPlayer ? 'bold' : 'normal'
            }}>
              {player.name} {player.isPlayer && '(You)'} - Lap {player.lap}
            </li>
          ))}
        </ol>
      </div>
      
      {/* Item box display (for powerups) */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        right: '30px',
        width: '80px',
        height: '80px',
        backgroundColor: 'rgba(0,0,0,0.5)',
        border: '3px solid white',
        borderRadius: '10px',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        color: 'white',
        fontSize: '12px',
        textAlign: 'center'
      }}>
        No Item
      </div>
      
      {/* Mini map - could be added in a future enhancement */}
      <div style={{
        position: 'absolute',
        bottom: '30px',
        left: '30px',
        width: '150px',
        height: '150px',
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderRadius: '50%',
        border: '3px solid white',
        overflow: 'hidden',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center'
      }}>
        <div style={{
          width: '100px',
          height: '100px',
          borderRadius: '50%',
          border: '2px solid #4CAF50',
          position: 'relative'
        }}>
          {/* Draw player positions on mini map */}
          {players.map(player => (
            <div 
              key={`map-${player.id}`}
              style={{
                position: 'absolute',
                width: '8px',
                height: '8px',
                backgroundColor: player.isPlayer ? '#FFEB3B' : 'white',
                borderRadius: '50%',
                transform: `translate(-50%, -50%)`,
                left: `${50 + 35 * Math.cos(player.angle) * 1.5}px`,
                top: `${50 + 35 * Math.sin(player.angle)}px`,
                border: player.isPlayer ? '1px solid black' : 'none',
                zIndex: player.isPlayer ? 5 : 1
              }}
            />
          ))}
        </div>
      </div>
      
      {/* Countdown at start or when finishing */}
      {/* This will be conditionally rendered based on game state */}
    </div>
  );
};

// Component for the countdown at race start
export const RaceCountdown = ({ count, onComplete }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      if (count > 0) {
        onComplete(count - 1);
      } else {
        onComplete(-1); // Signal race start
      }
    }, 1000);
    
    return () => clearTimeout(timer);
  }, [count, onComplete]);
  
  // No display when count is negative (race already started)
  if (count < 0) return null;
  
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
      color: 'white',
      fontSize: '120px',
      fontWeight: 'bold',
      zIndex: 1000
    }}>
      {count === 0 ? 'GO!' : count}
    </div>
  );
};

// Component for race results screen
export const RaceResults = ({ players = [], playerTime, onRestart }) => {
  return (
    <div style={{
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      display: 'flex',
      flexDirection: 'column',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: 'rgba(0,0,0,0.8)',
      color: 'white',
      zIndex: 1000
    }}>
      <h1 style={{ fontSize: '48px', marginBottom: '20px' }}>Race Results</h1>
      
      <div style={{
        backgroundColor: 'rgba(255,255,255,0.1)',
        padding: '30px',
        borderRadius: '15px',
        minWidth: '60%',
        maxWidth: '600px'
      }}>
        <h2 style={{ textAlign: 'center', marginTop: 0 }}>
          {players.find(p => p.isPlayer)?.position === 1 ? 'You Won!' : 'Race Complete!'}
        </h2>
        
        <div style={{ marginBottom: '30px', textAlign: 'center' }}>
          Your Time: {playerTime}
        </div>
        
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.3)' }}>
              <th style={{ padding: '10px', textAlign: 'left' }}>Pos</th>
              <th style={{ padding: '10px', textAlign: 'left' }}>Racer</th>
              <th style={{ padding: '10px', textAlign: 'right' }}>Time</th>
            </tr>
          </thead>
          <tbody>
            {players.sort((a, b) => a.position - b.position).map((player) => (
              <tr key={player.id} style={{
                backgroundColor: player.isPlayer ? 'rgba(255,235,59,0.2)' : 'transparent',
                borderBottom: '1px solid rgba(255,255,255,0.1)'
              }}>
                <td style={{ padding: '10px' }}>{player.position}</td>
                <td style={{ padding: '10px' }}>{player.name} {player.isPlayer && '(You)'}</td>
                <td style={{ padding: '10px', textAlign: 'right' }}>{player.time}</td>
              </tr>
            ))}
          </tbody>
        </table>
        
        <div style={{ marginTop: '30px', textAlign: 'center' }}>
          <button 
            onClick={onRestart}
            style={{
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              padding: '12px 30px',
              fontSize: '18px',
              borderRadius: '5px',
              cursor: 'pointer',
              transition: 'background-color 0.3s'
            }}
            onMouseOver={e => e.target.style.backgroundColor = '#45a049'}
            onMouseOut={e => e.target.style.backgroundColor = '#4CAF50'}
          >
            Race Again
          </button>
        </div>
      </div>
    </div>
  );
};

export default RaceUI; 