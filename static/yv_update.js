if(!YV || YV === undefined) throw "need to load yv.js first!";

(function(){

    var accumulator = 0.0

    //rotate the planets appropriately
    function updatePlanets(model, dt) {
        for(var planet in model.planets) {
            model.planets[planet].rotation +=
                model.planets[planet].rotationalVelocity * dt;
        }
        model.sun.rotation += model.sun.rotationalVelocity * dt;
    }

    function updatePlayerPositions(model){
        //TODO: GROSS
        var particle_hack = model.planets.slice(0)
        particle_hack.push(model.sun)

        GLIB.Solver.StepTime(model.players, true, particle_hack)

        var planetaryObjects = model.planets.slice(0);
        planetaryObjects.push(model.sun);

        //Check for player colisions with planets
        $.each(model.players, function(player_id, player) {
            var playerPos = player.position;
            $.each(planetaryObjects, function(planet_id, planet) {
                var distanceVec = playerPos.sub(planet.position);
                var distance = distanceVec.length + 1; //TODO parametarize this value
                if(distance < planet.radius + player.radius) {
                    //Collision!
                    delete model.players[player_id];
                }
            });
        });

        
    }

    function updateProjectiles(model) {
        //update lasers
        var lasers = model.particles.lasers
        for(laser_id = 0; laser_id < lasers.length; laser_id++) {
            var laser = lasers[laser_id];
            laser.age += GLIB.Solver.TimeStep;    
            if(laser.age > 4) {
                lasers.splice(laser_id, 1);
            }
        }
        GLIB.Solver.StepTime(lasers)

        //update explosions
        var explosions = model.particles.explosions
        explosions.map(function(explosion) {
            GLIB.Solver.StepTime(explosion.particles)
            explosion.particles.map(function(particle) {
                particle.age += GLIB.Solver.TimeStep
            })
        })

        //TODO: remove dead explosions

        //TODO:update thrusters
    }

    //function detectCollisions(...){...}

    YV.Update = function(dt, model) {
        //immune from accumulator
        updatePlanets(model, dt)

        for(accumulator += dt; accumulator > GLIB.Solver.TimeStep;
                                accumulator -= GLIB.Solver.TimeStep) {

            updatePlayerPositions(model)

            updateProjectiles(model)

            //detectCollisions()
        }
    }

})();
