$(function() {
    GLIB.loadResources({
        textures: ["earth.jpg", "sun.jpg"],
        shaders: ["planet.frag.glsl", "planet.vert.glsl"],
        meshes: ["sphere.json"]
    }, function(resources) {
        sglRegisterCanvas("canvas", {
            load: function(gl) {
                this.xform = new SglTransformStack();
                this.programs = {};
                this.programs.planet = new SglProgram(gl, [resources.shaders["planet.vert.glsl"]]
                                                          [resources.shaders["planet.frag.glsl"]]);
                console.log(this.programs.planet.log);
            },

            update: function(gl, dt) {

            },

            draw: function(gl) {

            }
        }, 60);
    });
});
