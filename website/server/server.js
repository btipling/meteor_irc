/**
 * @fileOverview Server specific functions.
 */


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
  }
}
handleIrcNames = handleIrcNames_;
