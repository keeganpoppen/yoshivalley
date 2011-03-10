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
    }

    function updateProjectiles(model) {
        //update lasers
        var lasers = model.particles.lasers
        GLIB.Solver.StepTime(lasers)

        //update explosions
        var explosions = model.particles.explosions
        explosions.map(function(explosion) {
            GLIB.Solver.StepTime(explosion.particles)
            explosion.time_alive += GLIB.Solver.TimeStep
        })

        //TODO: remove dead explosions and lasers

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
