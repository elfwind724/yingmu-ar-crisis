import Phaser from 'phaser';
import BootScene from './scenes/BootScene';
import GameScene from './scenes/GameScene';
import SkillSelectionScene from './scenes/SkillSelectionScene';
import GameOverScene from './scenes/GameOverScene';

const config = {
  type: Phaser.AUTO,
  // Mobile-first: use portrait orientation (9:16 ratio)
  width: 540,
  height: 960,
  parent: 'game-container',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: [BootScene, GameScene, SkillSelectionScene, GameOverScene],
  pixelArt: false,
  backgroundColor: '#222222',
  input: {
    activePointers: 3 // Support multiple touch points
  },
  // Scale manager for responsive design
  scale: {
    mode: Phaser.Scale.FIT, // Use FIT instead of RESIZE for better proportions
    autoCenter: Phaser.Scale.CENTER_BOTH,
    orientation: Phaser.Scale.PORTRAIT,
    width: 540,
    height: 960,
    min: {
      width: 270,
      height: 480
    },
    max: {
      width: 1080,
      height: 1920
    }
  }
};

export default config;
