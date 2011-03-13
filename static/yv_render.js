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
                gl.xform.model.rotate(-player.controller.yrot/180*Math.PI, 1.0, 0.0, 0.0);
                gl.xform.model.rotate(-player.controller.xrot/180*Math.PI, 0.0, 0.0, 1.0);
            }

            //Render Disk
            gl.xform.model.push();
            gl.xform.model.scale(player.radius, 0.3 * player.radius, player.radius);
            //sglRenderMeshGLPrimitives(model.UFOMesh, "index", gl.programs.ufo, null,
            sglRenderMeshGLPrimitives(model.ufo.mesh, "index", gl.programs.ufo, null,
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

            //render laser timer ring thing
            gl.xform.model.push()

            var ring_radius = player.radius + 2.
            var frac_ready = Math.min(1., ((Date.now() - player.last_shot) / (1000. * player.recharge_time)))

            renderParticles(gl, model, function(gl, model, data) {
                var verts = []
                var age_fracs = []

                for(var i = 0; i < 2. * Math.PI; ++i) {
                    verts.push(player_radius * Math.sin(i), 0., player_radius * Math.cos(i))
                    var active = (i / (2. * Math.PI)) >= frac_ready
                    age_fracs.push(((active)? .5 : .1))
                }
                
                if(model.ufo.vert_buffer === undefined) model.ufo.vert_buffer = gl.createBuffer()
                var vert_buffer = model.ufo.vert_buffer


            })

            gl.xform.model.pop()

            //Render Dome
            gl.xform.model.push();
            gl.xform.model.scale(0.6 * player.radius, 0.6 * player.radius,
                    0.6 *player.radius);
            //sglRenderMeshGLPrimitives(model.UFOMesh, "index", gl.programs.ufo, null,
            sglRenderMeshGLPrimitives(model.ufo.mesh, "index", gl.programs.ufo, null,
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

    function renderLasers(gl, model, data) {
        //only ever create one laser buffer
        if(model.laser.buffer === undefined) model.laser.buffer = gl.createBuffer()

        //set laser texture
        gl.activeTexture(gl.TEXTURE0)
        model.laser.texture.bind()
        gl.uniform1i(data.tex_loc, 0)

        //lasers don't age, of course
        gl.uniform1i(data.does_age_loc, 0);

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

        var vert_buffer = model.laser.buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, vert_buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
        gl.vertexAttribPointer(data.vertex_loc, 3, gl.FLOAT, false, 0, 0)
        
        gl.drawArrays(gl.POINTS, 0, vertices.length/3)

        model.laser.texture.unbind()
    }

    function renderExplosions(gl, model, data) {
        //set explosion / fire texture
        gl.activeTexture(gl.TEXTURE0)
        model.explosion.texture.bind()
        gl.uniform1i(data.tex_loc, 0)

        //fire ages, fo' sho'
        gl.uniform1i(data.does_age_loc, 1);

        var vertices = []
        var age_fracs = []

        model.particles.explosions.map(function(explosion) {
            explosion.particles.map(function(particle) {
                var pos = particle.position
                vertices.push(pos.x, pos.y, pos.z)
                age_fracs.push(particle.age/particle.lifetime)
            })
        })

        if(model.explosion.vert_buffer === undefined) model.explosion.vert_buffer = gl.createBuffer()

        var vert_buffer = model.explosion.vert_buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, vert_buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
        gl.vertexAttribPointer(data.vertex_loc, 3, gl.FLOAT, false, 0, 0)

        if(model.explosion.age_frac_buffer === undefined) model.explosion.age_frac_buffer = gl.createBuffer()

        var age_frac_buffer = model.explosion.age_frac_buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, age_frac_buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(age_fracs), gl.STATIC_DRAW)
        gl.vertexAttribPointer(data.age_frac_loc, 1, gl.FLOAT, false, 0, 0)

        gl.drawArrays(gl.POINTS, 0, vertices.length/3)

        model.explosion.texture.unbind()
    }

    function renderParticles(gl, model, particle_fns) {
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

        //locations for uniforms & attribs set per particle_fn
        var fn_data = {}

        //get texture location
        fn_data.tex_loc = gl.getUniformLocation(prog, "laserTex")

        //get position attribute location
        fn_data.vertex_loc = gl.getAttribLocation(prog, "a_position")

        //get attrib locations for particle age & uniform for whether age effects alpha
        fn_data.age_frac_loc = gl.getAttribLocation(prog, "a_age_frac")

        fn_data.does_age_loc = gl.getUniformLocation(prog, "does_age") 

        if(particle_fns instanceof Array) {
            particle_fns.map(function(fn) {
                fn(gl, model, fn_data)
            })
        } else if(typeof(particle_fns) == "function") {
            particle_fns(gl, model, fn_data)
        }

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

        renderParticles(gl, model, [renderLasers, renderExplosions]);

        gl.disable(gl.DEPTH_TEST);
    }
})();
