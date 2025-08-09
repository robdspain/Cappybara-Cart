// Simple JavaScript to create a basic sand texture
(function() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  // Base sand color
  ctx.fillStyle = '#F2D16B';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add texture variation
  for (let i = 0; i < 3000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 1 + Math.random() * 2;
    
    // Vary the sand color slightly
    const r = 230 + Math.random() * 25;
    const g = 200 + Math.random() * 25;
    const b = 90 + Math.random() * 30;
    ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
    ctx.fillRect(x, y, size, size);
  }
  
  // Add some small pebbles
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 1 + Math.random() * 2;
    
    ctx.fillStyle = '#C2A278';
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Convert to data URL
  const dataUrl = canvas.toDataURL('image/jpeg');
  
  const img = new Image();
  img.src = dataUrl;
  
  window.sandTexture = {
    image: img,
    dataUrl: dataUrl
  };
  
  console.log('Sand texture created:', dataUrl.substring(0, 50) + '...');
})(); 