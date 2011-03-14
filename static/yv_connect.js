if(!YV || YV === undefined) throw "need to load yv.js first!";

(function(){
    var sock;

    function handleMessage(message) {
        if(message.type == 'player:add') {
            YV.AddPlayer(message.player_id, message.color); 
        } else if(message.type == 'gyro:update') {
            YV.UpdatePlayerVelocity(message.player_id, message.data);
        } else if(message.type == 'laser:update') { 
            YV.UpdatePlayerCannonAngle(message.player_id, message.angle);
        } else if(message.type == 'laser:fire') {
            if(YV.FireLaser(message.player_id)) {
                document.getElementById('laser').play();
            }
        } else if(message.type == 'latency_check') {
            sock.send(message) //send 'er right back
        }
    }

    YV.Connect = function(socket) {
        sock = socket
        socket.on('message', handleMessage)
        socket.on('disconnect', function(){alert('socket disconnected! just thought you should know');})

        //let the server know that we're a viewer so we can get all those pretty little messages
        socket.send({client_type: 'viewer'})
    }

})();
