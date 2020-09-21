const ASSET_URL = 'http://localhost:8888/assets/'; // Obtained from the assets folder
const SOCKET_URL = 'ws://localhost:8888';
// We first initialize the phaser game object
const WINDOW_WIDTH = 750;
const WINDOW_HEIGHT = 500;
const game = new Phaser.Game(WINDOW_WIDTH, WINDOW_HEIGHT, Phaser.AUTO, '', {
  preload: preload,
  create: create,
  update: GameLoop,
});

const socket = new WebSocket(SOCKET_URL);

socket.addEventListener('open', function (event) {
  socket.send('Hello Server!');
});

socket.addEventListener('message', function (event) {
  console.log('Message from server ', event.data);
});

const WORLD_SIZE = {
  w: 750,
  h: 500,
};

const water_tiles = [];
const bullet_array = [];

const player = {
  sprite: null, //Will hold the sprite when it's created
  speed_x: 0, // This is the speed it's currently moving at
  speed_y: 0,
  speed: 0.5, // This is the parameter for how fast it should move
  friction: 0.95,
  shot: false,
  update: function () {
    // Lerp rotation towards mouse
    const dx = game.input.mousePointer.x + game.camera.x - this.sprite.x;
    const dy = game.input.mousePointer.y + game.camera.y - this.sprite.y;
    const angle = Math.atan2(dy, dx) - Math.PI / 2;
    let dir = (angle - this.sprite.rotation) / (Math.PI * 2);
    dir -= Math.round(dir);
    dir = dir * Math.PI * 2;
    this.sprite.rotation += dir * 0.1;

    // Move forward
    if (
      game.input.keyboard.isDown(Phaser.Keyboard.W) ||
      game.input.keyboard.isDown(Phaser.Keyboard.UP)
    ) {
      this.speed_x +=
        Math.cos(this.sprite.rotation + Math.PI / 2) * this.speed;
      this.speed_y +=
        Math.sin(this.sprite.rotation + Math.PI / 2) * this.speed;
    }

    this.sprite.x += this.speed_x;
    this.sprite.y += this.speed_y;

    this.speed_x *= this.friction;
    this.speed_y *= this.friction;

    // Shoot bullet
    if (game.input.activePointer.leftButton.isDown && !this.shot) {
      const speed_x = Math.cos(this.sprite.rotation + Math.PI / 2) * 20;
      const speed_y = Math.sin(this.sprite.rotation + Math.PI / 2) * 20;
      const bullet = {};
      bullet.speed_x = speed_x;
      bullet.speed_y = speed_y;
      bullet.sprite = game.add.sprite(
        this.sprite.x + bullet.speed_x,
        this.sprite.y + bullet.speed_y,
        'bullet',
      );
      bullet_array.push(bullet);
      this.shot = true;
    }
    if (!game.input.activePointer.leftButton.isDown) this.shot = false;

    // To make player flash when they are hit, set player.spite.alpha = 0
    if (this.sprite.alpha < 1) {
      this.sprite.alpha += (1 - this.sprite.alpha) * 0.16;
    } else {
      this.sprite.alpha = 1;
    }
  },
};

function CreateShip (type, x, y, angle) {
  // type is an int that can be between 1 and 6 inclusive
  // returns the sprite just created
  const sprite = game.add.sprite(x, y, 'ship' + String(type) + '_1');
  sprite.rotation = angle;
  sprite.anchor.setTo(0.5, 0.5);
  return sprite;
}

function preload () {
  game.load.crossOrigin = 'Anonymous'; // Allows us to load the sprites off the CDN server
  game.stage.backgroundColor = '#3399DA';

  // Load all the ships
  for (let i = 1; i <= 6; i++) {
    game.load.image(
      'ship' + String(i) + '_1',
      ASSET_URL + 'ship' + String(i) + '_1.png',
    );
    game.load.image(
      'ship' + String(i) + '_2',
      ASSET_URL + 'ship' + String(i) + '_2.png',
    );
    game.load.image(
      'ship' + String(i) + '_3',
      ASSET_URL + 'ship' + String(i) + '_3.png',
    );
    game.load.image(
      'ship' + String(i) + '_4',
      ASSET_URL + 'ship' + String(i) + '_4.png',
    );
  }

  game.load.image('bullet', ASSET_URL + 'cannon_ball.png');
  game.load.image('water', ASSET_URL + 'water_tile.png');
}

function create () {
  // Create water tiles
  for (let i = 0; i <= WORLD_SIZE.w / 64 + 1; i++) {
    for (let j = 0; j <= WORLD_SIZE.h / 64 + 1; j++) {
      const tile_sprite = game.add.sprite(i * 64, j * 64, 'water');
      tile_sprite.anchor.setTo(0.5, 0.5);
      tile_sprite.alpha = 0.5;
      water_tiles.push(tile_sprite);
    }
  }

  // Create player
  const player_ship_type = String(1);
  player.sprite = game.add.sprite(
    (Math.random() * WORLD_SIZE.w) / 2 + WORLD_SIZE.w / 2,
    (Math.random() * WORLD_SIZE.h) / 2 + WORLD_SIZE.h / 2,
    'ship' + player_ship_type + '_1',
  );
  player.sprite.anchor.setTo(0.5, 0.5);

  game.world.setBounds(0, 0, WORLD_SIZE.w, WORLD_SIZE.h);

  game.camera.x = player.sprite.x - WINDOW_WIDTH / 2;
  game.camera.y = player.sprite.y - WINDOW_HEIGHT / 2;

  socket.send(JSON.stringify({
    method: 'new-player',
    body: {
      x: player.sprite.x,
      y: player.sprite.y,
      angle: player.sprite.rotation,
    },
  }));
}

function GameLoop () {
  player.update();

  // Move camera with player
  const camera_x = player.sprite.x - WINDOW_WIDTH / 2;
  const camera_y = player.sprite.y - WINDOW_HEIGHT / 2;
  game.camera.x += (camera_x - game.camera.x) * 0.08;
  game.camera.y += (camera_y - game.camera.y) * 0.08;

  // Update bullets
  for (let i = 0; i < bullet_array.length; i++) {
    const bullet = bullet_array[i];
    bullet.sprite.x += bullet.speed_x;
    bullet.sprite.y += bullet.speed_y;
    // Remove if it goes too far off screen
    if (
      bullet.sprite.x < -10 ||
      bullet.sprite.x > WORLD_SIZE.w ||
      bullet.sprite.y < -10 ||
      bullet.sprite.y > WORLD_SIZE.h
    ) {
      bullet.sprite.destroy();
      bullet_array.splice(i, 1);
      i--;
    }
  }
}

