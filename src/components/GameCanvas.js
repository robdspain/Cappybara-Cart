import React, { useRef, useEffect, useState } from 'react';
import capybaraSprite from '../assets/capybara';
import trackImage from '../assets/track';

const GameCanvas = ({ onGameOver }) => {
  const canvasRef = useRef(null);
  const [score, setScore] = useState(0);
  const [gameLoop, setGameLoop] = useState(null);
  const [imagesLoaded, setImagesLoaded] = useState(false);
  const capybaraImgRef = useRef(null);
  const trackImgRef = useRef(null);
  const [loadingStatus, setLoadingStatus] = useState("Initializing...");
  
  // Game state
  const gameState = useRef({
    player: {
      x: 400,
      y: 500,
      width: 50,
      height: 50,
      speed: 0,
      maxSpeed: 5,
      acceleration: 0.1,
      deceleration: 0.05,
      turnSpeed: 0.1,
      angle: -Math.PI / 2, // Facing up
      isColliding: false
    },
    keysPressed: {
      ArrowUp: false,
      ArrowDown: false,
      ArrowLeft: false,
      ArrowRight: false
    },
    obstacles: [
      { x: 200, y: 200, width: 50, height: 50 },
      { x: 600, y: 300, width: 40, height: 40 },
      { x: 300, y: 400, width: 60, height: 40 },
      { x: 500, y: 150, width: 50, height: 50 }
    ],
    trackBoundary: {
      innerX: 150,
      innerY: 100,
      innerWidth: 500,
      innerHeight: 400,
      outerX: 50,
      outerY: 50,
      outerWidth: 700,
      outerHeight: 500
    },
    time: 0
  });

  // Create fallback images (colored rectangles) if loading fails
  const createFallbackImages = () => {
    console.log("Creating fallback images");
    
    // Create a fallback for capybara (red rectangle)
    const capyCanvas = document.createElement('canvas');
    capyCanvas.width = 50;
    capyCanvas.height = 50;
    const capyCtx = capyCanvas.getContext('2d');
    capyCtx.fillStyle = '#e74c3c';
    capyCtx.fillRect(0, 0, 50, 50);
    
    const capyImage = new Image();
    capyImage.src = capyCanvas.toDataURL();
    capybaraImgRef.current = capyImage;
    
    // Create a fallback for track (light gray rectangle)
    const trackCanvas = document.createElement('canvas');
    trackCanvas.width = 800;
    trackCanvas.height = 600;
    const trackCtx = trackCanvas.getContext('2d');
    trackCtx.fillStyle = '#f0f0f0';
    trackCtx.fillRect(0, 0, 800, 600);
    
    const trackImage = new Image();
    trackImage.src = trackCanvas.toDataURL();
    trackImgRef.current = trackImage;
    
    // Mark images as loaded
    setImagesLoaded(true);
  };

  // Load images with timeout
  useEffect(() => {
    console.log("Starting image loading process");
    let capyLoaded = false;
    let trackLoaded = false;
    let timeoutId;
    let errorOccurred = false;
    
    const checkAllLoaded = () => {
      if (capyLoaded && trackLoaded) {
        console.log("Both images loaded successfully");
        clearTimeout(timeoutId);
        setImagesLoaded(true);
      }
    };
    
    // Load capybara sprite
    setLoadingStatus("Loading capybara sprite...");
    const capyImg = new Image();
    capyImg.onload = () => {
      console.log("Capybara sprite loaded");
      capybaraImgRef.current = capyImg;
      capyLoaded = true;
      checkAllLoaded();
    };
    
    capyImg.onerror = (e) => {
      console.error("Failed to load capybara sprite:", e);
      setLoadingStatus("Error loading capybara sprite. Using fallback...");
      errorOccurred = true;
      // Automatically use fallback after error
      setTimeout(createFallbackImages, 1000);
    };
    
    // Load track image
    setLoadingStatus("Loading track image...");
    const trkImg = new Image();
    trkImg.onload = () => {
      console.log("Track image loaded");
      trackImgRef.current = trkImg;
      trackLoaded = true;
      checkAllLoaded();
    };
    
    trkImg.onerror = (e) => {
      console.error("Failed to load track image:", e);
      setLoadingStatus("Error loading track. Using fallback...");
      errorOccurred = true;
      // Automatically use fallback after error
      setTimeout(createFallbackImages, 1000);
    };
    
    // Set image sources
    try {
      capyImg.src = capybaraSprite;
      trkImg.src = trackImage;
    } catch (error) {
      console.error("Error setting image sources:", error);
      setLoadingStatus("Error loading images. Using fallbacks...");
      errorOccurred = true;
      setTimeout(createFallbackImages, 1000);
    }
    
    // Set a timeout to use fallbacks if images don't load
    timeoutId = setTimeout(() => {
      if (!imagesLoaded && !errorOccurred) {
        console.log("Image loading timed out after 5 seconds. Using fallbacks.");
        setLoadingStatus("Loading timed out. Using fallbacks...");
        createFallbackImages();
      }
    }, 5000);
    
    return () => {
      clearTimeout(timeoutId);
      capyImg.onload = null;
      capyImg.onerror = null;
      trkImg.onload = null;
      trkImg.onerror = null;
    };
  }, [imagesLoaded]);

  // Handle keyboard input
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        gameState.current.keysPressed[e.key] = true;
        e.preventDefault();
      }
    };

    const handleKeyUp = (e) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        gameState.current.keysPressed[e.key] = false;
        e.preventDefault();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Game loop - only start when images are loaded
  useEffect(() => {
    if (!imagesLoaded || !canvasRef.current) return;
    console.log("Starting game loop with loaded images");
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');

    // Create game loop
    const loop = setInterval(() => {
      // Update game state
      updateGameState();
      
      // Clear canvas
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      // Draw track
      if (trackImgRef.current) {
        try {
          ctx.drawImage(trackImgRef.current, 0, 0, canvas.width, canvas.height);
        } catch (error) {
          console.error("Error drawing track:", error);
          createFallbackImages();
        }
      }
      
      // Draw track boundaries
      drawTrackBoundaries(ctx);
      
      // Draw obstacles
      drawObstacles(ctx);
      
      // Draw player
      if (capybaraImgRef.current) {
        try {
          drawPlayer(ctx, capybaraImgRef.current);
        } catch (error) {
          console.error("Error drawing player:", error);
          createFallbackImages();
        }
      }
      
      // Draw score
      drawScore(ctx);
      
      // Check for game over
      checkGameOver();
      
    }, 1000 / 60); // 60 FPS
    
    setGameLoop(loop);
    
    return () => {
      clearInterval(loop);
    };
  }, [imagesLoaded, onGameOver]); // eslint-disable-line react-hooks/exhaustive-deps

  const updateGameState = () => {
    const { player, keysPressed } = gameState.current;
    
    // Acceleration
    if (keysPressed.ArrowUp) {
      player.speed += player.acceleration;
      if (player.speed > player.maxSpeed) {
        player.speed = player.maxSpeed;
      }
    } else if (keysPressed.ArrowDown) {
      player.speed -= player.acceleration;
      if (player.speed < -player.maxSpeed / 2) {
        player.speed = -player.maxSpeed / 2;
      }
    } else {
      // Deceleration when no keys are pressed
      if (player.speed > 0) {
        player.speed -= player.deceleration;
        if (player.speed < 0) player.speed = 0;
      } else if (player.speed < 0) {
        player.speed += player.deceleration;
        if (player.speed > 0) player.speed = 0;
      }
    }
    
    // Turning
    if (keysPressed.ArrowLeft) {
      player.angle -= player.turnSpeed;
    }
    if (keysPressed.ArrowRight) {
      player.angle += player.turnSpeed;
    }
    
    // Update position
    player.x += Math.cos(player.angle) * player.speed;
    player.y += Math.sin(player.angle) * player.speed;
    
    // Check collisions
    checkCollisions();
    
    // Update score (based on time)
    gameState.current.time++;
    if (gameState.current.time % 60 === 0) { // Increase score every second
      setScore(prev => prev + 1);
    }
  };

  const checkCollisions = () => {
    const { player, obstacles, trackBoundary } = gameState.current;
    
    // Check obstacle collisions
    player.isColliding = false;
    obstacles.forEach(obstacle => {
      if (
        player.x < obstacle.x + obstacle.width &&
        player.x + player.width > obstacle.x &&
        player.y < obstacle.y + obstacle.height &&
        player.y + player.height > obstacle.y
      ) {
        player.isColliding = true;
        player.speed = 0; // Stop on collision
      }
    });
    
    // Check track boundary collisions
    const { innerX, innerY, innerWidth, innerHeight, outerX, outerY, outerWidth, outerHeight } = trackBoundary;
    
    // Check if player is outside the outer boundary
    if (
      player.x < outerX ||
      player.x + player.width > outerX + outerWidth ||
      player.y < outerY ||
      player.y + player.height > outerY + outerHeight
    ) {
      player.isColliding = true;
      player.speed = 0;
    }
    
    // Check if player is inside the inner boundary
    if (
      player.x > innerX &&
      player.x + player.width < innerX + innerWidth &&
      player.y > innerY &&
      player.y + player.height < innerY + innerHeight
    ) {
      player.isColliding = true;
      player.speed = 0;
    }
  };

  const checkGameOver = () => {
    if (score >= 60) { // Game ends after 60 seconds (1 minute)
      clearInterval(gameLoop);
      onGameOver(score);
    }
  };

  const drawPlayer = (ctx, image) => {
    const { player } = gameState.current;
    
    ctx.save();
    ctx.translate(player.x + player.width / 2, player.y + player.height / 2);
    ctx.rotate(player.angle);
    ctx.drawImage(
      image,
      -player.width / 2,
      -player.height / 2,
      player.width,
      player.height
    );
    ctx.restore();
  };

  const drawObstacles = (ctx) => {
    const { obstacles } = gameState.current;
    
    ctx.fillStyle = '#e74c3c';
    obstacles.forEach(obstacle => {
      ctx.fillRect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
    });
  };

  const drawTrackBoundaries = (ctx) => {
    const { trackBoundary } = gameState.current;
    const { innerX, innerY, innerWidth, innerHeight, outerX, outerY, outerWidth, outerHeight } = trackBoundary;
    
    // Draw outer track boundary
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 3;
    ctx.strokeRect(outerX, outerY, outerWidth, outerHeight);
    
    // Draw inner track boundary
    ctx.strokeStyle = '#3498db';
    ctx.lineWidth = 3;
    ctx.strokeRect(innerX, innerY, innerWidth, innerHeight);
  };

  const drawScore = (ctx) => {
    ctx.fillStyle = '#2c3e50';
    ctx.font = '24px Arial';
    ctx.fillText(`Score: ${score}`, 20, 30);
  };

  const handleForceStart = () => {
    // Force start the game with fallback images
    createFallbackImages();
  };

  return (
    <div className="game-container">
      <canvas ref={canvasRef} width={800} height={600} />
      <div className="score">Score: {score}</div>
      {!imagesLoaded && (
        <div style={{ 
          position: 'absolute', 
          top: '50%', 
          left: '50%', 
          transform: 'translate(-50%, -50%)', 
          color: '#333', 
          fontSize: '24px',
          textAlign: 'center',
          backgroundColor: 'rgba(255, 255, 255, 0.8)',
          padding: '20px',
          borderRadius: '10px'
        }}>
          <div>{loadingStatus}</div>
          <div style={{ fontSize: '16px', margin: '10px 0' }}>If loading takes too long, you can:</div>
          <button 
            onClick={handleForceStart}
            style={{
              padding: '8px 16px',
              backgroundColor: '#4CAF50',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '16px'
            }}
          >
            Start with simple graphics
          </button>
        </div>
      )}
    </div>
  );
};

export default GameCanvas; 