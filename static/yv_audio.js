if(!YV || YV === undefined) throw "need to load yv.js first!";

(function(){

    var List = function(){
        var head, tail; 
        var count = 0;

        this.PushBack = function(obj){
            toAdd = {obj: obj, next: tail, prev: undefined}
            if(tail !== undefined) tail.prev = toAdd
            tail = toAdd
            if(head === undefined) head = tail

            ++count
        }

        this.PopFront = function(){
            if(head === undefined) return null

            var retWrapper = head
            head = head.prev
            if(head !== undefined) head.next = undefined

            --count

            return retWrapper.obj
        }

        this.Count = function(){
            return count
        }
    }

    var laserSrc = "/audio/laser.mp3";
    var explosionSrc = "/audio/explosion.mp3";
    var musicSrc = "/audio/fates.mp3";
    var music = new Audio();
    music.src = musicSrc;
    music.loop = true;

    var LaserList = new List();
    for(i = 0; i<YV.Constants.maxPlayers; i++) {
        var a = new Audio();
        a.src = laserSrc;
        LaserList.PushBack(a);
    }

    var ExplosionList = new List();
    for(i = 0; i<YV.Constants.maxPlayers; i++) {
        var a = new Audio();
        a.src = explosionSrc;
        ExplosionList.PushBack(a);
    }

    YV.Audio = {
        PlayLaser : function() {
            var a = LaserList.PopFront();
            a.play();
            LaserList.PushBack(a);
        },

        PlayExplosion : function() {
            var e = ExplosionList.PopFront();
            e.play();
            ExplosionList.PushBack(e);
        },

        StartMusic : function () {
            music.play();
        },
    };
})();
