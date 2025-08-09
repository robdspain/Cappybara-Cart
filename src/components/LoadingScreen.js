import React from 'react';

export const LoadingScreen = ({ progress = 0, message = 'Loading...' }) => {
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
      backgroundColor: 'rgba(0, 0, 0, 0.8)',
      color: 'white',
      zIndex: 1000,
    }}>
      <h2 style={{ marginBottom: '20px' }}>Cappybara Kart</h2>
      <div style={{ width: '300px', backgroundColor: '#333', borderRadius: '10px', overflow: 'hidden' }}>
        <div 
          style={{ 
            width: `${progress}%`, 
            height: '20px', 
            backgroundColor: '#4CAF50',
            transition: 'width 0.3s ease-in-out'
          }} 
        />
      </div>
      <p style={{ marginTop: '10px' }}>{message}</p>
    </div>
  );
}; 