// Simple JavaScript to create a basic grass texture
(function() {
  // Create a canvas
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  // Draw a grass-like pattern
  ctx.fillStyle = '#4CAF50'; // Base green
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add some texture/variation
  for (let i = 0; i < 1000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 1 + Math.random() * 3;
    
    // Vary the green color slightly
    const r = 50 + Math.random() * 30;
    const g = 150 + Math.random() * 60;
    const b = 30 + Math.random() * 50;
    
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(x, y, size, size);
  }
  
  // Convert to data URL
  const dataUrl = canvas.toDataURL('image/jpeg');
  
  // Create an image from the data URL
  const img = new Image();
  img.src = dataUrl;
  
  // Make it available globally
  window.grassTexture = {
    image: img,
    dataUrl: dataUrl
  };
  
  // Export to console for debugging
  console.log('Grass texture created:', dataUrl.substring(0, 50) + '...');
})(); 