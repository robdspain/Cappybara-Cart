import React, { useState, useEffect } from 'react';
import '../styles/KartCustomize.css';

// Define kart part data
const KART_BODIES = [
  {
    id: 'standard',
    name: 'Standard',
    image: '/karts/standard.png',
    stats: { speed: 3, acceleration: 3, handling: 3, weight: 3 }
  },
  {
    id: 'sport',
    name: 'Sport',
    image: '/karts/sport.png',
    stats: { speed: 4, acceleration: 2, handling: 3, weight: 3 }
  },
  {
    id: 'classic',
    name: 'Classic',
    image: '/karts/classic.png',
    stats: { speed: 2, acceleration: 4, handling: 4, weight: 2 }
  },
  {
    id: 'heavy',
    name: 'Heavy Duty',
    image: '/karts/heavy.png',
    stats: { speed: 3, acceleration: 1, handling: 2, weight: 5 }
  }
];

const KART_WHEELS = [
  {
    id: 'standard',
    name: 'Standard',
    image: '/wheels/standard.png',
    stats: { speed: 3, acceleration: 3, handling: 3, traction: 3 }
  },
  {
    id: 'slick',
    name: 'Slick',
    image: '/wheels/slick.png',
    stats: { speed: 5, acceleration: 3, handling: 2, traction: 1 }
  },
  {
    id: 'offroad',
    name: 'Off-Road',
    image: '/wheels/offroad.png',
    stats: { speed: 2, acceleration: 2, handling: 3, traction: 5 }
  },
  {
    id: 'roller',
    name: 'Roller',
    image: '/wheels/roller.png',
    stats: { speed: 1, acceleration: 5, handling: 5, traction: 3 }
  }
];

const KART_GLIDERS = [
  {
    id: 'standard',
    name: 'Standard',
    image: '/gliders/standard.png',
    stats: { airTime: 3, airControl: 3 }
  },
  {
    id: 'parafoil',
    name: 'Parafoil',
    image: '/gliders/parafoil.png',
    stats: { airTime: 4, airControl: 2 }
  },
  {
    id: 'flower',
    name: 'Flower',
    image: '/gliders/flower.png',
    stats: { airTime: 2, airControl: 4 }
  }
];

// Stat bar component
const StatBar = ({ label, value, max = 5, color = '#4CAF50' }) => {
  return (
    <div className="kart-stat-bar">
      <span className="kart-stat-label">{label}</span>
      <div className="kart-stat-bar-container">
        {[...Array(max)].map((_, i) => (
          <div 
            key={i} 
            className={`kart-stat-bar-segment ${i < value ? 'filled' : 'empty'}`}
            style={i < value ? {background: `linear-gradient(to right, ${color}, ${adjustColor(color, 20)})`} : {}}
          />
        ))}
      </div>
    </div>
  );
};

