/**
 *
 * PLAYER_CONTROLS.JS
 * ---------------------------
 *  - sets up the throttles
 *  - registers listeners for gyro and cannon update and laser
 *
 *  NOTE: this file is not no-knowledge about the strucutre of player.html
 *
 */


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
 * set up handling for cannon aimer
 */

var prev_angle = 0.0
var CANNON_ACTIVE = false
var send_touch_angle = function(e) {
    e.preventDefault()

    if(!CANNON_ACTIVE) return

    var ev = e.touches[0]
    var deviation_x = ev.pageX - 160
    var deviation_y = ev.pageY - 115

    var angle = Math.atan2(-deviation_y, deviation_x)
    prev_angle = angle

    draw(-angle - Math.PI / 2)

    CannonThrottle.AcceptInput(angle)
    return false
}

function bind_cannon_handlers(){
    var control_center = document.getElementById("control_center")
    control_center.addEventListener("touchstart", function(){
        CANNON_ACTIVE = true
    }, false);
    control_center.addEventListener("touchmove", send_touch_angle, false);
    control_center.addEventListener("touchend", function(){
        CANNON_ACTIVE = false 
    }, false);
    control_center.addEventListener("touchcancel", function(){
        CANNON_ACTIVE = false 
    }, false);

    document.body.addEventListener("touchstart", send_touch_angle, false)
    document.body.addEventListener("touchmove", send_touch_angle, false)

    document.getElementById("fire_button").addEventListener("touchstart", function(){
        socket.send({'type': 'laser:fire', 'angle': prev_angle, 'player_id': player_id})
    }, false)
}

function bind_keyboard_controls(){
    /* For testing purposes, add call backs for mouse and keyboard events. That way we can test
       on a laptop too */

    var xrot = 0.0;
    var yrot = 0.0;
    var zrot = 0.0;
    function sendVelocityUpdate(x, y, z) {
        xrot += x;
        yrot += y;
        zrot += z;
        var data = {}
        data.xrot = xrot; data.yrot = yrot; data.zrot = zrot;
        socket.send({'type': 'gyro:update', 'data': data, 'player_id': player_id})
    }

    window.addEventListener("keypress", function(e) {
        switch(e.keyCode) {
        case 32:
            socket.send({'type': 'laser:fire', 'angle': prev_angle, 'player_id': player_id});
            break;
        //WASD keys
        case 119: //Up
            sendVelocityUpdate(0, 10, 0);    
            break;
        case 115: //Down
            sendVelocityUpdate(0, -10, 0);    
            break;
        case 100: //Right
            sendVelocityUpdate(10, 0, 0);    
            break;
        case 97: //Left
            sendVelocityUpdate(-10, 0, 0);    
            break;
        }
    }, false);
}
