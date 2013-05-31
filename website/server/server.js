/**
 * @fileOverview Server specific functions.
 */

Meteor.startup(function() {
  console.log('Starting');
  Meteor.publish('secret', function() {
    return Config.find({}, {fields: {secret: 0}});
  });
  Meteor.publish('recentjoins', function(limit) {
    return Joins.find({}, {limit: limit});
  });
  Meteor.publish('recentmessages', function(limit) {
    return Messages.find({}, {limit: limit});
  });
  Meteor.publish('recentnames', function(limit) {
    return Names.find({}, {limit: limit});
  });
});

/**
 * @param {string}
 * @return {Config}
 */
function getConfig_(secret) {
  var config;
  config = Config.findOne({secret: secret});
  if (!config) {
    console.log('Not authorized!');
  }
  return config;
}
getConfig = getConfig_;

/**
 * @param {Config} config
 * @param {string} from
 * @param {string} to
 * @param {string} message
 */
function handleIrcMessage_(config, from, to, message) {
  if (config.channel === to) {
    console.log('Got a message', from, message);
    Messages.insert({
      nick: from,
      message: message,
      ts: new Date().getTime()
    });
  }
}
handleIrcMessage = handleIrcMessage_;

/**
 * @param {Config} config
 * @param {string} channel
 * @param {string} nick
 */
function handleIrcJoin_(config, channel, nick) {
  if (config.channel === channel && nick !== config.nick) {
    console.log('Got a join', nick);
    Joins.insert({
      nick: nick,
      ts: new Date().getTime()
    });
  }
}
handleIrcJoin = handleIrcJoin_;

/**
 * @param {Config} config
 * @param {string} channel
 * @param {!Object} names
 */
function handleIrcNames_(config, channel, names) {
  if (config.channel === channel) {
    names = _.keys(names);
    console.log('Got names!', names);
    Names.insert({
      names: names,
      ts: new Date().getTime()
    });
  }
}
handleIrcNames = handleIrcNames_;
