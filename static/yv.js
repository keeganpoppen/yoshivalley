//init the global YV object. note that this file needs to be loaded first, obviously
var YV = {};

(function(){
    //Put all numerical constants here
    YV.Constants = (function() {
        var arenaRadius = 50;
        var sunRadius = arenaRadius / 15;
        var neptuneRadius = sunRadius * 0.6;
        var saturnRadius = sunRadius * 0.7;
        var jupiterRadius = sunRadius * 0.9;
        var earthRadius = sunRadius * 0.7;
        var marsRadius = sunRadius * 0.6;
        var ufoRadius = sunRadius * 0.4;

        var earthOrbit = 2 * arenaRadius / 8;
        var marsOrbit = 3 * arenaRadius / 8;
        var jupiterOrbit = 4 * arenaRadius / 8;
        var saturnOrbit = 5 * arenaRadius / 8;
        var neptuneOrbit = 6 * arenaRadius / 8;

        var sunMass = 20;
        var jupiterMass = 0.8 * sunMass;
        var saturnMass = 0.4 * sunMass;
        var neptuneMass = 0.6 * sunMass;
        var earthMass = 0.5 * sunMass;
        var marsMass = 0.4 * sunMass;
        var ufoMass = 0.2 * sunMass;

        var fieldOfView = 60.0;
        var cameraRadius = Math.abs(2 * arenaRadius / Math.tan(sglDegToRad(fieldOfView)));
    
        var constants = {
            maxPlayers: 8,
            planetSphereDensity: 25,
            maxFrameRate: 60,
            arenaRadius: arenaRadius,
            arenaKickbackMultiplier: 150,

            ufo: {
                mass: ufoMass,
                radius: ufoRadius,
                lives: 3,
                rechargeTime: 0.8,
                invulnerablePeriod: 3,
                initialRadius: arenaRadius / 2,
                initialVelocity: 2*ufoRadius,

                collisionEpsilon: ufoRadius/4,

                minMaxAngle: 60.0,
                controlVelocityMultiplier: 20,

                blinkPeriod: 0.3,
                blinkOffPercent: 0.33,
                shininess: 20.0,

                diskSquishFrac: 0.3,
                domeRadFrac: 0.6,
                ringRadius: 1.3 * ufoRadius,
            },

            particle: {
                lifetime: 1,
            },

            explosion: {
                outwardVelocity: 5*ufoRadius,
                vertexDensity: 20,
                particleSize: 600,
            },

            camera: {
                fov: fieldOfView, //Degrees
                orbitRadius: cameraRadius,
                orbitAngle: 0.0,
                near: 0.1,
                far: 3*cameraRadius,
                azimuth: 70,
            },

            planets : {
                orbitVelocity: 25,

                sun: {
                    radius: sunRadius,
                    mass: sunMass,
                },

                earth: {
                    radius : earthRadius,
                    mass : earthMass,
                    tilt: 5.0, //Degrees
                    rotationalVelocity: 8.0, //Degrees per second
                    orbitRadius: earthOrbit,
                    orbitAngle: 180.0,
                },

                mars: {
                    radius: marsRadius,
                    mass: marsMass,
                    tilt: 3.0,
                    rotationalVelocity: 5.0,
                    orbitRadius: marsOrbit, 
                    orbitAngle: 25.0
                },

                jupiter: {
                    radius: jupiterRadius,
                    mass: jupiterMass,
                    tilt: 0.0,
                    rotationalVelocity: 6.0,
                    orbitRadius: jupiterOrbit,
                    orbitAngle: 125.0
                },

                saturn: {
                    radius: saturnRadius,
                    mass: saturnMass,
                    tilt: 15.0,
                    rotationalVelocity: 12.0,
                    orbitRadius: saturnOrbit,
                    orbitAngle: 270.0,
                },

                neptune: {
                    radius: neptuneRadius,
                    mass: neptuneMass,
                    tilt: 1.0,
                    rotationalVelocity: 8.0,
                    orbitRadius: neptuneOrbit,
                    orbitAngle: -30.0,
                },
            },

            laser: {
                length: ufoRadius,
                numParticles: 10,
                velocityMultiplier: 20,
                maxAge: 4,
                particleSize: 300,
            },

            solver: {
                timestep: 0.03,
                gravitationalConstant: 40.0,
            },
        };
        return constants;
    })();

    //all the resources that need to be loaded before the game will work correctly
    YV.Resources = {
        textures: ["earth.jpg", "sun.jpg", "mars.jpg", "sky2.jpg", "jupiter.jpg",
                   "saturn.jpg", "laser.png", "fire.png", "ring.png", "metal.jpg",
                   "saturn-ring.jpg", "saturn-ring-alpha.gif", "neptune.jpg"],
        shaders: ["planet.frag.glsl", "planet.vert.glsl",
                  "sun.vert.glsl", "sun.frag.glsl",
                  "bg.vert.glsl", "bg.frag.glsl",
                  "particle.vert.glsl", "particle.frag.glsl",
                  "ufo.vert.glsl", "ufo.frag.glsl",
                  "saturn.vert.glsl", "saturn.frag.glsl",
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

    YV.AddPlayer = function(playerid, color) {
        var newufo = new UFO({
            color: color,
        });
        setInitialPosAndVel(playerid, newufo);
        YV.GameModel.players[playerid] = newufo;
    }
    
})();
