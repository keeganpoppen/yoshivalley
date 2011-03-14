if(!YV || YV === undefined) throw "need to load yv.js first!";

(function(){
    YV.GamePhase = 'lobby';


    //Called when a user initiates the current game
    YV.Begin = function() {
        YV.GamePhase = 'play';
        $('#lobby').css('visibility', 'hidden');
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
            $('#lobby').css('visibility', 'visible');
        });
    }
})();
