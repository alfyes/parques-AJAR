export default class Board {
  /**
   * Modela el tablero de Parqués como una grilla de casillas.
   * @param {Phaser.Scene} scene Escena donde se renderiza el tablero.
   */
  constructor(scene) {
    this.scene = scene;
    this.rows = 15;
    this.cols = 15;
    this.cellSize = 32;
    const width = scene.sys.game.config.width;
    const height = scene.sys.game.config.height;
    this.offsetX = (width - this.cols * this.cellSize) / 2;
    this.offsetY = (height - this.rows * this.cellSize) / 2;
    this.cells = [];
    this.createCells();
    // crear ruta principal como anillo de celdas
    this.createRoute();
    // definir puntos de inicio y meta para cada jugador
    this.setupPlayerRoutes();
  }

  /**
   * Genera las casillas con posición y tipo (normal, casa de cada color).
   */
  createCells() {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const x = this.offsetX + col * this.cellSize;
        const y = this.offsetY + row * this.cellSize;
        let type = 'normal';
        // casas de jugadores en las esquinas
        if (row < 2 && col < 2) type = 'home-red';
        else if (row < 2 && col > this.cols - 3) type = 'home-yellow';
        else if (row > this.rows - 3 && col < 2) type = 'home-green';
        else if (row > this.rows - 3 && col > this.cols - 3) type = 'home-blue';
        // zonas seguras en puntos cardinales del anillo
        else if ((row === 2 && col === 7) || (row === 7 && col === 12) ||
                 (row === 12 && col === 7) || (row === 7 && col === 2)) type = 'safe';
        this.cells.push({ row, col, x, y, type });
      }
    }
  }

  /**
   * Construye la ruta principal (anillo) de celdas entre row=2..12, col=2..12
   */
  createRoute() {
    this.route = [];
    // salida inicial en (2,2) - cerca de casa roja
    this.route.push(this.cells.find(c => c.row === 2 && c.col === 2));
    // lado izquierdo descendente: (3..12,2)
    for (let row = 3; row <= 12; row++) {
      this.route.push(this.cells.find(c => c.row === row && c.col === 2));
    }
    // base: (12,3..12)
    for (let col = 3; col <= 12; col++) {
      this.route.push(this.cells.find(c => c.row === 12 && c.col === col));
    }
    // lado derecho ascendente: (11..2,12)
    for (let row = 11; row >= 2; row--) {
      this.route.push(this.cells.find(c => c.row === row && c.col === 12));
    }
    // cima: (2,11..3)
    for (let col = 11; col >= 3; col--) {
      this.route.push(this.cells.find(c => c.row === 2 && c.col === col));
    }
  }

  /**
   * Configura los puntos de inicio y meta para cada jugador
   */
  setupPlayerRoutes() {
    // Calcular longitud total de la ruta para determinar la distancia de meta
    const routeLength = this.route.length;
    const targetDistance = routeLength; // Una vuelta completa
    
    // Definir puntos de inicio para cada jugador (adyacentes a sus casas)
    // Rojo: (2,2) - esquina superior izquierda
    // Verde: (12,2) - esquina inferior izquierda
    // Azul: (12,12) - esquina inferior derecha 
    // Amarillo: (2,12) - esquina superior derecha
    
    this.playerStartIndices = {
      0: 0,  // Rojo: (2,2)
      1: this.findRouteIndex(12, 2),   // Verde: (12,2) 
      2: this.findRouteIndex(12, 12),  // Azul: (12,12)
      3: this.findRouteIndex(2, 12)    // Amarillo: (2,12)
    };
    
    // Calcular índices de meta para cada jugador
    this.playerGoalIndices = {};
    for (let playerId = 0; playerId < 4; playerId++) {
      const startIndex = this.playerStartIndices[playerId];
      this.playerGoalIndices[playerId] = (startIndex + targetDistance - 1) % routeLength;
    }
    
    // Definir posiciones visuales para fichas que llegaron a la meta (al lado de cada casa)
    this.setupGoalPositions();
    
    console.log('Puntos de inicio:', this.playerStartIndices);
    console.log('Puntos de meta:', this.playerGoalIndices);
  }

  /**
   * Configura las posiciones visuales para las fichas que llegaron a la meta
   */
  setupGoalPositions() {
    this.goalPositions = {};
    
    // Posiciones al lado de cada casa para mostrar fichas que llegaron a la meta
    // Rojo: al lado derecho de la casa roja (esquina superior izquierda)
    this.goalPositions[0] = [
      { x: this.offsetX + 2 * this.cellSize, y: this.offsetY + 0 * this.cellSize },
      { x: this.offsetX + 2 * this.cellSize, y: this.offsetY + 1 * this.cellSize },
      { x: this.offsetX + 3 * this.cellSize, y: this.offsetY + 0 * this.cellSize },
      { x: this.offsetX + 3 * this.cellSize, y: this.offsetY + 1 * this.cellSize }
    ];
    
    // Verde: al lado derecho de la casa verde (esquina inferior izquierda)
    this.goalPositions[1] = [
      { x: this.offsetX + 2 * this.cellSize, y: this.offsetY + 13 * this.cellSize },
      { x: this.offsetX + 2 * this.cellSize, y: this.offsetY + 14 * this.cellSize },
      { x: this.offsetX + 3 * this.cellSize, y: this.offsetY + 13 * this.cellSize },
      { x: this.offsetX + 3 * this.cellSize, y: this.offsetY + 14 * this.cellSize }
    ];
    
    // Azul: al lado izquierdo de la casa azul (esquina inferior derecha)
    this.goalPositions[2] = [
      { x: this.offsetX + 11 * this.cellSize, y: this.offsetY + 13 * this.cellSize },
      { x: this.offsetX + 11 * this.cellSize, y: this.offsetY + 14 * this.cellSize },
      { x: this.offsetX + 10 * this.cellSize, y: this.offsetY + 13 * this.cellSize },
      { x: this.offsetX + 10 * this.cellSize, y: this.offsetY + 14 * this.cellSize }
    ];
    
    // Amarillo: al lado izquierdo de la casa amarilla (esquina superior derecha)
    this.goalPositions[3] = [
      { x: this.offsetX + 11 * this.cellSize, y: this.offsetY + 0 * this.cellSize },
      { x: this.offsetX + 11 * this.cellSize, y: this.offsetY + 1 * this.cellSize },
      { x: this.offsetX + 10 * this.cellSize, y: this.offsetY + 0 * this.cellSize },
      { x: this.offsetX + 10 * this.cellSize, y: this.offsetY + 1 * this.cellSize }
    ];
  }

  /**
   * Obtiene la posición visual para una ficha que llegó a la meta
   */
  getGoalPosition(playerId, pieceIndex) {
    return this.goalPositions[playerId] ? this.goalPositions[playerId][pieceIndex] : null;
  }

  /**
   * Verifica si una ficha ha llegado exactamente a la meta
   */
  isAtGoal(piece) {
    const playerId = piece.player.id;
    const relativePosition = this.getRelativePosition(playerId, piece.routeIndex);
    return relativePosition === this.route.length - 1;
  }

  /**
   * Verifica si un movimiento llevaría a la ficha exactamente a la meta
   */
  wouldReachGoal(piece, steps) {
    const playerId = piece.player.id;
    const currentRelativePosition = this.getRelativePosition(playerId, piece.routeIndex);
    const targetRelativePosition = currentRelativePosition + steps;
    return targetRelativePosition === this.route.length - 1;
  }

  /**
   * Encuentra el índice en la ruta para una casilla específica
   */
  findRouteIndex(row, col) {
    return this.route.findIndex(cell => cell.row === row && cell.col === col);
  }

  /**
   * Obtiene el punto de inicio para un jugador específico
   */
  getPlayerStartIndex(playerId) {
    return this.playerStartIndices[playerId] || 0;
  }

  /**
   * Obtiene el punto de meta para un jugador específico
   */
  getPlayerGoalIndex(playerId) {
    return this.playerGoalIndices[playerId] || 0;
  }

  /**
   * Convierte una posición relativa del jugador a índice absoluto de la ruta
   */
  getAbsoluteRouteIndex(playerId, relativePosition) {
    const startIndex = this.getPlayerStartIndex(playerId);
    return (startIndex + relativePosition) % this.route.length;
  }

  /**
   * Convierte un índice absoluto de la ruta a posición relativa del jugador
   */
  getRelativePosition(playerId, absoluteIndex) {
    const startIndex = this.getPlayerStartIndex(playerId);
    let relative = absoluteIndex - startIndex;
    if (relative < 0) relative += this.route.length;
    return relative;
  }

  /**
   * Devuelve todas las casillas del tablero.
   * @returns {Array<{row:number, col:number, x:number, y:number, type:string}>}
   */
  getCells() {
    return this.cells;
  }

  /**
   * Calcula casillas posibles según la posición de la ficha y dados.
   */
  getPossibleMoves(piece, diceValues) {
    const moves = [];
    const sum = diceValues[0] + diceValues[1];
    const playerId = piece.player.id;
    
    // si la ficha está en casa, solo sale con dobles
    if (piece.routeIndex < 0) {
      if (diceValues[0] === diceValues[1]) {
        // Salir de casa: ir al punto de inicio del jugador y mover el valor del dado
        const startIndex = this.getPlayerStartIndex(playerId);
        const moveSteps = Math.min(diceValues[0], this.route.length - 1);
        const finalIndex = (startIndex + moveSteps) % this.route.length;
        moves.push(this.route[finalIndex]);
      }
    } else {
      // avanzar sum casillas en la ruta (con wrap-around)
      const newIndex = (piece.routeIndex + sum) % this.route.length;
      
      // Verificar si ha completado más de una vuelta (llegado a meta)
      const relativePosition = this.getRelativePosition(playerId, piece.routeIndex);
      const goalPosition = this.route.length - 1; // Una vuelta completa
      
      if (relativePosition + sum <= goalPosition) {
        moves.push(this.route[newIndex]);
      }
      // Si se pasa de la meta, no puede moverse (necesita número exacto)
    }
    return moves;
  }

  /**
   * Calcula casillas posibles para un solo dado.
   */
  getPossibleMovesForSingleDice(piece, diceValue) {
    const moves = [];
    const playerId = piece.player.id;
    
    // Si la ficha está en casa, no puede moverse con un solo dado
    if (piece.routeIndex < 0) {
      return moves;
    }
    
    // Avanzar el valor del dado individual (con wrap-around)
    const newIndex = (piece.routeIndex + diceValue) % this.route.length;
    
    // Verificar si ha completado más de una vuelta (llegado a meta)
    const relativePosition = this.getRelativePosition(playerId, piece.routeIndex);
    const goalPosition = this.route.length - 1; // Una vuelta completa
    
    if (relativePosition + diceValue <= goalPosition) {
      moves.push(this.route[newIndex]);
    }
    // Si se pasa de la meta, no puede moverse (necesita número exacto)
    
    return moves;
  }
} 