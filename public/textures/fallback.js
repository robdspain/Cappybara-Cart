// Create fallback textures programmatically
window.createFallbackTextures = function() {
  console.log("Creating fallback textures");
  
  // Create Capybara texture (brown rectangle)
  const capyCanvas = document.createElement('canvas');
  capyCanvas.width = 128;
  capyCanvas.height = 128;
  const capyCtx = capyCanvas.getContext('2d');
  
  // Create gradient brown color for capybara
  const gradient = capyCtx.createLinearGradient(0, 0, 128, 128);
  gradient.addColorStop(0, '#8B4513'); // SaddleBrown
  gradient.addColorStop(0.5, '#A0522D'); // Sienna
  gradient.addColorStop(1, '#8B4513');
  
  capyCtx.fillStyle = gradient;
  capyCtx.fillRect(0, 0, 128, 128);
  
  // Add some texture details
  capyCtx.fillStyle = '#654321';
  for (let i = 0; i < 30; i++) {
    const x = Math.random() * 128;
    const y = Math.random() * 128;
    const size = Math.random() * 10 + 2;
    capyCtx.beginPath();
    capyCtx.arc(x, y, size, 0, 2 * Math.PI);
    capyCtx.fill();
  }
  
  // Save to localStorage for reuse
  try {
    localStorage.setItem('fallbackCapybaraTexture', capyCanvas.toDataURL());
  } catch (e) {
    console.warn("Could not save to localStorage:", e);
  }
  
  // Create track texture (green with grid)
  const trackCanvas = document.createElement('canvas');
  trackCanvas.width = 512;
  trackCanvas.height = 512;
  const trackCtx = trackCanvas.getContext('2d');
  
  // Base green color
  trackCtx.fillStyle = '#4CAF50';
  trackCtx.fillRect(0, 0, 512, 512);
  
  // Add grid lines
  trackCtx.strokeStyle = '#2E7D32';
  trackCtx.lineWidth = 2;
  
  // Horizontal lines
  for (let i = 0; i < 512; i += 32) {
    trackCtx.beginPath();
    trackCtx.moveTo(0, i);
    trackCtx.lineTo(512, i);
    trackCtx.stroke();
  }
  
  // Vertical lines
  for (let i = 0; i < 512; i += 32) {
    trackCtx.beginPath();
    trackCtx.moveTo(i, 0);
    trackCtx.lineTo(i, 512);
    trackCtx.stroke();
  }
  
  // Add some random details
  trackCtx.fillStyle = '#388E3C';
  for (let i = 0; i < 100; i++) {
    const x = Math.random() * 512;
    const y = Math.random() * 512;
    const size = Math.random() * 15 + 5;
    trackCtx.beginPath();
    trackCtx.arc(x, y, size, 0, 2 * Math.PI);
    trackCtx.fill();
  }
  
  // Save to localStorage for reuse
  try {
    localStorage.setItem('fallbackTrackTexture', trackCanvas.toDataURL());
  } catch (e) {
    console.warn("Could not save to localStorage:", e);
  }
  
  return {
    capybara: capyCanvas.toDataURL(),
    track: trackCanvas.toDataURL()
  };
}; 