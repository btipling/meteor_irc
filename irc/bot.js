
(function() {

  var irc, ircClient, config, channel, nick, secret, _,
  LIST_FETCH_INTERVAL, RECONNECT_WAIT, DDPClient, ddpclient,
  ddpConnected, ircSay, ircAlert;

  irc = require('irc');
  DDPClient = require('ddp');
  _ = require('underscore');
  // Used to authenticate the IRC bot with the website;
  config = require('./meteor_irc_secret');

  secret = config.secret;
  nick = config.nick;
  channel = config.channel;

  /**
   * @type {number}
   * @const
   */
  LIST_FETCH_INTERVAL = 10 * 60 * 1000;

  /**
   * @type {number}
   * @const
   */
  RECONNECT_WAIT = 10 * 1000;

  /**
   * @type {boolean}
   */
  ddpConnected = false;

  ircClient = new irc.Client('irc.freenode.net', nick, {
    channels: [channel],
    autoReJoin: true,
    showErrors: true,
    debug: false
  });

  ircClient.addListener('message', function(from, to, message) {
    console.log(from + ' => ' + to + ': ' + message);
    send('ircMessage', [from, to, message]);
  });

  ircClient.addListener('join', function(channel, nick) {
    console.log(nick + ' joined ' + ' channel');
    if (nick === config.nick) {
      getList();
    }
  });

  ircClient.addListener('names', function(channel, nicks) {
    send('ircNames', [channel, nicks]);
  });

  ircClient.addListener('error', function() {
    console.log('Got an irc error!', arguments);
  });


  function connectToMeteor() {
    if (!ddpclient) {
      console.log('Connecting to Meteor.');
      ddpclient = new DDPClient({
        host: config.host,
        port: config.port
      });
    }
    ddpclient.connect(function(error) {
      var msg;
      msg = 'Error connecting to Meteor: ';
      if (error) {
        ircAlert(msg + ' ' + error.toString());
        console.log('Error connecting to Meteor: ', error);
      }
      console.log('Connected to Meteor!');
      ddpConnected = true;
    });
    ddpclient.on('socket-closed', function() {
      console.log('socket closed', arguments);
      ddpConnected = false;
    });
    ddpclient.on('socket-error', function() {
      ircAlert('Socket error!');
      console.log('socket error', arguments);
    });
  }

  connectToMeteor();



  /**
   * @param {string} methodName
   * @param {Array} args
   */
  function send(method, args) {
    if (ddpclient && ddpConnected) {
      console.log('Sending a message to meteor!', method, args);
      args.unshift(secret);
      ddpclient.call(method, args, function(err, result) {
        var msg;
        msg = 'Got an error from meteor';
        if (err) {
          ircAlert(msg + ' ' + err.toString());
          return console.log('Got an error from meteor', err);
        }
        console.log('Method response success.');
        if (!_.isUndefined(result)) {
          console.log('Meteor call result:', result);
          ircSay('Meteor call result: ' + result.toString());
        }
      });
    }
  }

  /**
   * Get a list of users in the channel.
   */
  function getList() {
    var cmd;
    if (ircClient) {
      console.log('Attempting to get names');
      ircClient.send('NAMES', config.channel);
    }
    _.delay(getList, LIST_FETCH_INTERVAL);
  }

  /**
   * @param {string} msg
   */
  function ircSay_(msg) {
    if (ircClient) {
      ircClient.say(config.adminChannel, msg);
    }
  }
  ircSay = _.throttle(ircSay_, 2000);

  function ircAlert_(msg) {
    if (ircClient) {
      ircClient.say(config.adminChannel, msg);
      ircClient.say(config.admin, msg);
    }
  }
  ircAlert = _.throttle(ircAlert_, 2000);

})();
