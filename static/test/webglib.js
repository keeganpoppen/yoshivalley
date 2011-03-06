(function(){
    var GLIB = {}

    var resources;
    var num_resources;
    var success_callback;

    function decrement_resources(){
        --num_resources
        console.log('resource loaded! down to ' + num_resources)
        if(num_resources == 0) {
            console.log('calling the success handler with object:')
            console.log(resources)
            success_callback(resources)
        }
    }

    var loadResources = function(path_obj, callback) {
        resources = { 'textures': {}, 'meshes': {}, 'shaders': {} }
        num_resources = Object.keys(path_obj.textures).length
                            + Object.keys(path_obj.meshes).length
                            + Object.keys(path_obj.shaders).length

        success_callback = callback

        for(texture in path_obj.textures) {
            (function(){
                var tex_name = texture
                var img = new Image()
                $(img).load(function(){
                    resources.textures[tex_name] = img
                    decrement_resources()
                })
                img.src = tex_name
            )()
        }
        for(mesh in path_obj.meshes) {
            (function(){
                var mesh_name = mesh
                $.getJSON('/meshes/' + mesh_name, function(data) {
                    resources.meshes[mesh_name] = data
                    decrement_resources()
                }
            )()
        }
        for(shader in path_obj.shaders) {
            (function(){
                var shader_name = shader
                $.get('/shaders/' + shader_name, {}, function(data) {
                    resources.shaders[shader_name] = data
                    decrement_resources()
                }, 'text/plain')
            })()
        }
    }

    GLIB.loadResources = loadResources

    return GLIB;
})()
