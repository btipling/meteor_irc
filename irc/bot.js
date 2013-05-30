(function() {

  var irc, ircClient, sjClient, config, channel, nick, secret, sjsc,
    uniqueId, connectedToSock, _, LIST_FETCH_INTERVAL;

  irc = require('irc');
  sjsc = require('sockjs-client-ws');
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
  LIST_FETCH_INTERVAL = 1 * 60 * 1000;

  /**
   * @type {number}
   */
  uniqueId = 0;
  /**
   * @type {boolean}
   */
  connectedToSock = false;

  ircClient = new irc.Client('irc.freenode.net', nick, {
    channels: [channel],
    autoReJoin: true,
    showErrors: true,
    debug: false
  });

  ircClient.addListener('message', function(from, to, message) {
    console.log(from + ' => ' + to + ': ' + message);
    send({
      msg: 'method',
      method: 'ircMessage',
      params: [from, to, message]
    });
  });

  ircClient.addListener('join', function(channel, nick) {
    console.log(nick + ' joined ' + ' channel');
    if (nick === config.nick) {
      getList();
    }
    send({
      msg: 'method',
      method: 'ircJoin',
      params: [channel, nick]
    });
  });

  ircClient.addListener('names', function(channel, nicks) {
    send({
      msg: 'method',
      method: 'ircNames',
      params: [channel, nicks]
    });
  });

  ircClient.addListener('error', function() {
    console.log('Got an irc error!', arguments);
  });

  sjClient = sjsc.create('http://localhost:3000/sockjs');
  sjClient.on('connection', function() {
    console.log('connection', arguments);
    if (!connectedToSock) {
      send({
        msg: 'connect',
        version: 'pre1',
        support: 'websocket'
      });
    }
  });
  sjClient.on('error', function() {
    console.log('Got a sockjs error!', arguments);
  });
  sjClient.on('data', function(msg) {
    console.log('data', arguments);
  });
  sjClient.on('error', function(e) {
    console.log('error', arguments);
  });

  /**
   * @param {Object} data
   */
  function send(data) {
    var msg;
    uniqueId++;
    if (data.msg === 'method') {
      data.params.unshift(secret);
    }
    data.id = 'meteor_irc_' + uniqueId.toString();
    msg = JSON.stringify(data);
    if (sjClient) {
      try {
        console.log('writing message!', msg);
        sjClient.write(msg);
      } catch (e) {
        console.log('Write error', e);
      }
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

})();
