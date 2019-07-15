importScripts("gameplay.js", "ai.js");
const ai = new AI(new Gameplay());

onmessage = function(event) {
  postMessage(ai.getBestMove(event.data));
};
