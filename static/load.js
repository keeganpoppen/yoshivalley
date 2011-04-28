//NOTE: SHOULD PUT YEPNOPE UP HERE IN THE FUTURE


var _default_deps = [
    '/jquery-1.5.1.min.js',
    '/underscore-min.js',
    '/socket.io.js'
]

Load = function(paths, callback){
    yepnope({
        load: _default_deps.concat(paths),
        callback: function(url, result, key){
            //TODO: check for fails or something?
        },
        complete: callback
    })
}

