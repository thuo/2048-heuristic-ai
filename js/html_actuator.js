function HTMLActuator() {
  this.tileContainer = document.querySelector(".tile-container");
  this.scoreContainer = document.querySelector(".score-container");
  this.bestContainer = document.querySelector(".best-container");
  this.messageContainer = document.querySelector(".game-message");
  this.button = document.querySelector(".restart-button");

  this.score = 0;
}

HTMLActuator.prototype.actuate = function(game, metadata) {
  var self = this;

  window.requestAnimationFrame(function() {
    self.clearContainer(self.tileContainer);

    for (var row = 0; row < game.grid.length; row++) {
      for (var col = 0; col < game.grid.length; col++) {
        var tile = game.grid[row][col];
        if (tile) {
          self.addTile({
            value: tile,
            position: [row, col],
            origin: metadata.tileOrigins[row][col] || {}
          });
        }
      }
    }

    self.updateScore(game.score);
    self.updateBestScore(metadata.bestScore);

    if (metadata.over) {
      self.message();
    }
  });
};

HTMLActuator.prototype.clearContainer = function(container) {
  while (container.firstChild) {
    container.removeChild(container.firstChild);
  }
};

HTMLActuator.prototype.addTile = function(tile) {
  var self = this;

  var wrapper = document.createElement("div");
  var inner = document.createElement("div");

  // render the tile in its previous position if it existed before
  var positionClass = self.positionClass(tile.origin.position || tile.position);

  var classes = ["tile", `tile-${tile.value}`, positionClass];

  if (tile.value > 2048) {
    classes.push("tile-super");
  }

  if (tile.origin.position) {
    // update a tile rendered in it's previous position to its
    // current position in the next frame
    window.setTimeout(function() {
      window.requestAnimationFrame(function() {
        classes[2] = self.positionClass(tile.position);
        self.applyClasses(wrapper, classes);
      });
    }, 16);
  } else if (tile.origin === "new") {
    classes.push("tile-new");
  } else if (Array.isArray(tile.origin)) {
    classes.push("tile-merged");
    for (var origin of tile.origin) {
      self.addTile({
        value: origin.tile,
        position: tile.position,
        origin: origin
      });
    }
  }

  self.applyClasses(wrapper, classes);

  inner.classList.add("tile-inner");
  inner.textContent = tile.value;

  wrapper.appendChild(inner);

  self.tileContainer.appendChild(wrapper);
};

HTMLActuator.prototype.applyClasses = function(element, classes) {
  element.setAttribute("class", classes.join(" "));
};

HTMLActuator.prototype.normalizePosition = function(position) {
  return { x: position[1] + 1, y: position[0] + 1 };
};

HTMLActuator.prototype.positionClass = function(position) {
  position = this.normalizePosition(position);
  return "tile-position-" + position.x + "-" + position.y;
};

HTMLActuator.prototype.updateScore = function(score) {
  this.clearContainer(this.scoreContainer);

  var difference = score - this.score;
  this.score = score;

  this.scoreContainer.textContent = this.score;

  if (difference > 0) {
    var addition = document.createElement("div");
    addition.classList.add("score-addition");
    addition.textContent = "+" + difference;

    this.scoreContainer.appendChild(addition);
  }
};

HTMLActuator.prototype.updateBestScore = function(bestScore) {
  this.bestContainer.textContent = bestScore;
};

HTMLActuator.prototype.message = function() {
  this.messageContainer.classList.add("game-over");
  this.messageContainer.getElementsByTagName("p")[0].textContent = "Game over!";
};

HTMLActuator.prototype.clearMessage = function() {
  this.messageContainer.classList.remove("game-over");
};

HTMLActuator.prototype.updateButton = function(options) {
  var button = this.button;
  window.requestAnimationFrame(function() {
    if (options.over) {
      button.textContent = "New Game";
    } else if (options.isRunningAI) {
      button.textContent = "Stop AI";
    } else {
      button.textContent = "Start AI";
    }
  });
};
