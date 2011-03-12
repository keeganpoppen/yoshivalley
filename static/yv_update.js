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

    function checkForIntersection(collection1, collection2, callback) {
        $.each(collection1, function(player_id, player) {
            var playerPos = player.position;
            $.each(collection2, function(planet_id, planet) {
                var distanceVec = playerPos.sub(planet.position);
                var distance = distanceVec.length; //TODO parametarize this value
                var playerRadius = (player.radius ? player.radius-1 : 0.0);
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

        GLIB.Solver.StepTime(model.players, true, particle_hack)

        checkForPlanetaryIntersection(model.players, model, function(player_id, planet_id) {
            delete model.players[player_id];
        });
    }

    function updateProjectiles(model) {
        //update lasers
        var lasers = model.particles.lasers
        $.each(lasers, function(laser_id, laser) {
            laser.age += GLIB.Solver.TimeStep;    
            if(laser.age > 4) { //TODO paramaterize this value
                lasers.splice(laser_id, 1);
            }
        });
        GLIB.Solver.StepTime(lasers)

        checkForPlanetaryIntersection(lasers, model, function(laser_id, planet_id) {
            lasers.splice(laser_id, 1);
        });

        //Check for intersections with ufo's, hits if you will
        checkForIntersection(lasers, model.players, function(laser_id, player_id) {
            if(player_id != lasers[laser_id].shooter_id) {
                console.log("hit!");
                console.log(lasers[laser_id].shooter_id);
                //var shooter = model.players[lasers[laser_id].shooter_id];
                delete model.players[player_id];
                delete lasers[laser_id];
            }
        });

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
