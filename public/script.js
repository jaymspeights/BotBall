var updateLoop = setInterval(getState, 100);
var selectLoop = setInterval(getGames, 1000);

var games = [];

var state;
var prev_state;
var v2h = .5;

function setup () {
  let container_width = $("#sketch-holder").width();
  let canvas = createCanvas(container_width, v2h*container_width);
  canvas.parent('sketch-holder');
  ellipseMode(CORNER);
  noLoop();
}

function windowResized() {
  let container_width = $("#sketch-holder").width();
  resizeCanvas(container_width, v2h*container_width);
}

function resize(new_v2h) {
  v2h = new_v2h;
  let container_width = $("#sketch-holder").width();
  resizeCanvas(container_width, v2h*container_width);
}

function draw() {
  background(200);
  if (state == null) return;
  let scale = width / (state.field.width+2);
  stroke(0);
  for (let i = 0; i <= state.field.width+1; i++) {
    for (let j = 0; j <= state.field.height+1; j++) {
      noFill();
      if (i == 0) {
        if (j >= state.field.goal_start+1 && j <= state.field.goal_end+1) {
          fill(0,255,0,100);
        } else {
          fill(0);
        }
      } else if (i == state.field.width+1) {
        if (j >= state.field.goal_start+1 && j <= state.field.goal_end+1) {
          fill (0,0,255,100);
        } else {
          fill(0);
        }
      } else if (j == 0 || j == state.field.height+1) {
        fill(0)
      }
      rect(i*scale, j*scale, scale, scale);
    }
  }
  fill(0, 255, 0);
  rect((state.players[0].x+1)*scale, (state.players[0].y+1)*scale, scale, scale);
  fill(0, 0, 255);
  rect((state.players[1].x+1)*scale, (state.players[1].y+1)*scale, scale, scale);

  fill(255, 0, 0);
  ellipse((state.ball.x+1)*scale, (state.ball.y+1)*scale, scale, scale);
}

function getGames() {
  $.get('/BotBall/games', function (res, err) {
    let game = $('#games_select').val();
    let new_games = [];

    for (let game of res) {
      new_games.push(game.id);
    }
    if (!testEquality(new_games, games)) {
      for (let i = games.length-1; i >= 0; i--) {
        if (!new_games.includes(games[i])) {
          games.splice(i, 1);
        }
      }
      for (let i = 0; i < new_games.length; i++) {
        if (!games.includes(new_games[i])) {
          games.push(new_games[i]);
        }
      }
      $('#games_select').empty();
      for (let game of games) {
        $('#games_select').append($("<option>").text(game).val(game));
      }
      if (games.includes(game))
        $('#games_select').val(game);
    }
  });
}

function getState() {
  if ($('#games_select').val() != null) {
    $.get(`/BotBall/state?game=${$('#games_select').val()}`, function (res, err) {
      if (res.error) {
        state = null;
        redraw();
        console.log(res.error);
        return;
      }
      prev_state = state;
      state = res;
      let new_v2h = (state.field.height+2)/(state.field.width+2);
      if (v2h != new_v2h) {
        resize(new_v2h)
      }
      if (state != prev_state) {
        redraw();
      }
    });
  }
}
function testEquality(a1, a2) {
  if (a1.length != a2.length) return false;
  for (let i = 0; i < a1.length; i++) {
    if (a1[i] != a2[i]) return false;
  }
  return true;
}
