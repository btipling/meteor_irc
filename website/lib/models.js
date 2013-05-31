/**
 * @fileOverview The models for the app.
 */
/**
 * Just a general config with just one item in it.
 * Entered on first setting up.
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

/**
 * Used to track names.
 * @constructor
 */
Names = new Meteor.Collection('names');

/**
 * Tracking messages.
 * @constructor
 */
Messages = new Meteor.Collection('messages');

/**
 * Used to track joins.
 * @constructor
 */
Joins = new Meteor.Collection('joins');
