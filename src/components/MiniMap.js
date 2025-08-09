import React, { useRef, useEffect, useState } from 'react';
import { getMinimapData } from './RaceTrack';

// MiniMap component for displaying track and player positions
const MiniMap = ({ players = [], trackRef, position = 'top-right' }) => {
  const canvasRef = useRef(null);
  const minimapSize = 150; // Size of the minimap in pixels
  const pixelRatio = window.devicePixelRatio || 1;
  const [error, setError] = useState(null);

  // Draw the minimap
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size with correct pixel ratio for sharp rendering
    canvas.width = minimapSize * pixelRatio;
    canvas.height = minimapSize * pixelRatio;
    canvas.style.width = `${minimapSize}px`;
    canvas.style.height = `${minimapSize}px`;
    ctx.scale(pixelRatio, pixelRatio);

    try {
      // Get minimap data from track
      let minimapData = null;
      if (trackRef && trackRef.current) {
        minimapData = getMinimapData(trackRef);
      }

      // Clear the canvas
      ctx.clearRect(0, 0, minimapSize, minimapSize);

      // Draw track background (green)
      ctx.fillStyle = '#388E3C';
      ctx.fillRect(0, 0, minimapSize, minimapSize);

      // Draw track (gray)
      const trackOuterRadius = minimapSize * 0.4;
      const trackInnerRadius = minimapSize * 0.2;
      
      ctx.save();
      ctx.translate(minimapSize / 2, minimapSize / 2);
      
      // Draw oval track
      ctx.save();
      ctx.scale(1.5, 1); // Make it oval
      
      // Outer track
      ctx.beginPath();
      ctx.arc(0, 0, trackOuterRadius / 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#555555';
      ctx.fill();
      
      // Inner cutout
      ctx.beginPath();
      ctx.arc(0, 0, trackInnerRadius / 1.5, 0, Math.PI * 2);
      ctx.fillStyle = '#388E3C';
      ctx.fill();
      ctx.restore();
      
      // Draw checkpoints
      const checkpoints = [
        { x: 0, z: trackOuterRadius * 0.65, angle: 0 },
        { x: trackOuterRadius * 0.65 * 1.5, z: 0, angle: Math.PI / 2 },
        { x: 0, z: -trackOuterRadius * 0.65, angle: Math.PI },
        { x: -trackOuterRadius * 0.65 * 1.5, z: 0, angle: Math.PI * 3 / 2 }
      ];
      
      checkpoints.forEach((checkpoint, index) => {
        ctx.fillStyle = index === 0 ? '#FF0000' : '#2196F3';
        ctx.beginPath();
        ctx.arc(checkpoint.x, checkpoint.z, 3, 0, Math.PI * 2);
        ctx.fill();
      });
      
      // Draw start/finish line
      ctx.save();
      ctx.translate(0, trackOuterRadius * 0.65);
      ctx.rotate(Math.PI / 2);
      
      ctx.fillStyle = '#FFFFFF';
      ctx.fillRect(-10, -2, 20, 4);
      
      // Checkered pattern
      ctx.fillStyle = '#000000';
      for (let i = -10; i < 10; i += 4) {
        ctx.fillRect(i, -2, 2, 2);
        ctx.fillRect(i + 2, 0, 2, 2);
      }
      ctx.restore();
      
      // Draw players
      if (players && players.length > 0) {
        players.forEach((player, index) => {
          if (!player || !player.position) return;
          
          // Scale world coordinates to minimap
          const x = player.position[0] * (trackOuterRadius / 20) * 0.8;
          const z = player.position[2] * (trackOuterRadius / 20) * 0.8;
          
          // Player color - player 1 is red, others are different colors
          const colors = ['#FF0000', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF', '#FF8800', '#88FF00'];
          const color = index === 0 ? colors[0] : colors[(index % (colors.length - 1)) + 1];
          
          // Draw player marker
          ctx.save();
          ctx.translate(x, z);
          
          // Rotate marker to match player direction
          if (player.rotation) {
            ctx.rotate(-player.rotation[1]);
          }
          
          // Draw triangle for player
          ctx.beginPath();
          ctx.moveTo(0, -5);
          ctx.lineTo(-3, 3);
          ctx.lineTo(3, 3);
          ctx.closePath();
          
          ctx.fillStyle = color;
          ctx.fill();
          
          ctx.strokeStyle = '#FFFFFF';
          ctx.lineWidth = 1;
          ctx.stroke();
          
          ctx.restore();
          
          // Draw player number
          ctx.fillStyle = '#FFFFFF';
          ctx.font = '8px Arial';
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(`${index + 1}`, x, z);
        });
      }
      
      ctx.restore();
      
      // Draw border
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.strokeRect(0, 0, minimapSize, minimapSize);
      
      // Reset error if successful
      if (error) setError(null);
    } catch (err) {
      console.error('Error rendering minimap:', err);
      setError(err);
    }
  }, [players, trackRef, pixelRatio, error]);

  // Position styles
  const getPositionStyle = () => {
    switch (position) {
      case 'top-left':
        return { top: '10px', left: '10px' };
      case 'top-right':
        return { top: '10px', right: '10px' };
      case 'bottom-left':
        return { bottom: '10px', left: '10px' };
      case 'bottom-right':
        return { bottom: '10px', right: '10px' };
      default:
        return { top: '10px', right: '10px' };
    }
  };

  return (
    <div className="minimap-container" style={{
      position: 'absolute',
      zIndex: 100,
      backgroundColor: 'rgba(0, 0, 0, 0.5)',
      padding: '5px',
      borderRadius: '5px',
      ...getPositionStyle()
    }}>
      <canvas
        ref={canvasRef}
        style={{
          display: 'block',
          width: `${minimapSize}px`,
          height: `${minimapSize}px`
        }}
      />
      {error && (
        <div style={{ 
          position: 'absolute', 
          top: 0, 
          left: 0, 
          right: 0, 
          bottom: 0, 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          background: 'rgba(0,0,0,0.7)',
          color: 'red',
          fontSize: '10px',
          textAlign: 'center'
        }}>
          MiniMap Error
        </div>
      )}
    </div>
  );
};

export default MiniMap; 