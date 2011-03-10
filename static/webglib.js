var GLIB = {};

//utility junk
(function(){
    var resources;
    var num_resources;
    var success_callback;

    function decrement_resources(){
        --num_resources
        if(num_resources == 0) {
            console.log('done loading resources')
            console.log(resources)
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
    Solver.TimeStep = .01
    Solver.grav_constant = 200.0
    Solver.print_updates = false

    var accum = 0

    var calculate_gravity = function(massive_pos, massive_mass, small_pos) {
        if(!massive_pos || massive_pos === undefined)
            throw "massive object has no position... what?"

        if(!massive_mass || massive_mass === undefined)
            throw "massive object has no mass... hmmmmm"

        if(!small_pos || small_pos === undefined)
            throw "don't know where the gravity-bitch is. how would we apply the force?"

        var to_vec = massive_pos.clone().add(small_pos.neg)
        var force_mult = (Solver.grav_constant * massive_mass) / to_vec.squaredLength
        return to_vec.mul(new SglVec3(force_mult))
    }

    var calculate_grav_accelerations = function(grav_bodies, player_pos) {
        if(!grav_bodies || grav_bodies === undefined)
            throw "don't have any bodies with which to apply gravity"

        if(!player_pos || player_pos === undefined)
            throw "player doesn't have any position. guess gravity's not his/her biggest issue..."

        var grav_accel = new SglVec3(0.0)
        grav_bodies.map(function(grav_body) {
            var body_accel = calculate_gravity(grav_body.position, grav_body.mass, player_pos)
            grav_accel = grav_accel.add(body_accel)
        })

        return grav_accel
    }

    var vec_to_string = function(vec) {
        return "(" + vec.x + ", " + vec.y + ", " + vec.z + ")"
    }

    var print_player_status = function(player) {
        console.log('position: ' + vec_to_string(player.position))
        console.log('velocity: ' + vec_to_string(player.velocity))
    }

    Solver.StepTime = function(particles, gravity, grav_bodies) {
        var timestep_vec = new SglVec3(Solver.TimeStep)

        particles.map(function(particle) {
            if(!particle.position || particle.position === undefined)
                throw "particle has no position? how is it going to move???";

            var velocity = particle.velocity || new SglVec3(0.0)
            var acceleration = particle.acceleration || new SglVec3(0.0)

            if(gravity) {
                var grav_accel = calculate_grav_accelerations(grav_bodies, particle.position)
                acceleration = acceleration.add(grav_accel)
            }

            //integrate the accelerations
            velocity = velocity.add(acceleration.mul(timestep_vec))

            //update the position by the amount the time step will allow
            particle.position = particle.position.add(velocity.mul(timestep_vec))
        })
    }

    GLIB.Solver = Solver;
})();

(function(){
    GLIB.MakeSphericalVerts = function(radius, lats, longs) {
        var verts = []

        for (var latNumber = 0; latNumber <= lats; ++latNumber) {
            for (var longNumber = 0; longNumber <= longs; ++longNumber) {
                var theta = latNumber * Math.PI / lats;
                var phi = longNumber * 2 * Math.PI / longs;
                var sinTheta = Math.sin(theta);
                var sinPhi = Math.sin(phi);
                var cosTheta = Math.cos(theta);
                var cosPhi = Math.cos(phi);

                var x = cosPhi * sinTheta;
                var y = cosTheta;
                var z = sinPhi * sinTheta;

                verts.push(new SglVec3(x,y,z))
            }
        }

        return verts
    }

    GLIB.MakeSphere = function(radius, lats, longs) {
        var geometryData = [ ];
        var texCoordData = [ ];
        var indexData = [ ];

        for (var latNumber = 0; latNumber <= lats; ++latNumber) {
            for (var longNumber = 0; longNumber <= longs; ++longNumber) {
                var theta = latNumber * Math.PI / lats;
                var phi = longNumber * 2 * Math.PI / longs;
                var sinTheta = Math.sin(theta);
                var sinPhi = Math.sin(phi);
                var cosTheta = Math.cos(theta);
                var cosPhi = Math.cos(phi);

                var x = cosPhi * sinTheta;
                var y = cosTheta;
                var z = sinPhi * sinTheta;
                var u = 1-(longNumber/longs);
                var v = latNumber/lats;

                texCoordData.push(u);
                texCoordData.push(v);
                geometryData.push(radius * x);
                geometryData.push(radius * y);
                geometryData.push(radius * z);
            }
        }

        for (var latNumber = 0; latNumber < lats; ++latNumber) {
            for (var longNumber = 0; longNumber < longs; ++longNumber) {
                var first = (latNumber * (longs+1)) + longNumber;
                var second = first + longs + 1;
                indexData.push(first);
                indexData.push(second);
                indexData.push(first+1);

                indexData.push(second);
                indexData.push(second+1);
                indexData.push(first+1);
            }
        }

        var retval = { };
        retval.indices = new Uint16Array(indexData);
        retval.vertices = new Float32Array(geometryData);
        retval.texCoords = new Float32Array(texCoordData);
        
        return retval;
    };
})();

(function(){
    GLIB.compileProgram = function(gl, resources, stem) {
        p = new SglProgram(gl, [resources.shaders[stem + '.vert.glsl']],
                               [resources.shaders[stem + '.frag.glsl']]);
        if(!p.isValid) {
            console.log("Shader program " + stem + " failed to compile");
            console.log(p.log);
        }
        return p;
    }
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
