if(!YV || YV === undefined) throw "need to load yv.js first!";

(function(){
    YV.Intro = (function() {
        var end_callback;

        var start_angle = 90.0;
        var start_azimuth = 10.0;
        var start_radius = YV.Constants.arenaRadius * 1.3;
        var angularVelocity = 60.0;

        var azimuthVelocity = (YV.Constants.camera.azimuth - start_azimuth) / 
                              (start_angle / angularVelocity);
        var radiusVelocity = (YV.Constants.camera.orbitRadius - start_radius) / 
                             (start_angle / angularVelocity); 
        
        intro = {
            Reset : function(atEnd) {
                end_callback = atEnd;
                //Set camera to starting position
                YV.SetCameraTo(start_angle, start_azimuth, start_radius);
            },

            TimeStep : function(dt) {
                if(YV.GetCamera().orbitRadius >= YV.Constants.camera.orbitRadius) {
                    YV.SetCameraTo(YV.Constants.camera.orbitAngle,
                                   YV.Constants.camera.azimuth,
                                   YV.Constants.camera.orbitRadius);    
                    end_callback();
                } else if(YV.GetCamera().orbitAngle < start_angle-360.0) {
                    YV.MoveCamera(-angularVelocity*dt, azimuthVelocity*dt,
                                radiusVelocity*dt);
                } else {
                    YV.MoveCamera(-angularVelocity*dt, 0.0, 0.0);
                }
            }
        };
        return intro;
    })();

    YV.Victory = (function() {
        var player;
        var animTime = 5.0;
        var endCallback;

        var angle = 0.0;
        var azimuth = 0.0;
        var radius = 5*YV.Constants.ufo.radius;
        var fireworkfrequency = 0.7;
        
        victory = {
            Reset : function(winner, atEnd) {
                player = winner;
                endCallback = atEnd;
                YV.GetCamera().lookat = new SglVec3(winner.position);
                YV.SetCameraTo(angle, azimuth, radius);
            },

            TimeStep : function(dt) {
                animTime -= dt;

                if(animTime % fireworkfrequency < 1.5*dt) {
                    //Set off firework
                    var pos = new SglVec3(player.position);
                    pos.y += 4*YV.Constants.ufo.radius;
                    pos.y += 3*Math.random() * YV.Constants.ufo.radius;
                    pos.z += 3*Math.random() * YV.Constants.ufo.radius;
                    pos.x += 3*Math.random() * YV.Constants.ufo.radius;
                    YV.AddExplosion(pos);
                }

                if(animTime < 0.0) {
                    endCallback();
                }
            },
        }
        return victory;
    })();
})();
