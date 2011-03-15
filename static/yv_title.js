if(!YV || YV === undefined) throw "need to load yv.js first!";

(function(){
    function setCamera(gl) {
        var w = gl.canvas.width;
        var h = gl.canvas.height;

        gl.viewport(0, 0, w, h);
        gl.xform.projection.loadIdentity();
        gl.xform.projection.perspective(sglDegToRad(60.0), w/h,
                0.1, 10);
        gl.xform.view.loadIdentity();
        gl.xform.view.translate(0,0,-3);
        gl.xform.view.rotate(sglDegToRad(-70.0), 1.0, 0.0, 0.0);
    }

    var width = 2;
    var length = 4;
    var rate = length / 40;
    var acc = length / 300;
    var pos = -2.0;

    var program;
    var mesh;
    var texture;

    YV.Title = {
        Init : function(gl, resources) {
            var m = {vertices:[], texCoords:[], indices:[]};
            m.vertices.push(-width/2, -length, 0,
                             width/2, -length, 0,
                            -width/2, 0.0, 0,
                             width/2, 0.0, 0);
            m.indices.push(0, 1, 2, 1, 2, 3);
            m.texCoords.push(0.0, 1.0, 1.0, 1.0, 0.0, 0.0, 1.0, 0.0);

            mesh = GLIB.MakeSGLMesh(gl, m);
            program = GLIB.compileProgram(gl, resources.shaders, 'title');
            texture = new SglTexture2D(gl, resources.textures['title.png'], {
                generateMipmap: true,
                flipY: false,
                minFilter: gl.LINEAR_MIPMAP_LINEAR,
            });
        },

        Update : function(dt) {
            pos += rate * dt;
            rate += acc * dt;
            if(pos > 8.0) {
                YV.EnterLobby();
            }
        },

        Render : function(gl, background) {
            setCamera(gl);
            gl.enable(gl.BLEND);
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE_MINUS_SRC_ALPHA);
            background();
            gl.xform.model.loadIdentity();
            gl.xform.model.translate(0, pos, 0);
            sglRenderMeshGLPrimitives(mesh, "index", program, null, {
                ModelViewProjectionMatrix : gl.xform.modelViewProjectionMatrix, 
            }, {uTexture: texture}, 0, 6);
            gl.disable(gl.BLEND);
        }
    }  
})();
