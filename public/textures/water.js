// Simple JavaScript to create a basic water texture
(function() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');
  
  // Base water color gradient
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#1E88E5');   // Deeper blue at the top
  gradient.addColorStop(1, '#64B5F6');   // Lighter blue at the bottom
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Add water waves
  for (let i = 0; i < 10; i++) {
    ctx.beginPath();
    ctx.moveTo(0, i * 25 + Math.sin(i) * 5);
    
    for (let x = 0; x < canvas.width; x += 5) {
      const y = i * 25 + Math.sin(x / 20 + i) * 8;
      ctx.lineTo(x, y);
    }
    
    ctx.lineTo(canvas.width, i * 25);
    ctx.strokeStyle = '#90CAF9';
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  
  // Add some shimmering reflection points
  for (let i = 0; i < 300; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const size = 1 + Math.random() * 2;
    
    ctx.fillStyle = `rgba(255, 255, 255, ${Math.random() * 0.3})`;
    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }
  
  // Convert to data URL
  const dataUrl = canvas.toDataURL('image/jpeg');
  
  const img = new Image();
  img.src = dataUrl;
  
  window.waterTexture = {
    image: img,
    dataUrl: dataUrl
  };
  
  console.log('Water texture created:', dataUrl.substring(0, 50) + '...');
})(); 