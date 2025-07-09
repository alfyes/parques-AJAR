export default class UIScene extends Phaser.Scene {
  constructor() {
    super({ key: 'UIScene' });
  }

  create() {
    const { width, height } = this.scale;
    // texto de turno activo
    const turnNames = ['Rojo', 'Amarillo', 'Verde', 'Azul'];
    this.turnText = this.add.text(100, 20, 'Turno: Rojo', { fontSize: '20px', fill: '#fff' }).setDepth(10);
    this.game.events.on('turnChanged', idx => {
      this.turnText.setText(`Turno: ${turnNames[idx]}`);
    });
    // texto de tiros restantes
    this.rollsText = this.add.text(300, 20, 'Tiros: 0', { fontSize: '20px', fill: '#fff' }).setDepth(10);
    this.game.events.on('rollsLeft', n => {
      this.rollsText.setText(`Tiros: ${n}`);
    });
    
    // texto de movimientos restantes
    this.movementsText = this.add.text(450, 20, 'Movimientos: 0', { fontSize: '20px', fill: '#fff' }).setDepth(10);
    this.game.events.on('movementsLeft', n => {
      this.movementsText.setText(`Movimientos: ${n}`);
    });
    
    // texto de estado del turno
    this.stateText = this.add.text(100, 50, 'Estado: Inicial', { fontSize: '16px', fill: '#fff' }).setDepth(10);
    this.game.events.on('turnStateChanged', state => {
      const stateNames = {
        'INITIAL_ROLLS': 'Sacando fichas',
        'NORMAL_MOVEMENT': 'Movimiento normal'
      };
      this.stateText.setText(`Estado: ${stateNames[state] || state}`);
    });
    // botón para tirar dados
    this.diceButton = this.add.rectangle(width - 80, height - 50, 160, 40, 0x888888).setInteractive().setDepth(20);
    this.diceButtonText = this.add.text(width - 80, height - 50, 'Tirar dados', { fontSize: '18px', fill: '#000' }).setOrigin(0.5).setDepth(21);
    
    // Botón de tutorial
    this.tutorialButton = this.add.rectangle(100, height - 50, 140, 30, 0x2196F3)
      .setInteractive()
      .setStrokeStyle(2, 0x1976D2)
      .setDepth(20);
    this.tutorialButtonText = this.add.text(100, height - 50, 'Tutorial', { fontSize: '16px', fill: '#fff' }).setOrigin(0.5).setDepth(21);
    
    // Variables para controlar el estado del botón
    this.canRollDice = true;
    this.movementsLeft = 0;
    this.rollsLeft = 0;
    this.tutorialActive = false; // Nueva variable para controlar tutorial
    this.helpActive = false; // Nueva variable para controlar ayuda
    
    this.diceButton.on('pointerdown', () => {
      if (!this.canRollDice || this.tutorialActive || this.helpActive) return; // No permitir tirar si hay movimientos pendientes, tutorial activo o ayuda activa
      
      // Deshabilitar botón durante la animación
      this.setDiceButtonEnabled(false);
      
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
    this.diceText = this.add.text(width / 2, height - 50, 'Dados: -', { fontSize: '24px', fill: '#fff' }).setOrigin(0.5).setDepth(10);

    // actualizar texto al recibir evento
    this.game.events.on('diceRolled', (d1, d2) => {
      this.diceText.setText(`Dados: ${d1} y ${d2}`);
    });

    // Escuchar cambios en movimientos para controlar el botón
    this.game.events.on('movementsLeft', (n) => {
      this.movementsLeft = n;
      this.updateDiceButtonState();
    });

    // Escuchar cambios en tiros para controlar el botón
    this.game.events.on('rollsLeft', (n) => {
      this.rollsLeft = n;
      this.updateDiceButtonState();
    });

    // Escuchar cuando los dados estén listos
    this.game.events.on('diceReady', (ready) => {
      if (ready) {
        this.updateDiceButtonState();
      }
    });

    // Evento para el botón de tutorial
    this.tutorialButton.on('pointerdown', () => {
      if (this.tutorialActive) return; // Evitar abrir tutorial múltiples veces
      // Obtener la escena del juego y mostrar el tutorial
      const gameScene = this.scene.get('GameScene');
      if (gameScene && gameScene.helpSystem) {
        gameScene.helpSystem.showTutorial();
      }
    });

    // Escuchar cambios en el estado del tutorial
    this.game.events.on('tutorialStateChanged', (isActive) => {
      this.tutorialActive = isActive;
      this.updateDiceButtonState();
      this.updateTutorialButtonState();
      this.setUIVisibility(!isActive && !this.helpActive); // Ocultar/mostrar toda la UI
    });

    // Escuchar cambios en el estado de la ayuda
    this.game.events.on('helpStateChanged', (isActive) => {
      this.helpActive = isActive;
      this.updateDiceButtonState();
      this.updateTutorialButtonState();
      this.setUIVisibility(!isActive && !this.tutorialActive); // Ocultar/mostrar toda la UI
    });
  }

  /** Actualiza el estado del botón de dados según movimientos y tiros pendientes */
  updateDiceButtonState() {
    // Habilitar botón solo si hay tiros disponibles Y no hay movimientos pendientes Y no hay tutorial o ayuda activos
    const shouldEnable = this.rollsLeft > 0 && this.movementsLeft === 0 && !this.tutorialActive && !this.helpActive;
    this.setDiceButtonEnabled(shouldEnable);
  }

  /** Habilita o deshabilita el botón de dados */
  setDiceButtonEnabled(enabled) {
    this.canRollDice = enabled;
    if (enabled) {
      this.diceButton.setFillStyle(0x888888);
      this.diceButtonText.setFill('#000');
      this.diceButton.setInteractive();
    } else {
      this.diceButton.setFillStyle(0x444444);
      this.diceButtonText.setFill('#666');
      this.diceButton.disableInteractive();
    }
  }

  /** Actualiza el estado del botón de tutorial */
  updateTutorialButtonState() {
    if (this.tutorialActive || this.helpActive) {
      this.tutorialButton.setFillStyle(0x1565C0); // Color más oscuro cuando tutorial o ayuda están activos
      this.tutorialButtonText.setFill('#aaa');
      this.tutorialButton.disableInteractive();
    } else {
      this.tutorialButton.setFillStyle(0x2196F3); // Color normal
      this.tutorialButtonText.setFill('#fff');
      this.tutorialButton.setInteractive();
    }
  }

  /** Controla la visibilidad de todos los elementos de la UI */
  setUIVisibility(visible) {
    const elements = [
      this.turnText,
      this.rollsText,
      this.movementsText,
      this.stateText,
      this.diceButton,
      this.diceButtonText,
      this.diceText,
      this.tutorialButton,
      this.tutorialButtonText
    ];

    elements.forEach(element => {
      if (element) {
        element.setVisible(visible);
      }
    });
  }
}