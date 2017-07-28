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
const DAYSTARTHOUR = 8;
const DAYSTARTMIN = 0;
const DAYENDHOUR = 19;
const DAYENDMIN = 0;

class Votabia {
  init() {
    this.status = 'WORK';
    this.round = 0;
    this.timer = 0;
    this.countdown = WORKTIME;
  }

  constructor() {
    var me = this;
    this.init();

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
    client.get("votabia_round", function (err, reply) {
      if (err) {
        console.error(err);
      }
      if (reply && !isNaN(reply)) {
        me.round = parseInt(reply);
      }
    });

    this.setWorkTime();
  }

  setPause() {
    this.status = 'BREAK';
    this.timer = 0;
    this.countdown = BREAK;
    this.timeout = setTimeout(this.setWorkTime.bind(this), 1000 * BREAK)
  }

  setLongPause() {
    this.status = 'LONG BREAK';
    this.timer = 0;
    this.countdown = LONGBREAK;
    this.timeout = setTimeout(this.setWorkTime.bind(this), 1000 * LONGBREAK)
  }

  setWorkTime() {
    this.round++;
    this.status = 'WORK';
    this.timer = 0;
    this.countdown = WORKTIME;
    if (this.round % 4 == 0) {
      this.timeout = setTimeout(this.setLongPause.bind(this), 1000 * WORKTIME)
    } else {
      this.timeout = setTimeout(this.setPause.bind(this), 1000 * WORKTIME);
    }
  }

  start() {
    this.interval = setInterval(this.run.bind(this), 500);
  }

  isWorkingHour() {
    var now = new Date();
    if (now.getHours() < DAYSTARTHOUR || now.getHours > DAYENDHOUR) {
      return false;
    }
    if (now.getHours() == DAYSTARTHOUR && now.getMinutes() < DAYSTARTMIN) {
      return false;
    }
    if (now.getHours() == DAYENDHOUR && now.getMinutes() > DAYENDMIN) {
      return false;
    }
    return true;
  }

  checkWorkingHour() {
    if (!this.isWorkingHour()) {
      this.status = 'STOP';
      this.timer = 0;
      this.round = 0;
      this.countdown = 0;
    }
  }

  checkReset() {
    var now = new Date();
    if (now.getHours() == DAYSTARTHOUR && now.getMinutes() == DAYSTARTMIN && now.getSeconds() == 0) {
      clearTimeout(this.timeout);
      clearInterval(this.interval);
      this.init();
      this.setWorkTime();
      this.start();
    }
  }

  run() {
    this.timer += 0.5;
    this.checkReset();
    this.checkWorkingHour();
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
    client.set("votabia_round", this.round, function(err) {
      if (err) {
        console.error(err);
      }
    });
  }
}

module.exports = Votabia;
