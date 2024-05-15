class AI {
  constructor(gameplay) {
    this.gameplay = gameplay;
    this.timeLimitMs = 200;
  }

  getBestMove(game) {
    // alpha-beta pruning with iterative deepening
    this.startTime = Date.now();
    let bestMove;
    let depth = 1;
    while (true) {
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
      depth++;
    }
    return { bestMove, depth };
  }

  search(game, depth, alpha, beta, maximizing) {
    if (depth === 0 || Date.now() >= this.startTime + this.timeLimitMs) {
      return {
        evaluation: this.evaluate(game),
        completed: depth === 0
      };
    }

    if (maximizing) {
      let children = [];
      for (let direction = 0; direction < 4; direction++) {
        const clone = this.gameplay.clone(game);
        if (this.gameplay.move(clone, direction).moved) {
          children.push({
            game: clone,
            evaluation: this.evaluate(clone),
            direction
          });
        }
      }
      // search higher evaluation moves first
      children.sort((a, b) => b.evaluation - a.evaluation);

      let evaluation = Number.NEGATIVE_INFINITY;
      let bestMove;
      let completed;
      for (let child of children) {
        const result = this.search(child.game, depth - 1, alpha, beta, false);
        if (result.evaluation >= evaluation) {
          evaluation = result.evaluation;
          bestMove = child.direction;
          completed = result.completed;
        }
        alpha = Math.max(alpha, evaluation);
        if (alpha >= beta) {
          break;
        }
      }
      return { evaluation, bestMove, completed };
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

      let evaluation = Number.POSITIVE_INFINITY;
      let completed;
      for (let child of children) {
        const clone = this.gameplay.clone(game);
        clone.grid[child.pos.row][child.pos.col] = child.tile;
        const result = this.search(clone, depth - 1, alpha, beta, true);
        if (result.evaluation <= evaluation) {
          evaluation = result.evaluation;
          completed = result.completed;
        }
        beta = Math.min(beta, evaluation);
        if (alpha >= beta) {
          break;
        }
      }
      return { evaluation, completed };
    }
  }

  evaluate(game) {
    const heuristics = {
      score: {
        rawValue: Math.log2(game.score + 1),
        weight: 5
      },
      empty: {
        rawValue: this.empty(game.grid),
        weight: 5
      },
      duplication: {
        rawValue: this.duplication(game.grid),
        weight: -4
      },
      friendliness: {
        rawValue: this.neighbourhoodFrendliness(game.grid),
        weight: 2
      }
    };

    let evaluation = 0;
    for (const heuristic in heuristics) {
      const { rawValue, weight } = heuristics[heuristic];
      evaluation += rawValue * weight;
    }
    return evaluation;
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
    const exists = {};
    let duplication = 0;
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid.length; col++) {
        const tile = grid[row][col];
        if (!tile) {
          continue;
        }
        if (exists[tile]) {
          duplication += Math.log2(tile);
        } else {
          exists[tile] = true;
        }
      }
    }
    return duplication;
  }

  neighbourhoodFrendliness(grid) {
    const friendliness = this.gameplay.createGrid(grid.length, 0);

    // Row-wise neighbourhood friendliness.
    for (let row = 0; row < grid.length; row++) {
      let prevCol = 0;
      let col = 1;
      for (let nextCol = 2; nextCol < grid.length; nextCol++) {
        const next = grid[row][nextCol];
        if (!next) {
          continue;
        }

        const current = grid[row][col];
        if (!current) {
          col = nextCol;
          continue;
        }

        const prev = grid[row][prevCol];
        if (!prev) {
          prevCol = col;
          col = nextCol;
          continue;
        }

        const prevRatio = current / prev;
        const nextRatio = next / current;
        let friendlinessFactor = 0;

        if ((prevRatio > 1 && nextRatio > 1) || (prevRatio < 1 && nextRatio < 1)) {
          friendlinessFactor =
            Math.min(prevRatio, 1 / prevRatio) + Math.min(nextRatio, 1 / nextRatio);
        } else if (prevRatio === 1 || nextRatio === 1) {
          friendlinessFactor =
            prevRatio === 1
              ? Math.min(nextRatio, 1 / nextRatio)
              : Math.min(prevRatio, 1 / prevRatio);
        } else if (prevRatio < 1 && nextRatio > 1) {
          friendlinessFactor = Math.min(nextRatio, 1 / nextRatio, prevRatio, 1 / prevRatio) - 0.2;
        } else {
          friendlinessFactor = Math.min(nextRatio, 1 / nextRatio, prevRatio, 1 / prevRatio) - 2;
        }

        const prevFriendliness = friendlinessFactor * Math.log2(prev);
        const currentFriendliness = friendlinessFactor * Math.log2(current);
        const nextFriendliness = friendlinessFactor * Math.log2(next);

        friendliness[row][prevCol] += prevFriendliness;
        friendliness[row][col] += currentFriendliness;
        friendliness[row][nextCol] += nextFriendliness;

        prevCol = col;
        col = nextCol;
      }
    }

    // Column-wise neighbourhood friendliness.
    for (let col = 0; col < grid.length; col++) {
      let prevRow = 0;
      let row = 1;
      for (let nextRow = 2; nextRow < grid.length; nextRow++) {
        const next = grid[nextRow][col];
        if (!next) {
          continue;
        }

        const current = grid[row][col];
        if (!current) {
          row = nextRow;
          continue;
        }

        const prev = grid[prevRow][col];
        if (!prev) {
          prevRow = row;
          row = nextRow;
          continue;
        }

        const prevRatio = current / prev;
        const nextRatio = next / current;
        let friendlinessFactor = 0;

        if ((prevRatio > 1 && nextRatio > 1) || (prevRatio < 1 && nextRatio < 1)) {
          friendlinessFactor =
            Math.min(prevRatio, 1 / prevRatio) + Math.min(nextRatio, 1 / nextRatio);
        } else if (prevRatio === 1 || nextRatio === 1) {
          friendlinessFactor =
            prevRatio === 1
              ? Math.min(nextRatio, 1 / nextRatio)
              : Math.min(prevRatio, 1 / prevRatio);
        } else if (prevRatio < 1 && nextRatio > 1) {
          friendlinessFactor = Math.min(nextRatio, 1 / nextRatio, prevRatio, 1 / prevRatio) - 0.2;
        } else {
          friendlinessFactor = Math.min(nextRatio, 1 / nextRatio, prevRatio, 1 / prevRatio) - 2;
        }

        const prevFriendliness = friendlinessFactor * Math.log2(prev);
        const currentFriendliness = friendlinessFactor * Math.log2(current);
        const nextFriendliness = friendlinessFactor * Math.log2(next);

        friendliness[prevRow][col] =
          friendliness[prevRow][col] >= 0 && prevFriendliness > 0
            ? Math.max(friendliness[prevRow][col], prevFriendliness)
            : Math.min(friendliness[prevRow][col], prevFriendliness);

        friendliness[row][col] =
          friendliness[row][col] >= 0 && currentFriendliness > 0
            ? Math.max(friendliness[row][col], currentFriendliness)
            : Math.min(friendliness[row][col], currentFriendliness);

        friendliness[nextRow][col] =
          friendliness[nextRow][col] >= 0 && nextFriendliness > 0
            ? Math.max(friendliness[nextRow][col], nextFriendliness)
            : Math.min(friendliness[nextRow][col], nextFriendliness);

        prevRow = row;
        row = nextRow;
      }
    }

    let totalFriendliness = 0;
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid.length; col++) {
        totalFriendliness += friendliness[row][col];
      }
    }

    return totalFriendliness;
  }
}
