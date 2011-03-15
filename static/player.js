/*
 * globals
 */

var player_id = -1;
var color = [0.0, 0.0, 0.0];
var socket = new io.Socket();

/*
 * set up socket
 */

socket.connect();

//on connection, let the server know we're a player
socket.on('connect', function() {
    socket.send({'client_type': 'player'})             
})

//set up handling messages from the server
socket.on('message', function(message) {
    if(message.type == 'init:setid') {
        player_id = message.player_id
        console.log(message);
        var colorstring = "rgb(" + Math.floor(color[0]*255) + ", " + 
                                   Math.floor(color[1]*255) + ", " +
                                   Math.floor(color[2]*255) + ")";
        $('body').css('color', colorstring);
        $("#player_id").html(player_id)

    } else if(message.type == 'set:color') {
        if(message.color === null) {
            color = [0.0, 0.0, 0.0];
        } else {
            color = message.color;
        }
        #('body').css('background-color', color);
    } else if(message.type == 'latency_check') {
        socket.send(message) //just send 'er right back
    }
})

//TODO: need this?
//socket.on('disconnect', function() {})
