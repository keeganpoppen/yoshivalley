var GLIB = {};

(function(){
    var resources;
    var num_resources;
    var success_callback;

    function decrement_resources(){
        --num_resources
        if(num_resources == 0) {
            console.log('done loading resources')
            success_callback(resources)
        }
    }

    var loadResources = function(path_obj, callback) {
        resources = { 'textures': {}, 'meshes': {}, 'shaders': {} }
        num_resources = Object.keys(path_obj.textures).length
                            + Object.keys(path_obj.meshes).length
                            + Object.keys(path_obj.shaders).length

        success_callback = callback

        for(var i = 0; i < path_obj.textures.length; ++i) {
            (function(){
                var tex_name = path_obj.textures[i]
                var img = new Image()
                $(img).load(function(){
                    console.log("loaded texture with name: " + tex_name)
                    resources.textures[tex_name] = img
                    decrement_resources()
                })
                img.src = '/textures/' + tex_name
            })()
        }
        for(var i = 0; i < path_obj.meshes.length; ++i) {
            (function(){
                var mesh_name = path_obj.meshes[i]
                $.getJSON('/meshes/' + mesh_name, function(data) {
                    console.log('loaded mesh with name: ' + mesh_name)
                    resources.meshes[mesh_name] = data
                    decrement_resources()
                })
            })()
        }
        for(var i = 0; i < path_obj.shaders.length; ++i) {
            (function(){
                var shader_name = path_obj.shaders[i]
                $.get('/shaders/' + shader_name, function(data) {
                    console.log('loaded shader with name' + shader_name)
                    resources.shaders[shader_name] = data
                    decrement_resources()
                })
            })()
        }
    }

    GLIB.loadResources = loadResources
})()
