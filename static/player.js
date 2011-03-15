/*
 * globals
 */

var player_id = -1
var color = [0.0, 0.0, 0.0]
var socket = new io.Socket()
var player_name;

/*
 * set up socket
 */

var CONNECTED = false

//set up handling messages from the server
socket.on('message', function(message) {
    if(message.type == 'init:setid') {
        player_id = message.player_id
        console.log(message);
        var colorstring = "rgb(" + Math.floor(color[0]*255) + ", " + 
                                   Math.floor(color[1]*255) + ", " +
                                   Math.floor(color[2]*255) + ")";
        $('body').css('color', colorstring);
        //$("#player_id").html(player_id)

    } else if(message.type == 'set:color') {
        if(message.color === null) {
            color = [0.0, 0.0, 0.0];
        } else {
            color = message.color;
        }

        if(draw !== undefined) draw(-CannonThrottle.last_sent)
        $(function(){
            $("#player_id").css('color', "rgb(" + Math.floor(255*color[0]) +
                                    "," + Math.floor(255*color[1]) +
                                    "," + Math.floor(255*color[2]) + ")");

        })

    } else if(message.type == 'set:lives') {
        $("#life_" + message.lives).addClass("extinguished")
        if(message.lives == 0) {
            $("#lives_title").html("You've died!")    
        }
        
    } else if(message.type == 'latency_check') {
        socket.send(message) //just send 'er right back

    } else if(message.type == 'set:reset') {
        $(".life").removeClass("extinguished")
        $("#lives_title").html("Lives remaining:")    
    }
})

//TODO: need this?
//socket.on('disconnect', function() {})
