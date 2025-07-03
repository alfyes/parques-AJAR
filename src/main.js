import BootScene from '../scenes/BootScene.js';
import PreloadScene from '../scenes/PreloadScene.js';
import GameScene from '../scenes/GameScene.js';
import UIScene from '../scenes/UIScene.js';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 600,
  backgroundColor: '#1d2430',
  scene: [BootScene, PreloadScene, GameScene, UIScene],
  physics: {
    default: 'arcade',
    arcade: { debug: false }
  }
};

window.onload = () => {
  new Phaser.Game(config);
}; 