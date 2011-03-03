var connect = require('connect')
var util = require('util')
var io = require('socket.io')

var router = connect.router(function(app) {
	app.get('/', function(req, res, next) {
		res.write("<h1>Hello, there</h1>")
	})

	app.get('/keegan', function(req, res, next) {
		res.write("welcome to keegantown. keegan is awesome.")
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
	connect.static(__dirname + '/static'),

  //kill all forms of caching. muahahaha.
  function(req, res) {
    res.setHeader('Cache-Control', 'no-cache, must-revalidate')
    res.setHeader('Expires', 'Sat, 26 Jul 1997 05:00:00 GMT')
    res.setHeader('Pragma', 'no-cache')
    res.setHeader('Last-Modified', 'Sat, 26 Jul 2025 05:00:00 GMT')
    res.end()
  }
)

server.listen(6969) //listen on everyone's favorite port ;)

util.log('server listening on port 6969... hotly')

var socket = io.listen(server)

socket.on('connection', function(client) {
  client.on('message', function(msg) {
      if(msg.type == 'accel') {
        util.log('x: ' + msg.accelX + ', y: ' + msg.accelY + ', z: ' + msg.accelZ) 
      }
  })
  client.on('disconnect', function() {
    util.log('client disconnected! what a douche!')
  })
})
