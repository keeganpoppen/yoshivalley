if(!YV || YV === undefined) throw "need to load yv.js first!";

(function(){
    function setCamera(gl, camera, sun) {
        var w = gl.ui.width;
        var h = gl.ui.height;

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
    }

    function renderBackground(gl, background) {
        gl.disable(gl.DEPTH_TEST);
        sglRenderMeshGLPrimitives(background.mesh, "index", gl.programs[background.program], null,
            {
                repeat : background.repeat,
                aspectRatio : gl.ui.width / gl.ui.height,
            },
            {   backgroundTexture : background.texture }, 0, 6);
        gl.enable(gl.DEPTH_TEST);
    }

    function renderSun(gl, sun) {
        gl.xform.model.loadIdentity();
        gl.xform.model.translate(sun.position.x, sun.position.y, sun.position.z);
        gl.xform.model.rotate(sglDegToRad(sun.rotation), 0.0, 1.0, 0.0);
        gl.xform.model.scale(sun.radius, sun.radius, sun.radius);
        sglRenderMeshGLPrimitives(sun.mesh, "index", gl.programs.sun, null,
        /*Uniforms*/ {
                        ModelViewProjectionMatrix : gl.xform.modelViewProjectionMatrix,
                     },
        /*Samplers*/ {surfaceTexture : sun.texture});
    }

    function renderPlanet(gl, sun, planet) {
        gl.xform.model.loadIdentity();
        var planPos = planet.position;
        gl.xform.model.translate(planPos.x, planPos.y, planPos.z);
        gl.xform.model.rotate(sglDegToRad(planet.tilt), 1.0, 0.0, 0.0);
        gl.xform.model.rotate(sglDegToRad(planet.rotation), 0.0, 1.0, 0.0);
        gl.xform.model.scale(planet.radius, planet.radius, planet.radius);

        sglRenderMeshGLPrimitives(planet.mesh, "index", gl.programs.planet, null,
        /*Uniforms*/ {
                        ModelMatrix : gl.xform.modelMatrix,
                        ModelViewProjectionMatrix : gl.xform.modelViewProjectionMatrix,
                        planetCenter : [planPos.x, planPos.y, planPos.z],
                        sunCenter : [sun.position.x, sun.position.y, sun.position.z]
                     },
        /*Samplers*/ {surfaceTexture : planet.texture});
    }

    function renderPlanets(gl, model) {
        renderSun(gl, model.sun)
        for(var planet in model.planets) {
            renderPlanet(gl, model.sun, model.planets[planet]);
        }
    }

    function renderUFOs(gl, model) {
        model.players.map(function(player) {
            var pos = player.position;
            gl.xform.model.loadIdentity();
            //gl.xform.model.translate(pos.x, pos.y, pos.z);
            gl.xform.model.scale(player.radius, player.radius, player.radius);

            var sunpos = model.sun.position;
            sglRenderMeshGLPrimitives(model.UFOMesh, "index", gl.programs.ufo, null,
                {
                    ModelViewProjectionMatrix : gl.xform.modelViewProjectionMatrix,
                    ModelMatrix : gl.xform.modelMatrix,
                    NormalMatrix : gl.xform.viewSpaceNormalMatrix,
                    sunCenter : [sunpos.x, sunpos.y, sunpos.z]
                },
            {});
        });
    }

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
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        setCamera(gl, model.camera, model.sun);
        renderBackground(gl, model.background);
        renderPlanets(gl, model);
        renderUFOs(gl, model);
        renderParticles(gl, model);

        gl.disable(gl.DEPTH_TEST);
    }
})();
