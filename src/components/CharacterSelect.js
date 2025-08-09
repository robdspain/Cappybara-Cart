import React, { useState } from 'react';
import '../styles/CharacterSelect.css';

// Define character data
const CHARACTERS = [
  {
    id: 'capybara',
    name: 'Cappy',
    description: 'Balanced racer with good all-around stats',
    image: '/characters/capybara.png',
    stats: {
      speed: 3,
      acceleration: 3,
      handling: 3,
      weight: 3
    }
  },
  {
    id: 'turtle',
    name: 'Shelly',
    description: 'Heavy racer with high top speed but slow acceleration',
    image: '/characters/turtle.png',
    stats: {
      speed: 4,
      acceleration: 2,
      handling: 2,
      weight: 5
    }
  },
  {
    id: 'rabbit',
    name: 'Hoppy',
    description: 'Light racer with quick acceleration and agile steering',
    image: '/characters/rabbit.png',
    stats: {
      speed: 2,
      acceleration: 5,
      handling: 4,
      weight: 1
    }
  },
  {
    id: 'penguin',
    name: 'Waddles',
    description: 'Good ice traction, medium weight with balanced stats',
    image: '/characters/penguin.png',
    stats: {
      speed: 3,
      acceleration: 3,
      handling: 4,
      weight: 3
    }
  },
  {
    id: 'toad',
    name: 'Sporey',
    description: 'Lightweight racer with excellent handling',
    image: '/characters/toad.png',
    stats: {
      speed: 2,
      acceleration: 4,
      handling: 5,
      weight: 2
    }
  }
];

// Stat bar component
const StatBar = ({ label, value, max = 5 }) => {
  return (
    <div className="stat-bar">
      <span className="stat-label">{label}</span>
      <div className="stat-bar-container">
        {[...Array(max)].map((_, i) => (
          <div 
            key={i} 
            className={`stat-bar-segment ${i < value ? 'filled' : 'empty'}`} 
          />
        ))}
      </div>
    </div>
  );
};

// Character card component
const CharacterCard = ({ character, selected, onSelect }) => {
  return (
    <div 
      className={`character-card ${selected ? 'selected' : ''}`}
      onClick={() => onSelect(character)}
    >
      <div className="character-image-container">
        <div className="character-image">
          {/* Fallback color if image fails to load */}
          <div 
            style={{ 
              backgroundColor: `hsl(${character.id.charCodeAt(0) * 20}, 70%, 60%)`,
              width: '100%',
              height: '100%',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '24px',
              color: 'white',
              fontWeight: 'bold'
            }}
          >
            {character.name.charAt(0)}
          </div>
        </div>
      </div>
      <h3>{character.name}</h3>
    </div>
  );
};

// Character details component
const CharacterDetails = ({ character }) => {
  if (!character) return null;
  
  return (
    <div className="character-details">
      <h2>{character.name}</h2>
      <p>{character.description}</p>
      <div className="character-stats">
        <StatBar label="Speed" value={character.stats.speed} />
        <StatBar label="Acceleration" value={character.stats.acceleration} />
        <StatBar label="Handling" value={character.stats.handling} />
        <StatBar label="Weight" value={character.stats.weight} />
      </div>
    </div>
  );
};

// Main character selection component
const CharacterSelect = ({ onSelect, onConfirm }) => {
  const [selectedCharacter, setSelectedCharacter] = useState(CHARACTERS[0]);
  
  const handleSelect = (character) => {
    setSelectedCharacter(character);
    if (onSelect) onSelect(character);
  };
  
  const handleConfirm = () => {
    if (onConfirm) onConfirm(selectedCharacter);
  };
  
  return (
    <div className="character-select-screen">
      <h1>Select Your Character</h1>
      
      <div className="character-select-container">
        <div className="character-list">
          {CHARACTERS.map(character => (
            <CharacterCard 
              key={character.id}
              character={character}
              selected={selectedCharacter?.id === character.id}
              onSelect={handleSelect}
            />
          ))}
        </div>
        
        <CharacterDetails character={selectedCharacter} />
      </div>
      
      <button 
        className="confirm-button"
        onClick={handleConfirm}
      >
        Confirm Selection
      </button>
    </div>
  );
};

export default CharacterSelect;
export { CHARACTERS }; 