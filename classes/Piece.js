export default class Piece {
  constructor(player, index) {
    this.player = player;
    this.index = index;
    // posición actual y estado (en casa, en camino, en meta)
    this.routeIndex = -1; // -1 indica en casa
  }

  moveTo(cell) {
    // lógica para mover la ficha al objeto casilla indicado
  }
} 