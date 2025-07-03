export default class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: 'BootScene' });
  }

  preload() {
    // aquí precargaremos recursos básicos (por ejemplo, barra de carga)
  }

  create() {
    // iniciar escena de precarga
    this.scene.start('PreloadScene');
  }
} 