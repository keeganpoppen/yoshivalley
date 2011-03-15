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

    function find_laser(frame, laser_id) {
        var laser = null
        for(var i = 0; i < frame.particles.lasers.length; ++i) {
            var l = frame.particles.lasers[i]
            if(l.id != laser_id) continue

            laser = l
            break
        }
        return laser
    }

    function cam_pos_from_laser(laser) {
        var trail_vec = laser.velocity.normalize().mul(new SglVec3(30. * YV.Constants.ufo.radius))
        return laser.position.add(trail_vec.neg).add(new SglVec3(0., YV.Constants.ufo.radius * 30., 0.))
    }

    YV.AwardsCeremony = (function(){
        var endCallback;
        var startFrame, endFrame;
        var laser_id;

        var awards_ceremony = {
            Reset: function(atEnd) {
                console.log('STARTING THE REPLAY!!!')

                var longest_shot = YV.Replay.ComputeAwards()

                if(longest_shot !== null) {
                    laser_id = longest_shot.laser_id

                    //start and end w/the shot
                    startFrame = longest_shot.start_frame
                    endFrame = longest_shot.end_frame

                    var frame = YV.Replay.GetFrameAt(startFrame)
                    var laser = find_laser(frame, longest_shot.laser_id)

                    if(laser == null) throw "ARGH. WTF???"

                    YV.SetCameraToVec(cam_pos_from_laser(laser))
                    YV.GetCamera().lookat = new SglVec3(laser.position)

                    YV.Replay.SetPlayRange(startFrame, endFrame)

                    /*
                    YV.Replay.SetPlayRange(startFrame - YV.Constants.pre_replay_buffer,
                                            endFrame + YV.Constants.post_replay_buffer)
                    */

                } else {
                    //otherwise just do the whole thing
                    startFrame = 0
                    endFrame = YV.Replay.GetFrameNumber() - 1

                    YV.SetCameraTo(YV.Constants.camera.orbitAngle,
                                   YV.Constants.camera.azimuth,
                                   YV.Constants.camera.orbitRadius);    
                    YV.GetCamera().lookat = new SglVec3(0.0,0.0,0.0);
                }

                endCallback = atEnd 
            },
            TimeStep: function(dt) {
                var frame = YV.Replay.GetNextFrameObj()

                //frame is null after the Replay has hit the final frame
                if(frame === null) {
                    endCallback()
                } else {
                    var laser = find_laser(frame, laser_id)

                    if(laser != null) {
                        YV.SetCameraToVec(cam_pos_from_laser(laser))
                        YV.GetCamera().lookat = new SglVec3(laser.position)
                    }
                    
                    //set the data directly
                    YV.MergeState(frame)
                }
            }
        }

        return awards_ceremony 
    })();
})();
