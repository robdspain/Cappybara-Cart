// Simple JavaScript to create a basic track texture
(function() {
  // Create a canvas
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Draw a track-like pattern
  ctx.fillStyle = '#555555'; // Dark gray asphalt
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add some texture/variation to simulate asphalt
  for (let i = 0; i < 5000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 1 + Math.random() * 2;
    
    // Vary the gray color slightly
    const shade = 60 + Math.random() * 40;
    ctx.fillStyle = `rgb(${shade}, ${shade}, ${shade})`;
    ctx.fillRect(x, y, size, size);
  }
  
  // Add a yellow center line
  ctx.fillStyle = '#FFCC00';
  ctx.fillRect(canvas.width / 2 - 5, 0, 10, canvas.height);
  
  // Add dashed white lines on each side of the track
  ctx.fillStyle = '#FFFFFF';
  for (let y = 0; y < canvas.height; y += 30) {
    // Left lane marking
    ctx.fillRect(canvas.width / 4, y, 10, 15);
    
    // Right lane marking
    ctx.fillRect(3 * canvas.width / 4, y, 10, 15);
  }
  
  // Convert to data URL
  const dataUrl = canvas.toDataURL('image/jpeg');
  
  // Create an image from the data URL
  const img = new Image();
  img.src = dataUrl;
  
  // Make it available globally
  window.trackTexture = {
    image: img,
    dataUrl: dataUrl
  };
  
  // Export to console for debugging
  console.log('Track texture created:', dataUrl.substring(0, 50) + '...');
})(); 