var connect = require('connect')
var util = require('util')
var io = require('socket.io')
var _ = require('./underscore')._

var server = connect(
	//automagically logs request & response details
	connect.logger(),

	//uses the mime type to auto-parse certain body data,
	//most notably json
	connect.bodyParser(),

	//router,

	//serves all files in the static directory from '/'
	//i.e. static/penis.cock -> www.website.com/penis.cock
	connect.static(__dirname + '/static')
)

server.listen(80)

var NAMESPACE_SEPARATOR = '.'

var socket = io.listen(server)
var clients = {}

socket.on('connection', function(client) {
    util.log('connection made with client ' + client.sessionId)

    clients[client.sessionId] = client

    client.on('message', function(message) {
        util.log('message: ')
        util.log(util.inspect(message))

        var typeArr = message.type.split(NAMESPACE_SEPARATOR)

        if(typeArr[0] == 'autosync') {
            socket.broadcast(message, client.sessionId)
        }

        if(typeArr[0] == 'sr') {
            socket.broadcast(message, client.sessionId)
        }
    })
})

