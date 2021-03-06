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
                $.getJSON('/meshes/' + mesh_name, function(data, stat) {
                    console.log('loaded mesh with name ' + mesh_name);
                    if(data.vertices) {
                        data.vertices = new Float32Array(data.vertices);
                    }
                    if(data.normals) {
                        data.normals = new Float32Array(data.normals);
                    }
                    if(data.texCoords) {
                        data.texCoords = new Float32Array(data.texCoords);
                    }
                    if(data.indices) {
                        data.indices = new Uint16Array(data.indices);
                    }
                    resources.meshes[mesh_name] = data
                    decrement_resources()
                })
            })()
        }
        for(var i = 0; i < path_obj.shaders.length; ++i) {
            (function(){
                var shader_name = path_obj.shaders[i]
                $.get('/shaders/' + shader_name, function(data) {
                    console.log('loaded shader with name ' + shader_name)
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
    //Solver.TimeStep = .01
    Solver.TimeStep = YV.Constants.solver.timestep;
    Solver.grav_constant = YV.Constants.solver.gravitationalConstant;
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

    var calculate_grav_accelerations = function(player_pos) {
        var grav_accel = new SglVec3(0.0)

        //Planets
        YV.OverPlanets(function(id, grav_body) {
            var body_accel = calculate_gravity(grav_body.position,
                    grav_body.mass, player_pos)
            grav_accel = grav_accel.add(body_accel)
        });

        //Other ufos
        YV.OverPlayers(function(id, grav_body) {
            if(player_pos != grav_body.position) {
                var body_accel = calculate_gravity(grav_body.position,
                        grav_body.mass, player_pos)
                grav_accel = grav_accel.sub(body_accel)
            }
        });

        //Arena bounds buffer
        var vec = player_pos.neg;
        var distance = vec.length;
        if(distance > YV.Constants.arenaRadius) {
            var toofar = distance - YV.Constants.arenaRadius;
            vec.normalize();
            var vel = vec.mul(new SglVec3(YV.Constants.arenaKickbackMultiplier * toofar));
            grav_accel = grav_accel.add(vel);
        }

        return grav_accel
    }

    var vec_to_string = function(vec) {
        return "(" + vec.x + ", " + vec.y + ", " + vec.z + ")"
    }

    var print_player_status = function(player) {
        console.log('position: ' + vec_to_string(player.position))
        console.log('velocity: ' + vec_to_string(player.velocity))
    }

    var timestep_vec = new SglVec3(Solver.TimeStep)

    Solver.StepParticle = function(particle) {
        if(!particle.position || particle.position === undefined)
                throw "particle has no position? how is it going to move???";

        var velocity = particle.velocity || new SglVec3(0.0)
        var acceleration = particle.acceleration || new SglVec3(0.0)

        //integrate the accelerations
        velocity = velocity.add(acceleration.mul(timestep_vec))

        //update the position by the amount the time step will allow
        particle.position = particle.position.add(velocity.mul(timestep_vec))
    };

    Solver.StepGravity = function(player) {
        var grav_accel = calculate_grav_accelerations(player.position);

        var velocity = player.velocity || new SglVec3(0.0)
        var acceleration = player.acceleration || new SglVec3(0.0)

        acceleration = acceleration.add(grav_accel);

        //integrate the accelerations
        velocity = velocity.add(acceleration.mul(timestep_vec))

        //update the position by the amount the time step will allow
        player.position = player.position.add(velocity.mul(timestep_vec))
 
    };

/*
    Solver.StepTime = function(particles, gravity, grav_bodies, anti_grav_bodies) {

        $.each(particles, function(particle_id, particle) {
            if(!particle.position || particle.position === undefined)
                throw "particle has no position? how is it going to move???";

            var velocity = particle.velocity || new SglVec3(0.0)
            var acceleration = particle.acceleration || new SglVec3(0.0)

            if(gravity) {
                var grav_accel = calculate_grav_accelerations(grav_bodies, particle.position)
                acceleration = acceleration.add(grav_accel)
                if(anti_grav_bodies) {
                    var anti_grav_accel = calculate_grav_accelerations(anti_grav_bodies,
                            particle.position, true);
                    acceleration = acceleration.add(anti_grav_accel);
                }
            }

            //integrate the accelerations
            velocity = velocity.add(acceleration.mul(timestep_vec))

            //update the position by the amount the time step will allow
            particle.position = particle.position.add(velocity.mul(timestep_vec))
        })
    }
*/

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

                //verts.push(new SglVec3(radius * x,radius * y,radius * z))
                verts.push(x, y, z)
            }
        }

        return verts
    }

    GLIB.MakeSphere = function(radius, lats, longs, addNormals) {
        var geometryData = [ ];
        var texCoordData = [ ];
        var indexData = [ ];
        var normalData = [];

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

                normalData.push(x);
                normalData.push(y);
                normalData.push(z);
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
        retval.indices = indexData;//new Uint16Array(indexData);
        retval.vertices = geometryData; //new Float32Array(geometryData);
        retval.texCoords = texCoordData; //new Float32Array(texCoordData);
        if(addNormals) retval.normals = normalData; //new Float32Array(normalData);
        
        return retval;
    };
})();

