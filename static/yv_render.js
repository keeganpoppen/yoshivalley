if(!YV || YV === undefined) throw "need to load yv.js first!";

(function(){
    var setCamera = function(gl, camera, sun) {
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
    };

    var renderBackground = function(gl, background) {
        gl.disable(gl.DEPTH_TEST);
        sglRenderMeshGLPrimitives(background.mesh, "index", gl.programs[background.program], null,
            {
                repeat : background.repeat,
                aspectRatio : gl.ui.width / gl.ui.height,
            },
            {   backgroundTexture : background.texture }, 0, 6);
        gl.enable(gl.DEPTH_TEST);
    };

    var renderSun = function(gl, sun) {
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

    var renderPlanet = function(gl, sun, planet) {
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
    };

    var renderPlanets = function(gl, model) {
        renderSun(gl, model.sun)
        for(var planet in model.planets) {
            renderPlanet(gl, model.sun, model.planets[planet]);
        }
    };

    function renderLasers(gl, model, vertex_loc, tex_loc) {
        //set laser texture
        gl.activeTexture(gl.TEXTURE0)
        model.laser.texture.bind()
        gl.uniform1i(tex_loc, 0)

        //render all the lasers
        model.particles.lasers.map(function(laser) {
            var len_vec = laser.velocity.normalized.mul(new SglVec3(model.laser.length))
            var start_pos = laser.position.add(len_vec.mul(new SglVec3(0.5)).neg)
            var iter_vec = len_vec.mul(new SglVec3(1./model.laser.numParticles))

            var vertices = []

            for(var i = 0; i < model.laser.numParticles; ++i) {
                var pos = start_pos.add(iter_vec.mul(new SglVec3(i)))
                vertices.push(pos.x, pos.y, pos.z)
            }

            var vert_buffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, vert_buffer)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
            gl.vertexAttribPointer(vertex_loc, 3, gl.FLOAT, false, 0, 0)
            
            gl.drawArrays(gl.POINTS, 0, vertices.length/3)
        })

        model.laser.texture.unbind()
    }

    function renderExplosions(gl, model, vertex_loc, tex_loc) {
        //set laser texture
        gl.activeTexture(gl.TEXTURE0)
        model.explosion.texture.bind()
        gl.uniform1i(tex_loc, 0)

        var vertices = []

        model.particles.explosions.map(function(explosion) {
            explosion.particles.map(function(particle) {
                var pos = particle.position
                vertices.push(pos.x, pos.y, pos.z)
            })
        })

        if(window.PENIS) {
            console.log(vertices)
        }

        var vert_buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, vert_buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
        gl.vertexAttribPointer(vertex_loc, 3, gl.FLOAT, false, 0, 0)
        
        gl.drawArrays(gl.POINTS, 0, vertices.length/3)

        model.explosion.texture.unbind()
    }

    function renderParticles(gl, model) {
        gl.disable(gl.DEPTH_TEST)
        gl.enable(gl.BLEND)

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE)

        //dumb hack to get point sprites working
        gl.enable(0x8642);

        var prog = gl.programs.particle.handle
        gl.programs.particle.bind()

        //set modelviewprojection matrix
        var modelview_loc = gl.getUniformLocation(prog, "ModelViewProjectionMatrix")
        gl.uniformMatrix4fv(modelview_loc, false, new Float32Array(gl.xform.viewProjectionMatrix));

        //get texture location
        var tex_loc = gl.getUniformLocation(prog, "laserTex")

        //get position attribute location
        var vertex_loc = gl.getAttribLocation(prog, "a_position")

        renderLasers(gl, model, vertex_loc, tex_loc)
        renderExplosions(gl, model, vertex_loc, tex_loc)

        gl.programs.particle.unbind()

        gl.disable(gl.BLEND)
        gl.enable(gl.DEPTH_TEST)
    }

    YV.Render = function(gl, model) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        setCamera(gl, model.camera, model.sun);
        renderBackground(gl, model.background);
        renderPlanets(gl, model)
        renderParticles(gl, model)

        gl.disable(gl.DEPTH_TEST);
    }
})();
