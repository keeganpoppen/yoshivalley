if(!YV || YV === undefined) throw "need to load yv.js first!";

(function(){

    var model; 
    var sock;
    var laser_angle = 0.;

    function bracketed(min, max, val) {
        val = Math.max(min, val)
        val = Math.min(max, val)
        return val
    }

    function handleMessage(message) {
        var player = model.players[message.player_id]

        if(message.type != 'player:add' && player === undefined)
            return;
        if(message.type == 'gyro:update') {
            var d = message.data
            //var x = d.xrot; var y = d.yrot; var z = d.zrot;
            //console.log("xrot: " + x + ", yrot: " + y + ", zrot: " + z)

            $.each(d, function(rot, angle) {
                d[rot] = bracketed(-YV.Constants.ufo.minMaxAngle,
                        YV.Constants.ufo.minMaxAngle, angle)
            })

            var right = d.xrot / YV.Constants.ufo.minMaxAngle;
            var up = d.yrot / YV.Constants.ufo.minMaxAngle;

            var MULT = YV.Constants.ufo.controlVelocityMultiplier;
            var new_control_vel = new SglVec3(MULT * right, 0., -MULT * up);

            player.velocity =
                player.velocity.add(player.control_velocity.neg).add(new_control_vel)
            player.control_velocity = new_control_vel
            player.controller = $.extend({}, d)

        } else if(message.type == 'laser:update') { 
            laser_angle = message.angle 
            player.cannon_angle = laser_angle + Math.PI

        //FIRE ZE MISSILES!!!
        } else if(message.type == 'laser:fire') {
            //Check to see if we're allowed to shoot right now
            var player = model.players[message.player_id];
            if((Date.now() - player.last_shot)/1000 > player.recharge_time) {
                var MULT = YV.Constants.laser.velocityMultiplier;
                var x = -Math.sin(laser_angle)
                var z = -Math.cos(laser_angle)

                var laser_vel = new SglVec3(x, 0., z)
                laser_vel = laser_vel.normalize().mul(new SglVec3(MULT));

                player.last_shot = Date.now()

                model.particles.lasers.push(new YV.Laser({
                    position: player.position,
                    velocity: laser_vel,
                    shooter_id: message.player_id
                }))
            }
        } else if(message.type == 'player:add') {
            YV.AddPlayer(message.player_id, message.color); 
        } else if(message.type == 'latency_check') {
            sock.send(message) //send 'er right back
        }
    }

    YV.Connect = function(socket, game_model) {
        model = game_model
        sock = socket

        socket.on('message', handleMessage)
        socket.on('disconnect', function(){alert('socket disconnected! just thought you should know');})

        //let the server know that we're a viewer so we can get all those pretty little messages
        socket.send({client_type: 'viewer'})
    }

})();
