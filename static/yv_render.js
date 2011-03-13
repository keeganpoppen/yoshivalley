if(!YV || YV === undefined) throw "need to load yv.js first!";

(function(){
    function setCamera(gl, camera, sun) {
        var w = gl.canvas.width;
        var h = gl.canvas.height;

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
            if(player.invulnerable > 0.0 && player.invulnerable %
                    YV.Constants.ufo.blinkPeriod < YV.Constants.ufo.blinkPeriod
                    * YV.Constants.ufo.blinkOffPercent)
                return;
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
            gl.xform.model.scale(player.radius, YV.Constants.ufo.diskSquishFrac*
                    player.radius, player.radius);
            sglRenderMeshGLPrimitives(model.ufo.mesh, "index", gl.programs.ufo, null,
                {
                    ViewMatrix : gl.xform.viewMatrix,
                    ProjectionMatrix : gl.xform.projectionMatrix,
                    ModelMatrix : gl.xform.modelMatrix,
                    NormalMatrix : gl.xform.worldSpaceNormalMatrix,
                    sunCenter : [sunpos.x, sunpos.y, sunpos.z],
                    color : player.color,
                    halfSphere : false,
                    shininess: YV.Constants.ufo.shininess,
                },
            {});
            gl.xform.model.pop();

            //render laser timer ring thing
            gl.xform.model.push()

            enableParticleRendering(gl)

            var prog = gl.programs.ring.handle
            gl.programs.ring.bind()

            var loc_obj = getShaderVarLocations(gl, prog, {
                uniforms: ['ModelViewProjectionMatrix', 'ufoCenter', 'fracCharged',
                           'ringRadius', 'numRingParticles', 'cannonAngle', 'ringTex',
                           'color'],
                attributes: ['index']
            })

            var NUM_RING_PARTICLES = 10. //TODO: MOVE

            gl.uniformMatrix4fv(loc_obj.uniforms.ModelViewProjectionMatrix, false,
                                    new Float32Array(gl.xform.viewProjectionMatrix));
            gl.uniform1f(loc_obj.uniforms.ringRadius, YV.Constants.ufo.ringRadius)
            gl.uniform1f(loc_obj.uniforms.numRingParticles, NUM_RING_PARTICLES)
            gl.uniform1f(loc_obj.uniforms.cannonAngle, player.cannon_angle)
            gl.uniform3f(loc_obj.uniforms.color, player.color[0], player.color[1], player.color[2]);

            gl.activeTexture(gl.TEXTURE0)
            model.ufo.ring_texture.bind()
            gl.uniform1i(loc_obj.uniforms.ringTex, 0)

            var pos = player.position
            gl.uniform3f(loc_obj.uniforms.ufoCenter, pos.x, pos.y, pos.z)

            var frac_charged = Math.min(1.,
                                    ((Date.now() - player.last_shot) / (1000. * player.recharge_time)))
            gl.uniform1f(loc_obj.uniforms.fracCharged, frac_charged)

            //since vertex positions are computed in the shader, this is just an array [1..NUM_RING_PARTICLES]
            var indices = []
            for(var i = 0; i < NUM_RING_PARTICLES; ++i) indices.push(i)
                        
            if(model.ufo.index_buffer === undefined) model.ufo.index_buffer = gl.createBuffer()
            var index_buffer = model.ufo.index_buffer

            gl.bindBuffer(gl.ARRAY_BUFFER, index_buffer)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW)
            gl.vertexAttribPointer(loc_obj.attributes.index, 1, gl.FLOAT, false, 0, 0)

            gl.drawArrays(gl.POINTS, 0, indices.length)

            disableParticleRendering(gl)

            //Render Dome
            gl.xform.model.push();
            gl.xform.model.scale(YV.Constants.ufo.domeRadFrac * player.radius,
                    YV.Constants.ufo.domeRadFrac * player.radius,
                    YV.Constants.ufo.domeRadFrac * player.radius);
            sglRenderMeshGLPrimitives(model.ufo.mesh, "index", gl.programs.ufo, null,
                {
                    ViewMatrix : gl.xform.viewMatrix,
                    ProjectionMatrix : gl.xform.projectionMatrix,
                    ModelMatrix : gl.xform.modelMatrix,
                    NormalMatrix : gl.xform.worldSpaceNormalMatrix,
                    sunCenter : [sunpos.x, sunpos.y, sunpos.z],
                    color : [0.8, 0.8, 0.8],
                    halfSphere : true,
                    shininess: YV.Constants.ufo.shininess,
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
        gl.uniform1f(data.particle_size_loc, YV.Constants.laser.particleSize);

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
        gl.uniform1f(data.particle_size_loc, YV.Constants.explosion.particleSize);

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

    function enableParticleRendering(gl){
        gl.disable(gl.DEPTH_TEST)
        gl.enable(gl.BLEND)

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE)

        //dumb hack to get point sprites working
        gl.enable(0x8642)
    }

    function disableParticleRendering(gl) {
        gl.disable(gl.BLEND)
        gl.enable(gl.DEPTH_TEST)
    }

    /*
     * takes in: {
     *  uniforms: []
     *  attributes: []
     * }, and returns: {
     *  uniforms: {name: loc, }
     *  attributes: {name:loc, }
     * }
     */
    function getShaderVarLocations(gl, shader, obj) {
        if(!shader || shader === undefined) throw "shader undefined... what are you trying to pull?"
        if(!obj || obj === undefined) throw "no object? you're an idiot"

        var ret = {}

        ret.uniforms = {}
        if(obj.uniforms != undefined) {
            obj.uniforms.map(function(uniform) {
                var loc = gl.getUniformLocation(shader, uniform)
                if(loc == -1) throw "bad uniform name: " + uniform

                ret.uniforms[uniform] = loc
            })
        }

        ret.attributes = {}
        if(obj.attributes != undefined) {
            obj.attributes.map(function(attrib) {
                var loc = gl.getAttribLocation(shader, attrib)
                if(loc == -1) throw "bad attribute name: " + attrib

                ret.attributes[attrib] = loc
            })
        }

        return ret
    }

    function renderParticles(gl, model, particle_fns) {
        enableParticleRendering(gl)

        var prog = gl.programs.particle.handle
        gl.programs.particle.bind()

        //locations for uniforms & attribs set per particle_fn
        var fn_data = {}

        //set modelviewprojection matrix
        var modelview_loc = gl.getUniformLocation(prog, "ModelViewProjectionMatrix")
        gl.uniformMatrix4fv(modelview_loc, false, new Float32Array(gl.xform.viewProjectionMatrix));

        var particle_size_loc = gl.getUniformLocation(prog, "particleSize");
        gl.uniform1f(particle_size_loc, 1.0);
        fn_data.particle_size_loc = particle_size_loc;

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

        disableParticleRendering(gl)
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
