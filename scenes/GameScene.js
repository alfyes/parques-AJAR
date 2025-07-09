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
    
    // Sistema de estados de turno
    this.turnState = 'INITIAL_ROLLS'; // 'INITIAL_ROLLS' | 'NORMAL_MOVEMENT'
    this.rollsLeft = 0; // intentos restantes en el turno actual
    this.movementsLeft = 0; // movimientos pendientes en turno normal
    this.consecutiveDoubles = 0; // contador de dobles consecutivos
    this.usedDiceValues = []; // valores de dados ya utilizados en movimientos
    this.pendingMovements = []; // movimientos pendientes: [{diceValue, used: false}]
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
      this.game.events.emit('movementsLeft', this.movementsLeft);
      this.game.events.emit('turnStateChanged', this.turnState);
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

    // escuchar evento de dados y manejar según el estado del turno
    this.game.events.on('diceRolled', (d1, d2) => {
      this.handleDiceRoll(d1, d2);
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
    this.clearHighlights();
    
    if (this.turnState === 'NORMAL_MOVEMENT' && this.movementsLeft > 0) {
      // En fase normal: mostrar movimientos para cada dado individual
      this.showIndividualDiceMovements(piece);
    } else {
      // En otras fases: usar lógica anterior
      const moves = this.board.getPossibleMoves(piece, this.currentDice);
      this.showMovementMarkers(piece, moves);
    }
  }

  /** Muestra movimientos individuales por cada dado disponible */
  showIndividualDiceMovements(piece) {
    this.pendingMovements.forEach((movement, index) => {
      if (!movement.used) {
        const moves = this.board.getPossibleMovesForSingleDice(piece, movement.diceValue);
        moves.forEach(cell => {
          const radius = this.board.cellSize / 2 - 4;
          const marker = this.add.circle(
            cell.x + this.board.cellSize/2,
            cell.y + this.board.cellSize/2,
            radius,
            0x00ff00,
            0.5
          ).setInteractive();
          
          // Añadir texto con el valor del dado
          const text = this.add.text(
            cell.x + this.board.cellSize/2,
            cell.y + this.board.cellSize/2,
            movement.diceValue.toString(),
            { fontSize: '12px', fill: '#000' }
          ).setOrigin(0.5);
          
          marker.on('pointerdown', () => this.movePieceWithSingleDice(piece, cell, index));
          marker.setDepth(1);
          text.setDepth(2);
          this.moveMarkers.push(marker);
          this.moveMarkers.push(text);
        });
      }
    });
  }

  /** Muestra marcadores de movimiento estándar */
  showMovementMarkers(piece, moves) {
    moves.forEach(cell => {
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
   * Mueve la ficha usando un solo dado en fase normal.
   */
  movePieceWithSingleDice(piece, cell, movementIndex) {
    // Marcar el movimiento como usado
    this.pendingMovements[movementIndex].used = true;
    this.movementsLeft--;
    
    // Realizar el movimiento y verificar captura
    const didCapture = this.performPieceMovementWithCaptureCheck(piece, cell);
    
    // Verificar si quedan movimientos
    if (this.movementsLeft <= 0) {
      // No quedan movimientos: verificar si hay tirada extra por dobles o captura
      const isDouble = this.currentDice[0] === this.currentDice[1];
      if (isDouble || didCapture) {
        // Tirada extra por dobles o captura
        this.endTurn(true);
      } else {
        // Fin del turno
        this.endTurn(false);
      }
    } else {
      // Aún quedan movimientos: actualizar UI
      this.game.events.emit('movementsLeft', this.movementsLeft);
      this.game.events.emit('diceReady', false); // No se pueden tirar dados mientras hay movimientos pendientes
    }
    
    this.clearHighlights();
  }

  /**
   * Realiza el movimiento y retorna si hubo captura.
   */
  performPieceMovementWithCaptureCheck(piece, cell) {
    const newIndex = this.board.route.indexOf(cell);
    let didCapture = false;
    
    // Verificar captura antes del movimiento
    if (cell.type !== 'safe') {
      this.players.forEach(pl => {
        if (pl.id !== piece.player.id) {
          pl.pieces.forEach(p2 => {
            if (p2.routeIndex === newIndex) {
              didCapture = true;
              // regresar ficha enemiga a casa
              p2.routeIndex = -1;
              // ubicar ficha capturada en primer home libre
              const homeType = ['home-red','home-yellow','home-green','home-blue'][pl.id];
              const homeCells = this.board.getCells().filter(c => c.type === homeType);
              let cellHome = homeCells.find(c => {
                const px = c.x + this.board.cellSize/2;
                const py = c.y + this.board.cellSize/2;
                return !pl.pieces.some(p3 => p3.routeIndex < 0 && p3 !== p2 && p3.sprite.x === px && p3.sprite.y === py);
              });
              if (!cellHome) cellHome = homeCells[0];
              p2.sprite.x = cellHome.x + this.board.cellSize/2;
              p2.sprite.y = cellHome.y + this.board.cellSize/2;
              p2.sprite.setFillStyle(p2.player.color, 1).setStrokeStyle(2, 0x000000);
              p2.sprite.setDepth(1);
              console.log(`Ficha capturada: player ${pl.id}, index ${p2.index}`);
            }
          });
        }
      });
    }
    
    // Mover ficha propia
    piece.sprite.x = cell.x + this.board.cellSize/2;
    piece.sprite.y = cell.y + this.board.cellSize/2;
    piece.sprite.setFillStyle(piece.player.color, 1).setStrokeStyle(2, 0x000000);
    piece.routeIndex = newIndex;
    
    return didCapture;
  }

  /**
   * Realiza el movimiento físico de la ficha (sin lógica de turnos).
   */
  performPieceMovement(piece, cell) {
    // capturar fichas enemigas según routeIndex (no safe)
    const newIndex = this.board.route.indexOf(cell);
    console.log('performPieceMovement: newIndex =', newIndex);
    
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
    
    return newIndex;
  }

  /**
   * Mueve la ficha al destino y limpia resaltados (método legacy).
   */
  movePiece(piece, cell) {
    this.performPieceMovement(piece, cell);
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

  /** Maneja la tirada de dados según el estado del turno */
  handleDiceRoll(d1, d2) {
    this.currentDice = [d1, d2];
    const isDouble = d1 === d2;
    
    if (this.turnState === 'INITIAL_ROLLS') {
      this.handleInitialRolls(d1, d2, isDouble);
    } else if (this.turnState === 'NORMAL_MOVEMENT') {
      this.handleNormalMovement(d1, d2, isDouble);
    }
  }

  /** Maneja las tiradas iniciales (todas las fichas en casa) */
  handleInitialRolls(d1, d2, isDouble) {
    this.rollsLeft--;
    
    if (isDouble) {
      // Conseguimos dobles: colocar ficha y cambiar a fase normal
      console.log(`¡Dobles conseguidos! (${d1},${d2}) - Colocando ficha`);
      this.placeInitialPiece(d1);
      // Cambiar a fase normal con tirada extra por dobles
      this.turnState = 'NORMAL_MOVEMENT';
      this.rollsLeft = 1; // tirada extra por dobles
      this.consecutiveDoubles = 1;
      this.movementsLeft = 0; // se configurará en la próxima tirada
      this.game.events.emit('rollsLeft', this.rollsLeft);
      this.game.events.emit('movementsLeft', this.movementsLeft);
      this.game.events.emit('turnStateChanged', this.turnState);
    } else {
      // No son dobles: consumir intento
      console.log(`No son dobles (${d1},${d2}) - Intentos restantes: ${this.rollsLeft}`);
      if (this.rollsLeft <= 0) {
        // Se agotaron los intentos: pasar turno
        this.endTurn(false);
      } else {
        // Aún quedan intentos: actualizar UI
        this.game.events.emit('rollsLeft', this.rollsLeft);
        this.game.events.emit('diceReady', true);
        this.currentDice = null; // limpiar dados para evitar selección de fichas
      }
    }
  }

  /** Maneja el movimiento en fase normal */
  handleNormalMovement(d1, d2, isDouble) {
    this.rollsLeft--;
    
    // Configurar movimientos pendientes
    this.pendingMovements = [
      { diceValue: d1, used: false },
      { diceValue: d2, used: false }
    ];
    this.movementsLeft = 2;
    
    if (isDouble) {
      this.consecutiveDoubles++;
      console.log(`Dobles en fase normal (${d1},${d2}) - Consecutivos: ${this.consecutiveDoubles}`);
      
      if (this.consecutiveDoubles >= 3) {
        // 3 dobles consecutivos: última ficha movida va a meta
        console.log('¡3 dobles consecutivos! Última ficha movida va a meta');
        this.handleThreeConsecutiveDoubles();
        return;
      }
    } else {
      this.consecutiveDoubles = 0;
    }
    
    // Habilitar selección de fichas
    this.enableCurrentPlayerPieces();
    this.game.events.emit('rollsLeft', this.rollsLeft);
    this.game.events.emit('movementsLeft', this.movementsLeft);
    this.game.events.emit('diceReady', true);
  }

  /** Coloca fichas iniciales según las reglas de dobles */
  placeInitialPiece(diceValue) {
    const player = this.players[this.currentPlayerIdx];
    const piecesInHome = player.pieces.filter(p => p.routeIndex < 0);
    const playerId = this.currentPlayerIdx;
    
    // Obtener el punto de inicio específico del jugador
    const startIndex = this.board.getPlayerStartIndex(playerId);
    const startCell = this.board.route[startIndex];
    
    if (piecesInHome.length >= 2) {
      // Puede introducir dos fichas
      console.log(`Introduciendo dos fichas con dobles ${diceValue} - Jugador ${playerId}`);
      
      // Primera ficha: colocar en salida del jugador y mover
      const firstPiece = piecesInHome[0];
      firstPiece.routeIndex = startIndex;
      firstPiece.sprite.x = startCell.x + this.board.cellSize/2;
      firstPiece.sprite.y = startCell.y + this.board.cellSize/2;
      
      // Mover la primera ficha el valor del dado
      const newIndex = (startIndex + diceValue) % this.board.route.length;
      firstPiece.routeIndex = newIndex;
      const newCell = this.board.route[newIndex];
      firstPiece.sprite.x = newCell.x + this.board.cellSize/2;
      firstPiece.sprite.y = newCell.y + this.board.cellSize/2;
      
      // Segunda ficha: solo colocar en salida del jugador (con pequeño offset)
      const secondPiece = piecesInHome[1];
      secondPiece.routeIndex = startIndex;
      secondPiece.sprite.x = startCell.x + this.board.cellSize/2 + 5; // offset visual
      secondPiece.sprite.y = startCell.y + this.board.cellSize/2 + 5;
      
      console.log(`Dos fichas colocadas: primera movida ${diceValue} casillas, segunda en salida`);
    } else if (piecesInHome.length === 1) {
      // Solo una ficha en casa: colocar y buscar otra ficha en tablero para mover
      console.log(`Solo una ficha en casa, introduciendo y moviendo otra del tablero`);
      
      const lastPiece = piecesInHome[0];
      lastPiece.routeIndex = startIndex;
      lastPiece.sprite.x = startCell.x + this.board.cellSize/2;
      lastPiece.sprite.y = startCell.y + this.board.cellSize/2;
      
      // Buscar otra ficha en el tablero para mover
      const pieceInBoard = player.pieces.find(p => p.routeIndex >= 0 && p !== lastPiece);
      if (pieceInBoard) {
        const currentIndex = pieceInBoard.routeIndex;
        const newIndex = (currentIndex + diceValue) % this.board.route.length;
        
        // Verificar que no se pase de la meta
        const relativePos = this.board.getRelativePosition(playerId, currentIndex);
        const goalPosition = this.board.route.length - 1;
        
        if (relativePos + diceValue <= goalPosition) {
          pieceInBoard.routeIndex = newIndex;
          const newCell = this.board.route[newIndex];
          pieceInBoard.sprite.x = newCell.x + this.board.cellSize/2;
          pieceInBoard.sprite.y = newCell.y + this.board.cellSize/2;
          console.log(`Ficha del tablero movida ${diceValue} casillas`);
        }
      }
    } else {
      // No hay fichas en casa (caso extraño)
      console.log('No hay fichas en casa para colocar');
    }
  }

  /** Maneja el caso de 3 dobles consecutivos */
  handleThreeConsecutiveDoubles() {
    console.log('¡3 dobles consecutivos! Enviando última ficha movida a meta');
    
    // Encontrar la última ficha movida (la que tiene el índice más alto en la ruta)
    const player = this.players[this.currentPlayerIdx];
    const piecesInBoard = player.pieces.filter(p => p.routeIndex >= 0);
    
    if (piecesInBoard.length > 0) {
      // Encontrar la ficha más avanzada (asumiendo que es la última movida)
      const lastMovedPiece = piecesInBoard.reduce((max, piece) => 
        piece.routeIndex > max.routeIndex ? piece : max
      );
      
      // Enviar a meta (final de la ruta)
      const metaIndex = this.board.route.length - 1;
      lastMovedPiece.routeIndex = metaIndex;
      const metaCell = this.board.route[metaIndex];
      lastMovedPiece.sprite.x = metaCell.x + this.board.cellSize/2;
      lastMovedPiece.sprite.y = metaCell.y + this.board.cellSize/2;
      
      console.log(`Ficha ${lastMovedPiece.index} enviada a meta por 3 dobles consecutivos`);
    }
    
    this.endTurn(false);
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
        
        // Solo habilitar si es el jugador actual y hay dados disponibles
        const isCurrentPlayer = idx === this.currentPlayerIdx;
        const hasDice = this.currentDice !== null;
        const canMove = (this.turnState === 'NORMAL_MOVEMENT' && this.movementsLeft > 0) ||
                       (this.turnState === 'INITIAL_ROLLS' && hasDice);
        
        if (isCurrentPlayer && canMove) {
          p.sprite.setInteractive();
          p.sprite.on('pointerdown', () => this.selectPiece(p));
        }
      });
    });
  }

  /** Finaliza el turno; si extraRoll se omite o es false, consume tiro y cambia turno si se agotan */
  endTurn(extraRoll = false) {
    if (extraRoll) {
      // Tirada extra: mantener jugador actual
      this.rollsLeft = 1;
      this.currentDice = null;
      this.pendingMovements = [];
      this.movementsLeft = 0;
    } else {
      // Fin del turno: cambiar jugador
      this.currentPlayerIdx = (this.currentPlayerIdx + 1) % this.players.length;
      this.resetRolls();
      this.game.events.emit('turnChanged', this.currentPlayerIdx);
    }
    
    // notificar tiros restantes y habilitar piezas
    this.game.events.emit('rollsLeft', this.rollsLeft);
    this.game.events.emit('movementsLeft', this.movementsLeft);
    this.game.events.emit('diceReady', this.rollsLeft > 0 && this.movementsLeft === 0);
    this.enableCurrentPlayerPieces();
  }

  /** Inicializa el turno según el estado del jugador */
  resetRolls() {
    const pl = this.players[this.currentPlayerIdx];
    const allInHome = pl.pieces.every(p => p.routeIndex < 0);
    
    if (allInHome) {
      // Fase inicial: hasta 3 intentos para sacar dobles
      this.turnState = 'INITIAL_ROLLS';
      this.rollsLeft = 3;
      this.movementsLeft = 0;
    } else {
      // Fase normal: 1 tirada inicial, 2 movimientos
      this.turnState = 'NORMAL_MOVEMENT';
      this.rollsLeft = 1;
      this.movementsLeft = 0;
    }
    
    // Reiniciar contadores
    this.consecutiveDoubles = 0;
    this.usedDiceValues = [];
    this.pendingMovements = [];
    this.currentDice = null;
  }
} 