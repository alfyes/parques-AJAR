export default class Dice {
  roll() {
    // genera y retorna dos valores aleatorios entre 1 y 6
    const d1 = Phaser.Math.Between(1, 6);
    const d2 = Phaser.Math.Between(1, 6);
    return [d1, d2];
  }
} 