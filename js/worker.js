importScripts("engine.js", "ai.js");
const ai = new AI(new Engine());

onmessage = function(event) {
  postMessage(ai.getBestMove(event.data));
};
