var bunyan = require('bunyan');
var Elasticsearch = require('bunyan-elasticsearch');
var esStream = new Elasticsearch({
  indexPattern: '[logstash-]YYYY.MM.DD',
  type: 'logs',
  host: '10.1.1.232:31569'
});
esStream.on('error', function (err) {
  console.log('Elasticsearch Stream Error:', err.stack);
});

 
var log = bunyan.createLogger({
  name: "My Application",
  streams: [
    { stream: process.stdout },
    { stream: esStream }
  ],
  serializers: bunyan.stdSerializers
});

module.exports = {Log: log};