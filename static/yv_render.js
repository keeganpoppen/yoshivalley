if(!YV || YV === undefined) throw "need to load yv.js first!";

(function(){
    /*
     * ...should be something like this
     */

    //function RenderWorld(...){...}

    //function RenderPlanets(...){...}

    function renderParticles(gl, model) {
        gl.disable(gl.DEPTH_TEST)

        model.particles.lasers.map(function(laser) {
            var start_pos = laser.position.add(laser.velocity.neg)
            var vertices = [start_pos.x, start_pos.y, start_pos.z]
            var indices = [0]

            vertices = new Float32Array(vertices)
            indices = new Uint16Array(indices)

        })

        gl.enable(gl.DEPTH_TEST)
    }

    YV.Render = function(gl, model) {
        //renderWorld()
        //renderPlanets()
        renderParticles(gl, model)
    }
})();
