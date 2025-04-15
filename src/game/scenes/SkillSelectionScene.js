import Phaser from 'phaser';

class SkillSelectionScene extends Phaser.Scene {
  constructor() {
    super('SkillSelectionScene');
  }

  init(data) {
    // Get data from the game scene
    this.skillOptions = data.skillOptions || [];
    this.gameScene = data.gameScene;
  }

  create() {
    // Create cyberpunk-style UI elements
    // Create a dark overlay with grid pattern
    const overlay = this.add.rectangle(0, 0, this.game.config.width, this.game.config.height, 0x000000, 0.85);
    overlay.setOrigin(0);

    // Add grid lines for cyberpunk feel
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x00ffff, 0.15);

    // Horizontal grid lines
    for (let y = 0; y < this.game.config.height; y += 30) {
      grid.beginPath();
      grid.moveTo(0, y);
      grid.lineTo(this.game.config.width, y);
      grid.strokePath();
    }

    // Vertical grid lines
    for (let x = 0; x < this.game.config.width; x += 30) {
      grid.beginPath();
      grid.moveTo(x, 0);
      grid.lineTo(x, this.game.config.height);
      grid.strokePath();
    }

    // Add glitch effect
    this.createGlitchEffect();

    // Create a stylish title container
    const titleContainer = this.add.container(this.game.config.width / 2, this.game.config.height * 0.15);

    // Title background
    const titleBg = this.add.graphics();
    titleBg.fillStyle(0x000033, 0.7);
    titleBg.fillRect(-200, -40, 400, 80);
    titleBg.lineStyle(2, 0x00ffff, 1);
    titleBg.strokeRect(-200, -40, 400, 80);

    // Add decorative elements
    titleBg.lineStyle(1, 0xff00ff, 0.7);
    titleBg.beginPath();
    titleBg.moveTo(-190, -30);
    titleBg.lineTo(-150, -30);
    titleBg.moveTo(150, 30);
    titleBg.lineTo(190, 30);
    titleBg.strokePath();

    // Title text with glow effect
    const title = this.add.text(0, 0, '升级了！\n选择一个技能：', {
      fontSize: '28px',
      fill: '#00ffff',
      align: 'center',
      fontStyle: 'bold',
      stroke: '#0000ff',
      strokeThickness: 1,
      shadow: { offsetX: 2, offsetY: 2, color: '#0000ff', blur: 5, stroke: true, fill: true }
    });
    title.setOrigin(0.5);

    // Add elements to container
    titleContainer.add([titleBg, title]);

    // Add level up effect
    const levelUpEffect = this.add.circle(this.game.config.width / 2, this.game.config.height * 0.15, 100, 0x00ffff, 0.2);
    this.tweens.add({
      targets: levelUpEffect,
      scale: 2,
      alpha: 0,
      duration: 1000,
      repeat: 2
    });