(function(){
    GLIB.compileProgram = function(gl, shaders, stem) {
        p = new SglProgram(gl, [shaders[stem + '.vert.glsl']],
                               [shaders[stem + '.frag.glsl']]);
        if(!p.isValid) {
            console.log("Shader program " + stem + " failed to compile");
            console.log(p.log);
        }
        return p;
    }

    GLIB.compilePrograms = function(gl, shaders) {
        var programs = {};
        $.each(shaders, function(shader_name, shader_text) {
            var stem = shader_name.split('.', 1)[0];
            if(!programs[stem])
                programs[stem] = GLIB.compileProgram(gl, shaders, stem);
        });
        return programs;
    };
})();

(function(){
    GLIB.MakeSGLMesh = function(gl, mesh) {
        var sglMesh = new SglMeshGL(gl);
        if(mesh.vertices) {
            sglMesh.addVertexAttribute('position', 3, new Float32Array(mesh.vertices));
        }
        if(mesh.texCoords) {
            sglMesh.addVertexAttribute('texcoord', 2, new Float32Array(mesh.texCoords));
        }
        if(mesh.normals) {
            sglMesh.addVertexAttribute('normal', 3, new Float32Array(mesh.normals));
        }
        sglMesh.addIndexedPrimitives('index', gl.TRIANGLES, new Uint16Array(mesh.indices));
        return sglMesh;
    }
})();

(function(){
    GLIB.MakeSaturnSGLMesh = function(gl) {
        var mesh = {indices:[], vertices:[], normals:[]};

        //Add rings to mesh
        var innerRad = 1.2;
        var outerRad = 1.9;
        var step = 5.0 * Math.PI / 180.0;
        var startIndex = mesh.vertices.length;

        mesh.vertices.push(innerRad * Math.sin(0.0), 0.0,
                innerRad * Math.cos(0.0));
        mesh.vertices.push(outerRad * Math.sin(0.0), 0.0,
                outerRad * Math.cos(0.0));
        var currentIndex = startIndex + 1;
        for(var angle = step; angle < Math.PI * 2; angle += step) {
           mesh.vertices.push(innerRad * Math.sin(angle), 0.0,
                              innerRad * Math.cos(angle));
           mesh.vertices.push(outerRad * Math.sin(angle), 0.0,
                              outerRad * Math.cos(angle));

            mesh.indices.push(currentIndex, currentIndex+1, currentIndex+2);
            mesh.normals.push(0.0, 1.0, 0.0);
            mesh.indices.push(currentIndex+1, currentIndex+2, currentIndex+3);
            mesh.normals.push(0.0, 1.0, 0.0);
            currentIndex += 2;
        }
        mesh.vertices.push(innerRad * Math.sin(0.0), 0.0,
            innerRad * Math.cos(0.0));
        mesh.vertices.push(outerRad * Math.sin(0.0), 0.0,
            outerRad * Math.cos(0.0));
        mesh.indices.push(currentIndex, currentIndex+1, currentIndex+2);
        mesh.vertices.push(innerRad * Math.sin(step), 0.0,
            innerRad * Math.cos(step));
        mesh.indices.push(currentIndex+1, currentIndex+2, currentIndex+3);
   
        return GLIB.MakeSGLMesh(gl, mesh);
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
            $.extend(resources, res)
            dec_wait_count()
        })

        //make sure the socket has connected
        var socket = new io.Socket() 
        socket.on('connect', function() {
            console.log('socket connected!')
            $.extend(resources, {socket: socket})
            dec_wait_count()
        })
        socket.connect()
    }
})();
