if(!YV || YV === undefined) throw "need to load yv.js first!";

(function(){
    function setCamera(gl, camera, sun) {
        var w = gl.ui.width;
        var h = gl.ui.height;

        gl.viewport(0, 0, w, h);
        gl.xform.projection.loadIdentity();
        gl.xform.projection.perspective(sglDegToRad(camera.fov), w/h,
                camera.near, camera.far);
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
        $.each(model.players, function(player_id, player) {
            var pos = player.position;
            var sunpos = model.sun.position;

            gl.xform.model.loadIdentity();
            gl.xform.model.translate(pos.x, pos.y, pos.z);

            //Angle the ufo in the direction of the thrust
            if(player.velocity.length > 0.0) {
                var from = new SglVec3(0.0, 1.0, 0.0);
                var to = player.velocity.normalized;
                var perp = from.cross(to);
                var max_velocity = 75; //TODO set this to a rational defined value
                var angle = Math.PI / 2 * (player.velocity.length / max_velocity);
                gl.xform.model.rotate(angle, perp.x, perp.y, perp.z);
            }

            //Render Disk
            gl.xform.model.push();
            gl.xform.model.scale(player.radius, 0.3 * player.radius, player.radius);
            sglRenderMeshGLPrimitives(model.UFOMesh, "index", gl.programs.ufo, null,
                {
                    ViewProjectionMatrix : gl.xform.viewProjectionMatrix,
                    ModelMatrix : gl.xform.modelMatrix,
                    NormalMatrix : gl.xform.worldSpaceNormalMatrix,
                    sunCenter : [sunpos.x, sunpos.y, sunpos.z],
                    color : [1.0, 1.0, 0.0],
                    halfSphere : false
                },
            {});
            gl.xform.model.pop();

            //Render Dome
            gl.xform.model.push();
            gl.xform.model.scale(0.6 * player.radius, 0.6 * player.radius,
                    0.6 *player.radius);
            sglRenderMeshGLPrimitives(model.UFOMesh, "index", gl.programs.ufo, null,
                {
                    ViewProjectionMatrix : gl.xform.viewProjectionMatrix,
                    ModelMatrix : gl.xform.modelMatrix,
                    NormalMatrix : gl.xform.worldSpaceNormalMatrix,
                    sunCenter : [sunpos.x, sunpos.y, sunpos.z],
                    color : [0.0, 1.0, 1.0],
                    halfSphere : true
                },
            {});
            gl.xform.model.pop();
        });
    }

    function renderLasers(gl, model, vertex_loc, tex_loc, age_frac_loc, does_age_loc) {
        //set laser texture
        gl.activeTexture(gl.TEXTURE0)
        model.laser.texture.bind()
        gl.uniform1i(tex_loc, 0)

        //lasers don't age, of course
        gl.uniform1i(does_age_loc, 0);

        var vertices = []

        //render all the lasers
        model.particles.lasers.map(function(laser) {
            var len_vec = laser.velocity.normalized.mul(new SglVec3(model.laser.length))
            var start_pos = laser.position.add(len_vec.mul(new SglVec3(0.5)).neg)
            var iter_vec = len_vec.mul(new SglVec3(1./model.laser.numParticles))

            for(var i = 0; i < model.laser.numParticles; ++i) {
                var pos = start_pos.add(iter_vec.mul(new SglVec3(i)))
                vertices.push(pos.x, pos.y, pos.z)
            }
        })

        var vert_buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, vert_buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
        gl.vertexAttribPointer(vertex_loc, 3, gl.FLOAT, false, 0, 0)
        
        gl.drawArrays(gl.POINTS, 0, vertices.length/3)

        model.laser.texture.unbind()
    }

    function renderExplosions(gl, model, vertex_loc, tex_loc, age_frac_loc, does_age_loc) {
        //set explosion / fire texture
        gl.activeTexture(gl.TEXTURE0)
        model.explosion.texture.bind()
        gl.uniform1i(tex_loc, 0)

        //fire ages, fo' sho'
        gl.uniform1i(does_age_loc, 1);

        var vertices = []
        var age_fracs = []
        //var ages = []
        //var lifetimes = []

        model.particles.explosions.map(function(explosion) {
            explosion.particles.map(function(particle) {
                var pos = particle.position
                vertices.push(pos.x, pos.y, pos.z)
                age_fracs.push(particle.age/particle.lifetime)
                //ages.push(particle.age)
                //lifetimes.push(particle.lifetime)
            })
        })

        var vert_buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, vert_buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
        gl.vertexAttribPointer(vertex_loc, 3, gl.FLOAT, false, 0, 0)

        var age_frac_buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, age_frac_buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(age_fracs), gl.STATIC_DRAW)
        gl.vertexAttribPointer(age_frac_loc, 1, gl.FLOAT, false, 0, 0)

        /* CHROME BUG... FUCKERS!!!!!
        var lifetime_buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, lifetime_buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(lifetimes), gl.STATIC_DRAW)
        gl.vertexAttribPointer(lifetime_loc, 1, gl.FLOAT, false, 0, 0)

        var age_buffer = gl.createBuffer()
        gl.bindBuffer(gl.ARRAY_BUFFER, age_buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(ages), gl.STATIC_DRAW)
        gl.vertexAttribPointer(age_loc, 1, gl.FLOAT, false, 0, 0)
        */
        
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

        //get attrib locations for particle age & uniform for whether age effects alpha
        //var lifetime_loc = gl.getAttribLocation(prog, "a_lifetime")
        //var age_loc = gl.getAttribLocation(prog, "a_age")
        var age_frac_loc = gl.getAttribLocation(prog, "a_age_frac")
        var does_age_loc = gl.getUniformLocation(prog, "does_age")

        renderLasers(gl, model, vertex_loc, tex_loc, age_frac_loc, does_age_loc)
        renderExplosions(gl, model, vertex_loc, tex_loc, age_frac_loc, does_age_loc)

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
        renderPlanets(gl, model);
        renderUFOs(gl, model);
        renderParticles(gl, model);

        gl.disable(gl.DEPTH_TEST);
    }
})();
