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

            GameModel.background.mesh = new SglMeshGL(gl);
            GameModel.background.mesh.addVertexAttribute("position", 3, new Float32Array(
                                                                            [-1.0, -1.0, 0.0,
                                                                             1.0, -1.0, 0.0,
                                                                             1.0, 1.0, 0.0,
                                                                             -1.0, 1.0, 0.0]));
            GameModel.background.mesh.addIndexedPrimitives("index", gl.TRIANGLES,
                                                            new Uint16Array([0, 1, 2, 2, 3, 0]));
            GameModel.background.texture = new SglTexture2D(gl, resources.textures[GameModel.background.texture], textureOptions);

            var sphereMesh = GLIB.MakeSphere(1, 25, 25);
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
            YV.Render(gl, YV.GameModel)
        }

    }, 60.0);
});
