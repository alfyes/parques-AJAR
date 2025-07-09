export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    const { width, height } = this.scale;
    // texto de turno activo
    const turnNames = ['Rojo', 'Amarillo', 'Verde', 'Azul'];
    this.turnText = this.add.text(100, 20, 'Turno: Rojo', { fontSize: '20px', fill: '#fff' });
    this.game.events.on('turnChanged', idx => {
      this.turnText.setText(`Turno: ${turnNames[idx]}`);
    });
    // texto de tiros restantes
    this.rollsText = this.add.text(300, 20, 'Tiros: 0', { fontSize: '20px', fill: '#fff' });
    this.game.events.on('rollsLeft', n => {
      this.rollsText.setText(`Tiros: ${n}`);
    });
    // botón para tirar dados
    const btn = this.add.rectangle(width - 80, height - 50, 160, 40, 0x888888).setInteractive();
    this.add.text(width - 80, height - 50, 'Tirar dados', { fontSize: '18px', fill: '#000' }).setOrigin(0.5);
    btn.on('pointerdown', () => {
      // animación de tirada: flicker de valores aleatorios
      let count = 0;
      const flicks = 10;
      this.time.addEvent({
        delay: 50,
        repeat: flicks - 1,
        callback: () => {
          const r1 = Phaser.Math.Between(1, 6);
          const r2 = Phaser.Math.Between(1, 6);
          this.diceText.setText(`Dados: ${r1} y ${r2}`);
          count++;
          if (count === flicks) {
            this.game.events.emit('rollDice');
          }
        },
        callbackScope: this
      });
    });

    // texto para mostrar resultados de dados
    this.diceText = this.add.text(width / 2, height - 50, 'Dados: -', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5);

    // actualizar texto al recibir evento
    this.game.events.on('diceRolled', (d1, d2) => {
      this.diceText.setText(`Dados: ${d1} y ${d2}`);
    });
  }
} 