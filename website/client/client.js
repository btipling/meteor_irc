/**
 * fileOverview Client code etc.
 */

var dataMap, URL_REGEXP, QUERY_URL_REGEXP, isFirefox, isSafari;

isFirefox = navigator.userAgent.toLowerCase().indexOf('firefox') > -1;
isSafari = false;
if (navigator.userAgent.indexOf('Safari') != -1 &&
      navigator.userAgent.indexOf('Chrome') == -1) {
  isSafari = true;
}

if (isSafari) {
  // Severe performance problems.
  Meteor.subscribe('secret', 100);
  Meteor.subscribe('recentjoins', 100);
  Meteor.subscribe('recentmessages', 100);
  Meteor.subscribe('recentnames', 100);
} else {
  Meteor.subscribe('secret', 5000);
  Meteor.subscribe('recentjoins', 5000);
  Meteor.subscribe('recentmessages', 5000);
  Meteor.subscribe('recentnames', 5000);
}


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

Meteor.startup(function() {
  /**
   * @return {boolean}
   */
  Template.secretForm.isMissingSecret = function() {
    var hasSecret = Config.findOne({});
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
  var messages, now;
  now = new Date();
  now.setHours(0);
  now.setMinutes(0);
  now.setSeconds(0);
  messages = Messages.find({ts: {$gte: now.getTime()}});
  return Template.number(messages.count());
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

/**
 * @param {Object.<string, number>}
 * @param {boolean=} opt_isURL
 * @return {Array.<Object>}
 */
function getLeaderBoardFromMap(map, opt_isURL) {
  var results;
  results = _.map(map, function(count, name) {
    return {
      isURL: !!opt_isURL,
      name: name,
      count: count
    };
  });
  results = _.sortBy(results, function(person) {
    return person.count * -1;
  });
  return Template.leaderboard(results.slice(0, 5));
};

Template.dashboard.topActive = function() {
  var messages, countMap;
  messages = Messages.find({});
  countMap = {};
  messages.forEach(function(message) {
    if(!_.has(countMap, message.nick)) {
      return countMap[message.nick] = 1;
    }
    countMap[message.nick] += 1;
  });
  return getLeaderBoardFromMap(countMap);
};

Template.linechart.rendered = function() {
  var id, element;
  element = this.find('svg');
  id = $(element).attr('data-id');
  drawLine(dataMap[id], element);
};

Template.dashboard.online = function() {
  var names, data;
  names = Names.find({});
  data = [];
  names.forEach(function(nameset) {
    data.push({
      count: nameset.names.length,
      ts: nameset.ts
    });
  });
  dataMap.online = data;
  return Template.linechart({id: 'online'});
};

/**
 * @param {number} interval
 */
function getMessagesPerInterval(interval) {
  var messages, data, currentTime, currentCount, i, currentDate;
  now = new Date().getTime();
  data = [];
  messages = Messages.find({}, {sort: {ts: 1}}).fetch();
  if (_.isEmpty(messages)) {
    return [];
  }
  message = messages[0];
  currentDate = new Date(message.ts);
  currentDate.setHours(0);
  currentDate.setMinutes(0);
  currentDate.setSeconds(0);
  currentTime = currentDate.getTime();
  i = 0;
  while(currentTime < now) {
    currentCount = 0;
    if (i >= messages.length) {
      // No more messages, just add 0 for remaining hours.
      data.push({count: currentCount, ts: currentTime});
      currentTime += interval;
      continue;
    }
    while(message.ts < currentTime + interval) {
      currentCount += 1;
      i += 1;
      if (i >= messages.length) {
        break;
      }
      message = messages[i];
    }
    data.push({
      count: currentCount,
      ts: currentTime
    });
    currentTime += interval;
  }
  return data;
}

Template.dashboard.messagesPerHour = function() {
  dataMap.messagesPerHour = getMessagesPerInterval(60 * 60 * 1000);
  return Template.linechart({id: 'messagesPerHour'});
};

Template.dashboard.messagesPerDay = function() {
  dataMap.messagesPerDay = getMessagesPerInterval(24 * 60 * 60 * 1000);
  return Template.linechart({id: 'messagesPerDay'});
};

Template.dashboard.topURLs = function() {
  var messages, URLs;
  URLs = {};
  messages = Messages.find({message: {$regex: QUERY_URL_REGEXP}});
  messages.forEach(function(m) {
    var words, urls
    words = m.message.split(' ');
    urls = _.filter(words, function(word) {
      return URL_REGEXP.test(word);
    });
    _.each(urls, function(url) {
      if (!_.has(URLs, url)) {
        return URLs[url] = 1;
      }
      URLs[url] += 1;
    });
  });
  return getLeaderBoardFromMap(URLs, true);
};

/**
 * @param {Array.<Object>} data
 * @param {Element} element
 */
function drawLine(data, svg) {
  var e, width, height, line, xValues, yValues, yAxis, xAxis, margin;
  $(svg).empty();
  width = $(svg).parent().width();
  height = 150;
  margin = 20;
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
