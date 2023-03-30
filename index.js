/**
 * This file is distributed on an
 * "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either
 * express or implied.
 * 
 */
const amqp = require('amqplib/callback_api');
const queue = 'tasks';
const RETRY_INTERVAL = 2000;
const SEND_INTERVAL = 500;
const EXIT_TIMEOUT = 5 * 60 * 1000;
const CONNECTION_OPTS = {
    protocol: 'amqps',
    hostname: 'b-d5c2fa22-b6fc-4ed9-b0b5-bf264a3b35a0.mq.eu-west-1.amazonaws.com',
    port: 5671,
    username: 'rabbitmq-admin',
    password: 'password@1234',
    locale: 'en_US',
    heartbeat: 60,
    vhost: '/',
};

let state = {
    connection: null,
    channel: {
        listener: null,
        sender: null,
    }
};

let interval = null;

function initRabbitMq() {
    amqp.connect(CONNECTION_OPTS, (err, conn) => {
        if (err) {
            console.log('RabbitMQ is down. Will retry after 2 seconds.', err);
            cleanUpAndRetry(state);
            return;
        }

        state.connection = conn;

        // Listener
        if (!state.channel.listener) {
            state.connection.createChannel((err, ch2) => {
                if (err) {
                    console.log('Error in creating listener channel. Will retry after 2 seconds.');
                    cleanUpAndRetry(state);
                    return;
                }
                state.channel.listener = ch2;
                state.channel.listener.assertQueue(queue);

                state.channel.listener.on('error', (err) => {
                    console.log(err);
                    cleanUpAndRetry(state);
                });

                state.channel.listener.recover((err, ok) => {
                    if (err) {
                        console.log('Error recovering listener channel.', err);
                        return;
                    }
                    console.log('All ok with recover.', ok);
                });

                state.channel.listener.consume(queue, (msg) => {
                    if (msg != null) {
                        let dt = new Date();
                        console.log('[' + dt.toISOString() + '] Received msg: ' + msg.content.toString());
                        ch2.ack(msg);
                    } else {
                        state.channel.listener = null;
                        console.log('Consumer cancelled.');
                    }
                });
            });
        }

        // Sender
        if (!state.channel.sender) {
            state.connection.createChannel((err, ch1) => {
                if (err) {
                    console.log('Error in creating sender channel. Will retry after 2 seconds.');
                    cleanUpAndRetry(state);
                    return;
                }
                state.channel.sender = ch1;
                state.channel.sender.assertQueue(queue);

                state.channel.sender.on('error', (err) => {
                    console.log('Error in sending channel.', err);
                    cleanUpAndRetry(state);
                });
                
                interval = setInterval(() => {
                    if (!!state.channel.sender) {
                        let dt = new Date();
                        try {
                            state.channel.sender.sendToQueue(queue, Buffer.from('Did something at [' + dt.toISOString() + '].'));
                        } catch (err1) {
                            console.log('Error in sendToQueue.', err1);
                            
                            console.log('Clearing sender interval.');
                            clearInterval(interval);
                            
                            cleanUpAndRetry(state);
                        }
                    } else {
                        console.log("Can't send to queue since sender is null.");
                    }
                }, SEND_INTERVAL);
            });
        }

        state.connection.on('error', (err) => {
            console.log('Connection error.', err);
            cleanUpAndRetry(state);
        });

        /*
        setTimeout(() => {
            conn.close();
            process.exit(0);
        }, EXIT_TIMEOUT);
        */
    });
}

initRabbitMq();

function cleanUpAndRetry(state) {
    console.log('Executing clean up and retry...');
    
    closeSender(state);
    
    closeListener(state);
    
    closeConnection(state);
    
    setTimeout(() => {
        initRabbitMq();
    }, RETRY_INTERVAL);
}

function closeSender(state) {
    console.log('Closing sender channel...');
    if (!!state.channel.sender) {
        try {
            state.channel.sender.close();
            console.log('Sender channel closed.');
        } catch (errSender) {
            console.log('Error while closing sender channel.', errSender);
        }
        state.channel.sender = null;
    } else {
        console.log('Sender channel not found.');
    }
}

function closeListener(state) {
    console.log('Closing listener channel...');
    if (!!state.channel.listener) {
        try {
            state.channel.listener.close();
            console.log('Listener channel closed.');
        } catch (errListener) {
            console.log('Error in closing listener channel.', errListener); 
        }
        state.channel.listener = null;
    } else {
        console.log('Listener channel not found.');
    }
}

function closeConnection(state) {
    console.log('Closing connection...');
    if (!!state.connection) {
        try {
            state.connection.close();
            console.log('Connection closed.');
        } catch (errConn) {
            console.log('Error in closing connection.', errConn);
        }
        state.connection = null;
    } else {
        console.log('Connection not found.');
    }
}