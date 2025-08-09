// Simple JavaScript to create a basic sky texture
(function() {
  // Create a canvas
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');
  
  // Create a gradient for the sky
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#1E88E5');   // Brighter blue at the top
  gradient.addColorStop(0.5, '#64B5F6'); // Medium blue in the middle
  gradient.addColorStop(1, '#BBDEFB');   // Lighter blue/white at the horizon
  
  // Fill the background with gradient
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add some clouds
  ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
  
  // Function to draw a fluffy cloud
  function drawCloud(x, y, size) {
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y - size * 0.2, size * 0.8, 0, Math.PI * 2);
    ctx.arc(x + size, y, size * 0.7, 0, Math.PI * 2);
    ctx.arc(x + size * 1.5, y + size * 0.1, size * 0.6, 0, Math.PI * 2);
    ctx.arc(x + size * 0.5, y + size * 0.3, size * 0.9, 0, Math.PI * 2);
    ctx.closePath();
    ctx.fill();
  }
  
  // Draw several clouds of varying sizes
  for (let i = 0; i < 10; i++) {
    const x = Math.random() * canvas.width;
    const y = 50 + Math.random() * (canvas.height / 2); // Keep clouds in the upper half
    const size = 20 + Math.random() * 40;
    drawCloud(x, y, size);
  }
  
  // Draw the sun
  const sunX = canvas.width * 0.8;
  const sunY = canvas.height * 0.2;
  const sunRadius = 60;
  
  // Create a radial gradient for the sun glow
  const sunGlow = ctx.createRadialGradient(
    sunX, sunY, sunRadius * 0.5,
    sunX, sunY, sunRadius * 2
  );
  sunGlow.addColorStop(0, 'rgba(255, 255, 0, 1)');
  sunGlow.addColorStop(0.5, 'rgba(255, 200, 0, 0.5)');
  sunGlow.addColorStop(1, 'rgba(255, 200, 0, 0)');
  
  // Draw the sun glow
  ctx.fillStyle = sunGlow;
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius * 2, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  
  // Draw the sun itself
  ctx.fillStyle = '#FFEB3B';
  ctx.beginPath();
  ctx.arc(sunX, sunY, sunRadius, 0, Math.PI * 2);
  ctx.closePath();
  ctx.fill();
  
  // Convert to data URL
  const dataUrl = canvas.toDataURL('image/jpeg');
  
  // Create an image from the data URL
  const img = new Image();
  img.src = dataUrl;
  
  // Make it available globally
  window.skyTexture = {
    image: img,
    dataUrl: dataUrl
  };
  
  // Export to console for debugging
  console.log('Sky texture created:', dataUrl.substring(0, 50) + '...');
})(); 