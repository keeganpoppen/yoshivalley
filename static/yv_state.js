(function(){
    //all the resources that need to be loaded before the game will work correctly
    YV.Resources = {
        textures: ["earth.jpg", "sun.jpg", "mars.jpg", "sky2.jpg", "jupiter.jpg",
                   "saturn.jpg", "laser.png", "fire.png", "ring.png", "metal.jpg",
                   "saturn-ring.jpg", "saturn-ring-alpha.gif", "neptune.jpg",
                   "earth-spectral.jpg", "earth-night.jpg", "title.png", ],
        shaders: ["planet.frag.glsl", "planet.vert.glsl",
                  "sun.vert.glsl", "sun.frag.glsl",
                  "bg.vert.glsl", "bg.frag.glsl",
                  "particle.vert.glsl", "particle.frag.glsl",
                  "ufo.vert.glsl", "ufo.frag.glsl",
                  "saturn.vert.glsl", "saturn.frag.glsl",
                  "earth.vert.glsl", "earth.frag.glsl",
                  "explosion.vert.glsl", "explosion.frag.glsl",
                  "title.vert.glsl", "title.frag.glsl",
                  "ring.vert.glsl", "ring.frag.glsl"],
        meshes: [],
    }

    function Planet(opts) {
        this.__defineGetter__('position', function() {
            var planeDist = this.orbitRadius * Math.cos(sglDegToRad(this.azimuth));
            return new SglVec3(planeDist * Math.sin(sglDegToRad(this.orbitAngle)),
                               this.orbitRadius * Math.sin(sglDegToRad(this.azimuth)),
                               planeDist * Math.cos(sglDegToRad(this.orbitAngle)));
        });
        this.program = "planet";
        this.texture = "jupiter.jpg"; //Default texture
        this.mass = 0.0; //Default doesn't affect gravity
        this.radius = 0.0;
        this.tilt = 0.0;
        this.rotationalVelocity = 0.0;
        this.orbitRadius = 0.0;
        this.orbitAngle = 0.0;
        this.azimuth = 0.0;
        this.rotation = 0.0;
        this.mesh = {};
        this.name = "keegan is awesome"
        $.extend(this,opts || {});
    };

    function UFO(opts) {
        $.extend(this, opts || {})
    };
    $.extend(UFO.prototype, {
        program: "ufo",
        display_name: "Player",
        position: new SglVec3(0.0, 0.0, 0.0),
        mass: YV.Constants.ufo.mass,
        radius: YV.Constants.ufo.radius,
        lives: YV.Constants.ufo.lives,
        invulnerable: 0.0,
        color: [0,0,0],
        controller: {
            xrot: 0.0,
            yrot: 0.0
        },

        //this is set so that when a new velocity is set, the only part of the actual
        //velocity of the player that is reset is what the controller component was,
        //rather than invalidating all other sources of velocity (namely, momentum)
        control_velocity: new SglVec3(0., 0., 0.),
        velocity: new SglVec3(0.0, 0.0, 0.0),
        acceleration: new SglVec3(0.0, 0.0, 0.0),
        cannon_angle: 0.0,
        last_shot: 0, //time the last shot occurred
        recharge_time: YV.Constants.ufo.rechargeTime //time between shots (in seconds)
    })
    
    function Particle(opts) {
        $.extend(this, opts || {})
    }
    $.extend(Particle.prototype, {
        position: new SglVec3(0.),
        velocity: new SglVec3(0.),
        acceleration: new SglVec3(0.),
        lifetime: YV.Constants.particle.lifetime,
        age: 0.
    })

    var laser_id = 0
    var Laser = function(opts) {
        this.time_shot = Date.now()
        $.extend(this, opts || {})
        this.id = laser_id++
    }
    Laser.prototype = Particle.prototype
    $.extend(Laser.prototype, {
        shooter_id: 0,
        start_frame: 0,
        age: 0
    })


    function Explosion(opts) {
        $.extend(this, opts || {});

        var exp_const = YV.Constants.explosion
        var dist_variation = exp_const.finalRadius * exp_const.radiusVariability

        var dists = []
        for(var i = 0; i < State.explosion.verts.length / 3; ++i) {
            //rand -> (0, 2 * dist_variation)
            var rand = Math.floor(Math.random() * (dist_variation * 2. + 1)) 

            //rand -> (-dist_variation, dist_variation)
            rand -= dist_variation

            dists.push(exp_const.finalRadius + rand)
        } 

        this.distances = new Float32Array(dists)
    } 
    $.extend(Explosion.prototype, {
        position: new SglVec3(0.0),
        lifetime: Particle.prototype.lifetime,
        age: 0.0,
    })
    

    //the unifying data structure for all the stuff in the game ... whoa
    var State = {
        camera : new Planet({ //really just for the position getter
           fov : YV.Constants.camera.fov, //Degrees 
           orbitRadius : YV.Constants.camera.orbitRadius,
           orbitAngle: YV.Constants.camera.orbitAngle,
           near : YV.Constants.camera.near,
           far : YV.Constants.camera.far,
           azimuth: YV.Constants.camera.azimuth,
           lookat : new SglVec3(0.0),
           name: "camera"
        }), 

        background : {
            program : "bg",
            texture : "sky2.jpg",
            repeat : 1.0,
            mesh : {}
        },

        planets : [
            new Planet({
                program : "sun",
                texture : "sun.jpg",
                name: "Sun",
                radius: YV.Constants.planets.sun.radius,
                mass: YV.Constants.planets.sun.mass,
            }),

            new Planet({
                program: "earth",
                texture : "earth.jpg",
                name: "Earth", 
                textureNight: "earth-night.jpg",
                textureSpectral: "earth-spectral.jpg",
                mass : YV.Constants.planets.earth.mass, 
                radius : YV.Constants.planets.earth.radius,
                tilt : YV.Constants.planets.earth.tilt, 
                rotationalVelocity : YV.Constants.planets.earth.rotationalVelocity,
                orbitRadius : YV.Constants.planets.earth.orbitRadius,
                orbitAngle : YV.Constants.planets.earth.orbitAngle,
            }),

            new Planet({
                texture : "mars.jpg",
                name: "Mars", 
                mass : YV.Constants.planets.mars.mass, 
                radius : YV.Constants.planets.mars.radius,
                tilt : YV.Constants.planets.mars.tilt, 
                rotationalVelocity : YV.Constants.planets.mars.rotationalVelocity,
                orbitRadius : YV.Constants.planets.mars.orbitRadius,
                orbitAngle : YV.Constants.planets.mars.orbitAngle,
            }),

            new Planet({
                texture : "jupiter.jpg",
                name: "Jupiter",
                mass : YV.Constants.planets.jupiter.mass, 
                radius : YV.Constants.planets.jupiter.radius,
                tilt : YV.Constants.planets.jupiter.tilt, 
                rotationalVelocity : YV.Constants.planets.jupiter.rotationalVelocity,
                orbitRadius : YV.Constants.planets.jupiter.orbitRadius,
                orbitAngle : YV.Constants.planets.jupiter.orbitAngle,
            }),

            new Planet({
                texture : "saturn.jpg",
                name: "Saturn",
                mass : YV.Constants.planets.saturn.mass, 
                radius : YV.Constants.planets.saturn.radius,
                tilt : YV.Constants.planets.saturn.tilt, 
                rotationalVelocity : YV.Constants.planets.saturn.rotationalVelocity,
                orbitRadius : YV.Constants.planets.saturn.orbitRadius,
                orbitAngle : YV.Constants.planets.saturn.orbitAngle,
            }),

            new Planet({
                program : "saturn",
                texture : "saturn.jpg",
                name: "Saturn's rings",
                ringTexture : "saturn-ring.jpg",
                ringTextureAlpha : "saturn-ring-alpha.gif",
                mass : 0.1,
                radius : YV.Constants.planets.saturn.radius,
                tilt : YV.Constants.planets.saturn.tilt, 
                rotationalVelocity : YV.Constants.planets.saturn.rotationalVelocity,
                orbitRadius : YV.Constants.planets.saturn.orbitRadius,
                orbitAngle : YV.Constants.planets.saturn.orbitAngle,
            }),


            new Planet({
                texture : "neptune.jpg",
                name: "Neptune",
                mass : YV.Constants.planets.neptune.mass, 
                radius : YV.Constants.planets.neptune.radius,
                tilt : YV.Constants.planets.neptune.tilt, 
                rotationalVelocity : YV.Constants.planets.neptune.rotationalVelocity,
                orbitRadius : YV.Constants.planets.neptune.orbitRadius,
                orbitAngle : YV.Constants.planets.neptune.orbitAngle,
            })
        ],

        players: {},
        waitingPlayers: [],
        killedPlayers: [], //Pushed on inorder of death

        ufo: {
            ring_texture: "ring.png",
            metal: "metal.jpg",
        },

        //truck for global laser config
        laser: {
            length: YV.Constants.laser.length,
            numParticles: YV.Constants.laser.numParticles,
            texture: "laser.png"
        }, 

        explosion: {
            texture: "fire.png"
        },

        particles: {
            lasers: [],
            explosions: []
        },

        aggregate_time: 0
    }
            
    function resetPlayer(index, ufo) {
        var angle = index * (2*Math.PI / YV.Constants.maxPlayers);
        var pos = new SglVec3(YV.Constants.ufo.initialRadius * Math.sin(angle), 0.0,
                              YV.Constants.ufo.initialRadius * Math.cos(angle))
        var vel = pos.normalized;
        vel = vel.mul(new SglVec3(YV.Constants.ufo.initialVelocity));

        ufo.position = pos;
        ufo.velocity = vel;
        ufo.controller = {xrot: 0.0, yrot: 0.0};
        ufo.control_velocity = new SglVec3(0.0);
    }
    
    //External API for interacting with the game state
    YV.OverPlanets = function(f) {
        $.each(State.planets, f);
    };

    YV.OverPlayers = function(f) {
        $.each(State.players, f);
    };

    YV.OverLasers = function(f) {
        $.each(State.particles.lasers, f);
    };

    YV.OverExplosions = function(f) {
        $.each(State.particles.explosions, f);
    };

    YV.InitTextures = function(gl, textures) {
        var textureOptions = {
            generateMipmap: true,
            flipY: false,
            minFilter: gl.LINEAR_MIPMAP_LINEAR,
        };
        
        State.laser.texture = new SglTexture2D(gl,
            textures[State.laser.texture], textureOptions)
        State.explosion.texture = new SglTexture2D(gl,
            textures[State.explosion.texture], textureOptions)
        State.ufo.ring_texture = new SglTexture2D(gl,
            textures[State.ufo.ring_texture], textureOptions)
        State.ufo.metal = new SglTexture2D(gl,
            textures[State.ufo.metal], textureOptions)
        State.background.texture = new SglTexture2D(gl,
            textures[State.background.texture], textureOptions);
            
        YV.OverPlanets(function(planet_id, planet) {
            planet.texture = new SglTexture2D(gl,
                    textures[planet.texture], textureOptions);
            if(planet.ringTexture) {
                planet.ringTexture = new SglTexture2D(gl,
                    textures[planet.ringTexture], textureOptions);   
                planet.ringTextureAlpha = new SglTexture2D(gl,
                    textures[planet.ringTextureAlpha], textureOptions);   
                planet.mesh = GLIB.MakeSaturnSGLMesh(gl);
            } else if(planet.textureNight) {
                planet.textureNight = new SglTexture2D(gl,
                    textures[planet.textureNight], textureOptions);   
                planet.textureSpectral = new SglTexture2D(gl,
                    textures[planet.textureSpectral], textureOptions);   
            }
        });
    }

    YV.InitMeshes = function(gl) {
        State.background.mesh = GLIB.MakeSGLMesh(gl, {
            vertices: new Float32Array([-1.0, -1.0, 0.0,
                                         1.0, -1.0, 0.0,
                                         1.0, 1.0, 0.0,
                                        -1.0, 1.0, 0.0]),
            indices: new Uint16Array([0,1,2,2,3,0])
        });

        var sphereMesh = GLIB.MakeSphere(1,
                YV.Constants.planetSphereDensity, YV.Constants.planetSphereDensity);
        var SGLsphereMesh = GLIB.MakeSGLMesh(gl, sphereMesh);
        
        YV.OverPlanets(function(planet_id, planet) {
            if(planet.program === 'saturn')
                planet.mesh = GLIB.MakeSaturnSGLMesh(gl);
            else
                planet.mesh = SGLsphereMesh;
        });

        var sphereMeshWithNormals = GLIB.MakeSphere(1,
                YV.Constants.planetSphereDensity, YV.Constants.planetSphereDensity, true);
        var SGLMeshWithNormals = GLIB.MakeSGLMesh(gl, sphereMeshWithNormals); 
        State.ufo.mesh = SGLMeshWithNormals;

        var verts = GLIB.MakeSphericalVerts(1., YV.Constants.explosion.vertexDensity, 
                YV.Constants.explosion.vertexDensity);
        State.explosion.verts = new Float32Array(verts);
    };

    YV.MoveCamera = function(orbitAngle, azimuth, orbitRadius) {
        State.camera.orbitAngle += orbitAngle;
        State.camera.azimuth += azimuth;
        State.camera.orbitRadius += orbitRadius;
    };

    YV.GetCamera = function() {
        return State.camera;
    };

    YV.SetCameraTo = function(angle, azimuth, radius) {
        State.camera.orbitAngle = angle;
        State.camera.azimuth = azimuth;
        State.camera.orbitRadius = radius;
    };

    YV.SetCameraToVec = function(vec) {
        if(!(vec instanceof SglVec3)) throw "clearly you can't read method names"

        var orbit_radius = vec.length
        var azimuth = Math.asin(vec.y / orbit_radius)

        var planedist = orbit_radius * Math.cos(azimuth)
        var orbit_angle = Math.asin(vec.x / planedist)
        
        State.camera.orbitAngle = sglRadToDeg(orbit_angle)
        State.camera.azimuth = sglRadToDeg(azimuth)
        State.camera.orbitRadius = orbit_radius
    }

    YV.SetCameraToXYZ = function(x, y, z) {
        YV.SetCameraToVec(new SglVec3(x,y,z))
    }

    YV.GetBackground = function() {
        return State.background;
    };

    YV.GetUFOData = function() {
        return State.ufo;
    };

    YV.GetLaserData = function() {
        return State.laser;
    };

    YV.GetExplosionData = function() {
        return State.explosion;
    };

    YV.RemoveLasers = function(toremove) {
        if(toremove === undefined) {
            State.particles.lasers = [];
        } else {
            var tokeep = [];
            YV.OverLasers(function(laser_id, laser) {
                if($.inArray(laser_id, toremove) < 0) {
                    tokeep.push(laser);
                }
            });

            State.particles.lasers = tokeep;
        }
    };

    YV.AddExplosion = function(pos) {
        YV.Audio.PlayExplosion();
        State.particles.explosions.push(new Explosion({position: new SglVec3(pos)}));
    };

    YV.RemoveExplosions = function(toremove) {
        if(toremove === undefined) {
            State.particles.explosions = [];
        } else {
            var tokeep = [];
            YV.OverExplosions(function(explosion_id, explosion) {
                if($.inArray(explosion_id, toremove) < 0) {
                    tokeep.push(explosion);
                }
            });
            State.particles.exlosions = tokeep;
        }
    };

    function gameFull() {
        var count = 0;    
        YV.OverPlayers(function() {
            count++;
        });
        return (count >= YV.Constants.maxPlayers);
    }

    var Colors = [
        [ 0.933333333333 ,  0.866666666667 ,  0.250980392157 ],
        [ 0.960784313725 ,  0.474509803922 ,  0.0 ],
        [ 0.560784313725 ,  0.349019607843 ,  0.0078431372549 ],
        [ 0.450980392157 ,  0.823529411765 ,  0.0862745098039 ],
        [ 0.203921568627 ,  0.396078431373 ,  0.643137254902 ],
        [ 0.458823529412 ,  0.313725490196 ,  0.482352941176 ],
        [ 0.729411764706 ,  0.741176470588 ,  0.713725490196 ],
        [ 0.8 ,  0.0 ,  0.0 ],
    ];

    var ColorsInUse = [
        false,false,false,false,false,false,false,false
    ];

    function findColor() {
        for(i = 0; i<ColorsInUse.length; ++i) {
            if(!ColorsInUse[i]) {
                ColorsInUse[i] = true;
                return i;
            }
        }
    };

    YV.GetColor = function(i) {
        return Colors[i];
    };


    function setNewColor(player_id, player) {
        player.color = findColor();
        YV.SendPlayerColor(player_id, YV.GetColor(player.color));
    }

    YV.AddPlayer = function(playerid, displayName) {
        var newufo = new UFO({
            display_name: displayName,
        });
        if((YV.GamePhase === 'lobby') && !gameFull()) {
            setNewColor(playerid, newufo);
            resetPlayer(newufo.color, newufo);
            State.players[playerid] = newufo;
        } else {
            State.waitingPlayers.push([playerid, newufo]);
        }
    };

    YV.ResetPlayers = function(winner) {
        //The winner always gets to keep playing and keep her color
        resetPlayer(winner.color, winner);
        winner.lives = YV.Constants.ufo.lives;
        winner.invulnerable = 0.0;

        //Refill from the defeated list if room, they get to keep their color too
        //Put the rest at the end of the wait queue
        var numSlots = (YV.Constants.maxPlayers - 1);
        var numWaiters = State.waitingPlayers.length;
        numWaiters = (numWaiters < numSlots) ? numWaiters : numSlots;
        var numDefeateds = numSlots - numWaiters;
        console.log(State.killedPlayers);
        console.log(State.killedPlayers.length);
        console.log(State.killedPlayers[State.killedPlayers.length-1]);
        for(var i = State.killedPlayers.length-1; i >= 0; --i) {
            var player_id = State.killedPlayers[i][0];
            var player = State.killedPlayers[i][1];
            if(numDefeateds > 0) {
                resetPlayer(player.color, player);
                player.lives = YV.Constants.ufo.lives;
                player.invulnerable = 0.0;
                State.players[player_id] = player;
                numDefeateds--;
            } else {
                //They have to give up their color to a new commer;
                Colors[player.color] = false;
                YV.SendPlayerColor(player_id, null);
                State.waitingPlayers.push([player_id, player]);
            }
        }
        State.killedPlayers = [];
        for(var i=0; i<numWaiters; ++i) {
            var player_id = State.waitingPlayers[i][0];
            var player = State.waitingPlayers[i][1];
            setNewColor(player_id, player);
            resetPlayer(player.color, player);
            State.players[player_id] = player;
        }
        State.waitingPlayers.splice(0, numWaiters);
    };

    YV.NotifyPlayers = function() {
        YV.SendPlayerNotifications(State.players);
    }

    function bracketed(min, max, val) {
        val = Math.max(min, val)
        val = Math.min(max, val)
        return val
    }

    YV.UpdatePlayerVelocity = function(player_id, data) {
        var player = State.players[player_id];
        if(player === undefined || YV.GamePhase != 'play') return;

        $.each(data, function(rot, angle) {
            data[rot] = bracketed(-YV.Constants.ufo.minMaxAngle,
                    YV.Constants.ufo.minMaxAngle, angle)
        })

        var right = data.xrot / YV.Constants.ufo.minMaxAngle;
        var up = data.yrot / YV.Constants.ufo.minMaxAngle;

        var MULT = YV.Constants.ufo.controlVelocityMultiplier;
        var new_control_vel = new SglVec3(MULT * right, 0., -MULT * up);

        player.velocity =
            player.velocity.add(player.control_velocity.neg).add(new_control_vel)
        player.control_velocity = new_control_vel
        player.controller = $.extend({}, data)
    };

    YV.UpdatePlayerCannonAngle = function(player_id, angle) {
        var player = State.players[player_id];
        if(player === undefined || YV.GamePhase != 'play') return;
        player.cannon_angle = angle + Math.PI; //TODO base this correction on the camera
    };

    YV.FireLaser = function(player_id) {
        var player = State.players[player_id];
        if(player === undefined || YV.GamePhase != 'play') return;

        //Check to see if we're allowed to shoot right now
        if((Date.now() - player.last_shot)/1000 > player.recharge_time) {
            YV.Audio.PlayLaser();

            var MULT = YV.Constants.laser.velocityMultiplier;
            var x = -Math.sin(player.cannon_angle);
            var z = -Math.cos(player.cannon_angle);

            var laser_vel = (new SglVec3(x, 0., z)).neg;
            var laser_dir = laser_vel.normalize();
            laser_vel = laser_dir.mul(new SglVec3(MULT));

            player.last_shot = Date.now()

            var radius = YV.Constants.ufo.ringRadius;
            State.particles.lasers.push(new Laser({
                position: player.position.add(laser_dir.mul(new SglVec3(radius))),
                velocity: laser_vel,
                shooter_id: player_id,
                start_frame: YV.Replay.GetFrameNumber()
            }));
        }
    };
    
    YV.Respawn = function(player_id, player) {
        YV.SendPlayerLives(player_id, player.lives);
        if(player.lives > 0) {
            resetPlayer(player.color, player);
            player.invulnerable = YV.Constants.ufo.invulnerablePeriod;
            player.control_velocity = new SglVec3(0.0, 0.0, 0.0);
        } else {
            //Kill off the player for good
            State.killedPlayers.push([player_id, player]);
            delete State.players[player_id];
        }
    };

    /*
     * The below is only useful for replays, presumably
     */

    YV.MergeState = function(merge_obj) {
        $.extend(State, merge_obj)
    }

    YV.UpdateAggregateTime = function(dt){
        State.aggregate_time += dt
    }

    YV.GetAggregateTime = function(){
        return State.aggregate_time
    }
    
})();
