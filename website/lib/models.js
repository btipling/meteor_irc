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
 * Used to track URLs
 * @constructor
 */
URLs = new Meteor.Collection('urls');

/**
 * Used to track nicks
 * @constructor
 */
Nicks = new Meteor.Collection('nicks');

/**
 * Used to track names.
 * @constructor
 */
Names = new Meteor.Collection('names');

/**
 * Used to track online.
 * @constructor
 */
Online = new Meteor.Collection('online');

/**
 * Tracking messages.
 * @constructor
 */
Messages = new Meteor.Collection('messages');

/**
 * Tracking messages per hour.
 * @constructor
 */
MessagesPerHour = new Meteor.Collection('messagesPerHour');

/**
 * Tracking messages per day.
 * @constructor
 */
MessagesPerDay = new Meteor.Collection('messagesPerDay');
