//init the global YV object. note that this file needs to be loaded first, obviously
var YV = {};

(function(){

    //all the resources that need to be loaded before the game will work correctly
    YV.Resources = {
        textures: ["earth.jpg", "sun.jpg", "mars.jpg", "sky2.jpg", "jupiter.jpg", "laser.png", "fire.png"],
        shaders: ["planet.frag.glsl", "planet.vert.glsl",
                  "sun.vert.glsl", "sun.frag.glsl",
                  "bg.vert.glsl", "bg.frag.glsl",
                  "particle.vert.glsl", "particle.frag.glsl"],
                  "ufo.vert.glsl", "ufo.frag.glsl"],
        meshes: ["ufo.json"]
        meshes: []
    }

    function Planet(opts) {
        this.__defineGetter__('position', function() {
            return new SglVec3(this.orbitRadius * Math.sin(sglDegToRad(this.orbitAngle)),
                       0.0,
                       this.orbitRadius * Math.cos(sglDegToRad(this.orbitAngle)));
        });
        this.program = "planet";
        this.texture = "jupiter.jpg"; //Default texture
        this.mass = 0.0; //Default doesn't affect gravity
        this.radius = 1.0;
        this.tilt = 0.0;
        this.rotationalVelocity = 0.0;
        this.orbitRadius = 0.0;
        this.orbitAngle = 0.0;
        this.rotation = 0.0;
        this.mesh = {};
        $.extend(this,opts || {});
    };

    function UFO(opts) {
        this.program = "ufo";
        this.position = new SglVec3(0.0, 0.0, 0.0);
        this.mass = 0.1;
        this.radius = 5.0; 
        this.velocity = new SglVec3(0.0, 0.0, 0.0);
        this.acceleration = new SglVec3(0.0, 0.0, 0.0);
        this.cannon_angle = 0.0;
        $.extend(this, opts || {});
    };

    function Particle(opts) {
        $.extend(this, opts || {})
    }
    $.extend(Particle.prototype, {
        position: new SglVec3(0.),
        velocity: new SglVec3(1., 0., 1.),
        acceleration: new SglVec3(0.),
        lifetime: 5.,
        age: 0.
    })

    function Laser(opts) {
        this.time_shot = Date.now()
        $.extend(this, opts || {})
    }
    Laser.prototype = Particle.prototype
    $.extend(Laser.prototype, {
        shooter: -1,
        time_shot: 0
    })

    function Explosion(opts) {
        $.extend(this, opts || {})

        //initialize explosion particles
        //var nParticles = YV.GameModel.particles.laser.numParticles
        var nParticles = 100
        var center = this.position

        var verts = GLIB.MakeSphericalVerts(7.0, 20, 20)
        var that = this
        verts.map(function(vert){
            that.particles.push(new Particle({
                position: center.clone(),
                velocity: vert.clone()
            }))
        })

        console.log("made " + verts.length + " verts")
    }
    $.extend(Explosion.prototype, {
        position: new SglVec3(0.0),
        particles: []
    })

    //the unifying data structure for all the stuff in the game ... whoa
    YV.GameModel = {
        camera : {
           fov : 60.0, //Degrees 
           position: new SglVec3(100.0, 250.0, 100.0)
        }, 

        background : {
            program : "bg",
            texture : "sky2.jpg",
            repeat : 1.0,
            mesh : {}
        },

        sun : new Planet({
            program : "sun",
            texture : "sun.jpg",
            radius: 20.0,
            mass: 100.0,
        }),

        planets : [
            new Planet({
                texture : "earth.jpg",
                mass : 30.0, 
                radius : 15.0,
                tilt : 5.0, //Degrees
                rotationalVelocity : 8.0, //Degrees per second
                orbitRadius : 90.0,
                orbitAngle : 180.0, //Degrees
            }),

            new Planet({
                texture : "mars.jpg",
                mass : 10.0,
                radius : 8.0,
                tilt : 3.0, 
                rotationalVelocity : 5.0, 
                orbitRadius : 80.0,
                orbitAngle : 25.0,
            }),

            new Planet({
                texture : "jupiter.jpg",
                mass : 40.0,
                radius : 18.0,
                rotationalVelocity : 6.0,
                orbitRadius : 140.0,
                orbitAngle : 125.0,
            })
        ],

        players: [
            new UFO() 
        ],

        UFOMesh : {}, //Will get set in load

        //truck for global laser config
        laser: {
            length: 7.5,
            numParticles: 10,
            texture: "laser.png"    
        }, 

        explosion: {
            numParticles: 100,
            texture: "fire.png"
        },

        particles: {
            lasers: [
                /*
                new Laser({
                    position: new SglVec3(20.0, 0.0, 20.0),
                    velocity: new SglVec3(1.0, 0.0, 1.0)
                })
                */
            ],

            explosions: [
                /*
                new Explosion({
                    position: new SglVec3(20.0, 0.0, 20.0)
                })
                */
            ],

            thrusters: [
                //hmm.... this is slightly problematic-- the balance in between a no-knowledge
                //particle system and not duplicating effort w.r.t. thruster position, which
                //already really belongs to the player position, etc.
            ]
        }
    }
    
})();
