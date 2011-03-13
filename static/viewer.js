GLIB.FireWhenReady(YV.Resources, function(resources) {
    var last_frame_time = Date.now()
    var last_fps_print = Date.now()
    var fps_cum = 0.
    var fps_num = 0

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
            gl.programs.ring = GLIB.compileProgram(gl, resources, 'ring');
            gl.programs.saturn = GLIB.compileProgram(gl, resources, 'saturn');

            //Create Meshes 
            var textureOptions = {
                    generateMipmap: true,
                    flipY: false,
                    minFilter: gl.LINEAR_MIPMAP_LINEAR,
            };

            //set up laser texture
            GameModel.laser.texture = new SglTexture2D(gl, resources.textures[GameModel.laser.texture], textureOptions)
            
            //set up explosion texture
            GameModel.explosion.texture = new SglTexture2D(gl, resources.textures[GameModel.explosion.texture], textureOptions)

            //set up ring texture
            GameModel.ufo.ring_texture = new SglTexture2D(gl, resources.textures[GameModel.ufo.ring_texture], textureOptions)
            
            //metal texture
            GameModel.ufo.metal = new SglTexture2D(gl, resources.textures[GameModel.ufo.metal], textureOptions)

            GameModel.background.mesh = GLIB.MakeSGLMesh(gl, {
                vertices: new Float32Array([-1.0, -1.0, 0.0,
                                             1.0, -1.0, 0.0,
                                             1.0, 1.0, 0.0,
                                            -1.0, 1.0, 0.0]),
                indices: new Uint16Array([0,1,2,2,3,0])
            });

            GameModel.background.texture = new SglTexture2D(gl,
                    resources.textures[GameModel.background.texture], textureOptions);

            var sphereMesh = GLIB.MakeSphere(1,
                    YV.Constants.planetSphereDensity, YV.Constants.planetSphereDensity);
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
                if(planet.ringTexture) {
                    console.log(resources.textures[planet.ringTexture]);
                    planet.ringTexture = new SglTexture2D(gl,
                        resources.textures[planet.ringTexture], textureOptions);   
                    planet.ringTextureAlpha = new SglTexture2D(gl,
                        resources.textures[planet.ringTextureAlpha], textureOptions);   
                    planet.mesh = GLIB.MakeSaturnSGLMesh(gl);
                }
            }

            //GameModel.UFOMesh = GLIB.MakeSGLMesh(gl, resources.meshes['ufo.json']);
            var sphereMeshWithNormals = GLIB.MakeSphere(1,
                    YV.Constants.planetSphereDensity, YV.Constants.planetSphereDensity, true);
            var SGLMeshWithNormals = GLIB.MakeSGLMesh(gl, sphereMeshWithNormals); 
            GameModel.ufo.mesh = SGLMeshWithNormals;
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
            
            //Draw fps
            var cur_time = Date.now()
            var fps = 1000. / (cur_time - last_frame_time)
            fps = Math.round(fps * 10) / 10
            fps_cum += fps
            ++fps_num
            if(cur_time > (last_fps_print - 1000)) {
                var fps = fps_cum / fps_num
                fps_cum = fps_num = 0
                $('#framerate').html(fps + 'fps')
                last_fps_print = cur_time
            }
            last_frame_time = cur_time

            YV.Render(gl, YV.GameModel)
        }

    }, YV.Constants.maxFrameRate);
});
