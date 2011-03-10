//init the global YV object. note that this file needs to be loaded first, obviously
var YV = {};

(function(){

    //all the resources that need to be loaded before the game will work correctly
    YV.Resources = {
        textures: ["earth.jpg", "sun.jpg", "mars.jpg", "sky2.jpg", "jupiter.jpg", "laser.png"],
        shaders: ["planet.frag.glsl", "planet.vert.glsl",
                  "sun.vert.glsl", "sun.frag.glsl",
                  "bg.vert.glsl", "bg.frag.glsl",
                  "laser.vert.glsl", "laser.frag.glsl"],
        meshes: []
    }

    //the unifying data structure for all the stuff in the game ... whoa
    YV.GameModel = {
        camera : {
           fov : 60.0, //Degrees 
           //position : [100.0, 30.0, 100.0] //NOTE: CHANGED!!!
           position: new SglVec3(100.0, 250.0, 100.0)
        }, 

        sun : {
            program : "sun", //We'll need a special sun shader
            texture : "sun.jpg",
            radius: 20.0,
            mass: 100.0,
            rotation: 0.0,
            position : new SglVec3(0.0,0.0,0.0),
            rotationalVelocity: 0.0 //NOTE: CHANGED!!!
        },

        planets : [
            {
                program : "planet", //Eventually we'll have a special earth shader
                texture : "earth.jpg",
                mass : 30.0, 
                radius : 10.0,
                position: new SglVec3(100.0, 100.0, 0.0),
                tilt : 5.0, //Degrees
                rotation : 0.0, //Degrees
                rotationalVelocity : 8.0, //Degrees per second
                orbitRadius : 30.0,
                orbitAngle : 15.0, //Degrees
                mesh : {} //Will be set to SGlMesh object
            },

            {
                program : "planet",
                texture : "mars.jpg",
                mass : 10.0,
                radius : 3.33,
                position: new SglVec3(100.0, 0.0, 0.0),
                tilt : 3.0, 
                rotation : 0.0,
                rotationalVelocity : 5.0, 
                orbitRadius : 45.0,
                orbitAngle : 25.0,
                mesh : {} //Will be set to SGlMesh object
            }
        ],

        players: [
            {
                program: undefined, //obviously this shouldn't be undefined...
                texture: undefined, //...same
                mass: 0.1,
                radius: 0.5, 
                position: new SglVec3(50.0, 50.0, 0.0),
                velocity: new SglVec3(0.0, 0.0, 0.0),
                thrust_velocity: new SglVec3(0.0, 0.0, 0.0),
                acceleration: new SglVec3(0.0, 0.0, 0.0),
                cannon_angle: 0.0
            }
        ],

        particles: {
            lasers: [
                {
                    position: new SglVec3(2.0, 2.0, 0.0),
                    velocity: new SglVec3(1.0, 0.0, 0.0),
                    player: 0, //index of the player who shot the laser,
                    time_shot: 0    //this is a direction we could go in instead of +vel*dt
                }
            ],
            explosions: [

            ],
            thrusters: [
                //hmm.... this is slightly problematic-- the balance in between a no-knowledge
                //particle system and not duplicating effort w.r.t. thruster position, which
                //already really belongs to the player position, etc.
            ]
        }
    }
    
})();
