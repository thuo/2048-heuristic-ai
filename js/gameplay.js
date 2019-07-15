class Gameplay {
  constructor() {
    this.intervals = {
      incremental: size => ({ start: 0, step: 1, end: size }),
      decremental: size => ({ start: size - 1, step: -1, end: -1 })
    };

    this.orientations = {
      vertical: {
        get: (grid, x, y) => grid[y][x],
        set: (grid, x, y, tile) => {
          grid[y][x] = tile;
        },
        coordinates: (x, y) => [y, x]
      },
      horizontal: {
        get: (grid, x, y) => grid[x][y],
        set: (grid, x, y, tile) => {
          grid[x][y] = tile;
        },
        coordinates: (x, y) => [x, y]
      }
    };

    this.directions = {
      0: {
        label: "up",
        interval: this.intervals.incremental,
        orientation: this.orientations.vertical
      },
      1: {
        label: "right",
        interval: this.intervals.decremental,
        orientation: this.orientations.horizontal
      },
      2: {
        label: "down",
        interval: this.intervals.decremental,
        orientation: this.orientations.vertical
      },
      3: {
        label: "left",
        interval: this.intervals.incremental,
        orientation: this.orientations.horizontal
      }
    };
  }

  move(game, direction) {
    const { start, step, end } = this.directions[direction].interval(game.grid.length);
    const {
      orientation: { get, set, coordinates }
    } = this.directions[direction];

    const tileOrigins = this.createGrid(game.grid.length);
    let moved = false;

    for (let x = 0; x < game.grid.length; x++) {
      let targetY = start;
      for (let y = start + step; y !== end; y += step) {
        let currentTile = get(game.grid, x, y);
        if (!currentTile) {
          // the target cell remains the same
          continue;
        }
        let targetTile = get(game.grid, x, targetY);
        if (!targetTile) {
          set(game.grid, x, targetY, currentTile);
          set(game.grid, x, y, null);
          set(tileOrigins, x, targetY, { position: coordinates(x, y) });
          moved = true;
          // we just moved a tile into the target cell which was empty, so,
          // we will keep the target cell the same so that if we can
          // merge the moved tile later, it will be in the target cell
          continue;
        }
        // from here on, there will always be a tile in the target cell
        if (targetTile === currentTile) {
          set(game.grid, x, targetY, targetTile + currentTile);
          set(game.grid, x, y, null);
          set(tileOrigins, x, targetY, [
            { position: coordinates(x, targetY), tile: targetTile },
            { position: coordinates(x, y), tile: currentTile }
          ]);
          game.score = game.score + get(game.grid, x, targetY);
          moved = true;
        } else if (targetY + step !== y) {
          // there's a tile in the target cell but we couldn't merge it with
          // the curerent cell, so, we will move the current tile to the cell
          // after the target cell, unless it's already there (that's why
          // we're checking targetY + step !== y)
          set(game.grid, x, targetY + step, currentTile);
          set(game.grid, x, y, null);
          set(tileOrigins, x, targetY + step, { position: coordinates(x, y) });
          moved = true;
        }
        targetY += step;
      }
    }
    return { moved, tileOrigins };
  }

  addRandomTile(grid) {
    const emptyCells = [];
    for (let row = 0; row < grid.length; row++) {
      for (let col = 0; col < grid.length; col++) {
        if (!grid[row][col]) {
          emptyCells.push([row, col]);
        }
      }
    }
    if (!emptyCells.length) {
      return null;
    }
    const randomCellIndex = Math.floor(Math.random() * emptyCells.length);
    const [row, col] = emptyCells[randomCellIndex];
    grid[row][col] = Math.random() < 0.9 ? 2 : 4;
    return [row, col];
  }

  canMove(grid) {
    for (let row = 0; row < grid.length; row++) {
      if (!grid[row][0]) {
        return true;
      }
      for (let col = 1; col < grid.length; col++) {
        if (!grid[row][col]) {
          return true;
        }
        if (grid[row][col] === grid[row][col - 1]) {
          return true;
        }
      }
    }
    for (let col = 0; col < grid.length; col++) {
      if (!grid[0][col]) {
        return true;
      }
      for (let row = 1; row < grid.length; row++) {
        if (!grid[row][col]) {
          return true;
        }
        if (grid[row][col] === grid[row - 1][col]) {
          return true;
        }
      }
    }
    return false;
  }

  clone(game) {
    const gridClone = [];
    for (let row = 0; row < game.grid.length; row++) {
      gridClone[row] = [];
      for (let col = 0; col < game.grid.length; col++) {
        gridClone[row][col] = game.grid[row][col];
      }
    }
    return {
      score: game.score,
      grid: gridClone
    };
  }

  toString(game) {
    let string = "";
    for (let row = 0; row < game.grid.length; row++) {
      for (let col = 0; col < game.grid.length; col++) {
        string += (game.grid[row][col] || "-") + "\t";
      }
      string += "\n";
    }
    return string;
  }

  createGrid(size, fill = null) {
    const grid = [];
    for (let row = 0; row < size; row++) {
      grid[row] = [];
      for (let col = 0; col < size; col++) {
        grid[row][col] = fill;
      }
    }
    return grid;
  }
}
