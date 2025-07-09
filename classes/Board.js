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
    // salida inicial en (2,2)
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
    
    // si la ficha está en casa, solo sale con dobles
    if (piece.routeIndex < 0) {
      if (diceValues[0] === diceValues[1]) {
        // Salir de casa: colocar en salida y mover el valor del dado
        const moveIndex = Math.min(diceValues[0], this.route.length - 1);
        moves.push(this.route[moveIndex]);
      }
    } else {
      // avanzar sum casillas en la ruta
      const newIndex = piece.routeIndex + sum;
      if (newIndex < this.route.length) {
        moves.push(this.route[newIndex]);
      }
    }
    return moves;
  }

  /**
   * Calcula casillas posibles para un solo dado.
   */
  getPossibleMovesForSingleDice(piece, diceValue) {
    const moves = [];
    
    // Si la ficha está en casa, no puede moverse con un solo dado
    if (piece.routeIndex < 0) {
      return moves;
    }
    
    // Avanzar el valor del dado individual
    const newIndex = piece.routeIndex + diceValue;
    if (newIndex < this.route.length) {
      moves.push(this.route[newIndex]);
    }
    
    return moves;
  }
} 