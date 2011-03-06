var GLIB = {};

(function(){
    var resources;
    var num_resources;
    var success_callback;

    function decrement_resources(){
        --num_resources
        if(num_resources == 0) {
            console.log('done loading resources')
            success_callback(resources)
        }
    }

    var loadResources = function(path_obj, callback) {
        resources = { 'textures': {}, 'meshes': {}, 'shaders': {} }
        num_resources = Object.keys(path_obj.textures).length
                            + Object.keys(path_obj.meshes).length
                            + Object.keys(path_obj.shaders).length

        success_callback = callback

        for(var i = 0; i < path_obj.textures.length; ++i) {
            (function(){
                var tex_name = path_obj.textures[i]
                var img = new Image()
                $(img).load(function(){
                    console.log("loaded texture with name: " + tex_name)
                    resources.textures[tex_name] = img
                    decrement_resources()
                })
                img.src = '/textures/' + tex_name
            })()
        }
        for(var i = 0; i < path_obj.meshes.length; ++i) {
            (function(){
                var mesh_name = path_obj.meshes[i]
                $.getJSON('/meshes/' + mesh_name, function(data) {
                    console.log('loaded mesh with name: ' + mesh_name)
                    resources.meshes[mesh_name] = data
                    decrement_resources()
                })
            })()
        }
        for(var i = 0; i < path_obj.shaders.length; ++i) {
            (function(){
                var shader_name = path_obj.shaders[i]
                $.get('/shaders/' + shader_name, function(data) {
                    console.log('loaded shader with name' + shader_name)
                    resources.shaders[shader_name] = data
                    decrement_resources()
                })
            })()
        }
    }

    GLIB.loadResources = loadResources
})();

//creates a solver interface. right now, it just uses the euler method... if it
//needs to be better, it can probably be swapped out, but it seems unimportant
(function(){
    var Solver = {};
    Solver.time_step = .01
    Solver.grav_constant = 200.0
    Solver.print_updates = false

    var accum = 0

    var calculate_gravity = function(massive_pos, massive_mass, small_pos) {
        var to_vec = massive_pos.clone().add(small_pos.neg)
        var force_mult = (Solver.grav_constant * massive_mass) / to_vec.squaredLength
        return to_vec.mul(new SglVec3(force_mult))
    }

    var calculate_grav_accelerations = function(game_model, player_pos) {
        var grav_accel = calculate_gravity(game_model.sun.position, game_model.sun.mass, player_pos)
        for(var i = 0; i < game_model.planets.length; ++i) {
            var planet = game_model.planets[i]
            var planet_force = calculate_gravity(planet.position, planet.mass, player_pos)
            grav_accel = grav_accel.add(planet_force)
        }
        return grav_accel
    }

    var step_time_once = function(game_model) {
        var timestep_vec = new SglVec3(Solver.time_step)
        for(var i = 0; i < game_model.players.length; ++i) {
            var player = game_model.players[i]

            //figure out the effect of the planets on the player
            var grav_accel = calculate_grav_accelerations(game_model, player.position)
            var grav_vel = grav_accel.mul(timestep_vec)

            //update player velocity
            player.velocity = player.thrust_velocity.add(grav_vel)

            //update player position
            player.position = player.position.add(player.velocity.mul(timestep_vec))
        }
    }

    var vec_to_string = function(vec) {
        return "(" + vec.x + ", " + vec.y + ", " + vec.z + ")"
    }

    var print_player_status = function(player) {
        console.log('position: ' + vec_to_string(player.position))
        console.log('velocity: ' + vec_to_string(player.velocity))
    }

    var cum_time = 0 //;)
    var last_time = 0

    Solver.StepTime = function(game_model, dt) {
        for(accum += dt; accum > Solver.time_step; accum -= Solver.time_step) {
            step_time_once(game_model)
        }
       
        cum_time += dt
        if(cum_time - last_time > 2 && Solver.print_updates){
            last_time = cum_time

            console.log('time elapsed: ' + cum_time)
            for(var i = 0; i < game_model.players.length; ++i) {
                console.log("player " + i + " status:")
                print_player_status(game_model.players[i])
            }
        }
    }

    GLIB.Solver = Solver;
})();

(function(){
    var wait_count = 3
    var resources = {}
    var unready_callback;

    var dec_wait_count = function(){
        --wait_count
        if(wait_count == 0) {
            console.log("calling l'callback")
            unready_callback(resources)
        }
    }

    GLIB.FireWhenReady = function(resources_to_load, callback) {
        unready_callback = callback
        if($ === undefined || io === undefined)
            throw "either jquery or socket.io hasn't initialized yet, and that's bad"

        //make sure that the body has been loaded
        $(function(){ console.log('body loaded!'); dec_wait_count(); })

        //make sure the resources have been loaded
        GLIB.loadResources(resources_to_load, function(res) {
            console.log('resources loaded!')
            resources = res
            dec_wait_count()
        })

        //make sure the socket has connected
        var socket = new io.Socket() 
        socket.on('connect', function() {
            console.log('socket connected!')
            dec_wait_count()
        })
        socket.connect()
    }
})();
