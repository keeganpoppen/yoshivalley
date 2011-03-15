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

    YV.Replay.ComputeAwards = function(){
        //for now, just get longest shot
        var longest = null 
        
        kills.map(function(kill){
            if(kill.type == 'planet') return

            var kill_duration = kill.end_frame - kill.start_frame
            if(longest === null ||
                    (longest.end_frame - longest.start_frame) < kill_duration)
                longest = kill
        })

        return longest
    }

})();
