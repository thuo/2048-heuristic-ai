class AI {
  constructor(engine) {
    this.engine = engine;
    this.timeLimitMs = 250;
  }

  getBestMove(game) {
    // alpha-beta pruning with iterative deepening
    this.startTime = Date.now();
    let bestMove;
    for (let depth = 1; ; depth++) {
      const result = this.search(
        game,
        depth,
        Number.NEGATIVE_INFINITY,
        Number.POSITIVE_INFINITY,
        true
      );
      if (!result.completed) {
        // break the loop before updating the best move so that the
        // incomplete search doesn't affect the best move
        break;
      }
      bestMove = result.bestMove;
    }
    return bestMove;
  }

  search(game, depth, alpha, beta, maximizing) {
    if (depth === 0 || Date.now() >= this.startTime + this.timeLimitMs) {
      return {
        value: this.eval(game).value,
        completed: depth === 0
      };
    }

    if (maximizing) {
      let children = [];
      for (let direction = 0; direction < 4; direction++) {
        const clone = this.engine.clone(game);
        if (this.engine.move(clone)(direction).moved) {
          children.push({
            game: clone,
            value: this.eval(clone).value,
            direction
          });
        }
      }
      // evaluate higher valued moves first
      children.sort((a, b) => b.value - a.value);

      let value = Number.NEGATIVE_INFINITY;
      let bestMove;
      let completed;
      for (let child of children) {
        const result = this.search(child.game, depth - 1, alpha, beta, false);
        if (result.value >= value) {
          value = result.value;
          bestMove = child.direction;
          completed = result.completed;
        }
        alpha = Math.max(alpha, value);
        if (alpha >= beta) {
          break;
        }
      }
      return { value, bestMove, completed };
    } else {
      let children = [];
      for (let row = 0; row < game.grid.length; row++) {
        for (let col = 0; col < game.grid.length; col++) {
          if (!game.grid[row][col]) {
            children.push({ tile: 2, pos: { row, col } });
            children.push({ tile: 4, pos: { row, col } });
          }
        }
      }

      let value = Number.POSITIVE_INFINITY;
      let completed;
      for (let child of children) {
        const clone = this.engine.clone(game);
        clone.grid[child.pos.row][child.pos.col] = child.tile;
        const result = this.search(clone, depth - 1, alpha, beta, true);
        if (result.value <= value) {
          value = result.value;
          completed = result.completed;
        }
        beta = Math.min(beta, value);
        if (alpha >= beta) {
          break;
        }
      }
      return { value, completed };
    }
  }

  eval(game) {
    const heuristics = {
      empty: { value: 0, weight: 5 },
      score: { value: game.score, weight: 0.0625 },
      duplication: { value: 0, weight: 7.5 },
      quality: { value: 0, weight: 2.5 }
    };

    const count = {};
    for (let row = 0; row < game.grid.length; row++) {
      for (let col = 0; col < game.grid.length; col++) {
        const tile = game.grid[row][col];
        if (!tile) {
          heuristics.empty.value++;
          continue;
        }
        if (count[tile] !== undefined) {
          count[tile]++;
        } else {
          // we want to count every extra occurrence so we will count the
          // first occurrence as 0
          count[tile] = 0;
        }

        let leftSlope;
        let rightSlope;
        if (row === 0) {
          rightSlope = game.grid[row][col] > game.grid[row + 1][col] ? -1 : 1;
          leftSlope = rightSlope;
        } else if (row === game.grid.length - 1) {
          leftSlope = game.grid[row - 1][col] > game.grid[row][col] ? -1 : 1;
          rightSlope = leftSlope;
        } else {
          leftSlope = game.grid[row - 1][col] > game.grid[row][col] ? -1 : 1;
          rightSlope = game.grid[row][col] > game.grid[row + 1][col] ? -1 : 1;
          if (game.grid[row - 1][col] === game.grid[row][col]) {
            leftSlope = rightSlope;
          } else if (game.grid[row][col] === game.grid[row + 1][col]) {
            rightSlope = leftSlope;
          }
        }

        let topSlope;
        let bottomSlope;
        if (col === 0) {
          bottomSlope = game.grid[row][col] > game.grid[row][col + 1] ? -1 : 1;
          topSlope = bottomSlope;
        } else if (col === game.grid.length - 1) {
          topSlope = game.grid[row][col - 1] > game.grid[row][col] ? -1 : 1;
          bottomSlope = topSlope;
        } else {
          topSlope = game.grid[row][col - 1] > game.grid[row][col] ? -1 : 1;
          bottomSlope = game.grid[row][col] > game.grid[row][col + 1] ? -1 : 1;
          if (game.grid[row][col - 1] === game.grid[row][col]) {
            topSlope = bottomSlope;
          } else if (game.grid[row][col] === game.grid[row][col + 1]) {
            bottomSlope = topSlope;
          }
        }

        let tileQuality = 0;
        if (topSlope === bottomSlope && leftSlope === rightSlope) {
          tileQuality += tile;
        } else {
          if (topSlope != bottomSlope) {
            tileQuality -= tile;
          }
          if (leftSlope != rightSlope) {
            tileQuality -= tile;
          }
        }
        heuristics.quality.value += tileQuality;
      }
    }

    for (const tile of Object.keys(count)) {
      if (tile > 4) {
        heuristics.duplication.value -= tile * count[tile];
      }
    }

    let value = 0;
    for (const heuristic of Object.keys(heuristics)) {
      value += heuristics[heuristic].value * heuristics[heuristic].weight;
    }

    return { value, heuristics };
  }
}
