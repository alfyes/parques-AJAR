import Piece from './Piece.js';

export default class Player {
  constructor(id, color, isCPU = false) {
    this.id = id;
    this.color = color;
    this.isCPU = isCPU;
    // inicializa fichas
    this.pieces = [];
    for (let i = 0; i < 4; i++) {
      this.pieces.push(new Piece(this, i));
    }
  }

  rollDice() {
    // delegar tirada a la clase Dice o lógica interna
  }
} 