import Phaser from 'phaser';

class BootScene extends Phaser.Scene {
  constructor() {
    super('BootScene');
  }

  preload() {
    // Create a loading screen with cyberpunk style
    const loadingBg = this.add.rectangle(0, 0, this.cameras.main.width, this.cameras.main.height, 0x000000);
    loadingBg.setOrigin(0, 0);

    // Add glitch effect to loading text
    const glitchText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height / 2,
      '加载中...',
      {
        fontSize: '32px',
        fill: '#0ff', // Cyan color for cyberpunk feel
        fontStyle: 'bold'
      }
    );
    glitchText.setOrigin(0.5);

    // Create glitch effect
    this.tweens.add({
      targets: glitchText,
      alpha: { from: 1, to: 0.8 },
      duration: 50,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Add a progress bar
    const progressBarBg = this.add.rectangle(
      this.cameras.main.width * 0.2,
      this.cameras.main.height * 0.6,
      this.cameras.main.width * 0.6,
      10,
      0x333333
    );
    progressBarBg.setOrigin(0, 0.5);

    const progressBar = this.add.rectangle(
      this.cameras.main.width * 0.2,
      this.cameras.main.height * 0.6,
      0,
      10,
      0x00ffff
    );
    progressBar.setOrigin(0, 0.5);

    // Update progress bar as assets load
    this.load.on('progress', (value) => {
      progressBar.width = progressBarBg.width * value;
    });

    // We'll use Phaser's graphics capabilities instead of external images
    // Only load audio resources
    // Note: Background and UI elements will be created programmatically

    // Load only the boss images that we have (boss1.png, boss2.png, boss3.png)
    // For a full game, you would add all 33 boss images
    const availableBossImages = [1, 2, 3]; // Add more numbers as you add more boss images

    for (const bossNumber of availableBossImages) {
      this.load.image(`boss${bossNumber}`, `/assets/images/boss${bossNumber}.png`);
    }

    // Audio will be loaded by the user later
    // We'll provide placeholder methods that check if audio exists before playing

    // Add load complete event to check which boss images were loaded
    this.load.on('complete', () => {
      console.log('All assets loaded!');
      // Check which boss textures are available
      const availableBosses = [];
      for (let i = 1; i <= 33; i++) {
        if (this.textures.exists(`boss${i}`)) {
          availableBosses.push(`boss${i}`);
        }
      }
      console.log(`Available boss textures: ${availableBosses.join(', ')}`);

      // Destroy loading elements
      loadingBg.destroy();
      glitchText.destroy();
      progressBarBg.destroy();
      progressBar.destroy();
    });
  }

  create() {
    // Create a cyberpunk gradient background using graphics
    const menuBg = this.add.graphics();
    menuBg.fillGradientStyle(0x000033, 0x000033, 0x330033, 0x330033, 1);
    menuBg.fillRect(0, 0, this.cameras.main.width, this.cameras.main.height);

    // Add some grid lines for cyberpunk feel
    const gridGraphics = this.add.graphics();
    gridGraphics.lineStyle(1, 0x00ffff, 0.3);

    // Horizontal grid lines
    for (let y = 0; y < this.cameras.main.height; y += 30) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(0, y);
      gridGraphics.lineTo(this.cameras.main.width, y);
      gridGraphics.strokePath();
    }

    // Vertical grid lines
    for (let x = 0; x < this.cameras.main.width; x += 30) {
      gridGraphics.beginPath();
      gridGraphics.moveTo(x, 0);
      gridGraphics.lineTo(x, this.cameras.main.height);
      gridGraphics.strokePath();
    }

    // Add some random "data streams" for cyberpunk effect
    const dataStreams = this.add.graphics();
    dataStreams.lineStyle(2, 0x00ff66, 0.5);

    for (let i = 0; i < 10; i++) {
      const startX = Math.random() * this.cameras.main.width;
      const startY = Math.random() * this.cameras.main.height;
      const length = 100 + Math.random() * 200;
      const angle = Math.random() * Math.PI * 2;

      dataStreams.beginPath();
      dataStreams.moveTo(startX, startY);
      dataStreams.lineTo(
        startX + Math.cos(angle) * length,
        startY + Math.sin(angle) * length
      );
      dataStreams.strokePath();
    }

    // Create glitch overlay effect using graphics
    const glitchOverlay = this.add.graphics();

    // Create random glitch lines
    const createGlitchEffect = () => {
      glitchOverlay.clear();

      // Random horizontal glitch lines
      glitchOverlay.lineStyle(2, 0xff00ff, 0.3);
      for (let i = 0; i < 5; i++) {
        const y = Math.random() * this.cameras.main.height;
        const width = 50 + Math.random() * 200;
        const x = Math.random() * (this.cameras.main.width - width);

        glitchOverlay.beginPath();
        glitchOverlay.moveTo(x, y);
        glitchOverlay.lineTo(x + width, y);
        glitchOverlay.strokePath();
      }

      // Random vertical glitch lines
      glitchOverlay.lineStyle(2, 0x00ffff, 0.2);
      for (let i = 0; i < 3; i++) {
        const x = Math.random() * this.cameras.main.width;
        const height = 30 + Math.random() * 100;
        const y = Math.random() * (this.cameras.main.height - height);

        glitchOverlay.beginPath();
        glitchOverlay.moveTo(x, y);
        glitchOverlay.lineTo(x, y + height);
        glitchOverlay.strokePath();
      }

      // Random glitch rectangles
      glitchOverlay.fillStyle(0xffffff, 0.05);
      for (let i = 0; i < 2; i++) {
        const width = 20 + Math.random() * 100;
        const height = 5 + Math.random() * 20;
        const x = Math.random() * (this.cameras.main.width - width);
        const y = Math.random() * (this.cameras.main.height - height);

        glitchOverlay.fillRect(x, y, width, height);
      }
    };

    // Initial glitch effect
    createGlitchEffect();

    // Update glitch effect periodically
    this.time.addEvent({
      delay: 1000,
      callback: createGlitchEffect,
      loop: true
    });

    // Create title with custom graphics and text
    // Create a container for the title
    const titleContainer = this.add.container(
      this.cameras.main.width / 2,
      this.cameras.main.height * 0.2
    );

    // Create a stylized background for the title
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x000033, 0.6);
    titleBg.fillRect(-200, -40, 400, 80);

