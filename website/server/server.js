/**
 * @fileOverview Server specific functions.
 */

var URL_REGEXP;

Meteor.methods({
  ircMessage: function(secret, from, to, message) {
    var config;
    if (config = getConfig(secret)) {
      handleIrcMessage(config, from, to, message);
    }
  },
  ircNames: function(secret, channel, names) {
    var config;
    if (config = getConfig(secret)) {
      handleIrcNames(config, channel, names);
    }
  }
});

Meteor.startup(function() {
  console.log('Starting');
  Meteor.publish('secret', function() {
    return Config.find({}, {fields: {secret: 0}});
  });
  Meteor.publish('topURLsData', function(limit) {
    return URLs.find({}, {sort: {count: -1}, limit: limit});
  });
  Meteor.publish('topNicksData', function(limit) {
    return Nicks.find({}, {sort: {count: -1}, limit: limit});
  });
  Meteor.publish('recentMessages', function(limit) {
    return Messages.find({}, {sort: {ts:-1}, limit: limit});
  });
  Meteor.publish('messagesPerHourData', function() {
    return MessagesPerHour.find({});
  });
  Meteor.publish('messagesPerDayData', function() {
    return MessagesPerDay.find({});
  });
  Meteor.publish('onlineData', function() {
    return Online.find({});
  });
  Meteor.publish('namesData', function() {
    return Names.find({});
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
  var ts;
  if (to !== config.channel) return;
  ts = new Date().getTime()
  console.log('Got a message', from, message);
  Messages.insert({
    nick: from,
    message: message,
    ts: ts
  });
  updateMessagesPerHour(ts);
  updateMessagesPerDay(ts);
  updateNick(from, ts);
  updateURL(message, ts);
}
handleIrcMessage = handleIrcMessage_;

/**
 * @param {Config} config
 * @param {string} channel
 * @param {!Object} names
 */
function handleIrcNames_(config, channel, names) {
  var n, names, ts, data;
  if (channel !== config.channel) return;
  ts = new Date().getTime();
  names = _.keys(names);
  console.log('Got names!', names);
  data = {names: names, ts: ts};
  n = Names.findOne({});
  if (!n) {
    Names.insert(data);
  } else {
    Names.update({_id: n._id}, data);
  }
  updateOnline(ts, names.length);
}
handleIrcNames = handleIrcNames_;

/**
 * @param {number} ts
 */
function updateMessagesPerHour(ts) {
  var hourTs, interval;
  interval = 1000 * 60 * 60;
  hourTs = Math.floor(ts/3600000) * 3600000;
  updateMessagesPerInterval(ts, hourTs, interval, MessagesPerHour);
}

/**
 * @param {number} ts
 */
function updateMessagesPerDay(ts) {
  var dayTs, interval;
  interval = 1000 * 60 * 60 * 24;
  dayTs = Math.floor(ts/86400000) * 86400000;
  updateMessagesPerInterval(ts, dayTs, interval, MessagesPerDay);
}


/**
 * @param {number} ts
 * @param {number} intervalTs
 * @param {number} interval
 * @param {Meteor.Collection} C
 */
function updateMessagesPerInterval(ts, intervalTs, interval, C) {
  var doc, lastTs;
  doc = C.findOne({});
  if (!doc) {
    // Never saved anything before.
    C.insert({
      lastTs: intervalTs,
      data: [{count: 1, ts: intervalTs}]
    });
    return;
  }
  lastTs = doc.lastTs;
  doc.lastTs = intervalTs;
  if (lastTs === intervalTs) {
    // Message received in same interval as previous.
    _.last(doc.data).count += 1;
    C.update({_id: doc._id}, doc);
    return;
  }
  // Starting a new interval.
  while((lastTs += interval) < intervalTs) {
    // Add 0's for all intervals for which no messages were received.
    doc.data.push({count: 0, ts: lastTs});
  }
  doc.data.push({count: 1, ts: intervalTs});
  C.update({_id: doc._id}, doc);
}

/**
 * @param {number} ts
 * @param {number} count
 */
function updateOnline(ts, count) {
  var doc, data;
  doc = Online.findOne({});
  data = {count: count, ts: ts};
  if (!doc) {
    Online.insert({lastTs: ts, data: [data]});
    return;
  }
  doc.data.push(data);
  doc.lastTs = ts;
  Online.update({_id: doc._id}, doc);
}

/**
 * @param {string} from
 * @param {number} ts
 */
function updateNick(from, ts) {
  var nick;
  nick = Nicks.findOne({nick: from});
  if (!nick) {
    Nicks.insert({
      nick: from,
      count: 1,
      lastTs: ts
    });
    return;
  }
  nick.lastTs = ts;
  nick.count += 1;
  Nicks.update({_id: nick._id}, nick);
}

/**
 * @type {RegExp}
 */
URL_REGEXP = /^https?:\/\//

/**
 * @param {string} message
 * @param {number} ts
 */
function updateURL(message, ts) {
  var urls, words;
  words = message.split(' ');
  urls = _.filter(words, function(word) {
    return URL_REGEXP.test(word);
  });
  _.each(urls, function(url) {
    urlDoc = URLs.findOne({url: url});
    if (!urlDoc) {
      URLs.insert({
        url: url,
        count: 1,
        lastTs: ts
      });
      return;
    }
    urlDoc.lastTs = ts;
    urlDoc.count += 1;
    URLs.update({_id: urlDoc._id}, urlDoc);
  });
}
