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

var clients = {};

/*
 * { 
 *  player_id: {
 *      obj: socketio_obj,
 *      TODO: ADD MORE
 * }
 */

var players = {};
var viewers = {};

function broadcast_to_viewers(msg) {
    for(var id in viewers) {
        viewers[id].send(msg)
    }
}

var socket = io.listen(server)

socket.on('connection', function(client) {
    //if(client in clients) util.log('WWTF!!!!!')
    
    //the first message that comes from the client needs to determine
    //the 'client_type'-- either 'player' or 'viewer'
    client.once('message', function(message) { 
        if(message.client_type == 'player') {
            util.log('hesa playa')
            players[client.sessionId] = client

            //send the player his/her player_id
            client.send({'type': 'init:setid', 'player_id': client.sessionId})

            broadcast_to_viewers({'type': 'player:add', 'player_id': client.sessionId})

            client.on('message', function(message) {
                message.player_id = client.sessionId
                broadcast_to_viewers(message)
            })

            client.on('disconnect', function(message) {
                util.log('player with id: ' + client.sessionId + ' disconnected!')
                delete players[client.sessionId]
            })
        } else if(message.client_type == 'viewer') {
            util.log('new viewer connected')
            viewers[client.sessionId] = client

            //if players are connected before the viewer, just add them now
            for(var id in players) {
                client.send({'type': 'player:add', 'player_id': id})    
            }

            client.on('message', function(message) {
                //TODO: don't actually know if anything should be happening here right now
            })

            client.on('disconnect', function() {
                util.log('a viewer disconnected!')
                delete viewers[client.sessionId]
            })
        } else {
            util.log('player with unknown / undefined player type tried to connect')
        }
    })

    /*
    clients[client.sessionId] = {'obj': client, 'start': Date.now(), 'num_msg': 0}
    client.on('message', function(msg) {
        if(msg.type == 'accel') {
            //util.log('x: ' + msg.accelX + ', y: ' + msg.accelY + ', z: ' + msg.accelZ) 
            clients[client.sessionId].num_msg++;
        } else if(msg.type == 'timer') {
            msg.server_time = Date.now()
            client.send(msg)
        } else {
            util.log(util.inspect(msg))
        }
    })
    client.on('disconnect', function() {
        delete clients[client]
        util.log('client disconnected! what a douche!')
    })
    */
})

var print_rates = function() {
    util.log('printing rates')
    for(var id in clients) {
        var obj = clients[id]
        if(obj === undefined) {
            util.log('oops... undefined. killing it.')
            delete clients[id]
            continue
        }

        var time_elapsed = Date.now() - obj.start
        util.log('id: ' + id + ', rate: ' + (obj.num_msg / (time_elapsed/1000.0)))
    }
    setTimeout(print_rates, 2000)
}

//print_rates()
