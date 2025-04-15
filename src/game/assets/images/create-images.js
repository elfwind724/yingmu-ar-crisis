const fs = require('fs');
const { createCanvas } = require('canvas');

// Create player image
function createPlayerImage() {
  const canvas = createCanvas(32, 32);
  const ctx = canvas.getContext('2d');
  
  // Draw player (blue circle)
  ctx.fillStyle = '#4285f4';
  ctx.beginPath();
  ctx.arc(16, 16, 14, 0, Math.PI * 2);
  ctx.fill();
  
  // Add details
  ctx.fillStyle = '#34a853';
  ctx.beginPath();
  ctx.arc(16, 16, 10, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#fbbc05';
  ctx.beginPath();
  ctx.arc(16, 16, 6, 0, Math.PI * 2);
  ctx.fill();
  
  ctx.fillStyle = '#ea4335';
  ctx.beginPath();
  ctx.arc(16, 16, 2, 0, Math.PI * 2);
  ctx.fill();
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('player.png', buffer);
}

// Create enemy image
function createEnemyImage() {
  const canvas = createCanvas(24, 24);
  const ctx = canvas.getContext('2d');
  
  // Draw enemy (red square)
  ctx.fillStyle = '#ff0000';
  ctx.fillRect(2, 2, 20, 20);
  
  // Add details (eyes and mouth)
  ctx.fillStyle = '#000000';
  ctx.fillRect(6, 6, 4, 4);
  ctx.fillRect(14, 6, 4, 4);
  ctx.fillRect(8, 14, 8, 2);
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('enemy.png', buffer);
}

// Create projectile image
function createProjectileImage() {
  const canvas = createCanvas(16, 16);
  const ctx = canvas.getContext('2d');
  
  // Draw projectile (cyan circle)
  ctx.fillStyle = '#00ffff';
  ctx.beginPath();
  ctx.arc(8, 8, 6, 0, Math.PI * 2);
  ctx.fill();
  
  // Add details
  ctx.fillStyle = '#0000ff';
  ctx.beginPath();
  ctx.arc(8, 8, 3, 0, Math.PI * 2);
  ctx.fill();
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('projectile.png', buffer);
}

// Create experience gem image
function createExpImage() {
  const canvas = createCanvas(12, 12);
  const ctx = canvas.getContext('2d');
  
  // Draw exp gem (green diamond)
  ctx.fillStyle = '#00ff00';
  ctx.beginPath();
  ctx.moveTo(6, 1);
  ctx.lineTo(11, 6);
  ctx.lineTo(6, 11);
  ctx.lineTo(1, 6);
  ctx.closePath();
  ctx.fill();
  
  const buffer = canvas.toBuffer('image/png');
  fs.writeFileSync('exp.png', buffer);
}

// Run all functions
createPlayerImage();
createEnemyImage();
createProjectileImage();
createExpImage();

console.log('All images created successfully!');
