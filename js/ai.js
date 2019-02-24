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
    const { gridQuality, qualityPerTile } = this.quality(game.grid);
    const heuristics = {
      empty: {
        value: this.empty(game.grid),
        weight: 5
      },
      score: {
        value: game.score,
        weight: 0.0625
      },
      duplication: {
        value: this.duplication(game.grid),
        weight: 7.5
      },
      quality: {
        value: gridQuality,
        weight: 7.5
      }
    };

    let value = 0;
    for (const heuristic of Object.keys(heuristics)) {
      value += heuristics[heuristic].value * heuristics[heuristic].weight;
    }

    return { value, heuristics, qualityPerTile };
  }

  empty(grid) {
    let empty = 0;
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid.length; col++) {
        if (!grid[row][col]) {
          empty++;
        }
      }
    }
    return empty;
  }

  duplication(grid) {
    const duplicates = {};
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid.length; col++) {
        const tile = grid[row][col];
        if (!tile) {
          continue;
        }
        if (duplicates[tile] !== undefined) {
          duplicates[tile]++;
        } else {
          duplicates[tile] = 0;
        }
      }
    }
    let duplication = 0;
    for (const tile of Object.keys(duplicates)) {
      if (tile > 4) {
        duplication -= tile * duplicates[tile];
      }
    }
    return duplication;
  }

  quality(grid) {
    let gridQuality = 0;
    const qualityPerTile = this.engine.createGrid(grid.length, 0);
    for (let row = 0; row < grid.length; row++) {
      let prevDiff = 0;
      let neighbourCol = -1;
      for (let col = 0; col < grid.length; col++) {
        const tile = grid[row][col];
        if (!tile) {
          continue;
        }
        let tileQuality;
        let neighbour = neighbourCol >= 0 ? grid[row][neighbourCol] : null;
        if (neighbour) {
          let diff = tile - neighbour;
          if ((prevDiff >= 0 && diff >= 0) || (prevDiff <= 0 && diff <= 0)) {
            tileQuality = tile;
          } else {
            tileQuality = -Math.min(Math.abs(prevDiff), Math.abs(diff));
          }
          prevDiff = diff;
        } else {
          tileQuality = tile;
        }
        neighbourCol = col;
        qualityPerTile[row][col] = tileQuality;
      }
    }

    for (let col = 0; col < grid.length; col++) {
      let prevDiff = 0;
      let neighbourRow = -1;
      for (let row = 0; row < grid.length; row++) {
        const tile = grid[row][col];
        if (!tile) {
          continue;
        }
        let tileQuality;
        let neighbour = neighbourRow >= 0 ? grid[neighbourRow][col] : null;
        if (neighbour) {
          let diff = tile - neighbour;
          if ((prevDiff >= 0 && diff >= 0) || (prevDiff <= 0 && diff <= 0)) {
            tileQuality = tile;
          } else {
            tileQuality = -Math.min(Math.abs(prevDiff), Math.abs(diff));
          }
          prevDiff = diff;
        } else {
          tileQuality = tile;
        }
        neighbourRow = row;
        qualityPerTile[row][col] = Math.min(qualityPerTile[row][col], tileQuality);
        gridQuality += qualityPerTile[row][col];
      }
    }
    return { gridQuality, qualityPerTile };
  }
}
