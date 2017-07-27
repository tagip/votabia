var io = require('socket.io')(8012);
var redis = require("redis");
var client = redis.createClient(process.env.REDIS);

var isPause = false;
var isLongPause = false;
var isWorkTime = true;
var status = 'WORK';
var round = 1;
var timer = 0;

client.get("votabia_status", function (err, reply) {
  if (reply) {
    status = reply.toString();
  }
});
client.get("votabia_timer", function (err, reply) {
  if (reply && !isNaN(reply)) {
    timer = parseFloat(reply);
  }
});

function run() {
  timer += 0.5;
  var minutes = Math.floor(timer / 60);
  var seconds = Math.floor(timer - minutes * 60);
  io.emit('pomodoro', {status: status, timer: minutes + ':' + (seconds < 10 ? '0' : '') + seconds});
  client.set("votabia_timer", timer);
  client.set("votabia_status", status);
}

function setPause() {
  isPause = true;
  isWorkTime = false;
  isLongPause = false;
  status = 'PAUSE';
  timer = 0;
  setTimeout(setWorkTime, 1000 * 60 * 5)
}

function setLongPause() {
  isPause = true;
  isWorkTime = false;
  isLongPause = true;
  status = 'LONG PAUSE';
  timer = 0;
  setTimeout(setWorkTime, 1000 * 60 * 15)
}

function setWorkTime() {
  round++;
  isPause = false;
  isWorkTime = true;
  isLongPause = false;
  status = 'WORK';
  timer = 0;
  if (round % 4 == 0) {
    round = 1;
    setTimeout(setLongPause, 1000 * 60 * 25)
  } else {
    setTimeout(setPause, 1000 * 60 * 25);
  }
}

setWorkTime();
setInterval(run, 500);

