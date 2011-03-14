if(!YV || YV === undefined) throw "need to load yv.js first!";

(function(){
    function setCamera(gl, camera) {
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
                             0.0,0.0,0.0,
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

    function renderPlanet(gl, planet) {
        gl.xform.model.loadIdentity();
        var planPos = planet.position;
        gl.xform.model.translate(planPos.x, planPos.y, planPos.z);
        gl.xform.model.rotate(sglDegToRad(planet.tilt), 1.0, 0.0, 0.0);
        gl.xform.model.rotate(sglDegToRad(planet.rotation), 0.0, 1.0, 0.0);
        gl.xform.model.scale(planet.radius, planet.radius, planet.radius);

        var uniforms = {
            ModelMatrix : gl.xform.modelMatrix,
            ModelViewProjectionMatrix : gl.xform.modelViewProjectionMatrix,
            planetCenter : [planPos.x, planPos.y, planPos.z],
            sunCenter : [0.0, 0.0, 0.0],
        };

        var textures = {
            surfaceTexture: planet.texture,
        };

        if(planet.ringTexture) {
            $.extend(textures, {ringTexture: planet.ringTexture,
                                ringAlphaTexture: planet.ringTextureAlpha});
            gl.enable(gl.BLEND)
            gl.blendFunc(gl.SRC_ALPHA, gl.ONE)
        } else if(planet.textureNight) {
            var cameraVec = YV.GetCamera().position;
            var cameraPos = [cameraVec.x, cameraVec.y, cameraVec.z];            
            $.extend(textures, {nightTexture: planet.textureNight,
                                spectralTexture: planet.textureSpectral});
            $.extend(uniforms, {ViewMatrix: gl.xform.viewMatrix,
                                cameraPosition: cameraPos});
        }

        sglRenderMeshGLPrimitives(planet.mesh, "index", gl.programs[planet.program], null,
                uniforms, textures);
                
        gl.disable(gl.BLEND)
    }

    function renderPlanets(gl, model) {
        YV.OverPlanets(function(planet_id, planet) {
            renderPlanet(gl, planet);
        });
    }

    function renderUFOs(gl, ufo) {
        YV.OverPlayers(function(player_id, player) {
            if(player.invulnerable > 0.0 && player.invulnerable %
                    YV.Constants.ufo.blinkPeriod < YV.Constants.ufo.blinkPeriod
                    * YV.Constants.ufo.blinkOffPercent)
                return;

            var pos = player.position;

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

            var cameraVec = YV.GetCamera().position;
            var cameraPos = [cameraVec.x, cameraVec.y, cameraVec.z];            
            sglRenderMeshGLPrimitives(ufo.mesh, "index", gl.programs.ufo, null,
                {
                    ViewProjectionMatrix : gl.xform.viewProjectionMatrix,
                    ModelMatrix : gl.xform.modelMatrix,
                    NormalMatrix : gl.xform.worldSpaceNormalMatrix,
                    sunCenter : [0.0, 0.0, 0.0],
                    cameraPosition: cameraPos,
                    color : player.color,
                    halfSphere : false,
                    shininess: YV.Constants.ufo.shininess,
                },
                {
                    metalTexture: ufo.metal,
                }
            );
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
            }, 'ring')

            var NUM_RING_PARTICLES = 10. //TODO: MOVE

            gl.uniformMatrix4fv(loc_obj.uniforms.ModelViewProjectionMatrix, false,
                                    new Float32Array(gl.xform.viewProjectionMatrix));
            gl.uniform1f(loc_obj.uniforms.ringRadius, YV.Constants.ufo.ringRadius)
            gl.uniform1f(loc_obj.uniforms.numRingParticles, NUM_RING_PARTICLES)
            gl.uniform1f(loc_obj.uniforms.cannonAngle, player.cannon_angle)
            gl.uniform3f(loc_obj.uniforms.color, player.color[0], player.color[1], player.color[2]);

            gl.activeTexture(gl.TEXTURE0)
            ufo.ring_texture.bind()
            gl.uniform1i(loc_obj.uniforms.ringTex, 0)

            var pos = player.position
            gl.uniform3f(loc_obj.uniforms.ufoCenter, pos.x, pos.y, pos.z)

            var frac_charged = Math.min(1.,
                                    ((Date.now() - player.last_shot) / (1000. * player.recharge_time)))
            gl.uniform1f(loc_obj.uniforms.fracCharged, frac_charged)

            //since vertex positions are computed in the shader, this is just an array [1..NUM_RING_PARTICLES]
            var indices = []
            for(var i = 0; i < NUM_RING_PARTICLES; ++i) indices.push(i)
                        
            if(ufo.index_buffer === undefined) ufo.index_buffer = gl.createBuffer()
            var index_buffer = ufo.index_buffer

            gl.bindBuffer(gl.ARRAY_BUFFER, index_buffer)
            gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(indices), gl.STATIC_DRAW)
            gl.vertexAttribPointer(loc_obj.attributes.index, 1, gl.FLOAT, false, 0, 0)

            gl.drawArrays(gl.POINTS, 0, indices.length)

            gl.xform.model.pop()

            disableParticleRendering(gl)

            //Render Dome
            gl.xform.model.push();
            gl.xform.model.scale(YV.Constants.ufo.domeRadFrac * player.radius,
                    YV.Constants.ufo.domeRadFrac * player.radius,
                    YV.Constants.ufo.domeRadFrac * player.radius);
            sglRenderMeshGLPrimitives(ufo.mesh, "index", gl.programs.ufo, null,
                {
                    ViewProjectionMatrix : gl.xform.viewProjectionMatrix,
                    cameraPosition: cameraPos,
                    ModelMatrix : gl.xform.modelMatrix,
                    NormalMatrix : gl.xform.worldSpaceNormalMatrix,
                    sunCenter : [0.0, 0.0, 0.0],
                    color : [0.8, 0.8, 0.8],
                    halfSphere : true,
                    shininess: YV.Constants.ufo.shininess,
                },
            {});
            gl.xform.model.pop();
        });
    }

    function renderLasers(gl, laser, data) {
        //only ever create one laser buffer
        if(laser.buffer === undefined) laser.buffer = gl.createBuffer()

        //set laser texture
        gl.activeTexture(gl.TEXTURE0)
        laser.texture.bind()
        gl.uniform1i(data.tex_loc, 0)

        //lasers don't age, of course
        gl.uniform1i(data.does_age_loc, 0);
        gl.uniform1f(data.particle_size_loc, YV.Constants.laser.particleSize);

        var vertices = []

        //render all the lasers
        YV.OverLasers(function(laser_id, laserObj) {
            var len_vec = laserObj.velocity.normalized.mul(new SglVec3(laser.length))
            var start_pos = laserObj.position.add(len_vec.mul(new SglVec3(0.5)).neg)
            var iter_vec = len_vec.mul(new SglVec3(1./laser.numParticles))

            for(var i = 0; i < laser.numParticles; ++i) {
                var pos = start_pos.add(iter_vec.mul(new SglVec3(i)))
                vertices.push(pos.x, pos.y, pos.z)
            }
        });

        var vert_buffer = laser.buffer
        gl.bindBuffer(gl.ARRAY_BUFFER, vert_buffer)
        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW)
        gl.vertexAttribPointer(data.vertex_loc, 3, gl.FLOAT, false, 0, 0)
        
        gl.drawArrays(gl.POINTS, 0, vertices.length/3)

        laser.texture.unbind()
    }

    function renderExplosions(gl, explosion) {
        //short circuit on no explosions
        var exp = false;
        YV.OverExplosions(function(explosion_id, explosion) {
            exp = true;
        });
        if(!exp) return;

        gl.xform.model.push()

        enableParticleRendering(gl)

        var prog = gl.programs.explosion.handle
        gl.programs.explosion.bind()

        var loc_obj = getShaderVarLocations(gl, prog, {
            uniforms: ['ModelViewProjectionMatrix', 'particleSize', 'particleAge', 'lifetime', 'origin', 'explosionTex'],
            attributes: ['particleDirection', 'maxDist']
        }, 'explosion')

        gl.uniformMatrix4fv(loc_obj.uniforms.ModelViewProjectionMatrix, false,
                                    new Float32Array(gl.xform.viewProjectionMatrix))
        gl.uniform1f(loc_obj.uniforms.particleSize, YV.Constants.explosion.particleSize)
        gl.uniform1f(loc_obj.uniforms.lifetime, YV.Constants.explosion.lifetime)

        //set explosion / fire texture
        explosion.texture.bind(0);
        gl.uniform1i(loc_obj.uniforms.explosionTex, 0)

        //set the vertices, as they are constant for all explosions
        if(explosion.vert_buffer === undefined) {
            explosion.vert_buffer = gl.createBuffer()
            gl.bindBuffer(gl.ARRAY_BUFFER, explosion.vert_buffer)
            gl.bufferData(gl.ARRAY_BUFFER, explosion.verts, gl.STATIC_DRAW)
        } else {
            gl.bindBuffer(gl.ARRAY_BUFFER, explosion.vert_buffer)
        }
        gl.vertexAttribPointer(loc_obj.attributes.particleDirection, 3, gl.FLOAT, false, 0, 0)

        YV.OverExplosions(function(explosion_id, explosionObj) {
            //set particleAge
            gl.uniform1f(loc_obj.uniforms.particleAge, explosionObj.age)

            //set the center / origin of the explosion
            var origin = explosionObj.position
            gl.uniform3f(loc_obj.uniforms.origin, origin.x, origin.y, origin.z)

            //set the maxDist attribute
            if(explosion.dist_buffer === undefined) explosion.dist_buffer = gl.createBuffer()
            var dist_buffer = explosion.dist_buffer

            gl.bindBuffer(gl.ARRAY_BUFFER, dist_buffer)
            gl.bufferData(gl.ARRAY_BUFFER, explosionObj.distances, gl.STATIC_DRAW)
            gl.vertexAttribPointer(loc_obj.attributes.maxDist, 1, gl.FLOAT, false, 0, 0)

            gl.drawArrays(gl.POINTS, 0, explosionObj.distances.length)
        })

        gl.xform.model.pop()

        disableParticleRendering(gl)
    }

    function enableParticleRendering(gl){
        gl.disable(gl.DEPTH_TEST)
        gl.enable(gl.BLEND)

        gl.blendFunc(gl.SRC_ALPHA, gl.ONE)

        //dumb hack to get point sprites working
        gl.enable(0x8642)
    }

    function disableParticleRendering(gl) {
        gl.disable(0x8642)
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

    var shader_map = {}
    function getShaderVarLocations(gl, shader, obj, hash_name) {
        if(!hash_name || hash_name === undefined) throw "sorry for the hack-- give a hash name"
        if(!shader || shader === undefined) throw "shader undefined... what are you trying to pull?"
        if(!obj || obj === undefined) throw "no object? you're an idiot"

        if(hash_name in shader_map) return shader_map[hash_name]

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

        shader_map[hash_name] = ret

        return ret
    }

    function renderParticles(gl) {
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

        renderLasers(gl, YV.GetLaserData(), fn_data);
        //renderExplosions(gl, , fn_data);

        gl.programs.particle.unbind()
        disableParticleRendering(gl)
    }

    YV.Render = function(gl) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT | gl.STENCIL_BUFFER_BIT);
        gl.enable(gl.DEPTH_TEST);

        setCamera(gl, YV.GetCamera());
        renderBackground(gl, YV.GetBackground());
        renderPlanets(gl);
        renderUFOs(gl, YV.GetUFOData());

        renderParticles(gl);
        renderExplosions(gl, YV.GetExplosionData());
        gl.disable(gl.DEPTH_TEST);
    }
})();
