//takes in a minimum flush rate (#/sec), the maximum rate
//(if every message is life-or-death how often it CAN send)
//and two callbacks: one called with (message, queue) on every add, the other called
//with (queue) when the queue is flushed

var MessageTimer = {}
if(module && module.exports) {
    MessageTimer = module.exports
}

MessageTimer.create = function(min_rate, max_rate, add_callback, flush_callback) {
    var obj = {}

    var queue = {}

    var flush_interval = 1000. / min_rate
    var min_wait = 1000. / max_rate
    var add_cb = add_callback
    var flush_cb = flush_callback

    var last_sent = Date.now()

    var flush_timeout;
    function flush_queue() {
        flush_timeout = setTimeout(flush_queue, flush_interval)
        flush_cb(queue)
        last_sent = Date.now()
        queue = {}
    }

    //set the clock a'tickin'
    flush_timeout = setTimeout(flush_queue, flush_interval)

    obj.AddMessage = function(message, urgent) {
        add_cb(message, queue)
        if(urgent) {
            var elapsed = Date.now() - last_sent
            clearTimeout(flush_timeout)
            if(elapsed > min_wait) {
                flush_queue()
            } else {
                setTimeout(flush_queue, min_wait - elapsed)
            }
        }
    }

    return obj
};

//queue[type] is always the most recent message of that type
var PlayerQueueCallback = function(message, queue) {
    queue[message.type] = message
}
MessageTimer.PlayerQueueCallback = PlayerQueueCallback

//basically a map of player_id to PlayerQueue as above
ServerQueueCallback = function(message, queue) {
    if(message.type == 'latency_check') return

    if(!(message.player_id in queue)) queue[message.player_id] = {}
    PlayerQueueCallback(message, queue[message.player_id])    
}
MessageTimer.ServerQueueCallback = ServerQueueCallback
