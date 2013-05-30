/**
 * @constructor
 */
Secret = new Meteor.Collection('secret');
Secret.allow({
  insert: function() {
    return true;
  },
  update: function() {
    return false;
  },
  remove: function() {
    return false;
  }
});

if (Meteor.isClient) {

  Meteor.startup(function() {
    Meteor.subscribe('secret');
  });

  /**
   * @return {boolean}
   */
  Template.secretForm.isMissingSecret = function() {
    var hasSecret = Secret.findOne({hasSecret: true});
    return !hasSecret;
  };

  Template.secretForm.events({
    /**
     * @param {Object} event
     */
    'submit form' : function(event) {
      var secret;
      event.preventDefault();
      secret = $('.secret-input').val();
      Secret.insert({
        hasSecret: true,
        secret: secret
      });
    }
  });
}

if (Meteor.isServer) {
  Meteor.startup(function() {
    console.log('Starting');
  });
  Meteor.publish('secret', function() {
    return Secret.find({}, {fields: {secret: 0}});
  });
}
