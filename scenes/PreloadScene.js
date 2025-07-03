export default class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: 'PreloadScene' });
  }

  preload() {
    // cargar recursos del juego: tablero, fichas, dados, UI
    // ejemplo: this.load.image('board', 'assets/board.png');
  }

  create() {
    // una vez cargados los recursos, iniciar escena principal
    this.scene.start('GameScene');
  }
} 