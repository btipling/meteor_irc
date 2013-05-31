/**
 * fileOverview Client code etc.
 */

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

Template.dashboard.namesCount = function() {
  var names;
  names = Names.find({}, {sort: {ts: -1}, limit: 1}).fetch();
  if (_.isEmpty(names)) {
    return 0;
  }
  return names[0].names.length;
};
