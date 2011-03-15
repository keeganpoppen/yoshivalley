var connect = require('connect')
var util = require('util')
var io = require('socket.io')
//var dns = require('ndns')
var MessageTimer = require('./messagetimer')

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

server.listen(80) //listen on everyone's favorite port ;)

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

var viewer_timer = MessageTimer.create(50, 100, MessageTimer.ServerQueueCallback, function(queue){
    if(Object.keys(queue).length == 0) return

    for(var id in viewers) {
        viewers[id].send(queue)
    }
})

function broadcast_to_viewers(msg) {
    viewer_timer.AddMessage(msg, (msg.type == 'laser:fire'))
}

var socket = io.listen(server)

var last_message = Date.now()


var num_packets = 0
function print_packet_load(){
    if(num_packets > 0) console.log('num pakets this second: ' + num_packets)
    num_packets = 0
    setTimeout(print_packet_load, 1000)
}
print_packet_load()

function get_latencies(){
    //console.log('tryna get latencies')
    Object.keys(players).map(function(player_id){
        var obj = players[player_id]
        if(obj === undefined) return
        obj.send({type: 'latency_check', sent: Date.now()})
    })
    Object.keys(viewers).map(function(viewer_id){
        var obj = viewers[viewer_id]
        if(obj === undefined) return
        obj.send({type: 'latency_check', sent: Date.now()})
    })
    setTimeout(get_latencies, 3000)
}
get_latencies()

var Colors = [
    [ 0.933333333333 ,  0.866666666667 ,  0.250980392157 ],
    [ 0.960784313725 ,  0.474509803922 ,  0.0 ],
    [ 0.560784313725 ,  0.349019607843 ,  0.0078431372549 ],
    [ 0.450980392157 ,  0.823529411765 ,  0.0862745098039 ],
    [ 0.203921568627 ,  0.396078431373 ,  0.643137254902 ],
    [ 0.458823529412 ,  0.313725490196 ,  0.482352941176 ],
    [ 0.729411764706 ,  0.741176470588 ,  0.713725490196 ],
    [ 0.8 ,  0.0 ,  0.0 ]
];
var nextColor = 0;

socket.on('connection', function(client) {
    client.on('message', function(message) {
        if(message.type == 'latency_check') {
            console.log('latency for client ' + client.sessionId + ': ' + (Date.now() - message.sent) + 'ms')
        }
        ++num_packets
    })
    
    //the first message that comes from the client needs to determine
    //the 'client_type'-- either 'player' or 'viewer'
    client.once('message', function(message) { 
        if(message.client_type == 'player') {
            util.log('hesa playa')
            players[client.sessionId] = client

            //Assign this player her color
            client.color = Colors[nextColor];
            nextColor = ((nextColor + 1) % Colors.length);
            console.log("client assigned color: " + client.color);

            //send the player his/her player_id
            client.send({'type': 'init:setid', 'color': client.color, 'player_id': client.sessionId})

            broadcast_to_viewers({'type': 'player:add', 'color': client.color, 'player_id': client.sessionId})

            client.on('message', function(message) {
                //util.log('last message was ' + (Date.now() - last_message) + ' ms ago')
                last_message = Date.now()

                //util.log('message gotten from client ' + client.sessionId)
                //util.log(util.inspect(message))

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
            /*
            for(var id in players) {
                client.send({'type': 'player:add', 'player_id': id})    
            }
            */

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
