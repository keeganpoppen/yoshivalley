//init the global YV object. note that this file needs to be loaded first, obviously
var YV = {};

(function(){
    //Put all numerical constants here
    YV.Constants = {
        ufo: {
            mass: 10.0,
            radius: 10.0,
            lives: 3,
            rechargeTime: 3,
            invulnerablePeriod: 3,
            initialRadius: 70,
            initialVelocity: 5,

            collisionEpsilon: 1,

            minMaxAngle: 60.0,
            controlVelocityMultiplier: 100,

            blinkPeriod: 0.3,
            blinkOffPercent: 0.33,

            diskSquishFrac: 0.3,
            domeRadFrac: 0.6,
        },

        particle: {
            lifetime: 2
        },

        explosion: {
            outwardVelocity: 10.0,
            vertexDensity: 20
        },

        camera: {
            fov: 40.0, //Degrees
            orbitRadius: 250,
            orbitAngle: 0.0,
            near: 1,
            far: 900,
            azimuth: 70,
        },

        planets : {
            sun: {
                radius: 20.0,
                mass: 100.0,
            },

            earth: {
                radius : 10,
                mass : 15,
                tilt: 5.0, //Degrees
                rotationalVelocity: 8.0, //Degrees per second
                orbitRadius: 90.0,
                orbitAngle: 180.0,
            },

            mars: {
                radius: 8.0,
                mass: 10.0,
                tilt: 3.0,
                rotationalVelocity: 5.0,
                orbitRadius: 80.0,
                orbitAngle: 25.0
            },

            jupiter: {
                radius: 18.0,
                mass: 40.0,
                tilt: 0.0,
                rotationalVelocity: 6.0,
                orbitRadius: 140.0,
                orbitAngle: 125.0
            },
        },

        laser: {
            length: 7.5,
            numParticles: 10,
            velocityMultiplier: 100,
            maxAge: 4,
        },

        solver: {
            timestep: 0.03,
            gravitationalConstant: 200.0,
        },

        maxPlayers: 8,
        planetSphereDensity: 25,
        maxFrameRate: 60,
        arenaRadius: 400,
        arenaKickbackMultiplier: 150,
    };

    //all the resources that need to be loaded before the game will work correctly
    YV.Resources = {
        textures: ["earth.jpg", "sun.jpg", "mars.jpg", "sky2.jpg", "jupiter.jpg", "laser.png", "fire.png"],
        shaders: ["planet.frag.glsl", "planet.vert.glsl",
                  "sun.vert.glsl", "sun.frag.glsl",
                  "bg.vert.glsl", "bg.frag.glsl",
                  "particle.vert.glsl", "particle.frag.glsl",
                  "ufo.vert.glsl", "ufo.frag.glsl"],
        meshes: ["ufo.json"],
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
    YV.UFO = UFO

    YV.Respawn = function(player_id, ufo) {
        if(ufo.lives > 0) {
            setInitialPosAndVel(player_id, ufo);
            ufo.invulnerable = YV.Constants.ufo.invulnerablePeriod;
            ufo.control_velocity = new SglVec3(0.0, 0.0, 0.0);
        } else {
            //Kill off the player for good
            delete YV.GameModel.players[player_id];
        }
    };

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
    YV.Laser = Laser

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
    YV.GameModel = {
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

        sun : new Planet({
            program : "sun",
            texture : "sun.jpg",
            radius: YV.Constants.planets.sun.radius,
            mass: YV.Constants.planets.sun.mass,
        }),

        planets : [
            new Planet({
                texture : "earth.jpg",
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
            })
        ],

        players: {},

        ufo: {},

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

    YV.AddExplosion = function(pos) {
        YV.GameModel.particles.explosions.push(new Explosion({position: new SglVec3(pos)}));
    };
            
    function setInitialPosAndVel(playerid, ufo) {
        var count = 0;
        for(id in YV.GameModel.players) {
            if(id === playerid)
                break;
            else
                count++;
        }
        //var num_players = Object.keys(YV.GameModel.players).length + 1;
        var angle = count * (2*Math.PI / YV.Constants.maxPlayers);
        var pos = new SglVec3(YV.Constants.ufo.initialRadius * Math.sin(angle), 0.0,
                              YV.Constants.ufo.initialRadius * Math.cos(angle))
        var vel = pos.normalized;
        vel = vel.mul(new SglVec3(YV.Constants.ufo.initialVelocity));

        ufo.position = pos;
        ufo.velocity = vel;
    }

    YV.AddPlayer = function(playerid) {
        var newufo = new UFO();
        setInitialPosAndVel(playerid, newufo);
        YV.GameModel.players[playerid] = newufo;
    }
    
})();
