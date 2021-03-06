var log = require('./Log.js').Log;
var sqs = require('sqs');
var amqplib = require('amqplib/callback_api');
var q = 'entities';
var mq = 'amqp://guest:guest@10.1.1.231:5672';

var args = process.argv.slice(2);
log.info('SD SQS service started');

var queue = sqs({
	access: args[0],
	secret: args[1],
	region: args[2] // defaults to us-east-1
});

function bail(err) {
  console.error(err);
  process.exit(1);
}

function pullSQS(rabbit)
{
    queue.pull(args[3], function(message, callback) {
        log.info(message);

        var payload = {
          EventType: message.EventType,
          EventId: message.EventId,
          TenantId: message.TenantId,
          Action: message.Payload.Name,
          CorrelationId: message.CorrelationId,
          Entity:
          {
            Id: message.Payload.Source.EntityId,
            Name: message.Payload.Source.Name
          }
      };

        rabbit.publish(q + '_gateway', message.Payload.Name, new Buffer(JSON.stringify(payload)));
        callback(); // we are done with this message - pull a new one
                    // calling the callback will also delete the message from the queue
    });
}

amqplib.connect(mq, function(err, conn) {
    if (err != null) {
            bail(err);
    }
      conn.createChannel(on_open);
      function on_open(err, ch) {
        if (err != null) bail(err);
        ch.assertExchange(q + '_gateway', 'fanout', { durable: true, auto_delete: false });
        ch.assertExchange(q + '_distributor', 'topic', { durable: true, auto_delete: false });
        ch.bindExchange(q + '_distributor', q + '_gateway');

        ch.assertQueue(q,
          {
            exclusive: false,
            durable: true,
            autoDelete: false
          }, function(err, queue) { ch.bindQueue(q, q + '_gateway', '#');}
        );

        pullSQS(ch);
      }
});
