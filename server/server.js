//TODO: package.json

var connect = require('connect')
var util = require('util')

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

var server = connect.createServer()
	//automagically logs request & response details
	.use(connect.logger())

	//uses the mime type to auto-parse certain body data,
	//most notably json
	.use(connect.bodyParser())

	.use(router)

	//serves all files in the static directory from '/'
	//i.e. static/penis.cock -> www.website.com/penis.cock
	.use(connect.static(__dirname + '/static'))

	//listen on everyone's favorite port ;)
	.listen(6969)

util.log('server listening on port 6969... hotly')
