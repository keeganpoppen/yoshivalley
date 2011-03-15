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

        function displayWinnerName(name) {
            var span = $('<span>'+name+' Wins</span>');
            var canvasParent = $('#game_div');
            canvasParent.append(span);
            var sw = $(span).width();

            var h = $('canvas').height();
            var w = $('canvas').width();
            $(span).css({
                'position': 'absolute',
                'top': h/6,
                'left': (w-sw)/2,
                'color': 'white',
                'font-size': 38,
                'font-family': 'sans-serif',
            });
            return function(){
                canvasParent.removeChild(span);
            };
        }

        var removeMessage;
        victory = {
            Reset : function(winner, atEnd) {
                player = winner;
                endCallback = atEnd;
                YV.GetCamera().lookat = new SglVec3(winner.position);
                YV.SetCameraTo(angle, azimuth, radius);

                removeMessage = displayWinnerName(winner.display_name);
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
                    removeMessage();
                    endCallback();
                }
            },
        }
        return victory;
    })();

    YV.AwardsCeremony = (function(){
        var endCallback;
        var startFrame, endFrame;
        var laser_id;

        var awards, cur_award;
        var award_index = 0;

        var awards_ceremony = {
            Reset: function(atEnd) {
                console.log('STARTING THE REPLAY!!!')

                awards = YV.Replay.ComputeAwards()
                console.log(awards)

                if(awards == null || awards.length == 0) {
                    console.log("NO AWARDS!")
                    atEnd()
                }

                cur_award = awards[award_index]
                cur_award.SetPlayBounds(cur_award.startFrame - YV.Constants.replay.pre_replay_buffer,
                                        cur_award.endFrame + YV.Constants.replay.post_replay_buffer)

                endCallback = atEnd 

            },
            TimeStep: function(dt) {
                if(!cur_award || cur_award === undefined) return

                cur_award.SetCamera()

                if(!cur_award.TimeStep()) {
                    console.log("TIME STEP FAIL")
                    if((++award_index) == awards.length) {
                        endCallback()
                    } else {
                        cur_award = awards[award_index]
                        cur_award.SetPlayBounds(cur_award.startFrame - YV.Constants.replay.pre_replay_buffer,
                                                cur_award.endFrame + YV.Constants.replay.post_replay_buffer)
                    }
                }
            }
        }

        return awards_ceremony 
    })();
})();
