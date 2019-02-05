function GameManager(size, InputManager, Actuator, StorageManager) {
  this.inputManager = new InputManager();
  this.storageManager = new StorageManager();
  this.actuator = new Actuator();
  this.engine = new Engine();
  this.ai = new AI(this.engine);

  this.inputManager.on("move", this.move.bind(this));
  this.inputManager.on("restart", this.restart.bind(this));
  this.inputManager.on("toggleAI", this.toggleAI.bind(this));

  this.tileOrigins = null;
  this.isRunningAI = false;
  this.stopAIOnOver = true;
  this.over = false;
  this.bestScore = this.storageManager.getBestScore();

  this.setup();
}

// Restart the game
GameManager.prototype.restart = function() {
  this.storageManager.clearGameState();
  this.actuator.clearMessage();
  this.setup();
};

GameManager.prototype.toggleAI = function() {
  if (this.isRunningAI) {
    this.stopAI();
  } else if (this.over) {
    this.restart();
  } else {
    this.startAI();
  }
};

// Set up the game
GameManager.prototype.setup = function() {
  var previousState = this.storageManager.getGameState();

  // Reload the game from a previous game if present
  if (previousState) {
    this.game = previousState.game;
    this.over = previousState.over;
  } else {
    this.game = {
      score: 0,
      grid: [
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null],
        [null, null, null, null]
      ]
    };
    this.over = false;

    // Add the initial tiles
    this.addStartTiles();
  }

  // Update the actuator
  this.tileOrigins = [
    ["new", "new", "new", "new"],
    ["new", "new", "new", "new"],
    ["new", "new", "new", "new"],
    ["new", "new", "new", "new"]
  ];
  this.actuate();
};

// Set up the initial tiles to start the game with
GameManager.prototype.addStartTiles = function() {
  this.engine.addRandomTile(this.game.grid);
  this.engine.addRandomTile(this.game.grid);
};

GameManager.prototype.move = function(direction) {
  var metadata = this.engine.move(this.game)(direction);
  this.tileOrigins = metadata.tileOrigins;
  if (metadata.moved) {
    var position = this.engine.addRandomTile(this.game.grid);
    this.tileOrigins[position[0]][position[1]] = "new";
  }
  if (!this.engine.canMove(this.game.grid)) {
    this.over = true;
  }
  this.actuate();
};

GameManager.prototype.startAI = function() {
  this.isRunningAI = true;
  this.runAI();
  this.updateButton();
};

GameManager.prototype.stopAI = function() {
  this.isRunningAI = false;
  this.updateButton();
};

GameManager.prototype.runAI = function() {
  if (this.isRunningAI && !this.over) {
    setTimeout(this.runAI.bind(this), 50);
    this.move(this.ai.getBestMove(this.game));
  }
};

// Sends the updated grid to the actuator
GameManager.prototype.actuate = function() {
  if (this.bestScore < this.game.score) {
    this.bestScore = this.game.score;
    this.storageManager.setBestScore(this.bestScore);
  }

  // Clear the state when the game is over (game over only, not win)
  if (this.over) {
    this.storageManager.clearGameState();
    if (this.isRunningAI) {
      if (this.stopAIOnOver) {
        this.stopAI();
      } else {
        this.restart();
      }
    }
  } else {
    this.storageManager.setGameState(this.serialize());
  }
  this.actuator.actuate(this.game, {
    tileOrigins: this.tileOrigins,
    over: this.over,
    isRunningAI: this.isRunningAI,
    bestScore: this.bestScore
  });
  this.updateButton();
};

GameManager.prototype.updateButton = function() {
  this.actuator.updateButton({
    over: this.over,
    isRunningAI: this.isRunningAI
  });
};

// Represent the current game as an object
GameManager.prototype.serialize = function() {
  return {
    game: this.game,
    over: this.over
  };
};
