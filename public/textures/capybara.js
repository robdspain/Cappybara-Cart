// Simple JavaScript to create a basic capybara kart texture
(function() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  // Background/body color - brown
  ctx.fillStyle = '#8B4513';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Draw the main kart body (rounded rectangle)
  ctx.fillStyle = '#A0522D';
  ctx.beginPath();
  ctx.roundRect(50, 80, 156, 100, 20);
  ctx.fill();
  
  // Draw the capybara's head
  ctx.fillStyle = '#8B4513';
  ctx.beginPath();
  ctx.arc(190, 100, 40, 0, Math.PI * 2);
  ctx.fill();
  
  // Eyes
  ctx.fillStyle = 'black';
  ctx.beginPath();
  ctx.arc(205, 90, 5, 0, Math.PI * 2);
  ctx.fill();
  
  // Nose
  ctx.fillStyle = '#4A2511';
  ctx.beginPath();
  ctx.arc(220, 100, 8, 0, Math.PI * 2);
  ctx.fill();
  
  // Draw wheels
  function drawWheel(x, y) {
    ctx.fillStyle = 'black';
    ctx.beginPath();
    ctx.arc(x, y, 20, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.fillStyle = '#555';
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
  }
  
  drawWheel(80, 170);
  drawWheel(180, 170);
  
  // Add texture details
  for (let i = 0; i < 500; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 1 + Math.random() * 2;
    
    ctx.fillStyle = `rgba(100, 60, 20, ${Math.random() * 0.5})`;
    ctx.fillRect(x, y, size, size);
  }
  
  // Convert to data URL
  const dataUrl = canvas.toDataURL('image/jpeg');
  
  const img = new Image();
  img.src = dataUrl;
  
  window.capybaraTexture = {
    image: img,
    dataUrl: dataUrl
  };
  
  console.log('Capybara texture created:', dataUrl.substring(0, 50) + '...');
})(); 