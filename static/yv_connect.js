if(!YV || YV === undefined) throw "need to load yv.js first!";

(function(){

    var model; 
    var laser_angle = 0.;

    function bracketed(min, max, val) {
        val = Math.max(min, val)
        val = Math.min(max, val)
        return val
    }

    function handleMessage(message) {
        if(message.type == 'gyro:update') {
            var d = message.data
            //var x = d.xrot; var y = d.yrot; var z = d.zrot;
            //console.log("xrot: " + x + ", yrot: " + y + ", zrot: " + z)

            $.each(d, function(rot, angle) {
                d[rot] = bracketed(-60, 60, angle)
            })

            var right = d.xrot / 60.
            var up = d.yrot / 60.

            //console.log("right: " + right + ", up: " + up)
            var MULT = 50.
            model.players[message.player_id].velocity = new SglVec3(MULT * right, 0., -MULT * up);
            model.players[message.player_id].controller = $.extend({}, d)

        } else if(message.type == 'laser:update') { 
            laser_angle = message.angle 
            //console.log('new angle: ' + laser_angle)

        //FIRE ZE MISSILES!!!
        } else if(message.type == 'laser:fire') {
            var MULT = 20.;
            //var x = Math.cos(laser_angle)
            //var z = -Math.sin(laser_angle)
            var x = -Math.sin(laser_angle)
            var z = -Math.cos(laser_angle)

            //console.log("x: " + x + ", z: " + z)

            var laser_vel = new SglVec3(x, 0., z)
            laser_vel = laser_vel.normalize().mul(new SglVec3(MULT))

            //console.log("laser vel: " + laser_vel.x + ", " + laser_vel.y + ", " + laser_vel.z)

            //console.log("FIRING A MOTHAFUCKIN LASER!")

            model.particles.lasers.push(new YV.Laser({
                position: model.players[message.player_id].position,
                velocity: laser_vel,
                shooter: message.player_id
            }))
        } else if(message.type == 'player:add') {
           YV.AddPlayer(message.player_id); 
        }
    }

    YV.Connect = function(socket, game_model) {
        model = game_model

        socket.on('message', handleMessage)
        socket.on('disconnect', function(){alert('socket disconnected! just thought you should know');})

        //let the server know that we're a viewer so we can get all those pretty little messages
        socket.send({client_type: 'viewer'})
    }

})();