    // Add a border with glow effect
    titleBg.lineStyle(3, 0x00ffff, 1);
    titleBg.strokeRect(-200, -40, 400, 80);

    // Add some decorative elements
    titleBg.lineStyle(2, 0xff00ff, 0.7);
    titleBg.beginPath();
    titleBg.moveTo(-190, -30);
    titleBg.lineTo(-150, -30);
    titleBg.moveTo(150, 30);
    titleBg.lineTo(190, 30);
    titleBg.strokePath();

    // Create the title text
    const titleText = this.add.text(
      0, 0,
      '影目 AR 危机',
      {
        fontSize: '64px',
        fill: '#0ff', // Cyan color for cyberpunk feel
        fontStyle: 'bold',
        stroke: '#f0f',
        strokeThickness: 2,
        shadow: { offsetX: 2, offsetY: 2, color: '#f700ff', blur: 5, stroke: true, fill: true }
      }
    );
    titleText.setOrigin(0.5);

    // Add elements to the container
    titleContainer.add([titleBg, titleText]);

    // Add glitch effect to title
    this.glitchTitle(titleText);

    // Add subtitle with digital distortion effect
    const subtitle = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height * 0.32,
      '影目科技大楼',
      {
        fontSize: '28px',
        fill: '#ff00ff', // Magenta for cyberpunk feel
        fontStyle: 'bold'
      }
    );
    subtitle.setOrigin(0.5);

    // Add digital distortion effect
    this.tweens.add({
      targets: subtitle,
      alpha: { from: 1, to: 0.8 },
      duration: 100,
      yoyo: true,
      repeat: -1,
      repeatDelay: 3000
    });

    // Create a more visible start button
    const buttonWidth = this.cameras.main.width * 0.7;
    const buttonHeight = 80;
    const buttonX = this.cameras.main.width / 2;
    const buttonY = this.cameras.main.height * 0.5;

    // Create button background with glow effect
    const buttonGlow = this.add.rectangle(buttonX, buttonY, buttonWidth + 10, buttonHeight + 10, 0x00ffff, 0.3);

    // Create main button
    const startButton = this.add.rectangle(buttonX, buttonY, buttonWidth, buttonHeight, 0x000066, 0.9);
    startButton.setStrokeStyle(3, 0x00ffff);

    // Create button text
    const startText = this.add.text(buttonX, buttonY, '开始游戏', {
      fontSize: '36px',
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#00ffff',
      strokeThickness: 2
    });
    startText.setOrigin(0.5);

    // Add pulsing animation to the glow
    this.tweens.add({
      targets: buttonGlow,
      alpha: { from: 0.3, to: 0.6 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    // Add subtle movement to the button
    this.tweens.add({
      targets: [startButton, startText],
      y: buttonY + 5,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Make button interactive with visual feedback
    startButton.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        startButton.setFillStyle(0x0000aa, 0.9);
        startText.setTint(0x00ffff);
        buttonGlow.setAlpha(0.7);
      })
      .on('pointerout', () => {
        startButton.setFillStyle(0x000066, 0.9);
        startText.clearTint();
        buttonGlow.setAlpha(0.3);
      })
      .on('pointerdown', () => {
        startButton.setFillStyle(0x000044, 0.9);
        startText.setTint(0xff00ff);
        startButton.setScale(0.98);
        startText.setScale(0.98);
      })
      .on('pointerup', () => {
        this.playButtonSound();
        this.scene.start('GameScene');
      });

    // Also make text interactive for better UX
    startText.setInteractive({ useHandCursor: true })
      .on('pointerdown', () => {
        this.playButtonSound();
        this.scene.start('GameScene');
      });

    // Add story container with terminal-style text
    const storyContainer = this.add.container(
      this.cameras.main.width / 2,
      this.cameras.main.height * 0.65
    );

    // Add story background
    const storyBg = this.add.rectangle(
      0, 0,
      this.cameras.main.width * 0.8,
      this.cameras.main.height * 0.2,
      0x000000, 0.7
    );
    storyBg.setStrokeStyle(2, 0x00ffff);

    // Add story text with typewriter effect
    const storyText = this.add.text(
      0, 0,
      '',
      {
        fontSize: '18px',
        fill: '#0f0', // Green terminal text
        align: 'left',
        wordWrap: { width: this.cameras.main.width * 0.75 }
      }
    );
    storyText.setOrigin(0.5);

    // Full story text
    const fullStoryText =
      '>> 系统警告: 人工智能“盖亚”已突破安全协议 <<\n' +
      '>> 影目科技大楼已被锁定 <<\n' +
      '>> 冯老师必须使用AR眼镜对抗AI并到达33层 <<';

    // Add typewriter effect
    let currentText = '';
    let charIndex = 0;

    const typewriterTimer = this.time.addEvent({
      delay: 30,
      callback: () => {
        if (charIndex < fullStoryText.length) {
          currentText += fullStoryText.charAt(charIndex);
          storyText.setText(currentText);
          charIndex++;

          // Add random glitch to the text occasionally
          if (Math.random() < 0.1) {
            const originalText = storyText.text;
            storyText.setText(this.addTextGlitch(originalText));
            this.time.delayedCall(50, () => {
              storyText.setText(originalText);
            });
          }
        }
      },
      repeat: fullStoryText.length - 1
    });

    // Add blinking cursor
    const cursor = this.add.text(
      storyText.x + storyText.width / 2 + 5,
      storyText.y,
      '_',
      { fontSize: '18px', fill: '#0f0' }
    );
    cursor.setOrigin(0, 0.5);

    this.tweens.add({
      targets: cursor,
      alpha: { from: 1, to: 0 },
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Update cursor position as text grows
    this.time.addEvent({
      delay: 30,
      callback: () => {
        cursor.x = storyText.x + (storyText.width / 2) + 5;
      },
      repeat: fullStoryText.length
    });

    // Add elements to story container
    storyContainer.add([storyBg, storyText, cursor]);

    // Add control instructions
    const controlsText = this.add.text(
      this.cameras.main.width / 2,
      this.cameras.main.height * 0.85,
      '使用方向键移动 | 自动攻击 | 收集经验值升级',
      {
        fontSize: '16px',
        fill: '#0ff',
        align: 'center'
      }
    );
    controlsText.setOrigin(0.5);

    // Add version number
    const versionText = this.add.text(
      this.cameras.main.width - 10,
      this.cameras.main.height - 10,
      'v1.0.0',
      {
        fontSize: '12px',
        fill: '#666'
      }
    );
    versionText.setOrigin(1, 1);

    // Add keyboard support
    this.input.keyboard.once('keydown-SPACE', () => {
      this.playButtonSound();
      this.scene.start('GameScene');
    });

    this.input.keyboard.once('keydown-ENTER', () => {
      this.playButtonSound();
      this.scene.start('GameScene');
    });

    // Try to play menu music
    this.playMenuMusic();
  }

  // Helper method to create a simple cyberpunk-style button
  createCyberpunkButton(x, y, text, callback) {
    // Create a simple button with rectangle and text
    const buttonWidth = this.cameras.main.width * 0.7;
    const buttonHeight = 80;

    // Create the button background
    const buttonBg = this.add.rectangle(x, y, buttonWidth, buttonHeight, 0x000066, 0.8);
    buttonBg.setStrokeStyle(2, 0x00ffff);

    // Create the button text
    const buttonText = this.add.text(x, y, text, {
      fontSize: '32px',
      fill: '#ffffff',
      fontStyle: 'bold',
      stroke: '#00ffff',
      strokeThickness: 1
    });
    buttonText.setOrigin(0.5);

    // Make the button interactive
    buttonBg.setInteractive({ useHandCursor: true })
      .on('pointerover', () => {
        buttonBg.setFillStyle(0x001a80, 0.8);
        buttonBg.setStrokeStyle(3, 0x00ffff);
        buttonText.setTint(0x00ffff);
      })
      .on('pointerout', () => {
        buttonBg.setFillStyle(0x000066, 0.8);
        buttonBg.setStrokeStyle(2, 0x00ffff);
        buttonText.clearTint();
      })
      .on('pointerdown', () => {
        buttonBg.setScale(0.98);
        buttonText.setScale(0.98);
        buttonText.setTint(0xff00ff);
      })
      .on('pointerup', () => {
        buttonBg.setScale(1);
        buttonText.setScale(1);
        buttonText.clearTint();
        callback();
      });

    // Add a subtle animation
    this.tweens.add({
      targets: [buttonBg, buttonText],
      y: y + 3,
      duration: 1500,
      yoyo: true,
      repeat: -1,
      ease: 'Sine.easeInOut'
    });

    // Return both objects for reference
    return { bg: buttonBg, text: buttonText };
  }

  // Helper method to add glitch effect to title
  glitchTitle(titleText) {
    // Instead of using timeline, we'll use a repeating timer event
    this.time.addEvent({
      delay: 3000, // Trigger glitch every 3 seconds
      callback: () => {
        // Create a random glitch effect
        this.createRandomGlitch(titleText);
      },
      loop: true
    });
  }

  // Create a random glitch effect on the title
  createRandomGlitch(titleText) {
    // Save original position
    const originalX = titleText.x;
    const originalY = titleText.y;
    const originalScale = titleText.scale;

    // Random offset
    const offsetX = Math.random() * 10 - 5;
    const offsetY = Math.random() * 6 - 3;
    const scaleChange = Math.random() * 0.1 - 0.05;

    // Apply glitch effect
    this.tweens.add({
      targets: titleText,
      x: originalX + offsetX,
      y: originalY + offsetY,
      scaleX: 1 + scaleChange,
      scaleY: 1 + scaleChange,
      alpha: 0.8 + Math.random() * 0.2,
      duration: 50,
      yoyo: true,
      repeat: 1,
      onStart: () => {
        // Occasionally change text color during glitch
        if (Math.random() < 0.3) {
          titleText.setTint(0xff00ff);
        }
      },
      onComplete: () => {
        titleText.clearTint();
        titleText.setPosition(originalX, originalY);
        titleText.setScale(1);
        titleText.setAlpha(1);
      }
    });
  }

  // Helper method to add random glitch to text
  addTextGlitch(text) {
    // Replace random characters with glitch characters
    const glitchChars = '!@#$%^&*()_+-=[]\\{}|;\'\",./<?>';
    let result = '';

    for (let i = 0; i < text.length; i++) {
      if (Math.random() < 0.1) { // 10% chance to replace character
        result += glitchChars.charAt(Math.floor(Math.random() * glitchChars.length));
      } else {
        result += text.charAt(i);
      }
    }

    return result;
  }

  // Helper method to play button sound
  playButtonSound() {
    // This is a placeholder - the user will add their own sounds later
    console.log('Button click sound would play here');
    // When audio is added, uncomment this:
    // if (this.sound.get('button-click')) {
    //   this.sound.play('button-click', { volume: 0.5 });
    // }
  }

  // Helper method to play menu music
  playMenuMusic() {
    // This is a placeholder - the user will add their own music later
    console.log('Menu music would play here');
    // When audio is added, uncomment this:
    // if (this.sound.get('menu-music')) {
    //   const music = this.sound.add('menu-music', { loop: true, volume: 0.3 });
    //   music.play();
    // }
  }
}

export default BootScene;
