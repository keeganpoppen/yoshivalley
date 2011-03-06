GLIB.FireWhenReady({
    textures: ["earth.jpg", "sun.jpg", "mars.jpg"],
    shaders: ["spider.frag.glsl", "spider.vert.glsl", "planet.frag.glsl", "planet.vert.glsl"],
    meshes: []
}, function(resources) {
    console.log('starting real work, namely the actual game');
    
    var makeSphere = function(radius, lats, longs) {
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
    }
    
    var GameModel = {
        camera : {
           fov : 60.0, //Degrees 
           position : [100.0, 30.0, 100.0]
        }, 

        sun : {
            program : "planet", //We'll need a special sun shader
            texture : "sun.jpg",
            radius: 20.0,
            mass: 100.0,
            position : new SglVec3(0.0,0.0,0.0)
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

        particles: [
            {
                type: 'laser', //presumably this type will indicate which shader to use
                position: new SglVec3(2.0, 2.0, 2.0),
                velocity: new SglVec3(0.0, 0.0, 0.0),
                player: 0 //index of the player who shot the laser
            }
        ]

    };

    var setCamera = function(gl) {
        var w = gl.ui.width;
        var h = gl.ui.height;
        gl.viewport(0, 0, w, h);
        gl.xform.projection.loadIdentity();
        gl.xform.projection.perspective(sglDegToRad(GameModel.camera.fov), w/h, 0.1, 300.0);
        gl.xform.view.loadIdentity();
        gl.xform.view.lookAt(GameModel.camera.position[0],
                             GameModel.camera.position[1],
                             GameModel.camera.position[2],
                             GameModel.sun.position[0],
                             GameModel.sun.position[1],
                             GameModel.sun.position[2],
                             0.0, 1.0, 0.0);
    };

    var drawPlanet = function(gl, planet) {
        gl.xform.model.loadIdentity();
        var planetPosition = [];
        planetPosition[0] = planet.orbitRadius * Math.sin(sglDegToRad(planet.orbitAngle));
        planetPosition[1] = 0.0;
        planetPosition[2] = planet.orbitRadius * Math.cos(sglDegToRad(planet.orbitAngle));
        //gl.xform.model.translate(planetPosition.x, planetPosition.y, planetPosition.z);
        gl.xform.model.rotate(sglDegToRad(planet.tilt), 1.0, 0.0, 0.0);
        gl.xform.model.rotate(sglDegToRad(planet.rotation), 0.0, 1.0, 0.0);
        gl.xform.model.scale(planet.radius, planet.radius, planet.radius);

        sglRenderMeshGLPrimitives(planet.mesh, "index", gl.programs[planet.program], null,
        /*Uniforms*/ {
                        ModelMatrix : gl.xform.modelMatrix,
                        ModelViewProjectionMatrix : gl.xform.modelViewProjectionMatrix,
                        planetCenter : planetPosition,
                        sunCenter : GameModel.sun.position
                     },
        /*Samplers*/ {surfaceTexture : planet.texture});
    };

    sglRegisterLoadedCanvas("canvas", {
        load: function(gl) {
            gl.xform = new SglTransformStack();
            gl.programs = {};

            gl.programs.planet = new SglProgram(gl, [resources.shaders["spider.vert.glsl"]],
                                                    [resources.shaders["spider.frag.glsl"]]);
            console.log(gl.programs.planet.log);

            var sphereMesh = makeSphere(1, 15, 15);
            for(var id in GameModel.planets) {
                var planet = GameModel.planets[id];
                planet.mesh = new SglMeshGL(gl);
                planet.mesh.addVertexAttribute("position", 3, sphereMesh.vertices); 
                planet.mesh.addVertexAttribute("texcoord", 2, sphereMesh.texCoords); 
                planet.mesh.addIndexedPrimitives("index", gl.TRIANGLES, sphereMesh.indices);

                //Replace texture string with texture object
                planet.texture = new SglTexture2D(gl, resources.textures[planet.texture], {
                    generateMipmap: true,
                    minFilter: gl.LINEAR_MIPMAP_LINEAR,
                    onload: this.ui.requestDraw
                });
            }

            gl.ui = this.ui;
        },

        update: function(gl, dt) {
            //update the positions and velocities of ... everything!
            //GLIB.Solver.StepTime(GameModel, dt)

            for(var planet in GameModel.planets) {
                GameModel.planets[planet].rotation +=
                    GameModel.planets[planet].rotationalVelocity * dt;
            }
        },

        draw: function(gl) {
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST);
            gl.enable(gl.CULL_FACE);

            setCamera(gl);
            drawPlanet(gl, GameModel.planets[0]);
            //drawSun(gl)
            //for(var planet in GameModel.planets) {
            //    drawPlanet(gl, GameModel.planets[planet]);
            //}

            gl.disable(gl.CULL_FACE);
            gl.disable(gl.DEPTH_TEST);
        }
    }, 60.0);
});console.log('starting real work, namely the actual game');
