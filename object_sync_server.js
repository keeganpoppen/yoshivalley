var connect = require('connect')
var util = require('util')
var io = require('socket.io')
var _ = require('./underscore')._

//we can turn up the latency if we want...
var CONN_LATENCY = 0
var SOCKET_LATENCY = 0

var server = connect(
	//automagically logs request & response details
	connect.logger(),

	//uses the mime type to auto-parse certain body data,
	//most notably json
	connect.bodyParser(),

    //latency...
    function(req, res, next) { setTimeout(function(){ next() }, CONN_LATENCY) },

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

    client.on('message',
        function(_m){ message = _m; setTimeout(
        //function(message) {
        function() {
            //util.log('message: ')
            //util.log(util.inspect(message))

            var typeArr = message.type.split(NAMESPACE_SEPARATOR)

            if(typeArr[0] == 'autosync') {
                socket.broadcast(message, client.sessionId)
            }

            if(typeArr[0] == 'sr') {
                //for some reason, socket.io's broadcast function is broken... here's mine
                _.each(_.reject(clients, function(client_obj, id) { return id == client.sessionId; }),
                        function(client) { client.send(message) })
            }
        }
        , SOCKET_LATENCY) }
    )
})

