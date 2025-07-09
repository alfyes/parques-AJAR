import Board from '../classes/Board.js';
import Dice from '../classes/Dice.js';
import Player from '../classes/Player.js';

export default class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
    this.currentDice = null;
    this.moveMarkers = [];
    this.selectedPiece = null;
    // índice del jugador actual
    this.currentPlayerIdx = 0;
    // número de tiros restantes en el turno
    this.rollsLeft = 0;
  }

  create() {
    // instanciar y renderizar tablero
    this.board = new Board(this);
    this.drawBoard();
    // lanzar la escena de UI para mostrar controles de dados
    this.scene.launch('UIScene');
    // inicializar turnos y tiros tras el lanzamiento de la UI (demorar un tick)
    this.time.delayedCall(0, () => {
      this.resetRolls();
      this.game.events.emit('turnChanged', this.currentPlayerIdx);
      this.game.events.emit('rollsLeft', this.rollsLeft);
      this.enableCurrentPlayerPieces();
    }, null, this);

    // configurar 4 jugadores (1 local + 3 CPU) y dibujar fichas en casas
    this.players = [];
    const homeTypes = ['home-red', 'home-yellow', 'home-green', 'home-blue'];
    const colorValues = [0xff6666, 0xffff66, 0x66ff66, 0x6666ff];
    for (let i = 0; i < 4; i++) {
      const isCPU = i !== 0;
      const player = new Player(i, colorValues[i], isCPU);
      this.players.push(player);
      const homeCells = this.board.getCells().filter(c => c.type === homeTypes[i]);
      homeCells.forEach((cell, idx) => {
        const radius = this.board.cellSize / 2 - 4;
        // crear pieza con el color de la casa y borde negro
        const circle = this.add.circle(
          cell.x + this.board.cellSize/2,
          cell.y + this.board.cellSize/2,
          radius,
          colorValues[i],
          1
        ).setStrokeStyle(2, 0x000000);
        const piece = player.pieces[idx];
        piece.sprite = circle;
      });
    }

    // inicializar mecánica de dados
    this.dice = new Dice();
    // escuchar botón de tiro desde UIScene
    this.game.events.on('rollDice', () => {
      const [d1, d2] = this.dice.roll();
      this.game.events.emit('diceRolled', d1, d2);
    });

    // escuchar evento de dados y preparar selección para el jugador actual
    this.game.events.on('diceRolled', (d1, d2) => {
      this.currentDice = [d1, d2];
      this.enableCurrentPlayerPieces();
    });
    this.enableCurrentPlayerPieces();
  }

  /**
   * Dibuja todas las casillas del tablero usando Graphics.
   */
  drawBoard() {
    const graphics = this.add.graphics();
    this.board.getCells().forEach(cell => {
      let color = 0xffffff;
      switch (cell.type) {
        case 'home-red': color = 0xff6666; break;
        case 'home-yellow': color = 0xffff66; break;
        case 'home-green': color = 0x66ff66; break;
        case 'home-blue': color = 0x6666ff; break;
        case 'safe': color = 0x999999; break;
        default: break;
      }
      graphics.fillStyle(color).fillRect(cell.x, cell.y, this.board.cellSize, this.board.cellSize);
      graphics.lineStyle(1, 0x000000).strokeRect(cell.x, cell.y, this.board.cellSize, this.board.cellSize);
    });
  }

  /**
   * Maneja selección de una ficha y resalta posibles movimientos.
   */
  selectPiece(piece) {
    if (!this.currentDice) return;
    this.selectedPiece = piece;
    const moves = this.board.getPossibleMoves(piece, this.currentDice);
    this.clearHighlights();
    moves.forEach(cell => {
      // dibujar círculo indicador de movimiento
      const radius = this.board.cellSize / 2 - 4;
      const marker = this.add.circle(
        cell.x + this.board.cellSize/2,
        cell.y + this.board.cellSize/2,
        radius,
        0x00ff00,
        0.5
      ).setInteractive();
      marker.on('pointerdown', () => this.movePiece(piece, cell));
      marker.setDepth(1);
      this.moveMarkers.push(marker);
    });
  }

  /**
   * Mueve la ficha al destino y limpia resaltados.
   */
  movePiece(piece, cell) {
    // capturar fichas enemigas según routeIndex (no safe)
    const newIndex = this.board.route.indexOf(cell);
    console.log('movePiece: newIndex =', newIndex);
    if (cell.type !== 'safe') {
      this.players.forEach(pl => {
        if (pl.id !== piece.player.id) {
          pl.pieces.forEach(p2 => {
            console.log(`Comparando captura en player ${pl.id}, pieza ${p2.index}: routeIndex = ${p2.routeIndex}, newIndex = ${newIndex}`);
            if (p2.routeIndex === newIndex) {
              // regresar ficha enemiga a casa
              p2.routeIndex = -1;
              // ubicar ficha capturada en primer home libre para evitar solapamientos
              const homeType = ['home-red','home-yellow','home-green','home-blue'][pl.id];
              const homeCells = this.board.getCells().filter(c => c.type === homeType);
              // buscar celda libre
              let cellHome = homeCells.find(c => {
                const px = c.x + this.board.cellSize/2;
                const py = c.y + this.board.cellSize/2;
                return !pl.pieces.some(p3 => p3.routeIndex < 0 && p3 !== p2 && p3.sprite.x === px && p3.sprite.y === py);
              });
              if (!cellHome) cellHome = homeCells[0];
              p2.sprite.x = cellHome.x + this.board.cellSize/2;
              p2.sprite.y = cellHome.y + this.board.cellSize/2;
              // pintar con color original del jugador y mantener borde
              p2.sprite.setFillStyle(p2.player.color, 1).setStrokeStyle(2, 0x000000);
              p2.sprite.setDepth(1);
              console.log(`pieza capturada: player ${pl.id}, index ${p2.index}, reposicionada en home (x,y)=(${p2.sprite.x},${p2.sprite.y})`);
            }
          });
        }
      });
    }
    // mover ficha propia
    piece.sprite.x = cell.x + this.board.cellSize/2;
    piece.sprite.y = cell.y + this.board.cellSize/2;
    // aplicar el color del jugador a la pieza
    piece.sprite.setFillStyle(piece.player.color, 1).setStrokeStyle(2, 0x000000);
    // actualizar índice de ruta
    piece.routeIndex = newIndex;
    this.clearHighlights();
    // calcular extraRoll: par o captura
    const isDouble = this.currentDice[0] === this.currentDice[1];
    const didCapture = cell.type !== 'safe' && this.players.some(pl =>
      pl.id !== piece.player.id && pl.pieces.some(p2 => p2.routeIndex === -1)
    );
    this.endTurn(isDouble || didCapture);
  }

  /** Elimina resaltados de movimiento anteriores. */
  clearHighlights() {
    this.moveMarkers.forEach(m => m.destroy());
    this.moveMarkers = [];
  }

  update(time, delta) {
    // game loop
  }

  /** Habilita la interactividad sólo para el jugador actual */
  enableCurrentPlayerPieces() {
    this.players.forEach((pl, idx) => {
      pl.pieces.forEach(p => {
        p.sprite.removeAllListeners();
        p.sprite.disableInteractive();
        if (idx === this.currentPlayerIdx && this.currentDice) {
          p.sprite.setInteractive();
          p.sprite.on('pointerdown', () => this.selectPiece(p));
        }
      });
    });
  }

  /** Finaliza el turno; si extraRoll se omite o es false, consume tiro y cambia turno si se agotan */
  endTurn(extraRoll = false) {
    // consumir un tiro y añadir extra si corresponde
    this.rollsLeft = this.rollsLeft - 1 + (extraRoll ? 1 : 0);
    if (this.rollsLeft <= 0) {
      // avanzar turno
      this.currentPlayerIdx = (this.currentPlayerIdx + 1) % this.players.length;
      this.resetRolls();
      this.game.events.emit('turnChanged', this.currentPlayerIdx);
    }
    // notificar tiros restantes y habilitar piezas
    this.game.events.emit('rollsLeft', this.rollsLeft);
    this.enableCurrentPlayerPieces();
  }

  /** Inicializa rollsLeft según fichas en casa: 3 intentos si todas en casa, sino 1 */
  resetRolls() {
    const pl = this.players[this.currentPlayerIdx];
    const allInHome = pl.pieces.every(p => p.routeIndex < 0);
    this.rollsLeft = allInHome ? 3 : 1;
  }
} 