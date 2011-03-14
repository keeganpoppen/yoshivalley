if(!YV || YV === undefined) throw "need to load yv.js first!";

(function(){
    YV.GamePhase = 'lobby';


    //Called when a user initiates the current game
    YV.Begin = function() {
        YV.GamePhase = 'intro';
        $('#lobby').css('display', 'none');
        YV.Intro.Reset(function() {
            YV.GamePhase = 'play';
        });
    }

    //Called when the game state has decided upon a winner
    YV.End = function(winner) {
        YV.GamePhase = 'victory';
        //winner.controler.xrot = 0.0;
        //winner.controler.zrot = 0.0;
        YV.Victory.Reset(winner, function() {
            YV.GamePhase = 'lobby';
            YV.SetCameraTo(YV.Constants.camera.orbitAngle,
                           YV.Constants.camera.azimuth,
                           YV.Constants.camera.orbitRadius);    
            YV.GetCamera().lookat = new SglVec3(0.0,0.0,0.0);
            $('#lobby').css('display', 'block');
        });
    }
})();
