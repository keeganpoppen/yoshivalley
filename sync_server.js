var connect = require('connect')
var util = require('util')
var io = require('socket.io')

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

var socket = io.listen(server)
var client_times = {}
var clients = []

function getUTCMillis(){
    var d  = new Date()
    return d.getTime() + (d.getTimezoneOffset() + 60 * 1000)
}

function sendClockSyncPacket(client) {
    client.send({
        type: 'clock_sync',
        start_time: getUTCMillis()
    })
}

function sendSchedulePackets(client){
    util.log('scheduling packet')

    var sch_time = (getUTCMillis() + 2000)

    clients.map(function(client) {
        client.send({
            type: 'schedule_event',
            time: sch_time
        })
    })

    setTimeout(function(){
        console.log('TIME!!!')

        setTimeout(function(){
            sendSchedulePackets()
        }, 500)
    }, (sch_time - getUTCMillis()))
}

socket.on('connection', function(client) {
    util.log('connection made with client ' + client.sessionId)

    client_times[client.sessionId] = {
        total: 0,
        num_packets: 0
    }

    clients.push(client)

    client.on('message', function(message) {
        var time_obj = client_times[client.sessionId]
        var est_time = (getUTCMillis() + message.start_time) / 2.
        time_obj.total += est_time - message.received_time
        if(++time_obj.num_packets < 20) {
            sendClockSyncPacket(client)
        } else {
            util.log("offset_obj: " + util.inspect(time_obj))
            client.send({
                type: 'offset',
                offset: (time_obj.total / time_obj.num_packets)
            })
            if(clients.length == 1) sendSchedulePackets()
        }
    })

    sendClockSyncPacket(client)

})