    // Create buttons for each skill
    this.skillOptions.forEach((skill, index) => {
      // Position buttons in the middle of the screen with good spacing
      const y = this.game.config.height * 0.35 + (index * this.game.config.height * 0.18);

      // Create a container for the button and its effects
      const buttonContainer = this.add.container(this.game.config.width / 2, y);

      // Button dimensions
      const buttonWidth = this.game.config.width * 0.85; // 85% of screen width
      const buttonHeight = 100;

      // Create button glow effect
      const buttonGlow = this.add.rectangle(0, 0, buttonWidth + 10, buttonHeight + 10, 0x00ffff, 0.3);

      // Create main button with cyberpunk style
      const button = this.add.rectangle(0, 0, buttonWidth, buttonHeight, 0x000066, 0.9);
      button.setStrokeStyle(2, 0x00ffff);

      // Add decorative elements to button
      const buttonDecor = this.add.graphics();
      buttonDecor.lineStyle(1, 0xff00ff, 0.7);

      // Top left corner decoration
      buttonDecor.beginPath();
      buttonDecor.moveTo(-buttonWidth/2, -buttonHeight/2);
      buttonDecor.lineTo(-buttonWidth/2 + 30, -buttonHeight/2);
      buttonDecor.moveTo(-buttonWidth/2, -buttonHeight/2);
      buttonDecor.lineTo(-buttonWidth/2, -buttonHeight/2 + 20);
      buttonDecor.strokePath();

      // Bottom right corner decoration
      buttonDecor.beginPath();
      buttonDecor.moveTo(buttonWidth/2, buttonHeight/2);
      buttonDecor.lineTo(buttonWidth/2 - 30, buttonHeight/2);
      buttonDecor.moveTo(buttonWidth/2, buttonHeight/2);
      buttonDecor.lineTo(buttonWidth/2, buttonHeight/2 - 20);
      buttonDecor.strokePath();

      // Create skill icon based on skill type
      const iconSize = 40;
      const iconX = -buttonWidth/2 + 50;
      const iconY = 0;
      let skillIcon;

      if (skill.name.includes('子弹')) { // Bullet
        skillIcon = this.add.circle(iconX, iconY, iconSize/2, 0xff3366);
      } else if (skill.name.includes('射速')) { // Fire rate
        skillIcon = this.add.rectangle(iconX, iconY, iconSize, iconSize/2, 0x33ffaa);
      } else if (skill.name.includes('导弹')) { // Missile
        skillIcon = this.add.triangle(iconX, iconY, 0, -iconSize/2, -iconSize/2, iconSize/2, iconSize/2, iconSize/2, 0xff9900);
      } else {
        skillIcon = this.add.star(iconX, iconY, 5, iconSize/2, iconSize/4, 0xffff00);
      }

      // Create skill text with better formatting
      const skillNameText = this.add.text(10, -15, `${index + 1}. ${skill.name}`, {
        fontSize: '24px',
        fill: '#ffffff',
        fontStyle: 'bold',
        stroke: '#00ffff',
        strokeThickness: 1
      });

      const skillLevelText = this.add.text(10, 15, `等级 ${skill.level + 1}`, {
        fontSize: '20px',
        fill: '#aaffff',
        fontStyle: 'bold'
      });

      // Add all elements to the container
      buttonContainer.add([buttonGlow, button, buttonDecor, skillIcon, skillNameText, skillLevelText]);

      // Add pulsing animation to the glow
      this.tweens.add({
        targets: buttonGlow,
        alpha: { from: 0.3, to: 0.6 },
        duration: 1000,
        yoyo: true,
        repeat: -1
      });

      // Make button interactive
      button.setInteractive({ useHandCursor: true })
        .on('pointerover', () => {
          button.setFillStyle(0x001a80, 0.9);
          buttonGlow.setAlpha(0.7);
          skillNameText.setTint(0x00ffff);
        })
        .on('pointerout', () => {
          button.setFillStyle(0x000066, 0.9);
          buttonGlow.setAlpha(0.3);
          skillNameText.clearTint();
        })
        .on('pointerdown', () => {
          button.setFillStyle(0x000044, 0.9);
          skillNameText.setTint(0xff00ff);
          this.selectSkill(skill.name);
        });
    });

    // Add cyberpunk-style instruction panel
    const instructionBg = this.add.rectangle(this.game.config.width / 2, this.game.config.height * 0.85, this.game.config.width * 0.9, 50, 0x000033, 0.7);
    instructionBg.setStrokeStyle(1, 0x00ffff);

    // Add decorative elements
    const instructionDecor = this.add.graphics();
    instructionDecor.lineStyle(1, 0xff00ff, 0.7);
    instructionDecor.beginPath();
    instructionDecor.moveTo(this.game.config.width * 0.05, this.game.config.height * 0.85);
    instructionDecor.lineTo(this.game.config.width * 0.15, this.game.config.height * 0.85);
    instructionDecor.strokePath();

    instructionDecor.beginPath();
    instructionDecor.moveTo(this.game.config.width * 0.95, this.game.config.height * 0.85);
    instructionDecor.lineTo(this.game.config.width * 0.85, this.game.config.height * 0.85);
    instructionDecor.strokePath();

    // Add instruction text with glow
    const tapInstruction = this.add.text(this.game.config.width / 2, this.game.config.height * 0.85, '点击或按数字键 1-3 选择技能', {
      fontSize: '18px',
      fill: '#00ffff',
      align: 'center',
      fontStyle: 'bold'
    });
    tapInstruction.setOrigin(0.5);

    // Add subtle pulse animation
    this.tweens.add({
      targets: tapInstruction,
      alpha: 0.7,
      duration: 1500,
      yoyo: true,
      repeat: -1
    });

    // Add keyboard handlers for desktop
    this.input.keyboard.once('keydown-ONE', () => {
      if (this.skillOptions[0]) {
        console.log(`Skill 1 selected via keyboard: ${this.skillOptions[0].name}`);
        this.selectSkill(this.skillOptions[0].name);
      }
    });

