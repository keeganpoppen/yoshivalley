if(!YV || YV === undefined) throw "need to load yv.js first!";

(function(){

    var accumulator = 0.0

    //rotate the planets appropriately
    function updatePlanets(dt) {
        YV.OverPlanets(function(planet_id, planet) {
            if(planet.program !== 'sun') {
                planet.rotation += planet.rotationalVelocity * dt;
                planet.orbitAngle += YV.Constants.planets.orbitVelocity
                        * dt / Math.pow(planet.orbitRadius, 2);
            }
        });
    }

    function checkForIntersection(item1, item2) {
        var item1Pos = item1.position;
        var distanceVec = item1Pos.sub(item2.position);
        var distance = distanceVec.length; 
        var intersectRadius = (item1.radius ? item1.radius - 
                                YV.Constants.ufo.collisionEpsilon : 0.0);
        return (distance < item2.radius + intersectRadius);
    }

    function updatePlayerPositions() {
        YV.OverPlayers(function(player_id, player) {
            GLIB.Solver.StepGravity(player);
            player.invulnerable -= GLIB.Solver.TimeStep;
        });

        //Intersect with planets
        YV.OverPlayers(function(player_id, player) {
            YV.OverPlanets(function(planet_id, planet) {
                if(checkForIntersection(player, planet)) {
                    player.lives--;
                    YV.AddExplosion(player.position);
                    YV.Respawn(player_id, player);        
                    YV.Replay.LogPlanetKill(planet, player_id)
                }
            });
        });
    }

    function updateProjectiles() {
        YV.OverLasers(function(laser_id, laser) {
            GLIB.Solver.StepParticle(laser);
        });

        var toremove = [];
        YV.OverLasers(function(laser_id, laser) {
            laser.age += GLIB.Solver.TimeStep;    
            if(laser.age > YV.Constants.laser.maxAge) {
                toremove.push(laser_id);
            }
        });

        YV.OverLasers(function(laser_id, laser) {
            YV.OverPlanets(function(planet_id, planet) {
                if(checkForIntersection(laser, planet)) {
                    toremove.push(laser_id);
                }
            });
        });

        //Check for intersections with ufo's, hits if you will
        YV.OverLasers(function(laser_id, laser) {
            YV.OverPlayers(function(player_id, player) {
                if(player_id != laser.shooter_id &&
                        player.position.sub(laser.position).length < player.radius) {
                    //var shooter = model.players[lasers[laser_id].shooter_id];
                    if(player.invulnerable <= 0) {
                        player.lives--;
                        YV.AddExplosion(player.position);
                        YV.Respawn(player_id, player);
                        YV.Replay.LogPlayerKill(laser.shooter_id, player_id, laser)
                    }
                    toremove.push(laser_id);
                }
            });
        });

        YV.RemoveLasers(toremove);
    }

    function updateExplosions(dt) {
        var toremove = [];
        YV.OverExplosions(function(explosion_id, explosion) {
            explosion.age += dt;
            if(explosion.age > explosion.lifetime) {
                toremove.push(explosion_id);
            }
        });
        YV.RemoveExplosions(toremove);
    }

    YV.Update = function(dt) {
        switch(YV.GamePhase) {
        case 'title':
            YV.Title.Update(dt);
            break;
        case 'lobby':
            break;
        case 'intro':
            YV.Intro.TimeStep(dt);
            break;
        case 'awards_ceremony':
            YV.AwardsCeremony.TimeStep(dt)
            break
        case 'play':
            var numPlayersLeft = 0;
            var lastPlayer;
            YV.OverPlayers(function(player_id, player) {
                numPlayersLeft += 1;
                lastPlayer = player;
            });
            if(numPlayersLeft === 1) {
                YV.End(lastPlayer);
            }
            
            //immune from accumulator
            updatePlanets(dt)
            updateExplosions(dt)

            for(accumulator += dt; accumulator > GLIB.Solver.TimeStep;
                                    accumulator -= GLIB.Solver.TimeStep) {
                updatePlayerPositions();
                updateProjectiles();
            }
            break;
        case 'victory':
            updateExplosions(dt)
            YV.Victory.TimeStep(dt);
            break;
        }
    }

})();
