if(!YV || YV === undefined) throw "need to load yv.js first!";

(function(){

    var accumulator = 0.0

    //rotate the planets appropriately
    function updatePlanets(model, dt) {
        $.each(model.planets, function(planet_id, planet) {
            planet.rotation += planet.rotationalVelocity * dt;
            planet.orbitAngle += YV.Constants.planets.orbitVelocity
                    * dt / Math.pow(planet.orbitRadius, 2);
        });
        model.sun.rotation += model.sun.rotationalVelocity * dt;
    }

    function checkForIntersection(collection1, collection2, callback) {
        $.each(collection1, function(player_id, player) {
            var playerPos = player.position;
            $.each(collection2, function(planet_id, planet) {
                var distanceVec = playerPos.sub(planet.position);
                var distance = distanceVec.length; 
                var playerRadius = (player.radius ? player.radius - 
                                    YV.Constants.ufo.collisionEpsilon : 0.0);
                if(distance < planet.radius + playerRadius) {
                    callback(player_id, planet_id);
                }
            });
        });
    }

    function checkForPlanetaryIntersection(collection, model, callback) {
        var planetaryObjects = model.planets.slice(0);
        planetaryObjects.push(model.sun);
        checkForIntersection(collection, planetaryObjects, callback);
    }

    function updatePlayerPositions(model){
        //TODO: GROSS
        var particle_hack = model.planets.slice(0)
        particle_hack.push(model.sun)

        GLIB.Solver.StepTime(model.players, true, particle_hack, model.players)
        $.each(model.players, function(player_id, player) {
            player.invulnerable -= GLIB.Solver.TimeStep;
        });

        checkForPlanetaryIntersection(model.players, model, function(player_id, planet_id) {
            var player = model.players[player_id];
            player.lives--;
            YV.AddExplosion(player.position);
            YV.Respawn(player_id, player);
        });
    }

    //a somewhat poorly-named function, it should be said
    function updateProjectiles(model) {
        //update lasers
        var lasers = model.particles.lasers
        GLIB.Solver.StepTime(lasers)

        var toremove = [];
        $.each(lasers, function(laser_id, laser) {
            laser.age += GLIB.Solver.TimeStep;    
            if(laser.age > YV.Constants.laser.maxAge) {
                toremove.push(laser_id);
            }
        });

        checkForPlanetaryIntersection(lasers, model, function(laser_id, planet_id) {
            toremove.push(laser_id);
        });

        //Check for intersections with ufo's, hits if you will - grammar wtf? love, keegan
        checkForIntersection(lasers, model.players, function(laser_id, player_id) {
            if(player_id != lasers[laser_id].shooter_id) {
                //var shooter = model.players[lasers[laser_id].shooter_id];
                var sunk = model.players[player_id];
                if(sunk.invulnerable <= 0) {
                    sunk.lives--;
                    YV.AddExplosion(sunk.position);
                    YV.Respawn(player_id, sunk);
                }
                toremove.push(laser_id);
            }
        });

        //remove lasers that are now irrelevant for whatever reason
        var tokeep = [];
        $.each(lasers, function(laser_id, laser) {
            if($.inArray(laser_id, toremove) < 0) {
                tokeep.push(laser);
            }
        });

        model.particles.lasers = tokeep;
    }

    function updateExplosions(model, dt) {
        var explosions = model.particles.explosions
        var tokeep = [];
        explosions.map(function(explosion) {
            /* this should help... :)
            GLIB.Solver.StepTime(explosion.particles)
            explosion.particles.map(function(particle) {
                particle.age += GLIB.Solver.TimeStep
            })
            explosion.age += GLIB.Solver.TimeStep;
            */
            explosion.age += dt 
            if(explosion.age < explosion.lifetime) {
                tokeep.push(explosion);
            }
        })
        model.particles.explosions = tokeep;
    }

    YV.Update = function(dt, model) {
        //immune from accumulator
        updatePlanets(model, dt)
        updateExplosions(model, dt)

        for(accumulator += dt; accumulator > GLIB.Solver.TimeStep;
                                accumulator -= GLIB.Solver.TimeStep) {
            updatePlayerPositions(model)
            updateProjectiles(model)
        }
    }

})();
