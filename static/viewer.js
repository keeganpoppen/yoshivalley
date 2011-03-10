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
            //gl.programs.laser = GLIB.compileProgram(gl, resources, 'laser');

            //Create Meshes 
            var textureOptions = {
                    generateMipmap: true,
                    flipY: false,
                    minFilter: gl.LINEAR_MIPMAP_LINEAR,
            };

            //set up laser texture
            //GameModel.laser.texture = new SglTexture2D(gl, resources.textures[GameModel.laser.texture], textureOptions)

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
            GameModel.sun.mesh = GLIB.MakeSGLMesh(gl, sphereMesh);//new SglMeshGL(gl);
            GameModel.sun.texture = new SglTexture2D(gl,
                    resources.textures[GameModel.sun.texture], textureOptions);
            for(var id in GameModel.planets) {
                var planet = GameModel.planets[id];
                planet.mesh = GLIB.MakeSGLMesh(gl, sphereMesh);
                //Replace texture string with texture object
                planet.texture = new SglTexture2D(gl,
                        resources.textures[planet.texture], textureOptions);
            }

            GameModel.UFOMesh = GLIB.MakeSGLMesh(gl, resources.meshes['ufo.json']);
            
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
            YV.Render(gl, YV.GameModel)
        }

    }, 60.0);
});
