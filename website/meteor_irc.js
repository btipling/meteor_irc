

/**
 * @fileOverview The main entry point for the app.
 */

if (Meteor.isClient) {

  Meteor.startup(function() {
    Meteor.subscribe('secret');
  });

  /**
   * @return {boolean}
   */
  Template.secretForm.isMissingSecret = function() {
    var hasSecret = Config.findOne({hasSecret: true});
    return !hasSecret;
  };

  Template.secretForm.events({
    /**
     * @param {Object} event
     */
    'submit form' : function(event) {
      var secret, channel, nick;
      event.preventDefault();
      secret = $('.secret-input').val();
      channel = $('.channel-input').val();
      nick = $('.nick-input').val();
      Config.insert({
        hasSecret: true,
        secret: secret,
        channel: channel,
        nick: nick
      });
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function() {
    console.log('Starting');
  });
  Meteor.publish('secret', function() {
    return Config.find({}, {fields: {secret: 0}});
  });
  Meteor.methods({
    ircMessage: function(secret, from, to, message) {
      var config;
      if (config = getConfig(secret)) {
        handleIrcMessage(config, from, to, message);
      }
    },
    ircJoin: function(secret, channel, nick) {
      var config;
      if (config = getConfig(secret)) {
        handleIrcJoin(config, channel, nick);
      }
    },
    ircNames: function(secret, channel, names) {
      var config;
      if (config = getConfig(secret)) {
        handleIrcNames(config, channel, names);
      }
    }
  });
}
