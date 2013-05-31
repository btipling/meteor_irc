/**
 * fileOverview Client code etc.
 */

var dataMap;

/**
 * Map for canvas data.
 * @type {Object}
 */
dataMap = {};

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

Template.dashboard.topAactive = function() {
  var messages, countMap, results;
  messages = Messages.find({});
  countMap = {};
  messages.forEach(function(message) {
    if(!_.has(countMap, message.nick)) {
      return countMap[message.nick] = 1;
    }
    countMap[message.nick] += 1;
  });
  results = _.map(countMap, function(count, nick) {
    return {nick: nick, count: count};
  });
  results = _.sortBy(results, function(person) {
    return person.count * -1;
  });
  console.log('results', results);
  return Template.leaderboard(results);
};

Template.linechart.rendered = function() {
  var id, element;
  element = this.find('svg');
  id = $(element).attr('data-id');
  console.log('data', dataMap[id], element);
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
      console.log('ts', d.ts, width);
      console.log('ts value', x(d.ts));
      return x(d.ts);
    })
    .y(function(d) {
      console.log('count', d.count, height);
      console.log('count value', y(d.count));
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
    .text('Number online');
  e.append('g')
    .attr('class', 'x axis')
    .attr('transform', 'translate(0,' + height + ')')
    .call(xAxis);
  e.append('path').attr('d', line(data))
    .style('stroke', '#000')
    .style('stroke-width', '1px')
    .style('fill', 'none');


}
