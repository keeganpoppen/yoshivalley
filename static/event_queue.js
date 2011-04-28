/*
 * This here is the starts of a (hopefully glorious) event queue-- start small, hope for... more?
 *
 * Future possible extensions:
 *  -hierarchical events (this.that.theother)
 *  -regex matching
 *  -REST api
 *  -multiple handlers for stuff, sometimes
 */
var EventQueue = (function(){
    var ret = {}
    var handlers = {}

    var bind = function(event_name, handler) {
        if(event_name in handlers) return false
        handlers[event_name] = handler 
    }
    ret.bind = bind

    var unbind = function(event_name) {
        delete handlers[event_name]
    }
    ret.unbind = unbind

    var trigger = function(event_name, data) {
        if(event_name in handlers) handlers[event_name](data)
    }
    ret.trigger = trigger

    return ret

})();
