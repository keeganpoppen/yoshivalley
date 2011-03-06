$(function() {
    GLIB.loadResources({
        textures: ["earth.jpg", "sun.jpg"],
        shaders: ["planet.frag.glsl", "planet.vert.glsl"],
        meshes: ["sphere.json"]
    }, function(resources) {

        var GameModel = {
            sun : {
                program : "planet", //We'll need a special sun shader
                texture : "sun.jpg",
                position : [0.0,0.0,0.0]
            },

            planets : [
                {
                    program : "planet", //Eventually we'll have a special earth shader
                    texture : "earth.jpg",
                    radius : 10.0,
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
                    radius : 3.33,
                    tilt : 3.0, 
                    rotation : 0.0,
                    rotationalVelocity : 5.0, 
                    orbitRadius : 45.0,
                    orbitAngle : 25.0,
                    mesh : {} //Will be set to SGlMesh object
                },
            ],
        };

        var drawPlanet = function(gl, planet) {
            
        };

        sglRegisterCanvas("canvas", {
            load: function(gl) {
                this.xform = new SglTransformStack();
                this.programs = {};
                this.programs.planet = new SglProgram(gl, [resources.shaders["planet.vert.glsl"]]
                                                          [resources.shaders["planet.frag.glsl"]]);
                console.log(this.programs.planet.log);

                var sphereMesh = resources.meshes["sphere.json"];
                for(var id in GameModel.planets) {
                    var planet = GameModel.planets[id];
                    planet.mesh = new SglMesh(gl);
                    planet.mesh.addVertexAttribute("position", 3, sphereMesh.vertices); 
                    planet.mesh.addVertexAttribute("texcoord", 3, sphereMesh.vertices); 
                    planet.mesh.addIndexedPrimitives("triangles", gl.TRIANGLES, sphereMesh.indices);

                    planet.mesh.texture = new SglTexture2D(gl, resources.textures[planet.texture], {
                        generateMipmap : true,
                        minFilter: gl.LINEAR_MIPMAP_LINEAR
                    });
                }
            },

            update: function(gl, dt) {
                for(var planet in GameModel.planets) {
                    GameModel.planets[planet].rotation += rotationalVelocity * dt;
                }
            },

            draw: function(gl) {
                for(var planet in GameModel.planets) {
                    drawPlanet(gl, GameModel.planets[planet]);
                }
            }
        }, 60);
    });
});
