class AI {
  constructor(engine) {
    this.engine = engine;
  }

  getBestMove(game) {
    let bestMove = 0;
    let bestScore = 0;
    for (let direction = 0; direction < 4; direction++) {
      const clone = this.engine.clone(game);
      const metadata = this.engine.move(clone)(direction);
      if (!metadata.moved) {
        continue;
      }
      if (clone.score >= bestScore) {
        bestScore = clone.score;
        bestMove = direction;
      }
    }
    return bestMove;
  }
}
