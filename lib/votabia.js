var io = require('socket.io')(process.env.PORT || 8012);
var redis = require("redis");
var client = redis.createClient(process.env.REDIS, {
  retry_strategy: function (options) {
      if (options.error) {
          console.error(options.error);
      }
      return Math.min(options.attempt * 100, 10000);
  }
});

const WORKTIME = 60 * 25;
const BREAK = 60 * 5;
const LONGBREAK = 60 * 15;

class Votabia {
  constructor() {
    var me = this;
    this.isPause = false;
    this.isLongPause = false;
    this.isWorkTime = true;
    this.status = 'WORK';
    this.round = 1;
    this.timer = 0;
    this.countdown = 60 * 25;

    client.get("votabia_status", function (err, reply) {
      if (err) {
        console.error(err);
      }
      if (reply && typeof(reply) !== 'undefined') {
        me.status = reply.toString();
      }
    });
    client.get("votabia_timer", function (err, reply) {
      if (err) {
        console.error(err);
      }
      if (reply && !isNaN(reply)) {
        me.timer = parseFloat(reply);
      }
    });

    this.setWorkTime();
  }

  setPause() {
    this.isPause = true;
    this.isWorkTime = false;
    this.isLongPause = false;
    this.status = 'BREAK';
    this.timer = 0;
    this.countdown = BREAK;
    setTimeout(this.setWorkTime.bind(this), 1000 * BREAK)
  }

  setLongPause() {
    this.isPause = true;
    this.isWorkTime = false;
    this.isLongPause = true;
    this.status = 'LONG BREAK';
    this.timer = 0;
    this.countdown = LONGBREAK;
    setTimeout(this.setWorkTime.bind(this), 1000 * LONGBREAK)
  }

  setWorkTime() {
    this.round++;
    this.isPause = false;
    this.isWorkTime = true;
    this.isLongPause = false;
    this.status = 'WORK';
    this.timer = 0;
    this.countdown = WORKTIME;
    if (this.round % 4 == 0) {
      setTimeout(this.setLongPause.bind(this), 1000 * WORKTIME)
    } else {
      setTimeout(this.setPause.bind(this), 1000 * WORKTIME);
    }
  }

  start() {
    setInterval(this.run.bind(this), 500);
  }

  run() {
    this.timer += 0.5;
    var remain = this.countdown - this.timer;
    var minutes = Math.floor(remain / 60);
    var seconds = Math.floor(remain - minutes * 60);
    io.emit('pomodoro', {status: this.status, timer: minutes + ':' + (seconds < 10 ? '0' : '') + seconds, round: this.round});
    client.set("votabia_timer", this.timer, function(err) {
      if (err) {
        console.error(err);
      }
    });
    client.set("votabia_status", this.status, function(err) {
      if (err) {
        console.error(err);
      }
    });
  }
}

module.exports = Votabia;
