GLIB.FireWhenReady(YV.Resources, function(resources) {
    console.log('starting real work, namely the actual game');

    //TODO: this is eventually superflous... I'm just lazy
    var GameModel = YV.GameModel;
    
    sglRegisterLoadedCanvas("canvas", {
        load: function(gl) {
            gl.xform = new SglTransformStack();
            gl.programs = {};
            
            //Compile Shaders
            gl.programs.planet = GLIB.compileProgram(gl, resources, 'planet');
            gl.programs.sun = GLIB.compileProgram(gl, resources, 'sun');
            gl.programs.bg = GLIB.compileProgram(gl, resources, 'bg');
            gl.programs.ufo = GLIB.compileProgram(gl, resources, 'ufo');
            gl.programs.particle = GLIB.compileProgram(gl, resources, 'particle');

            //Create Meshes 
            var textureOptions = {
                    generateMipmap: true,
                    flipY: false,
                    minFilter: gl.LINEAR_MIPMAP_LINEAR,
            };

            //set up laser texture
            GameModel.laser.texture = new SglTexture2D(gl, resources.textures[GameModel.laser.texture], textureOptions)
            GameModel.explosion.texture = new SglTexture2D(gl, resources.textures[GameModel.explosion.texture], textureOptions)

            GameModel.background.mesh = GLIB.MakeSGLMesh(gl, {
                vertices: new Float32Array([-1.0, -1.0, 0.0,
                                             1.0, -1.0, 0.0,
                                             1.0, 1.0, 0.0,
                                            -1.0, 1.0, 0.0]),
                indices: new Uint16Array([0,1,2,2,3,0])
            });

            GameModel.background.texture = new SglTexture2D(gl,
                    resources.textures[GameModel.background.texture], textureOptions);

            var sphereMesh = GLIB.MakeSphere(1, 25, 25);
            var SGLsphereMesh = GLIB.MakeSGLMesh(gl, sphereMesh);
            GameModel.sun.mesh = SGLsphereMesh;
            GameModel.sun.texture = new SglTexture2D(gl,
                    resources.textures[GameModel.sun.texture], textureOptions);
            for(var id in GameModel.planets) {
                var planet = GameModel.planets[id];
                planet.mesh = SGLsphereMesh;
                //Replace texture string with texture object
                planet.texture = new SglTexture2D(gl,
                        resources.textures[planet.texture], textureOptions);
            }

            //GameModel.UFOMesh = GLIB.MakeSGLMesh(gl, resources.meshes['ufo.json']);
            var sphereMeshWithNormals = GLIB.MakeSphere(1, 25, 25, true);
            var SGLMeshWithNormals = GLIB.MakeSGLMesh(gl, sphereMeshWithNormals); 
            GameModel.UFOMesh = SGLMeshWithNormals;
            gl.ui = this.ui;

            //We want the canvas to resize with the window
            var resize = function() {
                gl.canvas.width = window.innerWidth;
                gl.canvas.height = window.innerHeight;
            }
            $(window).resize(resize);
            resize();

            window.onkeypress = function(e) {
                switch(e.charCode) {
                case 97: //A
                    YV.GameModel.camera.orbitAngle -= 5;
                    break;
                case 100: //D
                    YV.GameModel.camera.orbitAngle += 5;
                    break;
                case 119: //W
                    YV.GameModel.camera.azimuth += 5;
                    break;
                case 115: //S
                    YV.GameModel.camera.azimuth -= 5;
                    break;
                };
            }

            window.addEventListener('mousewheel', function(e) {
                YV.GameModel.camera.orbitRadius -= e.wheelDelta / 20;
            }, false);

            //set up all the relevant socket callbacks, etc.
            //right now this is last so that stuff is displaying before sockets start doing shit
            YV.Connect(resources.socket, GameModel)
        },

        update: function(gl, dt) {
            //update the positions and velocities of ... everything!
            YV.Update(dt, YV.GameModel)
        },

        draw: function(gl) {
            YV.Render(gl, YV.GameModel)
        }

    }, 60.0);
});