// Helper function to adjust color brightness
function adjustColor(color, amount) {
  return '#' + color.replace(/^#/, '').replace(/../g, color => ('0'+Math.min(255, Math.max(0, parseInt(color, 16) + amount)).toString(16)).substr(-2));
}

// Part selection component
const PartSelector = ({ parts, activePart, onSelect, title, colorClass }) => {
  return (
    <div className="part-selector">
      <h3 className={colorClass}>{title}</h3>
      <div className="parts-grid">
        {parts.map(part => (
          <div 
            key={part.id}
            className={`part-card ${activePart?.id === part.id ? 'selected' : ''}`} 
            onClick={() => onSelect(part)}
          >
            <div className={`part-image ${colorClass}-bg`}>
              {/* Fallback if image fails to load */}
              <div 
                style={{ 
                  backgroundColor: `hsl(${part.id.charCodeAt(0) * 20}, 70%, 60%)`,
                  width: '100%',
                  height: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '16px',
                  color: 'white',
                  fontWeight: 'bold'
                }}
              >
                {part.name.charAt(0)}
              </div>
            </div>
            <span className="part-name">{part.name}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

// Kart preview component
const KartPreview = ({ body, wheels, glider }) => {
  return (
    <div className="kart-preview">
      <h3>Your Kart</h3>
      <div className="kart-preview-image">
        {/* In a real implementation, we would combine the parts visually */}
        <div className="kart-combined" style={{
          backgroundColor: '#2196F3',
          width: '100%',
          height: '100%',
          borderRadius: '10px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          fontWeight: 'bold',
          fontSize: '18px'
        }}>
          {body.name} Kart
        </div>
        
        <div className="kart-parts-list">
          <div className="kart-part">Body: <span>{body.name}</span></div>
          <div className="kart-part">Wheels: <span>{wheels.name}</span></div>
          <div className="kart-part">Glider: <span>{glider.name}</span></div>
        </div>
      </div>
    </div>
  );
};

// Stats summary component
const StatsSummary = ({ body, wheels, glider }) => {
  // Calculate combined stats
  const [combinedStats, setCombinedStats] = useState({
    speed: 0,
    acceleration: 0,
    handling: 0,
    weight: 0,
    traction: 0,
    airTime: 0,
    airControl: 0
  });
  
  useEffect(() => {
    // Simple stat calculation formula (can be refined)
    const combined = {
      speed: Math.min(5, Math.round((body.stats.speed * 0.6 + wheels.stats.speed * 0.4))),
      acceleration: Math.min(5, Math.round((body.stats.acceleration * 0.5 + wheels.stats.acceleration * 0.5))),
      handling: Math.min(5, Math.round((body.stats.handling * 0.4 + wheels.stats.handling * 0.6))),
      weight: body.stats.weight,
      traction: wheels.stats.traction,
      airTime: glider.stats.airTime,
      airControl: glider.stats.airControl
    };
    
    setCombinedStats(combined);
  }, [body, wheels, glider]);
  
  return (
    <div className="stats-summary">
      <h3>Kart Stats</h3>
      <div className="stats-grid">
        <StatBar label="Speed" value={combinedStats.speed} color="#FF5722" />
        <StatBar label="Acceleration" value={combinedStats.acceleration} color="#4CAF50" />
        <StatBar label="Handling" value={combinedStats.handling} color="#2196F3" />
        <StatBar label="Weight" value={combinedStats.weight} color="#9C27B0" />
        <StatBar label="Traction" value={combinedStats.traction} color="#FFC107" />
        <StatBar label="Air Time" value={combinedStats.airTime} color="#00BCD4" />
        <StatBar label="Air Control" value={combinedStats.airControl} color="#3F51B5" />
      </div>
    </div>
  );
};

// Main kart customization component
const KartCustomize = ({ initialBody, initialWheels, initialGlider, onSelect, onConfirm }) => {
  const [selectedBody, setSelectedBody] = useState(initialBody || KART_BODIES[0]);
  const [selectedWheels, setSelectedWheels] = useState(initialWheels || KART_WHEELS[0]);
  const [selectedGlider, setSelectedGlider] = useState(initialGlider || KART_GLIDERS[0]);
  
  // Report selection to parent
  useEffect(() => {
    if (onSelect) {
      onSelect({
        body: selectedBody,
        wheels: selectedWheels,
        glider: selectedGlider
      });
    }
  }, [selectedBody, selectedWheels, selectedGlider, onSelect]);
  
  const handleConfirm = () => {
    if (onConfirm) {
      onConfirm({
        body: selectedBody,
        wheels: selectedWheels,
        glider: selectedGlider
      });
    }
  };
  
  return (
    <div className="kart-customize-screen">
      <h1>Customize Your Kart</h1>
      
      <div className="kart-customize-container">
        <div className="kart-parts-container">
          <PartSelector 
            parts={KART_BODIES} 
            activePart={selectedBody} 
            onSelect={setSelectedBody} 
            title="Kart Body" 
            colorClass="body-color"
          />
          
          <PartSelector 
            parts={KART_WHEELS} 
            activePart={selectedWheels} 
            onSelect={setSelectedWheels} 
            title="Wheels" 
            colorClass="wheel-color"
          />
          
          <PartSelector 
            parts={KART_GLIDERS} 
            activePart={selectedGlider} 
            onSelect={setSelectedGlider} 
            title="Glider" 
            colorClass="glider-color"
          />
        </div>
        
        <div className="kart-info-container">
          <KartPreview 
            body={selectedBody}
            wheels={selectedWheels}
            glider={selectedGlider}
          />
          
          <StatsSummary 
            body={selectedBody}
            wheels={selectedWheels}
            glider={selectedGlider}
          />
        </div>
      </div>
      
      <button 
        className="kart-confirm-button"
        onClick={handleConfirm}
      >
        Ready to Race!
      </button>
    </div>
  );
};

export default KartCustomize;
export { KART_BODIES, KART_WHEELS, KART_GLIDERS }; 