class AI {
  constructor(engine) {
    this.engine = engine;
  }

  getBestMove(game) {
    return this.search(
      game,
      9,
      Number.NEGATIVE_INFINITY,
      Number.POSITIVE_INFINITY,
      true
    ).bestMove;
  }

  search(game, depth, alpha, beta, maximizing) {
    if (depth === 0) {
      return { value: this.eval(game).value };
    }
    if (maximizing) {
      let value = Number.NEGATIVE_INFINITY;
      let bestMove;
      for (let direction = 0; direction < 4; direction++) {
        const clone = this.engine.clone(game);
        if (!this.engine.move(clone)(direction).moved) {
          // if this direction didn't change the grid, we won't
          // evaluate it any further.
          continue;
        }
        const result = this.search(clone, depth - 1, alpha, beta, false);
        if (result.value >= value) {
          value = result.value;
          bestMove = direction;
        }
        alpha = Math.max(alpha, value);
        if (alpha >= beta) {
          break;
        }
      }
      return { value, bestMove };
    } else {
      let value = Number.POSITIVE_INFINITY;
      let children = [];
      for (let row = 0; row < game.grid.length; row++) {
        for (let col = 0; col < game.grid.length; col++) {
          if (!game.grid[row][col]) {
            children.push({ tile: 2, pos: { row, col } });
            children.push({ tile: 4, pos: { row, col } });
            break;
          }
        }
      }
      for (let child of children) {
        const clone = this.engine.clone(game);
        clone.grid[child.pos.row][child.pos.col] = child.tile;
        value = Math.min(
          value,
          this.search(clone, depth - 1, alpha, beta, true).value
        );
        beta = Math.min(beta, value);
        if (alpha >= beta) {
          break;
        }
      }
      return { value };
    }
  }

  eval(game) {
    const heuristics = {
      empty: { value: 0, weight: 1 },
      score: { value: game.score, weight: 0.07 }
    };

    for (let row = 0; row < game.grid.length; row++) {
      for (let col = 0; col < game.grid.length; col++) {
        const tile = game.grid[row][col];
        if (!tile) {
          heuristics.empty.value++;
        }
      }
    }

    let value = 0;
    for (const heuristic of Object.keys(heuristics)) {
      value += heuristics[heuristic].value * heuristics[heuristic].weight;
    }

    return { value, heuristics };
  }
}
