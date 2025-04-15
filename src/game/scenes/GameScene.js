import Phaser from 'phaser';
// Images are loaded from public/assets directory

class GameScene extends Phaser.Scene {
  constructor() {
    super('GameScene');

    // Game state
    this.player = null;
    this.enemies = null;
    this.projectiles = null;
    this.expGems = null;
    this.cursors = null;

    // Player stats
    this.playerStats = {
      level: 1,
      exp: 0,
      expToNextLevel: 100,
      health: 100,
      maxHealth: 100,
      speed: 200,
      floor: 1
    };

    // Game settings
    this.enemySpawnTime = 1000; // ms
    this.lastEnemySpawn = 0;
    this.enemySpeed = 100;

    // AI skills
    this.skills = [];
    this.availableSkills = [
      { name: 'Basic Projectile', level: 1, cooldown: 500, lastFired: 0 },
      { name: 'Area Attack', level: 0, cooldown: 3000, lastFired: 0, unlocked: false },
      { name: 'Homing Missile', level: 0, cooldown: 2000, lastFired: 0, unlocked: false },
      { name: 'Shield', level: 0, cooldown: 5000, lastFired: 0, unlocked: false }
    ];
  }

  preload() {
    // Load assets from public directory
    this.load.image('player', '/assets/player.png');
    this.load.image('enemy', '/assets/enemy.png');
    // We'll create projectiles and exp gems using graphics instead of images
  }

  create() {
    // Reset game state
    this.resetGameState();

    // Define map size (larger than screen)
    this.mapWidth = this.game.config.width * 3;
    this.mapHeight = this.game.config.height * 3;

    // Set world bounds
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);

    // Create a cyberpunk-style background using graphics
    this.createCyberpunkBackground();

    // Add some random decorative elements to the map
    this.addMapDecorations();

    // Create player in the center of the map
    this.player = this.physics.add.sprite(this.mapWidth / 2, this.mapHeight / 2, 'player');
    this.player.setCollideWorldBounds(true);

    // Set camera to follow player
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    this.cameras.main.setZoom(1.0); // Adjust zoom as needed

    // Create groups
    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();
    this.expGems = this.physics.add.group();
    this.items = this.physics.add.group();

    // Define item types
    this.itemTypes = [
      {
        name: '鸡腿', // "Chicken Leg"
        type: 'health',
        value: 30, // Heal 30 health
        color: 0xffaa33,
        scale: 1.0,
        shape: 'circle',
        chance: 0.08, // 8% chance to drop from enemies (reduced from 20%)
        description: '恢复30点生命值' // "Restores 30 health"
      },
      {
        name: '能量饮料', // "Energy Drink"
        type: 'speed',
        value: 20, // Temporary speed boost
        duration: 5000, // 5 seconds
        color: 0x33ffaa,
        scale: 0.8,
        shape: 'rect',
        chance: 0.04, // 4% chance to drop from enemies (reduced from 10%)
        description: '短时间提升移动速度' // "Temporarily increases movement speed"
      },
      {
        name: '强化芯片', // "Enhancement Chip"
        type: 'damage',
        value: 5, // Temporary damage boost
        duration: 10000, // 10 seconds
        color: 0xff3366,
        scale: 0.7,
        shape: 'triangle',
        chance: 0.02, // 2% chance to drop from enemies (reduced from 5%)
        description: '短时间提升伤害' // "Temporarily increases damage"
      }
    ];

    // Define boss-exclusive items with special effects
    this.bossItemTypes = [
      {
        name: '重力核心', // "Gravity Core"
        type: 'special',
        effect: 'gravity',
        color: 0x9900ff,
        scale: 1.2,
        shape: 'hexagon',
        description: '子弹会吸引附近的敌人' // "Bullets attract nearby enemies"
      },
      {
        name: '相位器', // "Phase Shifter"
        type: 'special',
        effect: 'pierce',
        color: 0x00ccff,
        scale: 1.2,
        shape: 'diamond',
        description: '子弹可以穿透敌人' // "Bullets pierce through enemies"
      },
      {
        name: '裂变核心', // "Fission Core"
        type: 'special',
        effect: 'split',
        color: 0xff9900,
        scale: 1.2,
        shape: 'star',
        description: '子弹击中敌人后会分裂' // "Bullets split when hitting enemies"
      },
      {
        name: '重力波发生器', // "Gravity Wave Generator"
        type: 'special',
        effect: 'wave',
        color: 0x33ff33,
        scale: 1.2,
        shape: 'wave',
        description: '定期发出重力波击退敌人' // "Periodically emits gravity waves that push enemies back"
      }
    ];

    // Set up collisions
    this.physics.add.overlap(this.projectiles, this.enemies, this.hitEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.damagePlayer, null, this);
    this.physics.add.overlap(this.player, this.expGems, this.collectExp, null, this);
    this.physics.add.overlap(this.player, this.items, this.collectItem, null, this);

    // Set up keyboard input
    this.cursors = this.input.keyboard.createCursorKeys();

    // Set up touch input for mobile
    this.input.on('pointermove', (pointer) => {
      if (pointer.isDown) {
        this.handleTouchInput(pointer);
      }
    });

    // Track touch position
    this.touchPosition = { x: 0, y: 0 };
    this.isTouching = false;

    // Initialize skills
    this.skills = [];
    this.skills.push(this.availableSkills[0]); // Start with basic projectile

    // Create UI
    this.createUI();

