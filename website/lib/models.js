/**
 * @fileOverview The models for the app.
 */
/**
 * @constructor
 */
Config = new Meteor.Collection('config');
Config.allow({
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

