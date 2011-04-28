//only here because socket.io is a default dependency
var socket = new io.Socket()

socket.on('connect', function(){
    console.log('connected to socket!')
})

socket.connect()


var SocketRouter = (function(socket){
    var sr = {}
    var routes = {}
    var _prefix = 'sr'
    var _namespace_separator = '.'
    var _delegate_methods = ['receive', 'send']

    sr.socket = socket

    //how do we feel about throwing? rather than returning false?
    sr.addRouter = function(route_name, delegate_obj) {
        if(route_name == null || delegate_obj == null) return false
        if(route_name in routes) return false

        if(!_.all(delegate_obj, _delegate_methods)) return false

        routes[route_name] = delegate_obj
    }

    sr.removeRouter = function(route_name) {
        if(route_name in routes) delete routes[route_name]
    }

    sr.send = function(route_name, message) {
        message.type = [_prefix, route_name, (message.type||'')].join(_namespace_separator)
        socket.send(message)
    }

    socket.on('message', function(message){
        //remove _prefix + _namespace_separator from beginning
        var routes_arr = message.type.split(_namespace_separator).slice(1)
        var route_name = routes_arr[0]

        if(route_name == null || !(route_name in routes)) return

        routes[route_name].receive(routes_arr.slice(1), message)
    })

    return sr 
})(socket);


var EventRouter = (function(){
    var _namespace_separator = '.'
    var _router, _route_name, _receive_fn;

    var router = function(socket_router, route_name, receive_fn){
        _router = socket_router
        _route_name = route_name
        _receive_fn = receive_fn
    }

    router.prototype.receive = function(route_arr, message){
        console.log('received message with route_arr', route_arr, 'and msg', message)
        _receive_fn(route_arr, message)
    }

    router.prototype.send = function(message){
        _router.send(_route_name, message)
    }

    return router
})();
