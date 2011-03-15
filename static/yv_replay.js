if(!YV || YV === undefined) throw "need a YV object, dawg!";

(function(){
    YV.Replay = {}

    var frames = []
    var kills = []

    YV.Replay.CaptureFrame = function(){
        var frame_data = {}

        frame_data.players = {}
        YV.OverPlayers(function(id, player){
            frame_data.players[id] = {}
            $.extend(true, frame_data.players[id], player)
        })

        frame_data.particles = {}

        frame_data.particles.lasers = []
        YV.OverLasers(function(laser_id, laser){
            frame_data.particles.lasers.push($.extend(true, {}, laser))
        })

        frame_data.particles.explosions = []
        YV.OverExplosions(function(explosion_id, explosion){
            frame_data.particles.explosions.push($.extend(true, {}, explosion))
        })

        frame_data.aggregate_time = YV.GetAggregateTime()

        frames.push(frame_data)
    }

    var getFrameNum = function(){
        return frames.length
    }
    YV.Replay.GetFrameNumber = getFrameNum

    var replay_frame_num = 0 
    var start_frame_num = 0
    var end_frame_num = getFrameNum() - 1
    YV.Replay.SetPlayRange = function(start_frame, end_frame) {
        var index = Math.max(replay_frame_num, 0)
        index = Math.min(replay_frame_num, frames.length - 1)

        start_frame = Math.max(0, start_frame)
        end_frame = Math.min(end_frame, frames.length - 1)

        start_frame_num = replay_frame_num = start_frame
        end_frame_num = end_frame
    }

    YV.Replay.GetPlayhead = function(){
        return replay_frame_num
    }

    YV.Replay.GetNextFrameObj = function(){
        if(replay_frame_num == frames.length) return null
        if(replay_frame_num > end_frame_num) return null

        return frames[replay_frame_num++]
    } 

    YV.Replay.GetFrameAt = function(index) {
        if(index < 0 || index >= frames.length) return null
        return frames[index]
    }

    YV.Replay.LogPlanetKill = function(planet, player_id){
        console.log("MURDER BY THE PLANET: " + planet.name)

        kills.push({
            type: 'planet',
            planet: planet,
            start_frame: getFrameNum(),
            end_frame: getFrameNum(),
            player_id: player_id
        })
    }

    YV.Replay.LogPlayerKill = function(shooter_id, victim_id, laser){
        console.log("Player " + shooter_id + " killed " + victim_id)

        kills.push({
            type: 'player',
            shooter_id: shooter_id,
            victim_id: victim_id,
            start_frame: laser.start_frame,
            end_frame: getFrameNum(),
            laser_id: laser.id
        })
    }

    //helper function for finding the laser in question in a frame object
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

    //helper function for pointing the camera position given a particular laser
    function cam_pos_from_particle(particle) {
        if(particle === undefined) {
            throw "UNDEF!!!"
        }
        var trail_vec = particle.velocity.normalize().mul(new SglVec3(30. * YV.Constants.ufo.radius))
        return particle.position.add(trail_vec.neg).add(new SglVec3(0., YV.Constants.ufo.radius * 30., 0.))
    }

    YV.Replay.LongestShotAward = (function(){
        var longest_kill = null

        kills.map(function(kill) {
            if(kill.type == 'planet') return

            var kill_duration = kill.end_frame - kill.start_frame
            if(longest_kill === null ||
                    (longest_kill.end_frame - longest_kill.start_frame) < kill_duration)
                longest_kill = kill
        })

        //if there's no longest kill, don't give an award
        if(longest_kill === null) return null

        //object ultimately responsible for playback of the longest shot replay
        var award = {}

        var laser_id = longest_kill.laser_id

        //first frame of the kill
        var startFrame = longest_kill.start_frame
        award.startFrame = startFrame 

        //last frame of the kill
        var endFrame = longest_kill.end_frame
        award.endFrame = endFrame

        //initialize the actual player controls
        var play_start = startFrame
        var play_end = endFrame
        var playhead = play_start

        //optional fn to call to be able to render before start & after end
        award.SetPlayBounds = function(start, end) {
            play_start = Math.max(0, start)
            play_end = Math.min(end, frames.length - 1)
            playhead = play_start
        }

        award.Shooter = frames[1].players[longest_kill.shooter_id]

        award.SetCamera = function() {
            var frame = frames[playhead]

            var cameraPosition, lookAt;

            if(playhead <= startFrame) {
                var shooter = frame.players[longest_kill.shooter_id]

                cameraPosition = cam_pos_from_particle(shooter)
                lookAt = new SglVec3(shooter.position)
            } else if(playhead < endFrame) {
                var laser = find_laser(frame, laser_id)
                if(laser == null) throw "WTF!"

                cameraPosition = cam_pos_from_particle(laser)
                lookAt = new SglVec3(laser.position)
            } else {
                var last_frame = frames[endFrame]
                var victim = last_frame.players[longest_kill.victim_id]
                //console.log('vic')
                //console.log(victim)

                cameraPosition = cam_pos_from_particle(victim)
                lookAt = new SglVec3(victim.position)
            }

            YV.SetCameraToVec(cameraPosition)
            YV.GetCamera().lookat = new SglVec3(lookAt)
        }

        var slowmo_frame_count = 0
        award.TimeStep = function(dt) {
            if(playhead > play_end) {
                console.log("DONE PLAYING LONGEST SHOT!")
                return false
            }

            if(slowmo_frame_count == 0) {
                YV.MergeState(frames[++playhead])
            } else {
                var next_frame = frames[playhead+1]
                var real_dt = next_frame.aggregate_time - YV.GetAggregateTime()

                YV.RegularUpdate(real_dt / YV.Constants.replay.slowmo_mult)
            }
            slowmo_frame_count = (slowmo_frame_count + 1) % YV.Constants.replay.slowmo_mult

            return true
        }
        return award
    })

    YV.Replay.ComputeAwards = function(){
        //for now, just get longest shot
        var longest = YV.Replay.LongestShotAward()
        console.log(longest)
        if(longest !== undefined && longest !== null) {
            return [longest]
        } else {
            return null
        }
    }

})();
