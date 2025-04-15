import Phaser from 'phaser';

class GameOverScene extends Phaser.Scene {
  constructor() {
    super('GameOverScene');
  }

  init(data) {
    // Get data from the game scene
    this.level = data.level || 1;
    this.floor = data.floor || 1;
  }

  create() {
    // Create UI elements
    const overlay = this.add.rectangle(0, 0, this.game.config.width, this.game.config.height, 0x000000, 0.7);
    overlay.setOrigin(0);

    const title = this.add.text(this.game.config.width / 2, this.game.config.height * 0.25, '游戏结束', {
      fontSize: '48px',
      fill: '#ff0000',
      fontStyle: 'bold'
    });
    title.setOrigin(0.5);

    const stats = this.add.text(this.game.config.width / 2, this.game.config.height * 0.4,
      `等级: ${this.level}\n楼层: ${this.floor}/33`, {
      fontSize: '28px',
      fill: '#ffffff',
      align: 'center'
    });
    stats.setOrigin(0.5);

    // Add visual button - make it bigger for mobile
    const buttonWidth = this.game.config.width * 0.7; // 70% of screen width
    const restartButton = this.add.rectangle(this.game.config.width / 2, this.game.config.height * 0.6, buttonWidth, 80, 0x4444aa);
    restartButton.setOrigin(0.5);
    restartButton.setInteractive({ useHandCursor: true });

    const restartText = this.add.text(this.game.config.width / 2, this.game.config.height * 0.6, '重新开始', {
      fontSize: '32px',
      fill: '#ffffff',
      fontStyle: 'bold'
    });
    restartText.setOrigin(0.5);
    restartText.setInteractive({ useHandCursor: true });

    // Add tap instruction for mobile
    const tapInstruction = this.add.text(this.game.config.width / 2, this.game.config.height * 0.75, '点击任意位置重新开始', {
      fontSize: '18px',
      fill: '#aaaaaa',
      align: 'center'
    });
    tapInstruction.setOrigin(0.5);

    // Add click event to restart button
    restartButton.on('pointerdown', () => {
      console.log('Restart button clicked');
      this.restartGame();
    });

    // Add click event to restart text
    restartText.on('pointerdown', () => {
      console.log('Restart text clicked');
      this.restartGame();
    });

    // Also make overlay clickable
    overlay.setInteractive();
    overlay.on('pointerdown', () => {
      console.log('Overlay clicked');
      this.restartGame();
    });

    // Add space key handler
    this.input.keyboard.once('keydown-SPACE', () => {
      console.log('Space pressed to restart');
      this.restartGame();
    });
  }

  restartGame() {
    // Stop all scenes and start boot scene
    this.scene.stop('GameScene');
    this.scene.stop();
    this.scene.start('BootScene');
  }
}

export default GameOverScene;
