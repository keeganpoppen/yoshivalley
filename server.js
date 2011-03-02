var connect = require('connect')
var util = require('util')
var io = require('socket.io')

var router = connect.router(function(app) {
	app.get('/', function(req, res, next) {
		res.write("<h1>Hello, there</h1>")
		res.end()
	})

	app.get('/keegan', function(req, res, next) {
		res.write("welcome to keegantown. keegan is awesome.")
		res.end()
	})
})

var server = connect(
	//automagically logs request & response details
	connect.logger(),

	//uses the mime type to auto-parse certain body data,
	//most notably json
	connect.bodyParser(),

	router,

	//serves all files in the static directory from '/'
	//i.e. static/penis.cock -> www.website.com/penis.cock
	connect.static(__dirname + '/static')

)

server.listen(6969) //listen on everyone's favorite port ;)

util.log('server listening on port 6969... hotly')

var socket = io.listen(server)

socket.on('connection', function(client) {
  client.on('message', function(message) {
    util.log('message gotten: ' + message)
  })
  client.on('disconnect', function() {
    util.log('client disconnected! what a douche!')
  })
})
