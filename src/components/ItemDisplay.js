import React, { useState, useEffect } from 'react';
import './ItemDisplay.css';

/**
 * ItemDisplay - A component to show the current item in the HUD
 * Features:
 * - Shows the current item
 * - Animations for item acquisition
 * - Animations for item usage
 * - Empty state when no item is held
 */
const ItemDisplay = ({ currentItem, showItemObtainedAnimation = false }) => {
  const [showItem, setShowItem] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [useAnimation, setUseAnimation] = useState(false);
  
  // Handle item acquisition animation
  useEffect(() => {
    if (showItemObtainedAnimation) {
      setShowAnimation(true);
      
      // After the animation finishes, show the item
      const timer = setTimeout(() => {
        setShowAnimation(false);
        setShowItem(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [showItemObtainedAnimation]);
  
  // Handle item change
  useEffect(() => {
    if (currentItem) {
      setShowItem(true);
    } else {
      // Play use animation when item is cleared
      if (showItem) {
        setUseAnimation(true);
        
        const timer = setTimeout(() => {
          setUseAnimation(false);
          setShowItem(false);
        }, 500);
        
        return () => clearTimeout(timer);
      } else {
        setShowItem(false);
      }
    }
  }, [currentItem, showItem]);
  
  // Get item image path
  const getItemImagePath = (itemName) => {
    if (!itemName) return '';
    
    return `/imported/assets/sprites/${itemName}.png`;
  };
  
  // Get item name for display
  const getItemDisplayName = (itemName) => {
    if (!itemName) return '';
    
    // Convert snake_case to Title Case
    return itemName
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };
  
  return (
    <div className="item-display-container">
      <div className={`item-display ${showAnimation ? 'item-obtained' : ''} ${useAnimation ? 'item-used' : ''}`}>
        <div className="item-box">
          {showItem && currentItem && (
            <>
              <img 
                src={getItemImagePath(currentItem)} 
                alt={getItemDisplayName(currentItem)}
                className="item-image"
              />
              <div className="item-name">{getItemDisplayName(currentItem)}</div>
            </>
          )}
          {!showItem && !showAnimation && (
            <div className="empty-item">No Item</div>
          )}
        </div>
      </div>
      
      {showAnimation && (
        <div className="item-acquisition-overlay">
          <div className="item-acquisition-text">Item Acquired!</div>
          <img 
            src={getItemImagePath(currentItem)} 
            alt={getItemDisplayName(currentItem)}
            className="acquisition-item-image"
          />
          <div className="acquisition-item-name">{getItemDisplayName(currentItem)}</div>
        </div>
      )}
    </div>
  );
};

export default ItemDisplay; 