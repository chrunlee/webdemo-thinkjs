const view = require('think-view');
const model = require('think-model');
const cache = require('think-cache');
const session = require('think-session');
const socket = require('think-websocket');

module.exports = [
  view, // make application support view
  model(think.app),
  cache,
  session,
  socket(think.app)
];
