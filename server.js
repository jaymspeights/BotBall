'use strict'

var express = require('express');
var app = express();
var lcg = require( 'compute-lcg' );

var games = [];

var root = '/BotBall';

app.get(root+'/', function (req, res) {
  res.sendFile(__dirname + '/index.html');
});

app.get(root+'/games', function (req, res) {
  var g = [];
  for (let game of games) {
    g.push({id:game.id});
  }
  res.send(g);
});

app.get(root+'/create', function (req, res) {
  if (req.query.singleplayer) var singleplayer = true;
  else var singleplayer = false;

  var game = createGame(singleplayer);
  games.push(game);
  res.send({game_id:game.id, error: null});
});

app.get(root+'/join', function (req, res) {
  var game_id = req.query.game;
  if (game_id == undefined) {
    res.send({error: "Please include game={game_id} in your query."});
    return;
  }
  var game = findGame(game_id);
  if (game == null) {
    res.send({error: "Game with such an id cannot be found."});
    return;
  }
  for (var player of game.players) {
    if (player.active == false) {
      player.active = true;
      res.send({player_id: player.id, error: null});
      for (var player of game.players) {
        if (player.active == false) {
          return;
        }
      }
      game.start_time = (new Date).getTime() + 5000;
    }
  }
  res.send({error: "This game has no available players."});
});

app.get(root+'/move', function (req, res) {
  var game_id = req.query.game;
  if (game_id == undefined) {
    res.send({error: "Please include game={game_id} in your query."});
    return;
  }
  var game = findGame(game_id);
  if (game == null) {
    res.send({error: "Game with such an id cannot be found."});
    return;
  }
  var player;
  for (let p of game.players) {
    if (p.id == req.query.player) {
      player = p;
    }
  }
  if (player == null) {
    res.send({error: "Player with such an id cannot be found."});
    return;
  }
  let time = (new Date).getTime();
  if (game.start_time == null) {
    res.send({error: "Game has not started: Not enough players"});
    return;
  } else if (game.start_time > time) {
    res.send({error: "Game has not started: Starting in " + (game.start_time - time)});
    return;
  }
  if (game.over) {
    res.send({error: "Game is over"});
    return;
  }
  switch (req.query.dir) {
    case "NW":
      res.send(tryMove(game, player, -1, -1));
      break;
    case "N":
      res.send(tryMove(game, player, 0, -1));
      break;
    case "NE":
      res.send(tryMove(game, player, 1, -1));
      break;
    case "E":
      res.send(tryMove(game, player, 1, 0));
      break;
    case "W":
      res.send(tryMove(game, player, -1, 0));
      break;
    case "S":
      res.send(tryMove(game, player, 0, 1));
      break;
    case "SW":
      res.send(tryMove(game, player, -1, 1));
      break;
    case "SE":
      res.send(tryMove(game, player, 1, 1));
      break;
    default:
      res.send({error: "Please encode move direction dir=[NW | N | NE | E | SE | S | SW | W]"})
  }
});

app.get(root+'/state', function (req, res) {
  var game_id = req.query.game;
  if (game_id == undefined) {
    res.send({error: "Please include game={game_id} in your query."});
    return;
  }
  var game = findGame(game_id);
  if (game == null) {
    res.send({error: "Game with such an id cannot be found."});
    return;
  }
  var view = viewGame(game, req.query.player);
  view.error = null;
  res.send(view);
});

function findGame(game_id) {
  for (let game of games) {
    if (game.id == game_id)
      return game;
  }
  return null;
}

function viewGame(game, player_id) {
  var view = {field:{}, players: [], ball: {}};
  view.field = {game: {}, width: game.width, height: game.height, goal_start: game.goal_start, goal_end:game.goal_end};
  var you = null;
  for (let i = 0; i < game.players.length; i++) {
    if (game.players[i].id == player_id)
      you = i;
    view.players.push({x:game.players[i].x, y:game.players[i].y});
  }
  if (you != null)
    view.you = you;

  view.game = {over:game.over};
  view.ball = game.ball;
  return view;
}

function tryMove(game, player, dir_x, dir_y) {
  let loc_y = player.y + dir_y;
  let loc_x = player.x + dir_x;
  if (inBounds(game, loc_x, loc_y)) {
    for (let p of game.players) {
      if (p.x == loc_x && p.y == loc_y)
        return {error: "Cannot to another player's location"};
    }
    player.x = loc_x;
    player.y = loc_y;
    if (game.ball.x == loc_x && game.ball.y == loc_y) {
      moveBall(game, dir_x, dir_y, 2);
    }
    return{status:"SUCCESS", error: null};
  } else {
    return {error: "Cannot move out of bounds"};
  }
}

