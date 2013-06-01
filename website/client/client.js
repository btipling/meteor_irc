/**
 * fileOverview Client code etc.
 */

var dataMap, URL_REGEXP, QUERY_URL_REGEXP;

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

Template.dashboard.recentMessages = function() {
  var messages;
  messages = Messages.find({}, {sort: {ts:-1}, limit: 20});
  return Template.list(messages);
};

/**
 * @param {Object.<string, number>}
 * @return {Array.<Object>}
 */
function getLeaderBoardFromMap(map) {
  var results;
  results = _.map(map, function(count, name) {
    return {name: name, count: count};
  });
  results = _.sortBy(results, function(person) {
    return person.count * -1;
  });
  return Template.leaderboard(results);
};

Template.dashboard.topAactive = function() {
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
  return getLeaderBoardFromMap(URLs);
};

/**
 * @param {Array.<Object>} data
 * @param {Element} element
 */
function drawLine(data, svg) {
  var e, width, height, line, xValues, yValues, yAxis, xAxis;
  width = 300;
  height = 100;
  e = d3.select(svg)
    .attr('width', width)
    .attr('height', height);
  x = d3.time.scale().range([0, width]);
  y = d3.scale.linear().range([height, 0]);
  xValues = _.map(_.values(data), function(d) {
    return d.ts;
  });
  yValues = _.map(_.values(data), function(d) {
    return d.count;
  });
  x.domain([d3.min(xValues), d3.max(xValues)]);
  y.domain([d3.min(yValues), d3.max(yValues)]);
  line = d3.svg.line()
    .interpolate('basis')
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
    .call(yAxis)
    .append('text')
    .attr('transform', 'rotate(-90)')
    .attr('y', 6)
    .attr('dy', '.71em')
    .style('text-anchor', 'end')
  e.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis);
  e.append('path').attr('d', line(data))
    .style('stroke', '#00f')
    .style('stroke-width', '1px')
    .style('fill', 'none');


}
