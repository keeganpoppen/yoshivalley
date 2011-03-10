GLIB.FireWhenReady(YV.Resources, function(resources) {
    console.log('starting real work, namely the actual game');

    //TODO: I think this might should go to GLIB
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

    //TODO: this is eventually superflous... I'm just lazy
    var GameModel = YV.GameModel;
    
    var setCamera = function(gl) {
        var w = gl.ui.width;
        var h = gl.ui.height;

        var camera = GameModel.camera;
        var sun = GameModel.sun;
       
        gl.viewport(0, 0, w, h);
        gl.xform.projection.loadIdentity();
        gl.xform.projection.perspective(sglDegToRad(camera.fov), w/h, 80, 400.0);
        gl.xform.view.loadIdentity();
        gl.xform.view.lookAt(camera.position.x,
                             camera.position.y,
                             camera.position.z,
                             sun.position.x,
                             sun.position.y,
                             sun.position.z,
                             0.0, 1.0, 0.0);
    };

    var drawBackground = function(gl, background) {
        gl.disable(gl.DEPTH_TEST);
        sglRenderMeshGLPrimitives(background.mesh, "index", gl.programs[background.program], null,
            {
                repeat : background.repeat,
                aspectRatio : gl.ui.width / gl.ui.height,
            },
            {   backgroundTexture : background.texture }, 0, 6);
        gl.enable(gl.DEPTH_TEST);
    };

    var drawSun = function(gl, sun) {
        gl.xform.model.loadIdentity();
        gl.xform.model.translate(sun.position.x, sun.position.y, sun.position.z);
        gl.xform.model.rotate(sglDegToRad(sun.rotation), 0.0, 1.0, 0.0);
        gl.xform.model.scale(sun.radius, sun.radius, sun.radius);
        sglRenderMeshGLPrimitives(sun.mesh, "index", gl.programs.sun, null,
        /*Uniforms*/ {
                        ModelViewProjectionMatrix : gl.xform.modelViewProjectionMatrix,
                     },
        /*Samplers*/ {surfaceTexture : sun.texture});
    };
    
    var drawPlanet = function(gl, planet) {
        gl.xform.model.loadIdentity();
        var planPos = planet.position;
        gl.xform.model.translate(planPos.x, planPos.y, planPos.z);
        gl.xform.model.rotate(sglDegToRad(planet.tilt), 1.0, 0.0, 0.0);
        gl.xform.model.rotate(sglDegToRad(planet.rotation), 0.0, 1.0, 0.0);
        gl.xform.model.scale(planet.radius, planet.radius, planet.radius);

        var sun = GameModel.sun;
        sglRenderMeshGLPrimitives(planet.mesh, "index", gl.programs.planet, null,
        /*Uniforms*/ {
                        ModelMatrix : gl.xform.modelMatrix,
                        ModelViewProjectionMatrix : gl.xform.modelViewProjectionMatrix,
                        planetCenter : [planPos.x, planPos.y, planPos.z],
                        sunCenter : [sun.position.x, sun.position.y, sun.position.z]
                     },
        /*Samplers*/ {surfaceTexture : planet.texture});
    };

    sglRegisterLoadedCanvas("canvas", {
        load: function(gl) {
            gl.xform = new SglTransformStack();
            gl.programs = {};
            
            //Compile Shaders
            gl.programs.planet = new SglProgram(gl, [resources.shaders['planet.vert.glsl']],
                                                    [resources.shaders['planet.frag.glsl']]);
            console.log(gl.programs.planet.log);
            gl.programs.sun = new SglProgram(gl, [resources.shaders['sun.vert.glsl']],
                                                 [resources.shaders['sun.frag.glsl']]);
            console.log(gl.programs.sun.log);
            gl.programs.bg = new SglProgram(gl, [resources.shaders['bg.vert.glsl']],
                                               [resources.shaders['bg.frag.glsl']]);
            console.log(gl.programs.bg.log);

            //Create Meshes 
            var textureOptions = {
                    generateMipmap: true,
                    flipY: false,
                    minFilter: gl.LINEAR_MIPMAP_LINEAR,
            };

            /*

            GameModel.background.mesh = new SglMeshGL(gl);
            GameModel.background.mesh.addVertexAttribute("position", 3, new Float32Array(
                                                                            [-1.0, -1.0, 0.0,
                                                                             1.0, -1.0, 0.0,
                                                                             1.0, 1.0, 0.0,
                                                                             -1.0, 1.0, 0.0]));
            GameModel.background.mesh.addIndexedPrimitives("index", gl.TRIANGLES,
                                                            new Uint16Array([0, 1, 2, 2, 3, 0]));
            GameModel.background.texture = new SglTexture2D(gl, resources.textures[GameModel.background.texture], textureOptions);

            */
            

            var sphereMesh = makeSphere(1, 25, 25);
            GameModel.sun.mesh = new SglMeshGL(gl);
            GameModel.sun.mesh.addVertexAttribute("position", 3, sphereMesh.vertices);
            GameModel.sun.mesh.addVertexAttribute("texcoord", 2, sphereMesh.texCoords);
            GameModel.sun.mesh.addIndexedPrimitives("index", gl.TRIANGLES, sphereMesh.indices);
            GameModel.sun.texture = new SglTexture2D(gl, resources.textures[GameModel.sun.texture], textureOptions);
            for(var id in GameModel.planets) {
                var planet = GameModel.planets[id];
                planet.mesh = new SglMeshGL(gl);
                planet.mesh.addVertexAttribute("position", 3, sphereMesh.vertices);
                planet.mesh.addVertexAttribute("texcoord", 2, sphereMesh.texCoords);
                planet.mesh.addIndexedPrimitives("index", gl.TRIANGLES, sphereMesh.indices);
                
                //Replace texture string with texture object
                planet.texture = new SglTexture2D(gl, resources.textures[planet.texture], textureOptions);
            }
            
            gl.ui = this.ui;

            //We want the canvas to resize with the window
            var resize = function() {
                gl.canvas.width = window.innerWidth;
                gl.canvas.height = window.innerHeight;
            }
            $(window).resize(resize);
            resize();
        },

        update: function(gl, dt) {
            //update the positions and velocities of ... everything!
            YV.Update(dt, YV.GameModel)
        },

        draw: function(gl) {
            gl.clearColor(0.0, 0.0, 0.0, 1.0);
            gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
            gl.enable(gl.DEPTH_TEST);
        
            setCamera(gl);
            //drawBackground(gl, GameModel.background);
            drawSun(gl, GameModel.sun)
            for(var planet in GameModel.planets) {
                drawPlanet(gl, GameModel.planets[planet]);
            }
            
            //TODO: move stuff here
            YV.Render(gl, YV.GameModel)

            gl.disable(gl.DEPTH_TEST);
        }
    }, 60.0);
});
