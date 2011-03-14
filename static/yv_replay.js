if(!YV || YV === undefined) throw "need a YV object, dawg!";

(function(){
    YV.Replay = {}

    var frames = []

    YV.Replay.CaptureFrame = function(){
        var frame_data = {}

        frame_data.players = {}
        YV.OverPlayers(function(id, player){
            frame_data.players[id] = {}
            $.extend(true, frame_data.players[id], player)
        })

        frame_data.lasers = []
        YV.OverLasers(function(laser){
            frame_data.lasers.push($.extend(true, {}, laser))
        })

        frame_data.explosions = []
        YV.OverExplosions(function(explosion){
            frame_data.explosions.push($.extend(true, {}, explosion))
        })

        frames.push(frame_data)

        /*
        if(frames.length % 600 == 0) {
            console.log("num frames capped: " + frames.length)
            console.log(frames.slice(-10))
        }
        */
    }

    YV.Replay.LogEvent = function(){
        //TODO: allow for things like "laser kill", etc.
    }
})();
