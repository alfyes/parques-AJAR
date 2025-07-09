export default class HelpSystem {
  constructor(scene) {
    this.scene = scene;
    this.helpContainer = null;
    this.helpText = null;
    this.helpButton = null;
    this.isHelpVisible = false;
    this.tutorialVisible = false;
    this.currentMessage = '';
    
    this.createHelpUI();
    this.setupEventListeners();
  }

  createHelpUI() {
    const { width, height } = this.scene.scale;
    
    // Botón de ayuda en la esquina superior derecha
    this.helpButton = this.scene.add.rectangle(width - 30, 30, 50, 30, 0x4CAF50)
      .setInteractive()
      .setStrokeStyle(2, 0x2E7D32)
      .setDepth(1500); // Encima de elementos del juego pero debajo de ayuda
    
    this.helpButtonText = this.scene.add.text(width - 30, 30, '?', { 
      fontSize: '18px', 
      fill: '#fff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setDepth(1501);

    // Panel de ayuda contextual (inicialmente oculto)
    this.helpContainer = this.scene.add.container(width/2, 80);
    this.helpBackground = this.scene.add.rectangle(0, 0, width - 100, 120, 0x1a1a1a, 0.95)
      .setStrokeStyle(3, 0x4CAF50);
    
    this.helpText = this.scene.add.text(0, 0, '', {
      fontSize: '14px',
      fill: '#ffffff',
      align: 'center',
      wordWrap: { width: width - 140 }
    }).setOrigin(0.5);

    this.helpContainer.add([this.helpBackground, this.helpText]);
    this.helpContainer.setVisible(false);
    this.helpContainer.setDepth(50000); // Profundidad muy alta para estar encima de todo

    // Botón para cerrar ayuda
    this.closeHelpButton = this.scene.add.rectangle(width/2 + (width - 100)/2 - 15, 80 - 60 + 15, 20, 20, 0xff4444)
      .setInteractive()
      .setStrokeStyle(1, 0xaa0000)
      .setVisible(false)
      .setDepth(50001); // Encima del panel de ayuda
    
    this.closeHelpText = this.scene.add.text(width/2 + (width - 100)/2 - 15, 80 - 60 + 15, '×', {
      fontSize: '14px',
      fill: '#fff',
      fontStyle: 'bold'
    }).setOrigin(0.5).setVisible(false).setDepth(50002);

    // Tutorial overlay (modal completo)
    this.createTutorialOverlay();

    // Añadir animaciones de hover para el botón de ayuda
    this.helpButton.on('pointerover', () => {
      if (!this.isHelpVisible) {
        this.scene.tweens.add({
          targets: [this.helpButton, this.helpButtonText],
          scaleX: 1.1,
          scaleY: 1.1,
          duration: 150,
          ease: 'Back.easeOut'
        });
      }
    });
    
    this.helpButton.on('pointerout', () => {
      this.scene.tweens.add({
        targets: [this.helpButton, this.helpButtonText],
        scaleX: 1,
        scaleY: 1,
        duration: 150,
        ease: 'Back.easeOut'
      });
    });

    // Eventos de botones
    this.helpButton.on('pointerdown', () => {
      // Animación de click
      this.scene.tweens.add({
        targets: [this.helpButton, this.helpButtonText],
        scaleX: 0.9,
        scaleY: 0.9,
        duration: 80,
        ease: 'Quad.easeOut',
        yoyo: true
      });
      
      // Reproducir sonido de click
      if (this.scene.audioManager) {
        this.scene.audioManager.playButtonClick();
      }
      
      this.toggleHelp();
    });
    
    this.closeHelpButton.on('pointerdown', () => {
      // Reproducir sonido de click
      if (this.scene.audioManager) {
        this.scene.audioManager.playButtonClick();
      }
      this.hideHelp();
    });
  }

  createTutorialOverlay() {
    const { width, height } = this.scene.scale;
    
    // Crear elementos del tutorial directamente sin container para mejor control de depth
    this.tutorialBackground = this.scene.add.rectangle(width/2, height/2, width, height, 0x000000, 0.98)
      .setDepth(99990)
      .setVisible(false);
    
    // Panel principal del tutorial
    this.tutorialPanel = this.scene.add.rectangle(width/2, height/2, width - 50, height - 100, 0x1a1a1a)
      .setStrokeStyle(3, 0x4CAF50)
      .setDepth(99991)
      .setVisible(false);
    
    // Título del tutorial - posicionado en la parte superior del panel
    this.tutorialTitle = this.scene.add.text(width/2, height/2 - (height - 100)/2 + 50, 'PARQUÉS - INSTRUCCIONES', {
      fontSize: '22px',
      fill: '#4CAF50',
      fontStyle: 'bold',
      align: 'center'
    }).setOrigin(0.5)
      .setDepth(99992)
      .setVisible(false);

    // Contenido del tutorial - ajustado para quedar debajo del título
    const tutorialContent = this.getTutorialContent();
    this.tutorialText = this.scene.add.text(width/2, height/2 + 10, tutorialContent, {
      fontSize: '13px',
      fill: '#ffffff',
      align: 'left',
      wordWrap: { width: width - 140 },
      lineSpacing: 4
    }).setOrigin(0.5)
      .setDepth(99993)
      .setVisible(false);

    // Botones del tutorial - movidos más abajo para no tapar el texto
    this.closeTutorialButton = this.scene.add.rectangle(width/2 - 80, height/2 + (height - 100)/2 - 15, 120, 40, 0x4CAF50)
      .setInteractive()
      .setStrokeStyle(2, 0x2E7D32)
      .setDepth(99994)
      .setVisible(false);
    
    this.closeTutorialText = this.scene.add.text(width/2 - 80, height/2 + (height - 100)/2 - 15, 'ENTENDIDO', {
      fontSize: '16px',
      fill: '#fff',
      fontStyle: 'bold'
    }).setOrigin(0.5)
      .setDepth(99995)
      .setVisible(false);
    
    // Botón para mostrar ayuda contextual
    this.showHelpButton = this.scene.add.rectangle(width/2 + 80, height/2 + (height - 100)/2 - 15, 120, 40, 0x2196F3)
      .setInteractive()
      .setStrokeStyle(2, 0x1976D2)
      .setDepth(99994)
      .setVisible(false);
    
    this.showHelpButtonText = this.scene.add.text(width/2 + 80, height/2 + (height - 100)/2 - 15, 'VER AYUDA', {
      fontSize: '16px',
      fill: '#fff',
      fontStyle: 'bold'
    }).setOrigin(0.5)
      .setDepth(99995)
      .setVisible(false);

    // Almacenar todos los elementos en un array para fácil manejo
    this.tutorialElements = [
      this.tutorialBackground,
      this.tutorialPanel,
      this.tutorialTitle,
      this.tutorialText,
      this.closeTutorialButton,
      this.closeTutorialText,
      this.showHelpButton,
      this.showHelpButtonText
    ];

    // Eventos para tutorial con animaciones
    this.closeTutorialButton.on('pointerover', () => {
      this.scene.tweens.add({
        targets: [this.closeTutorialButton, this.closeTutorialText],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        ease: 'Quad.easeOut'
      });
    });
    
    this.closeTutorialButton.on('pointerout', () => {
      this.scene.tweens.add({
        targets: [this.closeTutorialButton, this.closeTutorialText],
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Quad.easeOut'
      });
    });
    
    this.showHelpButton.on('pointerover', () => {
      this.scene.tweens.add({
        targets: [this.showHelpButton, this.showHelpButtonText],
        scaleX: 1.05,
        scaleY: 1.05,
        duration: 100,
        ease: 'Quad.easeOut'
      });
    });
    
    this.showHelpButton.on('pointerout', () => {
      this.scene.tweens.add({
        targets: [this.showHelpButton, this.showHelpButtonText],
        scaleX: 1,
        scaleY: 1,
        duration: 100,
        ease: 'Quad.easeOut'
      });
    });
    
    this.closeTutorialButton.on('pointerdown', () => {
      // Animación de click
      this.scene.tweens.add({
        targets: [this.closeTutorialButton, this.closeTutorialText],
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 80,
        ease: 'Quad.easeOut',
        yoyo: true
      });
      
      // Reproducir sonido de click
      if (this.scene.audioManager) {
        this.scene.audioManager.playButtonClick();
      }
      
      this.hideTutorial();
    });
    
    this.showHelpButton.on('pointerdown', () => {
      // Animación de click
      this.scene.tweens.add({
        targets: [this.showHelpButton, this.showHelpButtonText],
        scaleX: 0.95,
        scaleY: 0.95,
        duration: 80,
        ease: 'Quad.easeOut',
        yoyo: true
      });
      
      // Reproducir sonido de click
      if (this.scene.audioManager) {
        this.scene.audioManager.playButtonClick();
      }
      
      this.hideTutorial();
      this.showHelp();
    });
    
    this.tutorialBackground.setInteractive().on('pointerdown', () => this.hideTutorial());
  }

  getTutorialContent() {
    return `OBJETIVO: Ser el primero en llevar las 4 fichas a la META (casillas con banderas).

FASES DEL JUEGO:

1. SACANDO FICHAS:
   • Necesitas DOBLES para sacar fichas de casa
   • Tienes hasta 3 intentos por turno
   • Al sacar dobles: coloca una ficha y muévela

2. MOVIMIENTO NORMAL:
   • Cada tirada da 2 movimientos independientes
   • Puedes usar ambos dados en la misma ficha o repartirlos
   • Los dobles dan una tirada extra

REGLAS ESPECIALES:
   • Casillas GRISES son seguras (no puedes ser comido)
   • Si caes en ficha enemiga, la envías a casa
   • 3 dobles seguidos: última ficha va directo a meta

CONTROLES:
   • Haz clic en "Tirar dados" para jugar
   • Selecciona ficha y luego destino verde`;
  }

  setupEventListeners() {
    // Escuchar cambios de estado del juego para actualizar mensajes
    this.scene.game.events.on('turnStateChanged', (state) => {
      this.updateContextualHelp(state);
    });

    this.scene.game.events.on('rollsLeft', (rolls) => {
      this.updateContextualHelp(null, { rollsLeft: rolls });
    });

    this.scene.game.events.on('movementsLeft', (movements) => {
      this.updateContextualHelp(null, { movementsLeft: movements });
    });

    this.scene.game.events.on('turnChanged', (playerIdx) => {
      this.updateContextualHelp(null, { currentPlayer: playerIdx });
    });
  }

  updateContextualHelp(state, additionalData = {}) {
    const gameState = state || this.scene.turnState;
    const rollsLeft = additionalData.rollsLeft ?? this.scene.rollsLeft;
    const movementsLeft = additionalData.movementsLeft ?? this.scene.movementsLeft;
    const currentPlayer = additionalData.currentPlayer ?? this.scene.currentPlayerIdx;
    
    let message = '';
    
    const playerNames = ['Rojo', 'Verde', 'Azul', 'Amarillo'];
    const playerName = playerNames[currentPlayer];

    if (gameState === 'INITIAL_ROLLS') {
      if (rollsLeft > 0) {
        message = `${playerName}: Haz clic en "Tirar dados" para intentar sacar DOBLES. ${rollsLeft} intento(s) restante(s).`;
      } else {
        message = `${playerName}: Sin más intentos. Fin del turno.`;
      }
    } else if (gameState === 'NORMAL_MOVEMENT') {
      if (movementsLeft > 0) {
        message = `${playerName}: Haz clic en una ficha, luego en el destino verde. ${movementsLeft} movimiento(s) pendiente(s).`;
      } else if (rollsLeft > 0) {
        message = `${playerName}: ¡Dobles! Haz clic en "Tirar dados" para tu tirada extra.`;
      } else {
        message = `${playerName}: Turno completado. El siguiente jugador puede tirar.`;
      }
    }

    this.currentMessage = message;
    
    // Si la ayuda está visible, actualizar el texto
    if (this.isHelpVisible) {
      this.helpText.setText(message);
    }
  }

  toggleHelp() {
    if (this.isHelpVisible) {
      this.hideHelp();
    } else {
      this.showHelp();
    }
  }

  showHelp() {
    // Ocultar botón de ayuda principal
    this.helpButton.setVisible(false);
    this.helpButtonText.setVisible(false);
    
    this.helpText.setText(this.currentMessage);
    this.helpContainer.setVisible(true);
    this.closeHelpButton.setVisible(true);
    this.closeHelpText.setVisible(true);
    this.isHelpVisible = true;
    // Notificar que la ayuda está activa para ocultar UI
    this.scene.game.events.emit('helpStateChanged', true);
  }

  hideHelp() {
    this.helpContainer.setVisible(false);
    this.closeHelpButton.setVisible(false);
    this.closeHelpText.setVisible(false);
    
    // Restaurar botón de ayuda principal
    this.helpButton.setVisible(true);
    this.helpButtonText.setVisible(true);
    
    this.isHelpVisible = false;
    // Notificar que la ayuda se cerró para mostrar UI
    this.scene.game.events.emit('helpStateChanged', false);
  }

  showTutorial() {
    // Ocultar botón de ayuda principal
    this.helpButton.setVisible(false);
    this.helpButtonText.setVisible(false);
    
    // Mostrar todos los elementos del tutorial
    this.tutorialElements.forEach(element => element.setVisible(true));
    this.tutorialVisible = true;
    // Notificar que el tutorial está activo para deshabilitar interacciones y ocultar UI
    this.scene.game.events.emit('tutorialStateChanged', true);
  }

  hideTutorial() {
    // Ocultar todos los elementos del tutorial
    this.tutorialElements.forEach(element => element.setVisible(false));
    
    // Restaurar botón de ayuda principal
    this.helpButton.setVisible(true);
    this.helpButtonText.setVisible(true);
    
    this.tutorialVisible = false;
    // Notificar que el tutorial se cerró para rehabilitar interacciones y mostrar UI
    this.scene.game.events.emit('tutorialStateChanged', false);
  }

  // Método para mostrar mensajes temporales de eventos específicos
  showTemporaryMessage(message, duration = 3000) {
    const tempText = this.scene.add.text(this.scene.scale.width/2, 150, message, {
      fontSize: '16px',
      fill: '#FFD700',
      fontStyle: 'bold',
      align: 'center',
      backgroundColor: 'rgba(0,0,0,0.7)',
      padding: { x: 10, y: 5 }
    }).setOrigin(0.5).setDepth(999);

    this.scene.time.delayedCall(duration, () => {
      tempText.destroy();
    });
  }
} 