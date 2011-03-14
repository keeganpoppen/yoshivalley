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
        
        victory = {
            Reset : function(winner, atEnd) {
                player = winner;
                endCallback = atEnd;
                YV.GetCamera().lookat = new SglVec3(winner.position);
            },

            TimeStep : function(dt) {
                animTime -= dt;
                if(animTime < 0.0) {
                    endCallback();
                }
            },
        }
        return victory;
    })();
})();
