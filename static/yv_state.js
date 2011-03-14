(function(){
    //all the resources that need to be loaded before the game will work correctly
    YV.Resources = {
        textures: ["earth.jpg", "sun.jpg", "mars.jpg", "sky2.jpg", "jupiter.jpg",
                   "saturn.jpg", "laser.png", "fire.png", "ring.png", "metal.jpg",
                   "saturn-ring.jpg", "saturn-ring-alpha.gif", "neptune.jpg",
                   "earth-spectral.jpg", "earth-night.jpg"],
        shaders: ["planet.frag.glsl", "planet.vert.glsl",
                  "sun.vert.glsl", "sun.frag.glsl",
                  "bg.vert.glsl", "bg.frag.glsl",
                  "particle.vert.glsl", "particle.frag.glsl",
                  "ufo.vert.glsl", "ufo.frag.glsl",
                  "saturn.vert.glsl", "saturn.frag.glsl",
                  "earth.vert.glsl", "earth.frag.glsl",
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
        $.extend(this,opts || {});
    };

    function UFO(opts) {
        $.extend(this, opts || {})
    };
    $.extend(UFO.prototype, {
        program: "ufo",
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

    var Laser = function(opts) {
        this.time_shot = Date.now()
        $.extend(this, opts || {})
    }
    Laser.prototype = Particle.prototype
    $.extend(Laser.prototype, {
        shooter_id: 0,
        time_shot: 0,
        age: 0
    })

    function Explosion(opts) {
        $.extend(this, opts || {});

        //initialize explosion particles
        var center = this.position;

        var verts = GLIB.MakeSphericalVerts(YV.Constants.explosion.outwardVelocity,
                YV.Constants.explosion.vertexDensity, YV.Constants.explosion.vertexDensity);
        var that = this;
        verts.map(function(vert){
            that.particles.push(new Particle({
                position: center.clone(),
                velocity: vert.clone()
            }))
        })
    }
    $.extend(Explosion.prototype, {
        position: new SglVec3(0.0),
        lifetime: Particle.prototype.lifetime,
        age: 0.0,
        particles: []
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
                radius: YV.Constants.planets.sun.radius,
                mass: YV.Constants.planets.sun.mass,
            }),

            new Planet({
                program: "earth",
                texture : "earth.jpg",
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
                mass : YV.Constants.planets.mars.mass, 
                radius : YV.Constants.planets.mars.radius,
                tilt : YV.Constants.planets.mars.tilt, 
                rotationalVelocity : YV.Constants.planets.mars.rotationalVelocity,
                orbitRadius : YV.Constants.planets.mars.orbitRadius,
                orbitAngle : YV.Constants.planets.mars.orbitAngle,
            }),

            new Planet({
                texture : "jupiter.jpg",
                mass : YV.Constants.planets.jupiter.mass, 
                radius : YV.Constants.planets.jupiter.radius,
                tilt : YV.Constants.planets.jupiter.tilt, 
                rotationalVelocity : YV.Constants.planets.jupiter.rotationalVelocity,
                orbitRadius : YV.Constants.planets.jupiter.orbitRadius,
                orbitAngle : YV.Constants.planets.jupiter.orbitAngle,
            }),

            new Planet({
                texture : "saturn.jpg",
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
                ringTexture : "saturn-ring.jpg",
                ringTextureAlpha : "saturn-ring-alpha.gif",
                mass : YV.Constants.planets.saturn.mass, 
                radius : YV.Constants.planets.saturn.radius,
                tilt : YV.Constants.planets.saturn.tilt, 
                rotationalVelocity : YV.Constants.planets.saturn.rotationalVelocity,
                orbitRadius : YV.Constants.planets.saturn.orbitRadius,
                orbitAngle : YV.Constants.planets.saturn.orbitAngle,
            }),


            new Planet({
                texture : "neptune.jpg",
                mass : YV.Constants.planets.neptune.mass, 
                radius : YV.Constants.planets.neptune.radius,
                tilt : YV.Constants.planets.neptune.tilt, 
                rotationalVelocity : YV.Constants.planets.neptune.rotationalVelocity,
                orbitRadius : YV.Constants.planets.neptune.orbitRadius,
                orbitAngle : YV.Constants.planets.neptune.orbitAngle,
            }),
        ],

        players: {},

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

            explosions: [],

            thrusters: [
                //hmm.... this is slightly problematic-- the balance in between a no-knowledge
                //particle system and not duplicating effort w.r.t. thruster position, which
                //already really belongs to the player position, etc.
            ]
        }
    }
            
    function setInitialPosAndVel(playerid, ufo) {
        var count = 0;
        for(id in State.players) {
            if(id === playerid)
                break;
            else
                count++;
        }

        var angle = count * (2*Math.PI / YV.Constants.maxPlayers);
        var pos = new SglVec3(YV.Constants.ufo.initialRadius * Math.sin(angle), 0.0,
                              YV.Constants.ufo.initialRadius * Math.cos(angle))
        var vel = pos.normalized;
        vel = vel.mul(new SglVec3(YV.Constants.ufo.initialVelocity));

        ufo.position = pos;
        ufo.velocity = vel;
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
    };

    YV.MoveCamera = function(orbitAngle, azimuth, orbitRadius) {
        State.camera.orbitAngle += orbitAngle;
        State.camera.azimuth += azimuth;
        State.camera.orbitRadius += orbitRadius;
    };

    YV.GetCamera = function() {
        return State.camera;
    };

    YV.GetBackground = function() {
        return State.background;
    };

    YV.GetUFOData = function() {
        return State.ufo;
    };

    YV.GetLaserData = function() {
        return State.laser;
    };

    YV.RemoveLasers = function(toremove) {
        var tokeep = [];
        YV.OverLasers(function(laser_id, laser) {
            if($.inArray(laser_id, toremove) < 0) {
                tokeep.push(laser);
            }
        });

        State.particles.lasers = tokeep;
    };

    YV.AddExplosion = function(pos) {
        State.particles.explosions.push(new Explosion({position: new SglVec3(pos)}));
    };

    YV.AddPlayer = function(playerid, color) {
        var newufo = new UFO({
            color: color,
        });
        setInitialPosAndVel(playerid, newufo);
        State.players[playerid] = newufo;
    };

    function bracketed(min, max, val) {
        val = Math.max(min, val)
        val = Math.min(max, val)
        return val
    }

    YV.UpdatePlayerVelocity = function(player_id, data) {
        var player = State.players[player_id];
        if(player === undefined) return;

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
        if(player === undefined) return;
        player.cannon_angle = angle + Math.PI; //TODO base this correction on the camera
    };

    YV.FireLaser = function(player_id) {
        var player = State.players[player_id];
        if(player === undefined) return false;

        //Check to see if we're allowed to shoot right now
        if((Date.now() - player.last_shot)/1000 > player.recharge_time) {
            var MULT = YV.Constants.laser.velocityMultiplier;
            var x = -Math.sin(player.cannon_angle);
            var z = -Math.cos(player.cannon_angle);

            var laser_vel = new SglVec3(x, 0., z)
            var laser_dir = laser_vel.normalize();
            laser_vel = laser_dir.mul(new SglVec3(MULT));

            player.last_shot = Date.now()

            var radius = YV.Constants.ufo.ringRadius;
            State.particles.lasers.push(new Laser({
                position: player.position.add(laser_dir.mul(new SglVec3(radius))),
                velocity: laser_vel,
                shooter_id: player_id
            }));
            
            return true;
        }
        return false;
    };
    
    YV.Respawn = function(player_id, ufo) {
        if(ufo.lives > 0) {
            setInitialPosAndVel(player_id, ufo);
            ufo.invulnerable = YV.Constants.ufo.invulnerablePeriod;
            ufo.control_velocity = new SglVec3(0.0, 0.0, 0.0);
        } else {
            //Kill off the player for good
            delete State.players[player_id];
        }
    };

    
})();