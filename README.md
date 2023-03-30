# RabbitMQ client in nodejs with autorecovery

**NOTE:** This is only a proof of concept and not meant to be used AS-IS for production deployments.

A simple implementation of auto recovery using `amqplib`. Works with Amazon MQ RabbitMQ cluster.

The main program resides in `index.js`. The program creates a connection and sets up sender and listener channels. On errors the the program tries to re-initiate the connection and recover the listener channel.

## Build

```bash
npm install
```

## Run
Create `.env` file in the project base directory with values for the environment variables.

| Name | Purpose |
|------|---------|
| `RABBIT_HOSTNAME` | DNS host name of AMQP endpoint for the RabbitMQ cluster |
| `RABBIT_PORT` | Port of AMQP endpoint for the RabbitMQ cluster |
| `RABBIT_USERNAME` | User name with permission to create queue |
| `RABBIT_PASSWORD` | Password for the user |

### Sample .env

```
RABBIT_HOSTNAME=<host>
RABBIT_PORT=<port>
RABBIT_USERNAME=<user>
RABBIT_PASSWORD=<password>
```

```bash
npm run server
```

### Sample run with broker reboot

```
$ npm run server

> rabbitmq-client-with-recovery@1.0.0 server
> node ./index.js

All ok with recover. {}
[2023-03-30T10:23:27.904Z] Received msg: Did something at [2023-03-30T10:23:27.902Z].
[2023-03-30T10:23:28.406Z] Received msg: Did something at [2023-03-30T10:23:28.404Z].
[2023-03-30T10:23:28.906Z] Received msg: Did something at [2023-03-30T10:23:28.904Z].
[2023-03-30T10:23:29.407Z] Received msg: Did something at [2023-03-30T10:23:29.405Z].
Error in sendToQueue. IllegalOperationError: Channel closed
    at Channel.<anonymous> (/home/ec2-user/environment/node_modules/amqplib/lib/channel.js:159:11)
    at Channel.publish (/home/ec2-user/environment/node_modules/amqplib/lib/callback_model.js:170:17)
    at Channel.sendToQueue (/home/ec2-user/environment/node_modules/amqplib/lib/callback_model.js:174:15)
    at Timeout._onTimeout (/home/ec2-user/environment/index.js:94:50)
    at listOnTimeout (node:internal/timers:559:17)
    at processTimers (node:internal/timers:502:7) {
  stackAtStateChange: 'Stack capture: Connection closed: 320 (CONNECTION-FORCED) with message "CONNECTION_FORCED - Node was put into maintenance mode"\n' +
    '    at Object.accept (/home/ec2-user/environment/node_modules/amqplib/lib/connection.js:89:15)\n' +
    '    at Connection.mainAccept [as accept] (/home/ec2-user/environment/node_modules/amqplib/lib/connection.js:63:33)\n' +
    '    at TLSSocket.go (/home/ec2-user/environment/node_modules/amqplib/lib/connection.js:486:48)\n' +
    '    at TLSSocket.emit (node:events:513:28)\n' +
    '    at emitReadable_ (node:internal/streams/readable:578:12)\n' +
    '    at processTicksAndRejections (node:internal/process/task_queues:82:21)'
}
Clearing sender interval.
Executing clean up and retry...
Closing sender channel...
Error while closing sender channel. IllegalOperationError: Channel closed
    at Channel.<anonymous> (/home/ec2-user/environment/node_modules/amqplib/lib/channel.js:159:11)
    at Channel.C.closeBecause (/home/ec2-user/environment/node_modules/amqplib/lib/channel.js:211:8)
    at Channel.close (/home/ec2-user/environment/node_modules/amqplib/lib/callback_model.js:90:15)
    at closeSender (/home/ec2-user/environment/index.js:144:34)
    at cleanUpAndRetry (/home/ec2-user/environment/index.js:129:5)
    at Timeout.<anonymous> (/home/ec2-user/environment/index.js:101:29)
    at listOnTimeout (node:internal/timers:559:17)
    at processTimers (node:internal/timers:502:7) {
  stackAtStateChange: 'Stack capture: Connection closed: 320 (CONNECTION-FORCED) with message "CONNECTION_FORCED - Node was put into maintenance mode"\n' +
    '    at Object.accept (/home/ec2-user/environment/node_modules/amqplib/lib/connection.js:89:15)\n' +
    '    at Connection.mainAccept [as accept] (/home/ec2-user/environment/node_modules/amqplib/lib/connection.js:63:33)\n' +
    '    at TLSSocket.go (/home/ec2-user/environment/node_modules/amqplib/lib/connection.js:486:48)\n' +
    '    at TLSSocket.emit (node:events:513:28)\n' +
    '    at emitReadable_ (node:internal/streams/readable:578:12)\n' +
    '    at processTicksAndRejections (node:internal/process/task_queues:82:21)'
}
Closing listener channel...
Error in closing listener channel. IllegalOperationError: Channel closed
    at Channel.<anonymous> (/home/ec2-user/environment/node_modules/amqplib/lib/channel.js:159:11)
    at Channel.C.closeBecause (/home/ec2-user/environment/node_modules/amqplib/lib/channel.js:211:8)
    at Channel.close (/home/ec2-user/environment/node_modules/amqplib/lib/callback_model.js:90:15)
    at closeListener (/home/ec2-user/environment/index.js:159:36)
    at cleanUpAndRetry (/home/ec2-user/environment/index.js:131:5)
    at Timeout.<anonymous> (/home/ec2-user/environment/index.js:101:29)
    at listOnTimeout (node:internal/timers:559:17)
    at processTimers (node:internal/timers:502:7) {
  stackAtStateChange: 'Stack capture: Connection closed: 320 (CONNECTION-FORCED) with message "CONNECTION_FORCED - Node was put into maintenance mode"\n' +
    '    at Object.accept (/home/ec2-user/environment/node_modules/amqplib/lib/connection.js:89:15)\n' +
    '    at Connection.mainAccept [as accept] (/home/ec2-user/environment/node_modules/amqplib/lib/connection.js:63:33)\n' +
    '    at TLSSocket.go (/home/ec2-user/environment/node_modules/amqplib/lib/connection.js:486:48)\n' +
    '    at TLSSocket.emit (node:events:513:28)\n' +
    '    at emitReadable_ (node:internal/streams/readable:578:12)\n' +
    '    at processTicksAndRejections (node:internal/process/task_queues:82:21)'
}
Closing connection...
Connection closed.
RabbitMQ is down. Will retry after 2 seconds. Error: connect ECONNREFUSED 10.0.138.17:5671
    at TCPConnectWrap.afterConnect [as oncomplete] (node:net:1278:16) {
  errno: -111,
  code: 'ECONNREFUSED',
  syscall: 'connect',
  address: '10.0.138.17',
  port: 5671
}
Executing clean up and retry...
Closing sender channel...
Sender channel not found.
Closing listener channel...
Listener channel not found.
Closing connection...
Connection not found.
All ok with recover. {}
[2023-03-30T10:23:34.498Z] Received msg: Did something at [2023-03-30T10:23:34.495Z].
[2023-03-30T10:23:34.999Z] Received msg: Did something at [2023-03-30T10:23:34.996Z].
[2023-03-30T10:23:35.500Z] Received msg: Did something at [2023-03-30T10:23:35.496Z].
[2023-03-30T10:23:35.998Z] Received msg: Did something at [2023-03-30T10:23:35.996Z].
[2023-03-30T10:23:36.498Z] Received msg: Did something at [2023-03-30T10:23:36.496Z].
[2023-03-30T10:23:36.998Z] Received msg: Did something at [2023-03-30T10:23:36.996Z].
[2023-03-30T10:23:37.499Z] Received msg: Did something at [2023-03-30T10:23:37.497Z].
[2023-03-30T10:23:37.999Z] Received msg: Did something at [2023-03-30T10:23:37.997Z].
[2023-03-30T10:23:38.500Z] Received msg: Did something at [2023-03-30T10:23:38.498Z].
[2023-03-30T10:23:39.001Z] Received msg: Did something at [2023-03-30T10:23:38.999Z].
[2023-03-30T10:23:39.502Z] Received msg: Did something at [2023-03-30T10:23:39.500Z].
[2023-03-30T10:23:40.003Z] Received msg: Did something at [2023-03-30T10:23:40.001Z].
[2023-03-30T10:23:40.504Z] Received msg: Did something at [2023-03-30T10:23:40.502Z].
```