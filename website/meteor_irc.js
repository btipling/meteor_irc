

/**
 * @fileOverview The main entry point for the app.
 */

if (Meteor.isClient) {

  Meteor.startup(function() {
    Meteor.subscribe('secret', 5000);
    Meteor.subscribe('recentjoins', 5000);
    Meteor.subscribe('recentmessages', 5000);
    Meteor.subscribe('recentnames', 5000);
  });

}

if (Meteor.isServer) {
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
