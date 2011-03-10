if(!YV || YV === undefined) throw "need to load yv.js first!";

(function(){
    /*
     * ...should be something like this
     */

    //function RenderWorld(...){...}

    //function RenderPlanets(...){...}

    function renderParticles(gl, model) {
        gl.disable(gl.DEPTH_TEST)
        gl.enable(gl.BLEND)
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE)

        gl.programs.laser.bind()

        var vertex_loc = gl.getAttributeLocation("a_position")

        model.particles.lasers.map(function(laser) {
            var start_pos = laser.position.add(laser.velocity.neg)
            var vertices = [start_pos.x, start_pos.y, start_pos.z]

            vertices = new Float32Array(vertices)

            var vert_buffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, vert_buffer)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
            
            gl.drawArrays(gl.POINTS, 0, vertices.length)
        })

        gl.programs.laser.unbind()

        gl.disable(gl.BLEND)
        gl.enable(gl.DEPTH_TEST)
    }

    YV.Render = function(gl, model) {
        //renderWorld()
        //renderPlanets()
        renderParticles(gl, model)
    }
})();
