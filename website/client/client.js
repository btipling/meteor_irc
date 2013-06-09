/**
 * fileOverview Client code etc.
 */

var dataMap, URL_REGEXP, QUERY_URL_REGEXP;

Meteor.subscribe('secret');
Meteor.subscribe('messagesPerHourData');
Meteor.subscribe('messagesPerDayData');
Meteor.subscribe('onlineData');
Meteor.subscribe('namesData');
Meteor.subscribe('topURLsData', 10);
Meteor.subscribe('topNicksData', 10);
Meteor.subscribe('recentMessages', 100);

/**
 * Map for canvas data.
 * @type {Object}
 */
dataMap = {};

/**
 * @type {RegExp}
 */
URL_REGEXP = /^https?:\/\//

/**
 * @type {RegExp}
 */
QUERY_URL_REGEXP = /^.*https?:\/\//

/**
 * @return {boolean}
 */
Template.secretForm.isMissingSecret = function() {
  var hasSecret = Config.findOne({});
  if (!SETUP) {
    return false;
  }
  console.log('hasSecret', hasSecret);
  return !hasSecret;
};

Template.secretForm.events({
  /**
   * @param {Object} event
   */
  'submit': function(event) {
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

Template.dashboard.channelName = function() {
  var config;
  config = Config.findOne({});
  if (config) {
    return config.channel;
  }
}

Template.dashboard.onlineCount = function() {
  var names;
  names = Names.find({}, {sort: {ts: -1}, limit: 1}).fetch();
  if (_.isEmpty(names)) {
    return Template.number(0);
  }
  return Template.number(names[0].names.length);
};


Template.dashboard.messagesToday = function() {
  var m;
  m = MessagesPerDay.findOne({});
  if (!m) {
    return Template.number(0);
  }
  return Template.number(_.last(m.data).count);
};

Template.dashboard.recentMessages = function() {
  var messages, formatted;
  messages = Messages.find({}, {sort: {ts:-1}, limit: 20});
  formatted = [];
  messages.forEach(function(m) {
    formatted.push({
      nick: m.nick,
      message: m.message,
      date: formatDate(m.ts)
    });
  });
  return Template.list(formatted);
};

Template.dashboard.topActive = function() {
  var nicks, results;
  nicks = Nicks.find({}, {sort: {count: -1}});
  results = [];
  nicks.forEach(function(nick) {
    results.push({
      isURL: false,
      name: nick.nick,
      count: nick.count
    });
  });
  return Template.leaderboard(results);
};

Template.linechart.rendered = function() {
  var id, element;
  element = this.find('svg');
  id = $(element).attr('data-id');
  drawLine(dataMap[id], element);
};

Template.dashboard.online = function() {
  var online;
  online = Online.findOne({});
  if (!online) {
    online = {data: []};
  }
  dataMap.online = online.data;
  return Template.linechart({id: 'online'});
};

Template.dashboard.messagesPerHour = function() {
  var messagesPerHour;
  messagesPerHour = MessagesPerHour.findOne({});
  if (!messagesPerHour) {
    messagesPerHour = {data: []};
  }
  dataMap.messagesPerHour = messagesPerHour.data;
  return Template.linechart({id: 'messagesPerHour'});
};

Template.dashboard.messagesPerDay = function() {
  var messagesPerDay;
  messagesPerDay = MessagesPerDay.findOne({});
  if (!messagesPerDay) {
    messagesPerDay = {data: []};
  }
  dataMap.messagesPerDay = messagesPerDay.data;
  return Template.linechart({id: 'messagesPerDay'});
};

Template.dashboard.topURLs = function() {
  var urls;
  urls = URLs.find({}, {sort: {count: -1}});
  results = [];
  urls.forEach(function(url) {
    results.push({
      isURL: true,
      name: url.url,
      count: url.count
    });
  });
  return Template.leaderboard(results);
};

/**
 * @param {Array.<Object>} data
 * @param {Element} element
 */
function drawLine(data, svg) {
  console.log('data', data);
  var e, width, height, line, xValues, yValues, yAxis, xAxis, margin;
  $(svg).empty();
  width = $(svg).parent().width();
  height = 150;
  margin = 30;
  e = d3.select(svg)
    .attr('width', width)
    .attr('height', height);
  x = d3.time.scale().range([margin, width - margin]);
  y = d3.scale.linear().range([height - margin, margin]);
  xValues = _.map(_.values(data), function(d) {
    return d.ts;
  });
  yValues = _.map(_.values(data), function(d) {
    return d.count;
  });
  x.domain([d3.min(xValues), d3.max(xValues)]);
  y.domain([d3.min(yValues), d3.max(yValues)]);
  line = d3.svg.line()
    .x(function(d) {
      return x(d.ts);
    })
    .y(function(d) {
      return y(d.count);
    })
  yAxis = d3.svg.axis()
    .scale(y)
    .ticks(4)
    .tickSubdivide(0)
    .tickFormat(function(value) {
      var floored;
      floored = Math.round(value);
      if (floored !== value) {
        return;
      }
      return value;
    })
    .orient('left');
  xAxis = d3.svg.axis()
    .scale(x)
    .orient('bottom')
  e.append('g')
    .attr('class', 'y axis')
    .attr('transform', 'translate(' + margin + ', 0)')
    .call(yAxis)
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 6)
    .attr('dy', '.71em')
    .style('text-anchor', 'end');
  e.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + (height - margin) + ')')
    .call(xAxis);
  e.append('path').attr('d', line(data))
    .attr('class', 'linepath');
  _.defer(function() {
    $(window).one('resize', _.bind(drawLine, null, data, svg));
  });
}

/**
 * @param {number} num
 * @return {string}
 */
function min2(num) {
  var s;
  s = num.toString();
  if (s.length < 2) {
    s = '0' + s;
  }
  return s;
}

/**
 * @param {number} ts
 * @return {string}
 */
function formatDate(ts) {
  var d, months;
  months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ];
  d = new Date(ts);
  return [
    months[d.getMonth()],
    ' ',
    min2(d.getDate()),
    ' ',
    min2(d.getHours()),
    ':',
    min2(d.getMinutes())
  ].join('');
}
