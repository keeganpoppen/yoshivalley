/*
 * globals
 */

var player_id = -1;
var color = [0.0, 0.0, 0.0];
var socket = new io.Socket();

/*
 * set up socket
 */

socket.connect();
socket.on('connect', function() {
    socket.send({'client_type': 'player'})             

    $("#stuff").append('<div>connected</div>')
})
socket.on('message', function(message) {
    if(message.type == 'init:setid') {
        player_id = message.player_id
        console.log(message);
        color = message.color;
        var colorstring = "rgb(" + Math.floor(color[0]*255) + ", " + 
                                   Math.floor(color[1]*255) + ", " +
                                   Math.floor(color[2]*255) + ")";
        $('body').css('color', colorstring);
        $("#player_id").html(player_id)

    } else if(message.type == 'latency_check') {
        socket.send(message) //just send 'er right back

    } else {
        $("#stuff").append('<div>message: ' + message + '</div>')
    }
})
socket.on('disconnect', function() {
    $("#stuff").append('<div>disconnected!</div>')
})

/*
 * Throttle for gyroscope input
 */

var GyroThrottle = {};
(function(){
    var prev_val = [0.0, 0.0, 0.0];
    var last_sent = prev_val;

    var get_value = function() {
        return prev_val
    }

    function arr_dist(a, b) {
        return Math.sqrt(Math.pow(a[0] - b[0], 2) +
                         Math.pow(a[1] - b[1], 2) +
                         Math.pow(a[2] - b[2], 2))
    }

    function large_send_deviation(input) {
        return (arr_dist(input, last_sent) > 5)
    }

    function sufficient_move_diff(input) {
        return (arr_dist(input, prev_val) > 1)
    }

    var should_send_given_input = function(input) {
        if(!input || input === undefined) return false

        var should = false
        if(sufficient_move_diff(input) || large_send_deviation(input)) {
            should = true
            last_sent = prev_val
        }

        prev_val = input
        return should
    }

    GyroThrottle.get_value = get_value
    GyroThrottle.should_send_given_input = should_send_given_input
})();


/*
 * Throttle for cannon input
 */

var CannonThrottle = {};
(function(){
    var last_sent = 0.
    var last_update = 0.
    var timeout = undefined
    var dirty = false
    CannonThrottle.AcceptInput = function(input) {
        last_update = input
        if(dirty) {
            send_data()
        }
    }

    function send_data(){
        timeout = null
        if(last_sent != last_update) {
            socket.send({type: 'laser:update', angle: last_update, player_id: player_id})
            last_sent = last_update
            dirty = false
        } else {
            dirty = true
        }

        clearTimeout(timeout)
        timeout = setTimeout(send_data, 50)
    }
    
    timeout = setTimeout(send_data, 50)
})();

/*
 * Listen for gyro events
 */

//TODO: SOMETHING HERE?
//if(typeof window.DeviceOrientationEvent === 'undefined') return
window.addEventListener('deviceorientation', function(e) {
    var xrot = e.beta
    var yrot = e.gamma
    var zrot = e.alpha

    if(GyroThrottle.should_send_given_input([xrot,yrot,zrot]) && player_id != -1) {
        var arr = GyroThrottle.get_value() 
        var data = {}
        data.xrot = arr[0]; data.yrot = arr[1]; data.zrot = arr[2];
        socket.send({'type': 'gyro:update', 'data': data, 'player_id': player_id})
    }
}, false)

/*
 * handler for flipping between portrait and landscape
 * (DEPRECATED)
 */

window.addEventListener('orientationchange', function(e) {
    var orient = window.orientation
    if(orient == 0 || orient == 180) {
        $("body").removeClass()
        $("body").addClass("portrait")
    } else {
        $("body").removeClass()
        $("body").addClass("landscape")
    }
    setTimeout(function(){window.scrollTo(0,1);},100)
})

/*
 * set up handling for cannon aimer
 */

var prev_angle = 0.0
var send_touch_angle = function(e) {
    e.preventDefault()
    var control_center = document.getElementById("control_center")
    var cc = $(control_center)
    var ev = e.touches[0]
    var offset = cc.offset()
    var deviation_x = ev.pageX - offset.left - (cc.width()/2)
    var deviation_y = ev.pageY - offset.top - (cc.height()/2)
    var angle = Math.atan2(-deviation_y, deviation_x)
    prev_angle = angle

    CannonThrottle.AcceptInput(angle)
    return false
}