    this.input.keyboard.once('keydown-TWO', () => {
      if (this.skillOptions[1]) {
        console.log(`Skill 2 selected via keyboard: ${this.skillOptions[1].name}`);
        this.selectSkill(this.skillOptions[1].name);
      }
    });

    this.input.keyboard.once('keydown-THREE', () => {
      if (this.skillOptions[2]) {
        console.log(`Skill 3 selected via keyboard: ${this.skillOptions[2].name}`);
        this.selectSkill(this.skillOptions[2].name);
      }
    });

    // Also add number key handlers (1, 2, 3 without ONE, TWO, THREE)
    this.input.keyboard.once('keydown-49', () => { // Key code for '1'
      if (this.skillOptions[0]) {
        console.log(`Skill 1 selected via number key: ${this.skillOptions[0].name}`);
        this.selectSkill(this.skillOptions[0].name);
      }
    });

    this.input.keyboard.once('keydown-50', () => { // Key code for '2'
      if (this.skillOptions[1]) {
        console.log(`Skill 2 selected via number key: ${this.skillOptions[1].name}`);
        this.selectSkill(this.skillOptions[1].name);
      }
    });

    this.input.keyboard.once('keydown-51', () => { // Key code for '3'
      if (this.skillOptions[2]) {
        console.log(`Skill 3 selected via number key: ${this.skillOptions[2].name}`);
        this.selectSkill(this.skillOptions[2].name);
      }
    });
  }

  selectSkill(skillName) {
    // Create a selection effect
    this.createSelectionEffect();

    // Call the upgrade skill method in the game scene
    if (this.gameScene && this.gameScene.upgradeSkill) {
      this.gameScene.upgradeSkill(skillName);

      // Resume the game scene after a short delay for the effect
      this.time.delayedCall(500, () => {
        this.scene.resume('GameScene');
        this.scene.stop();
      });
    }
  }

  // Create a glitch effect for the cyberpunk feel
  createGlitchEffect() {
    // Create random glitch lines
    const glitchOverlay = this.add.graphics();

    // Function to create random glitch lines
    const createGlitchLines = () => {
      glitchOverlay.clear();

      // Random horizontal glitch lines
      glitchOverlay.lineStyle(2, 0xff00ff, 0.3);
      for (let i = 0; i < 3; i++) {
        const y = Math.random() * this.game.config.height;
        const width = 50 + Math.random() * 200;
        const x = Math.random() * (this.game.config.width - width);

        glitchOverlay.beginPath();
        glitchOverlay.moveTo(x, y);
        glitchOverlay.lineTo(x + width, y);
        glitchOverlay.strokePath();
      }

      // Random vertical glitch lines
      glitchOverlay.lineStyle(2, 0x00ffff, 0.2);
      for (let i = 0; i < 2; i++) {
        const x = Math.random() * this.game.config.width;
        const height = 30 + Math.random() * 100;
        const y = Math.random() * (this.game.config.height - height);

        glitchOverlay.beginPath();
        glitchOverlay.moveTo(x, y);
        glitchOverlay.lineTo(x, y + height);
        glitchOverlay.strokePath();
      }
    };

    // Initial glitch effect
    createGlitchLines();

    // Update glitch effect periodically
    this.time.addEvent({
      delay: 2000,
      callback: createGlitchLines,
      loop: true
    });
  }

  // Create a selection effect when a skill is chosen
  createSelectionEffect() {
    // Create a flash effect
    const flash = this.add.rectangle(0, 0, this.game.config.width, this.game.config.height, 0xffffff, 0);
    flash.setOrigin(0);

    // Flash animation
    this.tweens.add({
      targets: flash,
      alpha: { from: 0, to: 0.3 },
      duration: 100,
      yoyo: true,
      repeat: 1
    });

    // Create a digital distortion effect
    const distortionLines = this.add.graphics();

    // Draw random distortion lines
    distortionLines.lineStyle(1, 0x00ffff, 0.5);
    for (let i = 0; i < 20; i++) {
      const y = Math.random() * this.game.config.height;

      distortionLines.beginPath();
      distortionLines.moveTo(0, y);
      distortionLines.lineTo(this.game.config.width, y);
      distortionLines.strokePath();
    }

    // Fade out distortion
    this.tweens.add({
      targets: distortionLines,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        distortionLines.destroy();
      }
    });

    // Play selection sound (placeholder)
    // this.sound.play('skill-select');
  }
}

export default SkillSelectionScene;