function moveBall(game, dir_x, dir_y, num) {
  if (num <= 0) return {status:"SUCCESS", error: null};
  let ball_x = game.ball.x + dir_x;
  let ball_y = game.ball.y + dir_y;
  if (inGoal(game, ball_x, ball_y)) {
    game.ball.y = ball_y;
    game.ball.x = ball_x;
    game.over = true;
    return true;
  }
  if (!inBounds(game, ball_x, ball_y)) {
    if (ball_x < 0)
      if (hitPlayer(game, ball_x+2, ball_y)) {
        ball_x -= dir_x;
        ball_y -= dir_y;
        while (true) {
          let found = false;
          for (let p of game.players) {
            if (p.x == ball_x && p.y == ball_y) {
              ball_x -= dir_x;
              ball_y -= dir_y;
              found = true;
            }
          }
          if (!found) break;
        }
        game.ball.x = ball_x;
        game.ball.y = ball_y;
        return {status:"SUCCESS", error: null};
      } else {
        game.ball.x = ball_x+2;
        game.ball.y = ball_y;
        return {status:"SUCCESS", error: null};
      }
    if (ball_x >= game.width)
      if (hitPlayer(game, ball_x-2, ball_y)) {
        ball_x -= dir_x;
        ball_y -= dir_y;
        while (true) {
          let found = false;
          for (let p of game.players) {
            if (p.x == ball_x && p.y == ball_y) {
              ball_x -= dir_x;
              ball_y -= dir_y;
              found = true;
            }
          }
          if (!found) break;
        }
        game.ball.x = ball_x;
        game.ball.y = ball_y;
        return {status:"SUCCESS", error: null};
      } else {
        game.ball.x = ball_x-2;
        game.ball.y = ball_y;
        return {status:"SUCCESS", error: null};
      }
    if (ball_y < 0)
      if (hitPlayer(game, ball_x, ball_y+2)) {
        ball_x -= dir_x;
        ball_y -= dir_y;
        while (true) {
          let found = false;
          for (let p of game.players) {
            if (p.x == ball_x && p.y == ball_y) {
              ball_x -= dir_x;
              ball_y -= dir_y;
              found = true;
            }
          }
          if (!found) break;
        }
        game.ball.x = ball_x;
        game.ball.y = ball_y;
        return {status:"SUCCESS", error: null};
      } else {
        game.ball.x = ball_x;
        game.ball.y = ball_y+2;
        return {status:"SUCCESS", error: null};
      }
    if (ball_y >= game.height)
      if (hitPlayer(game, ball_x, ball_y-2)) {
        ball_x -= dir_x;
        ball_y -= dir_y;
        while (true) {
          let found = false;
          for (let p of game.players) {
            if (p.x == ball_x && p.y == ball_y) {
              ball_x -= dir_x;
              ball_y -= dir_y;
              found = true;
            }
          }
          if (!found) break;
        }
        game.ball.x = ball_x;
        game.ball.y = ball_y;
        return {status:"SUCCESS", error: null};
      } else {
        game.ball.x = ball_x;
        game.ball.y = ball_y-2;
        return {status:"SUCCESS", error: null};
      }
  } else {
    if (hitPlayer(game, ball_x, ball_y)) {
      while (true) {
        let found = false;
        for (let p of game.players) {
          if (p.x == ball_x && p.y == ball_y) {
            ball_x -= dir_x;
            ball_y -= dir_y;
            found = true;
          }
        }
        if (!found) break;
      }
      game.ball.x = ball_x;
      game.ball.y = ball_y;
      return {status:"SUCCESS", error: null};
    } else {
      game.ball.x = ball_x;
      game.ball.y = ball_y;
      return moveBall(game, dir_x, dir_y, num-1);
    }
  }
}

function hitPlayer(game, x, y) {
  for (let p of game.players) {
    if (p.x == x && p.y == y) {
      return true;
    }
  }
  return false;
}

function inGoal(game, x, y) {
  return (x < 0 || x >= game.width) && y >= game.goal_start && y <= game.goal_end;
}

function inBounds(game, x, y) {
  return x >= 0 && y >= 0 && x < game.width && y < game.height;
}

function createGame(singleplayer) {
  var game = {players: [], width: 11, height: 7, goal_start: 2, goal_end: 4, ball: {x:5, y:3}};
  game.id = getGameID();
  if (!singleplayer) {
    game.players.push({y:3, x:0, id: getPlayerID(), active: false});
    game.players.push({y:3, x:10, id: getPlayerID(), active: false});
  } else {
    game.players.push({y:3, x:0, id: getPlayerID(), active: false});
  }
  game.over = false;
  return game;
}

var getGameID = createGenerator();
var getPlayerID = createGenerator();


function createGenerator() {
  var rand = lcg(Math.floor(Math.random()*10000));
  return function () {
    return rand().toString(16).substring(2);
  }
}

app.listen(8081);