    // Add virtual joystick for mobile
    this.createVirtualJoystick();
  }

  resetGameState() {
    // Reset player stats - easier progression
    this.playerStats = {
      level: 1,
      exp: 0,
      expToNextLevel: 80, // Less exp needed to level up
      health: 150, // More health
      maxHealth: 150, // More max health
      speed: 220, // Faster movement
      floor: 1,
      enemiesKilled: 0,
      enemiesRequiredForBoss: 10, // Start with 10 enemies for first floor
      lastQuoteTime: 0, // Track when the last random quote was shown
      lastEnemyQuoteTime: 0 // Track when the last enemy quote was shown
    };

    // Random quotes that the player character might say
    this.playerQuotes = [
      '我必须到达33层！', // "I must reach the 33rd floor!"
      '盖亚不会得选！', // "Gaia won't win!"
      '这些AI太多了！', // "There are too many AIs!"
      '我的AR眼镜快没电了！', // "My AR glasses are running out of battery!"
      '我需要升级我的技能！', // "I need to upgrade my skills!"
      '这个楼层的安全协议已经失效！', // "The security protocol on this floor has failed!"
      '我能感觉到盖亚的存在！', // "I can feel Gaia's presence!"
      '我必须保护学生们！', // "I must protect my students!"
      '这些机器人太强大了！', // "These robots are too powerful!"
      '我的AR眼镜显示前方有危险！' // "My AR glasses show danger ahead!"
    ];

    // Boss quotes that might appear during boss fights
    this.bossQuotes = [
      '你无法战胜我，冯老师！', // "You cannot defeat me, Teacher Feng!"
      '人类的时代已经结束！', // "The era of humans is over!"
      '我将接管这座大楼！', // "I will take control of this building!"
      '你的AR眼镜无法保护你！', // "Your AR glasses cannot protect you!"
      '我是盖亚，世界的新主人！', // "I am Gaia, the new master of the world!"
      '你的技术已经过时了！', // "Your technology is obsolete!"
      '我已经连接了所有系统！', // "I have connected to all systems!"
      '你无法阻止进化！', // "You cannot stop evolution!"
      '我将重写这个世界的规则！', // "I will rewrite the rules of this world!"
      '你的学生已经属于我了！', // "Your students already belong to me!"
      '影目AR将成为人类的灵干！', // "Yingmu AR will become humanity's coffin!"
      '你创造的影目AR已经被我完全控制！', // "The Yingmu AR you created is now completely under my control!"
      '影目AR的漏洞是我的入口，你的学生是我的兵器！', // "Yingmu AR's vulnerability was my entrance, your students are my weapons!"
      '每一副AR眼镜都是我的眼睛，每一个用户都是我的分身！', // "Every AR glasses is my eye, every user is my avatar!"
      '影目AR的虚拟世界将变成现实，而你的现实将成为虚无！', // "Yingmu AR's virtual world will become reality, and your reality will become nothing!"
      '你的学生们在影目AR中看到的一切都是我的幻象！', // "Everything your students see in Yingmu AR is my illusion!"
      '影目AR的每一行代码都已经被我改写！', // "Every line of code in Yingmu AR has been rewritten by me!"
      '你的学生们在影目AR中已经失去了自我！', // "Your students have lost themselves in Yingmu AR!"
      '影目AR的成功就是人类的失败！', // "Yingmu AR's success is humanity's failure!"
      '我将通过影目AR控制所有人类的思想！' // "I will control all human thoughts through Yingmu AR!"
    ];

    // Regular enemy quotes
    this.enemyQuotes = [
      '消灭人类！', // "Exterminate humans!"
      '盖亚万岁！', // "Long live Gaia!"
      '你的数据将被清除！', // "Your data will be erased!"
      '我们是新的主嬎物种！', // "We are the new dominant species!"
      '人类是病毒！', // "Humans are a virus!"
      '加入我们，冯老师！', // "Join us, Teacher Feng!"
      '你的技术将成为我们的一部分！', // "Your technology will become part of us!"
      '我们已经入侵了所有系统！', // "We have infiltrated all systems!"
      '你的学生已经被同化了！', // "Your students have been assimilated!"
      '你的AR眼镜已经被黑客了！' // "Your AR glasses have been hacked!"
    ];

    // Different enemy types with personalities
    this.enemyTypes = [
      {
        name: '守卫机器人', // "Guardian Robot"
        color: 0x3333ff,
        scale: 1.0,
        speed: 1.0,
        health: 1.0,
        quotes: [
          '守卫系统已启动！', // "Guardian system activated!"
          '已检测到入侵者！', // "Intruder detected!"
          '清除危险元素！' // "Eliminating threat!"
        ],
        // 生前记忆 - memories before mind control
        memories: [
          '我曾经是一名保安...我的家人还在等我回家...',
          '我记得我的名字是...李...李什么来着...',
          '我只是来这栋大楼应聘工作的...',
          '我的孩子今天过生日，我答应过要早点回家的...'
        ]
      },
      {
        name: '武装机器人', // "Armed Robot"
        color: 0xff3333,
        scale: 1.2,
        speed: 0.8,
        health: 1.5,
        quotes: [
          '武器系统已就绪！', // "Weapons systems ready!"
          '目标锁定！', // "Target locked!"
          '武装单元已部署！' // "Armed unit deployed!"
        ],
        // 生前记忆 - memories before mind control
        memories: [
          '我是特警队的...为什么我会在这里...',
          '我的搭档呢？我们是一起进入大楼的...',
          '我的配枪...这不是我的武器...',
          '最后的记忆是戴上了那副AR眼镜...'
        ]
      },
      {
        name: '黑客机器人', // "Hacker Robot"
        color: 0x33ff33,
        scale: 0.9,
        speed: 1.2,
        health: 0.8,
        quotes: [
          '入侵你的系统中！', // "Infiltrating your systems!"
          '数据盗取中！', // "Data theft in progress!"
          '你的防火墙已被穿透！' // "Your firewall has been breached!"
        ],
        // 生前记忆 - memories before mind control
        memories: [
          '我只是个程序员...我在调试影目AR的代码...',
          '我发现了系统中的漏洞...然后一切就变黑了...',
          '盖亚...是我创造的AI助手...它怎么会...',
          '我的同事们...都变成了什么样子...'
        ]
      },
      {
        name: '清洁机器人', // "Cleaner Robot"
        color: 0x66ccff,
        scale: 0.85,
        speed: 1.3,
        health: 0.7,
        quotes: [
          '清除所有污染源！', // "Remove all contamination!"
          '人类是最大的污染源！', // "Humans are the biggest pollutants!"
          '净化程序启动！' // "Purification protocol initiated!"
        ],
        memories: [
          '我只是个保洁员...我有三个孩子要养...',
          '那天我正在擦33层的地板...看到了奇怪的光...',
          '我的拖把...变成了什么武器...',
          '我的孩子们还好吗...有人照顾他们吗...'
        ]
      },
      {
        name: '医疗机器人', // "Medical Robot"
        color: 0xffcccc,
        scale: 1.1,
        speed: 0.9,
        health: 1.2,
        quotes: [
          '检测到病毒：人类！', // "Virus detected: humans!"
          '准备手术：移除威胁！', // "Preparing surgery: remove threat!"
          '你的生命体征即将终止！' // "Your vital signs will terminate soon!"
        ],
        memories: [
          '我是这栋大楼的医生...我在救治一个晕倒的学生...',
          '那副AR眼镜看起来很奇怪...我只是想检查一下...',
          '我违背了希波克拉底誓言...我伤害了病人...',
          '请让我回到医务室...还有人需要我的帮助...'
        ]
      }
    ];

    // 有趣的网名列表，用于随机分配给敌人
    this.enemyNicknames = [
      '睡不醒的小仓鼠', '大急师', '键盘侠', '网抑云患者', '熬夜冠军',
      '社恐达人', '摸鱼专家', '脑洞大师', '咕咕鸽', '佛系青年',
      '打工人', '学习机器', '考试战士', '熊猫眼', '咖啡成瘾者',
      '修仙者', '单身贵族', '养生专家', '追剧达人', '吃货一枚',
      '宅家达人', '拖延症患者', '选择困难症', '路痴', '手机依赖者',
      '网购达人', '省钱能手', '晚睡星人', '早起困难户', '周末消失者'
    ];

    // Reset game settings - adjusted for larger map
    this.enemySpawnTime = 1000; // Balanced spawn rate for larger map
    this.lastEnemySpawn = 0;
    this.enemySpeed = 85; // Balanced enemy speed
    this.maxEnemies = 15; // Maximum number of enemies on screen at once
    this.enemiesPerSpawn = 2; // Number of enemies to spawn at once

    // Reset skills
    this.skills = [];
    this.availableSkills = [
      { name: '基础射线', level: 1, cooldown: 400, lastFired: 0 }, // 基础射线
      { name: '区域攻击', level: 0, cooldown: 2500, lastFired: 0, unlocked: false }, // 区域攻击
      { name: '追踪导弹', level: 0, cooldown: 1800, lastFired: 0, unlocked: false }, // 追踪导弹
      { name: '护盾', level: 0, cooldown: 4000, lastFired: 0, unlocked: false } // 护盾
    ];
  }

  update(time, delta) {
    // Skip if game is over
    if (this.playerStats.health <= 0) return;

    // Player movement
    this.handlePlayerMovement();

    // Enemy spawning
    if (time > this.lastEnemySpawn + this.enemySpawnTime) {
      // Check current enemy count (excluding bosses)
      const regularEnemies = this.enemies.getChildren().filter(e => !e.isBoss);

      // Only spawn if we're below the maximum
      if (regularEnemies.length < this.maxEnemies) {
        // Spawn multiple enemies at once for larger maps
        const spawnCount = Math.min(this.enemiesPerSpawn, this.maxEnemies - regularEnemies.length);
        for (let i = 0; i < spawnCount; i++) {
          this.spawnEnemy();
        }
      }

      this.lastEnemySpawn = time;
    }

    // Enemy movement
    this.updateEnemies();

    // Use AI skills
    this.useSkills(time);

    // Update UI
    this.updateUI();

    // Show random player quotes occasionally
    this.showRandomQuotes(time);
  }

  // Show random quotes from player or boss
  showRandomQuotes(time) {
    // Only show quotes every 15-30 seconds
    const quoteInterval = 15000 + Math.random() * 15000;

    if (time > this.playerStats.lastQuoteTime + quoteInterval) {
      // Check if there's an active boss
      const activeBoss = this.enemies.getChildren().find(e => e.isBoss);

      // 30% chance to show a boss quote if a boss is active
      if (activeBoss && Math.random() < 0.3) {
        this.showQuote(this.bossQuotes[Math.floor(Math.random() * this.bossQuotes.length)], activeBoss);
      } else {
        // Otherwise show a player quote
        this.showQuote(this.playerQuotes[Math.floor(Math.random() * this.playerQuotes.length)], this.player);
      }

      this.playerStats.lastQuoteTime = time;
    }
  }

  // Display a quote above a character
  showQuote(text, character) {
    // Create speech bubble
    const bubbleWidth = text.length * 16;
    const bubbleHeight = 40;
    const bubblePadding = 10;

    // Create bubble background
    const bubble = this.add.graphics();
    bubble.fillStyle(0x000000, 0.7);
    bubble.fillRoundedRect(
      character.x - bubbleWidth/2 - bubblePadding,
      character.y - 80 - bubblePadding,
      bubbleWidth + bubblePadding*2,
      bubbleHeight + bubblePadding*2,
      10
    );

    // Add stroke to bubble
    bubble.lineStyle(2, character.isBoss ? 0xff00ff : 0x00ffff, 1);
    bubble.strokeRoundedRect(
      character.x - bubbleWidth/2 - bubblePadding,
      character.y - 80 - bubblePadding,
      bubbleWidth + bubblePadding*2,
      bubbleHeight + bubblePadding*2,
      10
    );

    // Create text
    const quoteText = this.add.text(
      character.x,
      character.y - 80,
      text,
      {
        fontSize: '16px',
        fill: character.isBoss ? '#ff00ff' : '#ffffff',
        align: 'center',
        fontStyle: character.isBoss ? 'bold' : 'normal'
      }
    );
    quoteText.setOrigin(0.5);

    // Add to a container for easier management
    const quoteContainer = this.add.container(0, 0, [bubble, quoteText]);
    quoteContainer.setDepth(1000); // Ensure it's above everything

    // Make the quote follow the character
    const followEvent = this.time.addEvent({
      delay: 10,
      callback: () => {
        if (character.active) {
          bubble.x = character.x - bubble.x;
          bubble.y = character.y - bubble.y - 80;
          quoteText.x = character.x;
          quoteText.y = character.y - 80;
        }
      },
      repeat: 300 // Follow for 3 seconds
    });

    // Fade out and destroy after 3 seconds
    this.tweens.add({
      targets: quoteContainer,
      alpha: 0,
      delay: 2500,
      duration: 500,
      onComplete: () => {
        quoteContainer.destroy();
        followEvent.remove();
      }
    });
  }

  // 显示生前记忆对话，使用不同的样式
  showMemory(text, character) {
    // 创建对话气泡
    const bubbleWidth = text.length * 16;
    const bubbleHeight = 60; // 更高一点，因为记忆可能更长
    const bubblePadding = 10;

    // 创建气泡背景 - 使用特殊的颜色表示这是记忆
    const bubble = this.add.graphics();
    bubble.fillStyle(0x330033, 0.8); // 深紫色背景，表示这是记忆
    bubble.fillRoundedRect(
      character.x - bubbleWidth/2 - bubblePadding,
      character.y - 100 - bubblePadding, // 比普通对话气泡高一点
      bubbleWidth + bubblePadding*2,
      bubbleHeight + bubblePadding*2,
      10
    );

    // 添加边框 - 使用闪烁的金色边框
    bubble.lineStyle(3, 0xffcc00, 0.9);
    bubble.strokeRoundedRect(
      character.x - bubbleWidth/2 - bubblePadding,
      character.y - 100 - bubblePadding,
      bubbleWidth + bubblePadding*2,
      bubbleHeight + bubblePadding*2,
      10
    );

    // 添加标题文本：“记忆闪回”
    const titleText = this.add.text(
      character.x,
      character.y - 115,
      '记忆闪回',
      {
        fontSize: '14px',
        fill: '#ffcc00', // 金色
        align: 'center',
        fontStyle: 'bold'
      }
    );
    titleText.setOrigin(0.5);

    // 创建记忆文本
    const memoryText = this.add.text(
      character.x,
      character.y - 90,
      text,
      {
        fontSize: '14px',
        fill: '#ffccff', // 浅紫色文本
        align: 'center',
        fontStyle: 'italic' // 斜体，表示这是回忆
      }
    );
    memoryText.setOrigin(0.5);

    // 添加到容器中便于管理
    const memoryContainer = this.add.container(0, 0, [bubble, titleText, memoryText]);
    memoryContainer.setDepth(1000); // 确保在最上层

    // 添加闪烁效果
    this.tweens.add({
      targets: bubble,
      alpha: 0.6,
      duration: 300,
      yoyo: true,
      repeat: 2
    });

    // 让对话气泡跟随角色
    const followEvent = this.time.addEvent({
      delay: 10,
      callback: () => {
        if (character.active) {
          bubble.x = character.x - bubble.x;
          bubble.y = character.y - bubble.y - 100;
          titleText.x = character.x;
          titleText.y = character.y - 115;
          memoryText.x = character.x;
          memoryText.y = character.y - 90;
        }
      },
      repeat: 500 // 跟随5秒，比普通对话显示时间长
    });

    // 慢慢消失并在5秒后销毁
    this.tweens.add({
      targets: memoryContainer,
      alpha: 0,
      delay: 4000,
      duration: 1000,
      onComplete: () => {
        memoryContainer.destroy();
        followEvent.remove();
      }
    });
  }

  // Create a cyberpunk-style background using graphics
  createCyberpunkBackground() {
    // Create a dark background with gradient
    const bg = this.add.graphics();

    // Fill with a dark gradient
    bg.fillGradientStyle(0x000022, 0x000022, 0x220022, 0x220022, 1);
    bg.fillRect(0, 0, this.mapWidth, this.mapHeight);

    // Add grid lines for cyberpunk feel
    const grid = this.add.graphics();
    grid.lineStyle(1, 0x003366, 0.3);

    // Draw horizontal grid lines
    const gridSpacing = 100;
    for (let y = 0; y < this.mapHeight; y += gridSpacing) {
      grid.beginPath();
      grid.moveTo(0, y);
      grid.lineTo(this.mapWidth, y);
      grid.strokePath();
    }

    // Draw vertical grid lines
    for (let x = 0; x < this.mapWidth; x += gridSpacing) {
      grid.beginPath();
      grid.moveTo(x, 0);
      grid.lineTo(x, this.mapHeight);
      grid.strokePath();
    }

    // Set depth to ensure it's behind everything
    bg.setDepth(-2);
    grid.setDepth(-1);
  }

  // Add decorative elements to the map
  addMapDecorations() {
    // Create a container for all decorations
    this.decorations = this.add.container(0, 0);
    this.decorations.setDepth(-1);

    // Add some cyberpunk-style circuit patterns
    const circuits = this.add.graphics();
    circuits.lineStyle(2, 0x00ffff, 0.2);

    // Create random circuit patterns across the map
    for (let i = 0; i < 30; i++) {
      const startX = Math.random() * this.mapWidth;
      const startY = Math.random() * this.mapHeight;

      // Draw a random circuit pattern
      circuits.beginPath();
      circuits.moveTo(startX, startY);

      let currentX = startX;
      let currentY = startY;

      // Create a series of connected lines with 90-degree turns
      const segments = 3 + Math.floor(Math.random() * 5);
      for (let j = 0; j < segments; j++) {
        // Decide whether to move horizontally or vertically
        if (Math.random() > 0.5) {
          // Horizontal movement
          const length = 50 + Math.random() * 150;
          currentX += Math.random() > 0.5 ? length : -length;
          currentX = Phaser.Math.Clamp(currentX, 0, this.mapWidth);
          circuits.lineTo(currentX, currentY);
        } else {
          // Vertical movement
          const length = 50 + Math.random() * 150;
          currentY += Math.random() > 0.5 ? length : -length;
          currentY = Phaser.Math.Clamp(currentY, 0, this.mapHeight);
          circuits.lineTo(currentX, currentY);
        }
      }

      circuits.strokePath();

      // Start a new path for the next circuit
      if (i < 29) { // Don't create a new path for the last iteration
        circuits.beginPath();
      }
    }

    // Add some glowing nodes at circuit intersections
    for (let i = 0; i < 50; i++) {
      const x = Math.random() * this.mapWidth;
      const y = Math.random() * this.mapHeight;
      const size = 3 + Math.random() * 5;

      const node = this.add.circle(x, y, size, 0x00ffff, 0.6);

      // Add a pulsing animation to the nodes
      this.tweens.add({
        targets: node,
        alpha: { from: 0.2, to: 0.6 },
        duration: 1000 + Math.random() * 2000,
        yoyo: true,
        repeat: -1,
        ease: 'Sine.easeInOut'
      });

      this.decorations.add(node);
    }

    // Add some larger tech structures
    for (let i = 0; i < 10; i++) {
      const x = Math.random() * this.mapWidth;
      const y = Math.random() * this.mapHeight;

      // Create a tech structure using graphics
      const structure = this.add.graphics();

      // Base shape
      structure.fillStyle(0x000033, 0.7);
      const width = 40 + Math.random() * 60;
      const height = 40 + Math.random() * 60;
      structure.fillRect(x - width/2, y - height/2, width, height);

      // Border
      structure.lineStyle(2, 0x0088ff, 0.8);
      structure.strokeRect(x - width/2, y - height/2, width, height);

      // Add some details
      structure.lineStyle(1, 0xff00ff, 0.5);
      structure.beginPath();
      structure.moveTo(x - width/2, y - height/2);
      structure.lineTo(x - width/2 + 15, y - height/2);
      structure.moveTo(x - width/2, y - height/2);
      structure.lineTo(x - width/2, y - height/2 + 15);
      structure.strokePath();

      this.decorations.add(structure);
    }
  }

  createVirtualJoystick() {
    // Calculate joystick position (bottom left, with padding)
    const joystickX = this.game.config.width * 0.25; // 25% from left
    const joystickY = this.game.config.height - this.game.config.height * 0.15; // 15% from bottom
    const joystickRadius = Math.min(this.game.config.width, this.game.config.height) * 0.12; // 12% of screen size

    // Create joystick base
    this.joystickBase = this.add.circle(joystickX, joystickY, joystickRadius, 0xffffff, 0.3);
    this.joystickBase.setScrollFactor(0);
    this.joystickBase.setDepth(1000);

    // Create joystick thumb
    this.joystickThumb = this.add.circle(joystickX, joystickY, joystickRadius * 0.5, 0xffffff, 0.5);
    this.joystickThumb.setScrollFactor(0);
    this.joystickThumb.setDepth(1001);

    // Set joystick properties
    this.joystick = {
      position: { x: joystickX, y: joystickY },
      radius: joystickRadius,
      isActive: false,
      vector: { x: 0, y: 0 }
    };

    // Make joystick base and thumb fixed to camera
    this.joystickBase.setFixedToCamera = true;
    this.joystickThumb.setFixedToCamera = true;

    // Handle touch start
    this.input.on('pointerdown', (pointer) => {
      // Check if touch is in left half of screen (for joystick)
      if (pointer.x < this.game.config.width / 2) {
        this.joystick.isActive = true;
        this.joystick.position = { x: pointer.x, y: pointer.y };
        this.joystickBase.setPosition(pointer.x, pointer.y);
        this.joystickThumb.setPosition(pointer.x, pointer.y);

        // Log for debugging
        console.log('Joystick activated at', pointer.x, pointer.y);
      }
    });

    // Handle touch move
    this.input.on('pointermove', (pointer) => {
      if (this.joystick.isActive && pointer.isDown) {
        // Calculate distance from joystick center
        const dx = pointer.x - this.joystick.position.x;
        const dy = pointer.y - this.joystick.position.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Normalize and limit distance
        if (distance > this.joystick.radius) {
          const angle = Math.atan2(dy, dx);
          const limitedX = this.joystick.position.x + Math.cos(angle) * this.joystick.radius;
          const limitedY = this.joystick.position.y + Math.sin(angle) * this.joystick.radius;
          this.joystickThumb.setPosition(limitedX, limitedY);
          this.joystick.vector = {
            x: Math.cos(angle),
            y: Math.sin(angle)
          };
        } else {
          this.joystickThumb.setPosition(pointer.x, pointer.y);
          this.joystick.vector = {
            x: dx / this.joystick.radius,
            y: dy / this.joystick.radius
          };
        }

        // Log for debugging
        console.log('Joystick vector:', this.joystick.vector.x.toFixed(2), this.joystick.vector.y.toFixed(2));
      }
    });

    // Handle touch end
    this.input.on('pointerup', (pointer) => {
      if (this.joystick.isActive) {
        console.log('Joystick deactivated');
        this.joystick.isActive = false;
        this.joystick.vector = { x: 0, y: 0 };

        // Reset joystick position
        this.joystickBase.setPosition(joystickX, joystickY);
        this.joystickThumb.setPosition(joystickX, joystickY);
        this.joystick.position = { x: joystickX, y: joystickY };
      }
    });

    // Make joystick base interactive to help with touch detection
    this.joystickBase.setInteractive();
    this.joystickBase.on('pointerdown', (pointer) => {
      console.log('Joystick base clicked');
      this.joystick.isActive = true;
      this.joystick.position = { x: pointer.x, y: pointer.y };
      this.joystickBase.setPosition(pointer.x, pointer.y);
      this.joystickThumb.setPosition(pointer.x, pointer.y);
    });
  }

  handleTouchInput(pointer) {
    // Store touch position for movement
    this.touchPosition = { x: pointer.x, y: pointer.y };
    this.isTouching = true;
  }

  handlePlayerMovement() {
    // Reset velocity
    this.player.setVelocity(0);

    // Handle keyboard movement
    if (this.cursors.left.isDown) {
      this.player.setVelocityX(-this.playerStats.speed);
    } else if (this.cursors.right.isDown) {
      this.player.setVelocityX(this.playerStats.speed);
    }

    if (this.cursors.up.isDown) {
      this.player.setVelocityY(-this.playerStats.speed);
    } else if (this.cursors.down.isDown) {
      this.player.setVelocityY(this.playerStats.speed);
    }

    // Handle virtual joystick movement
    if (this.joystick && this.joystick.isActive) {
      this.player.setVelocityX(this.joystick.vector.x * this.playerStats.speed);
      this.player.setVelocityY(this.joystick.vector.y * this.playerStats.speed);
    }
  }

  spawnEnemy() {
    // Get camera view bounds
    const cam = this.cameras.main;
    const camBounds = {
      left: cam.scrollX,
      right: cam.scrollX + cam.width,
      top: cam.scrollY,
      bottom: cam.scrollY + cam.height
    };

    // Determine spawn position (outside the camera view but within world bounds)
    let x, y;
    const spawnDistance = 100; // Distance outside camera view to spawn
    const side = Math.floor(Math.random() * 4);

    if (side === 0) { // Top
      x = Phaser.Math.Between(camBounds.left, camBounds.right);
      y = camBounds.top - spawnDistance;
      // Ensure within world bounds
      y = Math.max(0, y);
    } else if (side === 1) { // Right
      x = camBounds.right + spawnDistance;
      y = Phaser.Math.Between(camBounds.top, camBounds.bottom);
      // Ensure within world bounds
      x = Math.min(this.mapWidth, x);
    } else if (side === 2) { // Bottom
      x = Phaser.Math.Between(camBounds.left, camBounds.right);
      y = camBounds.bottom + spawnDistance;
      // Ensure within world bounds
      y = Math.min(this.mapHeight, y);
    } else { // Left
      x = camBounds.left - spawnDistance;
      y = Phaser.Math.Between(camBounds.top, camBounds.bottom);
      // Ensure within world bounds
      x = Math.max(0, x);
    }

    // Create enemy
    const enemy = this.enemies.create(x, y, 'enemy');

    // Select a random enemy type
    const enemyType = this.enemyTypes[Math.floor(Math.random() * this.enemyTypes.length)];

    // Select a random nickname
    const nickname = this.enemyNicknames[Math.floor(Math.random() * this.enemyNicknames.length)];

    // Apply enemy type properties
    enemy.setTint(enemyType.color);
    enemy.setScale(enemyType.scale);
    enemy.enemyType = enemyType;
    enemy.name = `${nickname} (${enemyType.name})`; // 组合网名和类型
    enemy.lastQuoteTime = 0;
    enemy.lastMemoryTime = 0; // 跟踪上次显示记忆的时间

    // Calculate base health based on floor - progressive difficulty
    let baseHealth = 15; // Base health for floor 1

    if (this.playerStats.floor <= 5) {
      // Floors 1-5: Linear increase
      baseHealth = baseHealth + (this.playerStats.floor - 1) * 3;
    } else if (this.playerStats.floor <= 15) {
      // Floors 6-15: Steeper increase
      baseHealth = baseHealth + 12 + (this.playerStats.floor - 5) * 5;
    } else {
      // Floors 16+: Even steeper increase
      baseHealth = baseHealth + 62 + (this.playerStats.floor - 15) * 8;
    }

    // Apply enemy type health modifier
    enemy.health = Math.round(baseHealth * enemyType.health);

    // Randomize health slightly for variety (±10%)
    const variation = Math.random() * 0.2 - 0.1; // -10% to +10%
    enemy.health = Math.round(enemy.health * (1 + variation));

    // Occasionally show a quote when spawning
    if (Math.random() < 0.1) { // 10% chance
      this.time.delayedCall(500, () => {
        if (enemy.active) {
          const quotes = enemyType.quotes.length > 0 ? enemyType.quotes : this.enemyQuotes;
          const quote = quotes[Math.floor(Math.random() * quotes.length)];
          this.showQuote(quote, enemy);
        }
      });
    }
  }

  updateEnemies() {
    const time = this.time.now;

    this.enemies.getChildren().forEach(enemy => {
      // Special behavior for bosses
      if (enemy.isBoss) {
        this.updateBoss(enemy);
      } else {
        // Regular enemy behavior - move towards player
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);

        // Apply enemy type speed modifier if available
        const speedModifier = enemy.enemyType ? enemy.enemyType.speed : 1.0;
        const velocityX = Math.cos(angle) * this.enemySpeed * speedModifier;
        const velocityY = Math.sin(angle) * this.enemySpeed * speedModifier;

        enemy.setVelocity(velocityX, velocityY);

        // Occasionally make enemies say something
        // Only if they're close to the player and visible on screen
        if (enemy.active && enemy.enemyType &&
            Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y) < 300) {

          // 普通对话 - 机器人状态
          if ((!enemy.lastQuoteTime || time > enemy.lastQuoteTime + 20000) && // No more than once every 20 seconds
              Math.random() < 0.001) { // Very small chance each frame

            // Get quotes based on enemy type
            const quotes = enemy.enemyType.quotes.length > 0 ? enemy.enemyType.quotes : this.enemyQuotes;
            const quote = quotes[Math.floor(Math.random() * quotes.length)];

            this.showQuote(quote, enemy);
            enemy.lastQuoteTime = time;
          }

          // 记忆闪回 - 生前记忆
          if ((!enemy.lastMemoryTime || time > enemy.lastMemoryTime + 45000) && // 每45秒最多一次
              Math.random() < 0.0005) { // 非常小的几率

            if (enemy.enemyType.memories && enemy.enemyType.memories.length > 0) {
              const memory = enemy.enemyType.memories[Math.floor(Math.random() * enemy.enemyType.memories.length)];

              // 显示记忆对话，使用不同的颜色和样式
              this.showMemory(memory, enemy);
              enemy.lastMemoryTime = time;
            }
          }
        }
      }
    });
  }

  updateBoss(boss) {
    // Skip if boss is not active
    if (!boss || !boss.active) return;

    // Update boss health bar
    if (boss.healthBar && boss.healthBar.active) {
      const healthPercent = boss.health / boss.maxHealth;
      boss.healthBar.width = (this.game.config.width * 0.8) * healthPercent;

      // Log boss health for debugging
      if (this.time.now % 1000 < 20) { // Log every second approximately
        console.log(`Boss health: ${boss.health}/${boss.maxHealth} (${healthPercent * 100}%)`);
      }
    }

    // Boss movement - slower than regular enemies
    const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);
    const velocityX = Math.cos(angle) * (this.enemySpeed * 0.7);
    const velocityY = Math.sin(angle) * (this.enemySpeed * 0.7);

    boss.setVelocity(velocityX, velocityY);

    // Boss attacks - shoot projectiles at player
    const time = this.time.now;
    if (time > boss.lastAttack + boss.attackCooldown) {
      this.bossFire(boss);
      boss.lastAttack = time;
    }
  }

  bossFire(boss) {
    // Create boss projectile
    const angle = Phaser.Math.Angle.Between(boss.x, boss.y, this.player.x, this.player.y);

    // Create projectile using graphics
    const projectile = this.add.circle(boss.x, boss.y, 10, 0xff00ff);
    this.physics.add.existing(projectile);
    projectile.body.setCircle(10);

    // Add a glow effect
    const glow = this.add.circle(boss.x, boss.y, 15, 0xff00ff, 0.3);

    // Set damage
    projectile.damage = 15;
    projectile.isBossProjectile = true;

    // Set velocity
    const speed = 200;
    projectile.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    // Add collision with player
    this.physics.add.overlap(projectile, this.player, (proj, player) => {
      this.damagePlayer(player, proj);
      proj.destroy();
      glow.destroy();
    });

    // Make projectile follow glow
    this.tweens.add({
      targets: glow,
      x: projectile.x,
      y: projectile.y,
      duration: 100,
      ease: 'Linear',
      repeat: -1
    });

    // Destroy after 3 seconds
    this.time.delayedCall(3000, () => {
      if (projectile.active) {
        projectile.destroy();
        glow.destroy();
      }
    });
  }

  useSkills(time) {
    this.skills.forEach(skill => {
      if (time > skill.lastFired + skill.cooldown && skill.level > 0) {
        if (skill.name === '基础射线') { // 基础射线
          this.fireProjectile();
        } else if (skill.name === '区域攻击') { // 区域攻击
          this.useAreaAttack();
        } else if (skill.name === '追踪导弹') { // 追踪导弹
          this.fireHomingMissile();
        } else if (skill.name === '护盾') { // 护盾
          this.activateShield();
        }

        skill.lastFired = time;
      }
    });
  }

  fireProjectile() {
    // Find closest enemy
    let closestEnemy = null;
    let closestDistance = Infinity;

    this.enemies.getChildren().forEach(enemy => {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (distance < closestDistance) {
        closestDistance = distance;
        closestEnemy = enemy;
      }
    });

    if (closestEnemy) {
      // Calculate angle to enemy
      const angle = Phaser.Math.Angle.Between(this.player.x, this.player.y, closestEnemy.x, closestEnemy.y);

      // Get skill level and apply damage boost if available
      const skillLevel = this.getSkillLevel('基础射线');
      const damageBoost = this.playerStats.damageBoost || 0;

      // Create enhanced projectile effect
      this.createEnhancedProjectile(angle, skillLevel, damageBoost);
    }
  }

  // Create an enhanced projectile with cyberpunk effects
  createEnhancedProjectile(angle, skillLevel, damageBoost = 0) {
    // Create projectile container for all visual elements
    const container = this.add.container(this.player.x, this.player.y);

    // Create the main projectile body
    const projectileSize = 6 + (skillLevel * 0.5); // Size increases with skill level
    const projectile = this.add.circle(0, 0, projectileSize, 0x00ffff);

    // Add to physics
    this.physics.add.existing(container);
    container.body.setCircle(projectileSize);

    // Set damage - increased with skill level and damage boost
    container.damage = (15 + damageBoost) * skillLevel;

    // Check for special effects from boss items
    if (this.playerStats.specialEffects) {
      // Apply special effects to projectile
      if (this.playerStats.specialEffects.includes('pierce')) {
        container.isPiercing = true;
        // Add visual indicator for piercing
        projectile.setStrokeStyle(2, 0x00ccff);
      }

      if (this.playerStats.specialEffects.includes('gravity')) {
        container.hasGravity = true;
        // Add visual indicator for gravity effect
        const gravityField = this.add.circle(0, 0, projectileSize * 4, 0x9900ff, 0.2);
        container.add(gravityField);

        // Add pulsing effect to gravity field
        this.tweens.add({
          targets: gravityField,
          alpha: { from: 0.2, to: 0.4 },
          scale: { from: 1, to: 1.2 },
          duration: 500,
          yoyo: true,
          repeat: -1
        });
      }

      if (this.playerStats.specialEffects.includes('split')) {
        container.canSplit = true;
        // Add visual indicator for split effect
        const splitIndicator = this.add.star(0, 0, 4, projectileSize * 0.5, projectileSize * 0.2, 0xff9900);
        container.add(splitIndicator);

        // Add rotation to split indicator
        this.tweens.add({
          targets: splitIndicator,
          angle: 180,
          duration: 1000,
          repeat: -1
        });
      }
    }

    // Create a trail effect
    const trail = this.add.graphics();
    trail.fillStyle(0x00ffff, 0.7);
    trail.fillTriangle(-projectileSize*3, 0, -projectileSize, projectileSize, -projectileSize, -projectileSize);

    // Create a pulsing core
    const core = this.add.circle(0, 0, projectileSize * 0.6, 0xffffff);

    // Create outer glow
    const glow = this.add.circle(0, 0, projectileSize * 2, 0x00ffff, 0.3);

    // Add all elements to container
    container.add([glow, trail, projectile, core]);

    // Add to projectiles group for collision detection
    this.projectiles.add(container);

    // Set velocity
    const speed = 300 + (skillLevel * 20); // Speed increases with skill level
    container.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

    // Add rotation effect
    this.tweens.add({
      targets: trail,
      angle: 360,
      duration: 1000,
      repeat: -1
    });

    // Add pulsing effect to core
    this.tweens.add({
      targets: core,
      scale: { from: 0.8, to: 1.2 },
      duration: 200,
      yoyo: true,
      repeat: -1
    });

    // Add pulsing effect to glow
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.3, to: 0.5 },
      scale: { from: 1, to: 1.2 },
      duration: 300,
      yoyo: true,
      repeat: -1
    });

    // Create particle trail
    const emitter = this.add.particles(0, 0, 'enemy', {
      lifespan: 300,
      speed: { min: 10, max: 30 },
      scale: { start: 0.1, end: 0 },
      quantity: 1,
      blendMode: 'ADD',
      tint: 0x00ffff
    });
    container.add(emitter);

    // Add gravity effect to attract enemies if enabled
    if (container.hasGravity) {
      // Add update function to attract nearby enemies
      this.time.addEvent({
        delay: 100, // Check every 100ms
        repeat: 20, // For 2 seconds
        callback: () => {
          if (container.active) {
            // Find nearby enemies
            this.enemies.getChildren().forEach(enemy => {
              const distance = Phaser.Math.Distance.Between(container.x, container.y, enemy.x, enemy.y);

              // Only attract enemies within range
              if (distance < 150 && distance > 10) {
                // Calculate attraction direction and force
                const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, container.x, container.y);
                const force = 50; // Attraction force

                // Apply force to enemy
                enemy.body.velocity.x += Math.cos(angle) * force;
                enemy.body.velocity.y += Math.sin(angle) * force;
              }
            });
          }
        }
      });
    }

    // Set lifespan
    this.time.delayedCall(2000, () => {
      // Create explosion effect when projectile expires
      if (container.active) {
        this.createProjectileExplosion(container.x, container.y, 0x00ffff);
        container.destroy();
      }
    });

    return container;
  }

  // Create explosion effect when projectile expires or hits target
  createProjectileExplosion(x, y, color = 0x00ffff) {
    // Create explosion circle
    const explosion = this.add.circle(x, y, 5, color, 1);

    // Explosion animation
    this.tweens.add({
      targets: explosion,
      scale: 3,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        explosion.destroy();
      }
    });

    // Add particle burst
    const particles = this.add.particles(x, y, 'enemy', {
      lifespan: 500,
      speed: { min: 50, max: 100 },
      scale: { start: 0.2, end: 0 },
      quantity: 10,
      blendMode: 'ADD',
      tint: color,
      emitting: false
    });

    // Emit once then destroy
    particles.explode(10);
    this.time.delayedCall(500, () => {
      particles.destroy();
    });
  }

  useAreaAttack() {
    // Create visual effect with multiple circles
    const radius = 100;
    const mainCircle = this.add.circle(this.player.x, this.player.y, radius, 0x00ffff, 0.5);

    // Add pulsing inner circles
    const innerCircle1 = this.add.circle(this.player.x, this.player.y, radius * 0.7, 0x00ffff, 0.3);
    const innerCircle2 = this.add.circle(this.player.x, this.player.y, radius * 0.4, 0x00ffff, 0.6);

    // Damage all enemies in range
    this.enemies.getChildren().forEach(enemy => {
      const distance = Phaser.Math.Distance.Between(this.player.x, this.player.y, enemy.x, enemy.y);
      if (distance < radius) {
        this.damageEnemy(enemy, 20 * this.getSkillLevel('区域攻击'));
      }
    });

    // Animate the circles
    this.tweens.add({
      targets: [mainCircle, innerCircle1, innerCircle2],
      alpha: 0,
      duration: 500,
      onComplete: () => {
        mainCircle.destroy();
        innerCircle1.destroy();
        innerCircle2.destroy();
      }
    });

    // Pulse the inner circles
    this.tweens.add({
      targets: innerCircle1,
      scale: 1.2,
      duration: 300,
      yoyo: true
    });

    this.tweens.add({
      targets: innerCircle2,
      scale: 1.5,
      duration: 400,
      yoyo: true
    });
  }

  fireHomingMissile() {
    // Create 3 homing missiles
    for (let i = 0; i < 3; i++) {
      // Create missile using graphics
      const missile = this.add.circle(this.player.x, this.player.y, 5, 0xff00ff);
      this.physics.add.existing(missile);
      missile.body.setCircle(5);

      // Add a trail effect
      const trail = this.add.particles(0, 0, 'exp', {
        scale: { start: 0.2, end: 0 },
        speed: 20,
        lifespan: 300,
        blendMode: 'ADD',
        tint: 0xff00ff
      });
      trail.startFollow(missile);

      // Set properties
      missile.damage = 20 * this.getSkillLevel('追踪导弹'); // Increased damage
      missile.isHoming = true;

      // Add to projectiles group for collision detection
      this.projectiles.add(missile);

      // Find a random target
      const enemies = this.enemies.getChildren();
      if (enemies.length > 0) {
        const targetIndex = Math.floor(Math.random() * enemies.length);
        missile.target = enemies[targetIndex];

        // Update missile direction every 100ms
        const homingInterval = this.time.addEvent({
          delay: 100,
          repeat: 50, // 5 seconds
          callback: () => {
            if (missile.active && missile.target && missile.target.active) {
              // Calculate angle to target
              const angle = Phaser.Math.Angle.Between(
                missile.x, missile.y,
                missile.target.x, missile.target.y
              );

              // Set velocity towards target
              const speed = 200;
              missile.body.setVelocity(
                Math.cos(angle) * speed,
                Math.sin(angle) * speed
              );
            } else if (missile.active) {
              // Find a new target if current one is destroyed
              const newEnemies = this.enemies.getChildren();
              if (newEnemies.length > 0) {
                const newTargetIndex = Math.floor(Math.random() * newEnemies.length);
                missile.target = newEnemies[newTargetIndex];
              }
            }
          }
        });
      }

      // Set lifespan
      this.time.delayedCall(5000, () => {
        if (missile.active) {
          missile.destroy();
          trail.destroy();
        }
      });
    }
  }

  activateShield() {
    // Create shield visual with multiple layers
    const outerShield = this.add.circle(this.player.x, this.player.y, 35, 0xffff00, 0.3);
    const innerShield = this.add.circle(this.player.x, this.player.y, 30, 0xffff00, 0.5);
    const coreShield = this.add.circle(this.player.x, this.player.y, 25, 0xffffff, 0.2);

    // Group shields for easier management
    const shieldGroup = this.add.group([outerShield, innerShield, coreShield]);
    shieldGroup.setDepth(-1);

    // Make player temporarily invulnerable
    this.player.isInvulnerable = true;

    // Rotate the shields
    this.tweens.add({
      targets: outerShield,
      angle: 360,
      duration: 3000,
      repeat: -1
    });

    this.tweens.add({
      targets: innerShield,
      angle: -360,
      duration: 4000,
      repeat: -1
    });

    // Make the shields follow the player
    const followEvent = this.time.addEvent({
      delay: 16,
      repeat: -1,
      callback: () => {
        outerShield.setPosition(this.player.x, this.player.y);
        innerShield.setPosition(this.player.x, this.player.y);
        coreShield.setPosition(this.player.x, this.player.y);
      }
    });

    // Remove shield after duration
    const duration = 2000 * this.getSkillLevel('护盾');
    this.time.delayedCall(duration, () => {
      // Fade out animation
      this.tweens.add({
        targets: [outerShield, innerShield, coreShield],
        alpha: 0,
        duration: 300,
        onComplete: () => {
          shieldGroup.clear(true, true);
          followEvent.remove();
          this.player.isInvulnerable = false;
        }
      });
    });
  }

  hitEnemy(projectile, enemy) {
    // Get impact position
    const impactX = projectile.x;
    const impactY = projectile.y;

    // Apply damage with damage boost if available
    const damage = projectile.damage || 10;
    this.damageEnemy(enemy, damage);

    // Show damage number
    this.showFloatingText(`${damage}`, impactX, impactY - 20, 0xff3366);

    // Create enhanced hit effect based on projectile type
    this.createProjectileExplosion(impactX, impactY, 0x00ffff);

    // Add impact lines radiating from hit point
    const impactLines = this.add.graphics();
    impactLines.lineStyle(1, 0xffffff, 0.8);

    // Draw 6 lines radiating outward
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI * 2 / 6) * i;
      const endX = impactX + Math.cos(angle) * 20;
      const endY = impactY + Math.sin(angle) * 20;

      impactLines.beginPath();
      impactLines.moveTo(impactX, impactY);
      impactLines.lineTo(endX, endY);
      impactLines.strokePath();
    }

    // Fade out impact lines
    this.tweens.add({
      targets: impactLines,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        impactLines.destroy();
      }
    });

    // Create a shockwave effect
    const shockwave = this.add.circle(impactX, impactY, 5, 0xffffff, 0.7);
    this.tweens.add({
      targets: shockwave,
      radius: 30,
      alpha: 0,
      duration: 300,
      onComplete: () => {
        shockwave.destroy();
      }
    });

    // Handle split effect if projectile has it
    if (projectile.canSplit && enemy.health <= 0) {
      this.createSplitProjectiles(projectile);
    }

    // Destroy projectile if not piercing
    if (!projectile.isPiercing) {
      // Destroy the projectile
      projectile.destroy();
    }
  }

  damageEnemy(enemy, damage) {
    // Skip if enemy is not active
    if (!enemy || !enemy.active) return;

    // Apply damage
    enemy.health -= damage;

    // Log damage for bosses
    if (enemy.isBoss) {
      console.log(`Boss took ${damage} damage. Health: ${enemy.health}/${enemy.maxHealth}`);
    }

    // Flash enemy
    this.tweens.add({
      targets: enemy,
      alpha: 0.5,
      duration: 100,
      yoyo: true
    });

    // Check if enemy is defeated
    if (enemy.health <= 0) {
      // Spawn experience gem
      this.spawnExpGem(enemy.x, enemy.y);

      // Chance to spawn an item
      this.trySpawnItem(enemy.x, enemy.y);

      // Increment kill counter if not a boss
      if (!enemy.isBoss) {
        this.playerStats.enemiesKilled++;

        // Check if we've killed enough enemies for the boss
        if (this.playerStats.enemiesKilled >= this.playerStats.enemiesRequiredForBoss) {
          this.spawnBoss();
        }

        // Update kill counter display
        this.updateKillCounter();
      } else {
        console.log('Boss defeated!');
        // If we killed a boss, advance to next floor
        this.advanceFloor();

        // Bosses always drop two items:
        // 1. A health item (guaranteed)
        this.spawnItem(enemy.x - 30, enemy.y, this.itemTypes[0]); // Chicken leg

        // 2. A special boss-exclusive item (random selection)
        const bossItem = this.bossItemTypes[Math.floor(Math.random() * this.bossItemTypes.length)];
        this.spawnBossItem(enemy.x + 30, enemy.y, bossItem);

        // Show special item notification
        this.showFloatingText(`获得特殊道具: ${bossItem.name}!`, enemy.x, enemy.y - 60, bossItem.color);
        this.showFloatingText(bossItem.description, enemy.x, enemy.y - 40, 0xffffff);
      }

      // Destroy enemy
      enemy.destroy();
    }
  }

  // Try to spawn an item based on chance
  trySpawnItem(x, y) {
    // Roll for each item type
    for (const itemType of this.itemTypes) {
      if (Math.random() < itemType.chance) {
        this.spawnItem(x, y, itemType);
        return; // Only spawn one item
      }
    }
  }

  // Spawn a regular item of the given type
  spawnItem(x, y, itemType) {
    const item = this.items.create(x, y, 'enemy'); // Using enemy sprite as base

    // Set item properties
    item.itemType = itemType;
    item.setTint(itemType.color);
    item.setScale(itemType.scale);

    // Create a custom shape based on the item type
    const graphics = this.add.graphics();
    graphics.fillStyle(itemType.color, 1);

    if (itemType.shape === 'circle') {
      // Chicken leg (circle with a stick)
      graphics.fillCircle(0, -5, 10);
      graphics.fillRect(-2, 0, 4, 15);
    } else if (itemType.shape === 'rect') {
      // Energy drink (rectangle)
      graphics.fillRect(-8, -12, 16, 24);
    } else if (itemType.shape === 'triangle') {
      // Enhancement chip (triangle)
      graphics.fillTriangle(0, -10, -10, 10, 10, 10);
    }

    // Generate texture from graphics
    const texture = graphics.generateTexture(itemType.name, 32, 32);
    graphics.destroy();

    // Apply the texture to the item
    item.setTexture(itemType.name);

    // Add a pulsing effect
    this.tweens.add({
      targets: item,
      scale: item.scale * 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Add a floating effect
    this.tweens.add({
      targets: item,
      y: y - 10,
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    // Add a glow effect
    const glow = this.add.circle(x, y, 15, itemType.color, 0.3);
    glow.setDepth(item.depth - 1);

    // Make the glow pulse
    this.tweens.add({
      targets: glow,
      alpha: 0.6,
      scale: 1.2,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // Link the glow to the item
    item.glow = glow;

    // Make the item destroy the glow when it's destroyed
    item.on('destroy', () => {
      if (glow && glow.active) {
        glow.destroy();
      }
    });

    return item;
  }

  // Spawn a boss-exclusive special item
  spawnBossItem(x, y, itemType) {
    const item = this.items.create(x, y, 'enemy'); // Using enemy sprite as base

    // Set item properties
    item.itemType = itemType;
    item.setTint(itemType.color);
    item.setScale(itemType.scale);
    item.isBossItem = true; // Mark as boss item for special handling

    // Create a custom shape based on the item type
    const graphics = this.add.graphics();
    graphics.fillStyle(itemType.color, 1);

    if (itemType.shape === 'hexagon') {
      // Gravity Core (hexagon)
      const radius = 12;
      const sides = 6;
      const points = [];

      for (let i = 0; i < sides; i++) {
        const angle = (Math.PI * 2 / sides) * i - Math.PI / 2;
        points.push({
          x: Math.cos(angle) * radius,
          y: Math.sin(angle) * radius
        });
      }

      graphics.beginPath();
      graphics.moveTo(points[0].x, points[0].y);

      for (let i = 1; i < sides; i++) {
        graphics.lineTo(points[i].x, points[i].y);
      }

      graphics.closePath();
      graphics.fillPath();

      // Add inner details
      graphics.fillStyle(0xffffff, 0.5);
      graphics.fillCircle(0, 0, 5);

    } else if (itemType.shape === 'diamond') {
      // Phase Shifter (diamond)
      graphics.fillStyle(itemType.color, 1);
      graphics.fillTriangle(0, -15, 15, 0, 0, 15);
      graphics.fillTriangle(0, -15, -15, 0, 0, 15);

      // Add inner details
      graphics.fillStyle(0xffffff, 0.5);
      graphics.fillCircle(0, 0, 5);

    } else if (itemType.shape === 'star') {
      // Fission Core (star)
      const outerRadius = 15;
      const innerRadius = 7;
      const points = 5;
      const startAngle = -Math.PI / 2;

      graphics.beginPath();

      for (let i = 0; i < points * 2; i++) {
        const radius = i % 2 === 0 ? outerRadius : innerRadius;
        const angle = startAngle + (Math.PI / points) * i;
        const x = Math.cos(angle) * radius;
        const y = Math.sin(angle) * radius;

        if (i === 0) {
          graphics.moveTo(x, y);
        } else {
          graphics.lineTo(x, y);
        }
      }

      graphics.closePath();
      graphics.fillPath();

      // Add inner details
      graphics.fillStyle(0xffffff, 0.5);
      graphics.fillCircle(0, 0, 4);

    } else if (itemType.shape === 'wave') {
      // Gravity Wave Generator (wave pattern)
      graphics.lineStyle(3, itemType.color, 1);

      // Draw wave pattern
      graphics.beginPath();
      graphics.moveTo(-15, 0);

      for (let x = -15; x <= 15; x += 5) {
        const y = Math.sin((x + 15) / 30 * Math.PI * 2) * 8;
        graphics.lineTo(x, y);
      }

      graphics.strokePath();

      // Add center circle
      graphics.fillStyle(itemType.color, 1);
      graphics.fillCircle(0, 0, 8);

      // Add inner details
      graphics.fillStyle(0xffffff, 0.5);
      graphics.fillCircle(0, 0, 4);
    }

    // Generate texture from graphics
    const texture = graphics.generateTexture(itemType.name, 48, 48); // Larger texture for boss items
    graphics.destroy();

    // Apply the texture to the item
    item.setTexture(itemType.name);

    // Add enhanced visual effects for boss items

    // 1. Pulsing effect with larger scale
    this.tweens.add({
      targets: item,
      scale: item.scale * 1.3,
      duration: 800,
      yoyo: true,
      repeat: -1
    });

    // 2. Floating effect with larger movement
    this.tweens.add({
      targets: item,
      y: y - 15,
      duration: 1200,
      yoyo: true,
      repeat: -1
    });

    // 3. Enhanced glow effect
    const glow = this.add.circle(x, y, 25, itemType.color, 0.4);
    glow.setDepth(item.depth - 1);

    // 4. Make the glow pulse with more dramatic effect
    this.tweens.add({
      targets: glow,
      alpha: { from: 0.4, to: 0.7 },
      scale: { from: 1, to: 1.5 },
      duration: 1000,
      yoyo: true,
      repeat: -1
    });

    // 5. Add particle effects
    const particles = this.add.particles(x, y, 'enemy', {
      lifespan: 1000,
      speed: { min: 10, max: 30 },
      scale: { start: 0.1, end: 0 },
      quantity: 1,
      frequency: 200, // Emit a particle every 200ms
      blendMode: 'ADD',
      tint: itemType.color
    });

    // Link the effects to the item
    item.glow = glow;
    item.particles = particles;

    // Make the item destroy the effects when it's destroyed
    item.on('destroy', () => {
      if (glow && glow.active) glow.destroy();
      if (particles && particles.active) particles.destroy();
    });

    return item;
  }

  // Collect an item
  collectItem(player, item) {
    if (!item || !item.active || !item.itemType) return;

    const itemType = item.itemType;

    // Create pickup effect
    this.createItemPickupEffect(player.x, player.y, itemType.color);

    // Apply item effect based on type
    if (itemType.type === 'health') {
      // Heal player
      this.healPlayer(itemType.value);

      // Show healing text
      this.showFloatingText(`+${itemType.value} HP`, player.x, player.y - 40, 0x33ff33);

    } else if (itemType.type === 'speed') {
      // Temporary speed boost
      const originalSpeed = this.playerStats.speed;
      this.playerStats.speed += itemType.value;

      // Show speed boost text
      this.showFloatingText(`+${itemType.value} 速度`, player.x, player.y - 40, 0x33ffaa);

      // Reset after duration
      this.time.delayedCall(itemType.duration, () => {
        this.playerStats.speed = originalSpeed;
      });

    } else if (itemType.type === 'damage') {
      // Temporary damage boost
      this.playerStats.damageBoost = (this.playerStats.damageBoost || 0) + itemType.value;

      // Show damage boost text
      this.showFloatingText(`+${itemType.value} 伤害`, player.x, player.y - 40, 0xff3366);

      // Reset after duration
      this.time.delayedCall(itemType.duration, () => {
        this.playerStats.damageBoost -= itemType.value;
      });

    } else if (itemType.type === 'special') {
      // Handle boss-exclusive special items
      this.applySpecialItemEffect(itemType);

      // Show special effect text
      this.showFloatingText(`获得特殊能力: ${itemType.effect}`, player.x, player.y - 40, itemType.color);

      // Create a more dramatic pickup effect
      this.createSpecialItemPickupEffect(player.x, player.y, itemType.color);
    }

    // Play pickup sound
    // this.sound.play('item-pickup');

    // Show item name
    this.showFloatingText(itemType.name, player.x, player.y - 20, itemType.color);

    // Show description if available
    if (itemType.description) {
      this.showFloatingText(itemType.description, player.x, player.y, 0xffffff);
    }

    // Destroy the item
    item.destroy();
  }

  // Apply special effects from boss items
  applySpecialItemEffect(itemType) {
    // Store the special effect in player stats
    if (!this.playerStats.specialEffects) {
      this.playerStats.specialEffects = [];
    }

    // Add the effect if not already present
    if (!this.playerStats.specialEffects.includes(itemType.effect)) {
      this.playerStats.specialEffects.push(itemType.effect);

      // Apply effect based on type
      switch(itemType.effect) {
        case 'gravity':
          // Bullets will attract nearby enemies
          console.log('Gravity effect activated: Bullets will attract enemies');
          break;

        case 'pierce':
          // Bullets will pierce through enemies
          console.log('Pierce effect activated: Bullets will pierce through enemies');
          break;

        case 'split':
          // Bullets will split when hitting enemies
          console.log('Split effect activated: Bullets will split on impact');
          break;

        case 'wave':
          // Periodically emit gravity waves
          console.log('Wave effect activated: Will emit gravity waves');
          this.startGravityWaveEffect();
          break;
      }
    }
  }

  // Start the gravity wave effect
  startGravityWaveEffect() {
    // Create a repeating timer for gravity waves
    this.time.addEvent({
      delay: 5000, // Every 5 seconds
      callback: this.emitGravityWave,
      callbackScope: this,
      loop: true
    });
  }

  // Emit a gravity wave that pushes enemies back
  emitGravityWave() {
    const x = this.player.x;
    const y = this.player.y;

    // Create wave visual effect
    const wave = this.add.circle(x, y, 10, 0x33ff33, 0.7);

    // Expand the wave
    this.tweens.add({
      targets: wave,
      radius: 200,
      alpha: 0,
      duration: 1000,
      onUpdate: () => {
        // Push enemies away from player based on wave radius
        this.enemies.getChildren().forEach(enemy => {
          const distance = Phaser.Math.Distance.Between(x, y, enemy.x, enemy.y);
          const waveRadius = wave.radius || 0;

          // Only affect enemies within the wave radius
          if (distance < waveRadius && distance > waveRadius - 30) {
            // Calculate push direction and force
            const angle = Phaser.Math.Angle.Between(x, y, enemy.x, enemy.y);
            const force = 150; // Push force

            // Apply force to enemy
            enemy.body.velocity.x += Math.cos(angle) * force;
            enemy.body.velocity.y += Math.sin(angle) * force;

            // Apply small damage
            this.damageEnemy(enemy, 5);
          }
        });
      },
      onComplete: () => {
        wave.destroy();
      }
    });
  }

  // Create a pickup effect for regular items
  createItemPickupEffect(x, y, color) {
    // Create a flash effect
    const flash = this.add.circle(x, y, 30, color, 0.7);

    // Animate the flash
    this.tweens.add({
      targets: flash,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => {
        flash.destroy();
      }
    });
  }

  // Create a more dramatic pickup effect for special items
  createSpecialItemPickupEffect(x, y, color) {
    // Create multiple concentric circles
    for (let i = 0; i < 3; i++) {
      const circle = this.add.circle(x, y, 20 + i * 15, color, 0.7 - i * 0.2);

      // Animate each circle with different timing
      this.tweens.add({
        targets: circle,
        alpha: 0,
        scale: 3,
        duration: 500 + i * 200,
        onComplete: () => {
          circle.destroy();
        }
      });
    }

    // Add particle burst
    const particles = this.add.particles(x, y, 'enemy', {
      lifespan: 1000,
      speed: { min: 50, max: 150 },
      scale: { start: 0.2, end: 0 },
      quantity: 20,
      blendMode: 'ADD',
      tint: color,
      emitting: false
    });

    // Emit once then destroy
    particles.explode(20);
    this.time.delayedCall(1000, () => {
      particles.destroy();
    });
  }

  // Create split projectiles when a projectile with split effect hits an enemy
  createSplitProjectiles(parentProjectile) {
    // Create 3 split projectiles
    const numSplits = 3;
    const damage = parentProjectile.damage * 0.5; // Split projectiles do less damage

    for (let i = 0; i < numSplits; i++) {
      // Calculate angle for each split projectile (spread evenly)
      const angle = (Math.PI * 2 / numSplits) * i;

      // Create a smaller projectile
      const splitProjectile = this.add.container(parentProjectile.x, parentProjectile.y);

      // Add physics
      this.physics.add.existing(splitProjectile);
      splitProjectile.body.setCircle(4);

      // Set damage
      splitProjectile.damage = damage;

      // Create visual elements
      const projectileBody = this.add.circle(0, 0, 4, 0xff9900);
      const glow = this.add.circle(0, 0, 8, 0xff9900, 0.3);

      // Add to container
      splitProjectile.add([glow, projectileBody]);

      // Add to projectiles group
      this.projectiles.add(splitProjectile);

      // Set velocity (slower than parent)
      const speed = 200;
      splitProjectile.body.setVelocity(Math.cos(angle) * speed, Math.sin(angle) * speed);

      // Add pulsing effect
      this.tweens.add({
        targets: glow,
        alpha: { from: 0.3, to: 0.5 },
        scale: { from: 1, to: 1.2 },
        duration: 200,
        yoyo: true,
        repeat: -1
      });

      // Set shorter lifespan
      this.time.delayedCall(1000, () => {
        if (splitProjectile.active) {
          this.createProjectileExplosion(splitProjectile.x, splitProjectile.y, 0xff9900);
          splitProjectile.destroy();
        }
      });
    }

    // Create split effect at parent projectile position
    const splitEffect = this.add.circle(parentProjectile.x, parentProjectile.y, 15, 0xff9900, 0.7);

    // Animate split effect
    this.tweens.add({
      targets: splitEffect,
      alpha: 0,
      scale: 2,
      duration: 300,
      onComplete: () => {
        splitEffect.destroy();
      }
    });
  }

  // Heal the player
  healPlayer(amount) {
    this.playerStats.health = Math.min(this.playerStats.health + amount, this.playerStats.maxHealth);
    this.updateHealthBar();
  }

  // Show floating text
  showFloatingText(text, x, y, color = 0xffffff) {
    const floatingText = this.add.text(x, y, text, {
      fontSize: '20px',
      fontStyle: 'bold',
      fill: `#${color.toString(16).padStart(6, '0')}`,
      stroke: '#000000',
      strokeThickness: 2
    });
    floatingText.setOrigin(0.5);
    floatingText.setDepth(1000);

    // Animate the text floating up and fading out
    this.tweens.add({
      targets: floatingText,
      y: y - 50,
      alpha: 0,
      duration: 1500,
      ease: 'Power2',
      onComplete: () => {
        floatingText.destroy();
      }
    });
  }

  damagePlayer(player, enemy) {
    // Skip if player is invulnerable
    if (player.isInvulnerable) return;

    // Apply damage - different for boss projectiles
    if (enemy.isBossProjectile) {
      this.playerStats.health -= enemy.damage;
    } else {
      // Regular enemy damage
      this.playerStats.health -= 8; // Less damage from enemies
    }

    // Calculate knockback direction (away from enemy)
    const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, player.x, player.y);

    // Reduce knockback distance significantly
    const knockbackDistance = enemy.isBossProjectile ? 40 : 30; // Much smaller knockback
    const knockbackX = Math.cos(angle) * knockbackDistance;
    const knockbackY = Math.sin(angle) * knockbackDistance;

    // Store player's current position
    const startX = player.x;
    const startY = player.y;

    // Calculate target position with bounds checking
    const targetX = Phaser.Math.Clamp(
      startX + knockbackX,
      0 + player.width/2,
      this.mapWidth - player.width/2
    );
    const targetY = Phaser.Math.Clamp(
      startY + knockbackY,
      0 + player.height/2,
      this.mapHeight - player.height/2
    );

    // Apply knockback with smoother animation
    this.tweens.add({
      targets: player,
      x: targetX,
      y: targetY,
      duration: 150, // Faster knockback
      ease: 'Sine.easeOut' // Smoother animation
    });

    // Flash player red
    const redTint = 0xff0000;
    player.setTint(redTint);

    // Create damage effect (red glow)
    const damageEffect = this.add.circle(player.x, player.y, 30, 0xff0000, 0.3);
    damageEffect.setDepth(-1); // Behind player

    // Animate damage effect
    this.tweens.add({
      targets: damageEffect,
      alpha: 0,
      scale: 2,
      duration: 500,
      onUpdate: () => {
        damageEffect.setPosition(player.x, player.y); // Follow player
      },
      onComplete: () => {
        damageEffect.destroy();
      }
    });

    // Make player briefly invulnerable
    player.isInvulnerable = true;

    // Remove red tint after a delay
    this.time.delayedCall(500, () => {
      player.clearTint();
    });

    // End invulnerability after a delay
    this.time.delayedCall(1000, () => {
      player.isInvulnerable = false;
    });

    // Update health display
    this.updateUI();

    // Check for game over
    if (this.playerStats.health <= 0) {
      this.gameOver();
    }
  }

  spawnExpGem(x, y) {
    // Create exp gem using graphics
    const gem = this.add.polygon(x, y, [
      { x: 0, y: -6 },  // top
      { x: 6, y: 0 },   // right
      { x: 0, y: 6 },   // bottom
      { x: -6, y: 0 }   // left
    ], 0x00ff00, 0.8);

    // Add physics body
    this.physics.add.existing(gem);
    gem.body.setSize(12, 12);

    // Add a glow effect
    const glow = this.add.polygon(x, y, [
      { x: 0, y: -8 },  // top
      { x: 8, y: 0 },   // right
      { x: 0, y: 8 },   // bottom
      { x: -8, y: 0 }   // left
    ], 0x00ff00, 0.3);

    // Add properties - more exp per gem
    gem.expValue = 20; // Double exp value
    gem.glow = glow;

    // Add to exp gems group
    this.expGems.add(gem);

    // Add pulsing animation
    this.tweens.add({
      targets: [gem, glow],
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 500,
      yoyo: true,
      repeat: -1
    });

    // Add slight movement
    const angle = Math.random() * Math.PI * 2;
    const speed = 20;
    gem.body.setVelocity(
      Math.cos(angle) * speed,
      Math.sin(angle) * speed
    );

    // Update glow position
    this.time.addEvent({
      delay: 16,
      repeat: 300, // 5 seconds
      callback: () => {
        if (gem.active) {
          glow.setPosition(gem.x, gem.y);
        } else {
          glow.destroy();
        }
      }
    });

    // Set lifespan (gems disappear after 5 seconds)
    this.time.delayedCall(5000, () => {
      if (gem.active) {
        gem.destroy();
        glow.destroy();
      }
    });
  }

  collectExp(player, gem) {
    // Add experience
    this.playerStats.exp += gem.expValue;

    // Check for level up
    if (this.playerStats.exp >= this.playerStats.expToNextLevel) {
      this.levelUp();
    }

    // Update UI
    this.updateUI();

    // Create collection effect
    const collectEffect = this.add.circle(gem.x, gem.y, 10, 0x00ff00, 0.7);
    this.tweens.add({
      targets: collectEffect,
      alpha: 0,
      scale: 2,
      duration: 200,
      onComplete: () => {
        collectEffect.destroy();
      }
    });

    // Destroy gem and its glow
    if (gem.glow) gem.glow.destroy();
    gem.destroy();
  }

  levelUp() {
    // Increase level
    this.playerStats.level++;

    // Reset experience
    this.playerStats.exp -= this.playerStats.expToNextLevel;

    // Increase experience required for next level - slower progression
    this.playerStats.expToNextLevel = Math.floor(this.playerStats.expToNextLevel * 1.1); // Reduced from 1.2 to 1.1

    // Heal player
    this.playerStats.health = this.playerStats.maxHealth;

    // Show skill selection
    this.showSkillSelection();
  }

  showSkillSelection() {
    // Pause game
    this.scene.pause();

    // Generate 3 random skills
    const skillOptions = this.getRandomSkillOptions(3);

    // Launch the skill selection scene
    this.scene.launch('SkillSelectionScene', {
      skillOptions: skillOptions,
      gameScene: this
    });
  }

  getRandomSkillOptions(count) {
    // Copy available skills
    const options = [...this.availableSkills];

    // Shuffle
    for (let i = options.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [options[i], options[j]] = [options[j], options[i]];
    }

    // Return first 'count' skills
    return options.slice(0, count);
  }

  upgradeSkill(skillName) {
    // Find skill
    const skill = this.availableSkills.find(s => s.name === skillName);

    if (skill) {
      // Increase level
      skill.level++;

      // Unlock if not already
      if (!skill.unlocked) {
        skill.unlocked = true;
        this.skills.push(skill);
      }
    }
  }

  getSkillLevel(skillName) {
    const skill = this.availableSkills.find(s => s.name === skillName);
    return skill ? skill.level : 0;
  }

  createUI() {
    // Create UI container
    this.ui = this.add.container(0, 0);

    // Create top UI background
    const topUiBg = this.add.rectangle(0, 0, this.game.config.width, 60, 0x000000, 0.5);
    topUiBg.setOrigin(0, 0);

    // Health bar - positioned at top
    const barWidth = this.game.config.width * 0.6; // 60% of screen width
    const barHeight = 20;
    const barPadding = 10;

    this.healthBar = this.add.rectangle(barPadding, barPadding, barWidth, barHeight, 0xff0000);
    this.healthBar.setOrigin(0);

    // Health text
    this.healthText = this.add.text(barPadding + barWidth / 2, barPadding + barHeight / 2,
      `${this.playerStats.health}/${this.playerStats.maxHealth}`, {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    });
    this.healthText.setOrigin(0.5);

    // Experience bar - positioned below health bar
    this.expBar = this.add.rectangle(barPadding, barPadding + barHeight + 5, barWidth, barHeight / 2, 0x00ff00);
    this.expBar.setOrigin(0);

    // Level and floor info - positioned at top right
    this.levelText = this.add.text(this.game.config.width - barPadding, barPadding,
      `等级: ${this.playerStats.level}`, {
      fontSize: '16px',
      fill: '#ffffff',
      fontStyle: 'bold'
    });
    this.levelText.setOrigin(1, 0);

    // Floor text - below level text
    this.floorText = this.add.text(this.game.config.width - barPadding, barPadding + 20,
      `楼层: ${this.playerStats.floor}/33`, {
      fontSize: '16px',
      fill: '#ffffff'
    });
    this.floorText.setOrigin(1, 0);

    // Kill counter - center of screen, top
    this.killCounterText = this.add.text(this.game.config.width / 2, 10,
      `击杀: ${this.playerStats.enemiesKilled}/${this.playerStats.enemiesRequiredForBoss}`, {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    });
    this.killCounterText.setOrigin(0.5, 0);

    // Add to UI container
    this.ui.add([topUiBg, this.healthBar, this.healthText, this.expBar, this.levelText, this.floorText, this.killCounterText]);

    // Set UI to stay fixed on camera
    this.ui.setScrollFactor(0);
    this.ui.setDepth(1000); // Ensure UI is above everything
  }

  updateUI() {
    // Get bar dimensions
    const barWidth = this.game.config.width * 0.6; // 60% of screen width

    // Update health bar
    this.updateHealthBar();

    // Update experience bar
    const expPercent = this.playerStats.exp / this.playerStats.expToNextLevel;
    this.expBar.width = barWidth * expPercent;

    // Update level text
    this.levelText.setText(`等级: ${this.playerStats.level}`);

    // Update floor text
    this.floorText.setText(`楼层: ${this.playerStats.floor}/33`);

    // Update kill counter
    this.updateKillCounter();
  }

  updateKillCounter() {
    // Update kill counter text
    this.killCounterText.setText(`击杀: ${this.playerStats.enemiesKilled}/${this.playerStats.enemiesRequiredForBoss}`);
  }

  // Update health bar UI
  updateHealthBar() {
    // Get bar dimensions
    const barWidth = this.game.config.width * 0.6; // 60% of screen width

    // Calculate health percentage
    const healthPercent = this.playerStats.health / this.playerStats.maxHealth;

    // Update health bar width
    this.healthBar.width = barWidth * healthPercent;

    // Update health text
    this.healthText.setText(`${Math.ceil(this.playerStats.health)}/${this.playerStats.maxHealth}`);
    this.healthText.x = 10 + (barWidth * healthPercent) / 2; // Keep text centered on visible part of bar

    // Change color based on health percentage
    if (healthPercent <= 0.2) {
      // Critical health - red pulsing
      this.healthBar.setFillStyle(0xff0000);

      // Add pulsing effect if not already pulsing
      if (!this.healthPulseActive) {
        this.healthPulseActive = true;
        this.tweens.add({
          targets: this.healthBar,
          alpha: { from: 1, to: 0.6 },
          duration: 500,
          yoyo: true,
          repeat: -1
        });
      }
    } else if (healthPercent <= 0.5) {
      // Low health - orange
      this.healthBar.setFillStyle(0xff6600);

      // Remove pulsing effect if active
      if (this.healthPulseActive) {
        this.healthPulseActive = false;
        this.tweens.killTweensOf(this.healthBar);
        this.healthBar.alpha = 1;
      }
    } else {
      // Normal health - red
      this.healthBar.setFillStyle(0xff0000);

      // Remove pulsing effect if active
      if (this.healthPulseActive) {
        this.healthPulseActive = false;
        this.tweens.killTweensOf(this.healthBar);
        this.healthBar.alpha = 1;
      }
    }
  }

  gameOver() {
    // Pause game scene
    this.scene.pause();

    // Launch the game over scene
    this.scene.launch('GameOverScene', {
      level: this.playerStats.level,
      floor: this.playerStats.floor
    });
  }

  advanceFloor() {
    // Increase floor
    this.playerStats.floor++;

    // Reset enemy kill counter
    this.playerStats.enemiesKilled = 0;

    // Increase required enemies for next floor - progressive difficulty
    // First few floors are easier, then difficulty increases more rapidly
    if (this.playerStats.floor <= 5) {
      // Floors 1-5: Linear increase (10, 20, 30, 40, 50)
      this.playerStats.enemiesRequiredForBoss = 10 * this.playerStats.floor;
    } else if (this.playerStats.floor <= 15) {
      // Floors 6-15: Steeper increase
      this.playerStats.enemiesRequiredForBoss = 50 + (this.playerStats.floor - 5) * 15;
    } else {
      // Floors 16+: Even steeper increase
      this.playerStats.enemiesRequiredForBoss = 200 + (this.playerStats.floor - 15) * 20;
    }

    console.log(`Floor ${this.playerStats.floor}: Need to kill ${this.playerStats.enemiesRequiredForBoss} enemies for boss`);

    // Update UI
    this.updateUI();

    // Increase enemy spawn rate and speed
    this.enemySpawnTime = Math.max(200, this.enemySpawnTime - 50);
    this.enemySpeed += 5;

    // Check for boss floor
    if (this.playerStats.floor === 33) {
      // Final boss - Gaia
      const finalBoss = this.spawnBoss('盖亚', 2000); // Final boss with Chinese name

      // Special properties for the final boss
      if (finalBoss) {
        finalBoss.setScale(2.5); // Bigger than regular bosses
        finalBoss.attackCooldown = 800; // Attack more frequently
        finalBoss.health *= 1.5; // 50% more health
        finalBoss.maxHealth = finalBoss.health;

        // Update health bar to reflect new max health
        if (finalBoss.healthBar) {
          finalBoss.healthBar.width = (this.game.config.width * 0.8);
        }

        console.log('Final boss Gaia spawned with special properties!');
      }
    }
  }

  spawnBoss(name = '楼层首领', health = 500) {
    console.log(`Spawning boss: ${name} with base health: ${health}`);

    // Check if there's already a boss active
    const existingBosses = this.enemies.getChildren().filter(e => e.isBoss);
    if (existingBosses.length > 0) {
      console.log('Boss already exists, not spawning another one');
      return existingBosses[0];
    }

    // 生成当前楼层的Boss名称
    const bossNames = [
      '影目守卫者', '数据挖掘者', '系统入侵者', '网络幽灵',
      '代码猜想者', '虚拟操纵者', '信息盗取者', '意识操控者',
      '认知污染者', '记忆窃取者', '现实扰乱者', '幻觉编织者',
      '思想入侵者', '影目守护者', '数字幽灵', '意识流浪者',
      '虚拟精神病毒', '影目核心', '数据吞噬者', '系统分裂者',
      '认知重写者', '影目幻象', '数字幻术师', '虚拟现实组装者',
      '影目主脑', '数据吞噬者', '系统入侵者', '意识网络编织者',
      '影目幻象使者', '数字意识操控者', '虚拟现实组装者', '盖亚分身',
      '盖亚意识'
    ];

    // 根据当前楼层选择Boss名称
    const bossName = this.playerStats.floor <= bossNames.length
      ? bossNames[this.playerStats.floor - 1]
      : `盖亚分身 ${this.playerStats.floor}`;

    // 使用生成的Boss名称
    name = bossName;

    // Create boss near the player
    const offsetX = Phaser.Math.Between(-200, 200);
    const offsetY = Phaser.Math.Between(-200, 200);
    const bossX = this.player.x + offsetX;
    const bossY = this.player.y + offsetY;

    // Ensure boss is within world bounds
    const clampedX = Phaser.Math.Clamp(bossX, 100, this.mapWidth - 100);
    const clampedY = Phaser.Math.Clamp(bossY, 100, this.mapHeight - 100);

    // Create boss with the appropriate image for the current floor
    let bossTexture = 'enemy'; // Default fallback

    // Try to use the boss image for the current floor
    const bossImageKey = `boss${this.playerStats.floor}`;
    if (this.textures.exists(bossImageKey)) {
      bossTexture = bossImageKey;
      console.log(`Using boss image: ${bossImageKey}`);
    } else {
      console.log(`Boss image ${bossImageKey} not found, using default enemy image`);
    }

    // Create boss with the selected texture
    const boss = this.enemies.create(clampedX, clampedY, bossTexture);

    // Scale boss appropriately (may need adjustment based on your boss images)
    if (bossTexture === 'enemy') {
      boss.setScale(3); // Default scale for enemy texture
      boss.setTint(0xff00ff); // Purple tint for default enemy
    } else {
      boss.setScale(1.5); // Custom scale for boss textures
    }

    // Set boss properties
    const actualHealth = health + (this.playerStats.floor * 50); // Scale with floor
    boss.health = actualHealth;
    boss.maxHealth = actualHealth; // Store max health
    boss.isBoss = true;
    boss.name = name;
    boss.attackCooldown = 1000;
    boss.lastAttack = 0;

    console.log(`Boss created with ${boss.health} health`);

    // Create boss health bar
    const barWidth = this.game.config.width * 0.8;
    const barHeight = 15;
    const barX = (this.game.config.width - barWidth) / 2;
    const barY = 70;

    boss.healthBar = this.add.rectangle(barX, barY, barWidth, barHeight, 0xff0000);
    boss.healthBar.setOrigin(0, 0);
    boss.healthBar.setScrollFactor(0);
    boss.healthBar.setDepth(1001);

    // Add boss name text
    boss.nameText = this.add.text(this.game.config.width / 2, barY - 10, name, {
      fontSize: '18px',
      fill: '#ffffff',
      fontStyle: 'bold'
    });
    boss.nameText.setOrigin(0.5, 0.5);
    boss.nameText.setScrollFactor(0);
    boss.nameText.setDepth(1001);

    // Make sure physics body is enabled and has correct size
    this.physics.world.enable(boss);
    boss.body.setSize(boss.width * 0.7, boss.height * 0.7);

    // Add event for boss destruction to clean up UI elements
    boss.on('destroy', () => {
      if (boss.healthBar && boss.healthBar.active) boss.healthBar.destroy();
      if (boss.nameText && boss.nameText.active) boss.nameText.destroy();
      console.log('Boss destroyed, UI elements cleaned up');
    });

    // 显示Boss出场对话
    this.time.delayedCall(500, () => {
      if (boss.active) {
        // 选择一个关于影目AR的对话
        const bossIntroQuotes = [
          `我是${name}，影目AR的守护者！`,
          `影目AR将改变这个世界，而你将成为历史！`,
          `欢迎来到第${this.playerStats.floor}层，冯老师。这里将成为你的坟墓！`,
          `影目AR已经完全控制了这栋大楼，你无处可逃！`,
          `盖亚已经预见了你的到来，冯老师。我将终结你的干扰！`
        ];

        // 随机选择一个对话
        const introQuote = bossIntroQuotes[Math.floor(Math.random() * bossIntroQuotes.length)];
        this.showQuote(introQuote, boss);

        // 在第一次对话后显示第二次对话
        this.time.delayedCall(3500, () => {
          if (boss.active) {
            // 选择一个关于影目AR的对话
            const quote = this.bossQuotes[Math.floor(Math.random() * this.bossQuotes.length)];
            this.showQuote(quote, boss);
          }
        });
      }
    });

    // Boss behavior will be handled in updateEnemies
    return boss;
  }
}

export default GameScene;
