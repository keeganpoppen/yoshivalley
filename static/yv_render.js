if(!YV || YV === undefined) throw "need to load yv.js first!";

(function(){
    /*
     * ...should be something like this
     */

    //function RenderWorld(...){...}

    //function RenderPlanets(...){...}

    function renderParticles(gl, model) {
        gl.disable(gl.DEPTH_TEST)

        gl.enable(gl.DEPTH_TEST)
    }

    YV.Render = function(gl, model) {
        //renderWorld()
        //renderPlanets()
        renderParticles(gl, model)
    }
})();
