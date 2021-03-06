if(!YV || YV === undefined) throw "need to load yv.js first!";

(function(){
    var sock;

    var ONCE = true

    function handleMessagesFromServer(message) {
        if(message.type !== undefined) {
            handleMessage(message)
        } else {
            var messages = []
            for(player_id in message) {
                for(type in message[player_id]) {
                    messages.push(message[player_id][type])
                }
            }
            messages.map(function(msg){ handleMessage(msg) })
        }
    }

    function handleMessage(message) {
        if(message.type == 'player:add') {
            YV.AddPlayer(message.player_id, message.displayName); 
        } else if(message.type == 'gyro:update') {
            YV.UpdatePlayerVelocity(message.player_id, message.data);
        } else if(message.type == 'laser:update') { 
            YV.UpdatePlayerCannonAngle(message.player_id, message.angle);
        } else if(message.type == 'laser:fire') {
            YV.FireLaser(message.player_id);
        } else if(message.type == 'latency_check') {
            sock.send(message) //send 'er right back
        }
    }

    YV.Connect = function(socket) {
        sock = socket
        socket.on('message', handleMessagesFromServer)
        socket.on('disconnect', function(){alert('socket disconnected! just thought you should know');})

        //let the server know that we're a viewer so we can get all those pretty little messages
        socket.send({client_type: 'viewer'})
    }

    YV.SendPlayerColor = function(playerId, color) {
        sock.send({type: "set:color", player_id: playerId, color: color});
    };

    YV.SendPlayerLives = function(playerId, lives) {
        sock.send({type: "set:lives", player_id: playerId, lives: lives});
    };

    YV.SendPlayerNotifications = function(players) {
        $.each(players, function(player_id, player) {
            sock.send({'type': "set:reset", 'player_id': player_id});
        });
    };

})();
