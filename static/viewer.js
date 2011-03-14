GLIB.FireWhenReady(YV.Resources, function(resources) {
    var last_frame_time = Date.now()
    var last_fps_print = Date.now()
    var fps_cum = 0.
    var fps_num = 0

    console.log('starting real work, namely the actual game');

    sglRegisterLoadedCanvas("canvas", {
        load: function(gl) {
            gl.xform = new SglTransformStack();
            gl.programs = {};
            
            //Compile Shaders
            gl.programs = GLIB.compilePrograms(gl, resources.shaders);

            YV.InitTextures(gl, resources.textures);
            YV.InitMeshes(gl);

            gl.ui = this.ui;

            //We want the canvas to resize with the window
            var resize = function() {
                gl.canvas.width = window.innerWidth;
                gl.canvas.height = window.innerHeight;
            }
            $(window).resize(resize);
            resize();

            window.onkeypress = function(e) {
                switch(e.charCode) {
                case 97: //A
                    YV.MoveCamera(-5, 0, 0);
                    break;
                case 100: //D
                    YV.MoveCamera(5, 0, 0);
                    break;
                case 119: //W
                    YV.MoveCamera(0, 5, 0);
                    break;
                case 115: //S
                    YV.MoveCamera(0, -5, 0);
                    break;
                case 32: //Space
                    YV.Begin();
                    break;
                };
            }

            window.addEventListener('mousewheel', function(e) {
                YV.MoveCamera(0, 0, -e.wheelDelta / 20);
            }, false);

            //set up all the relevant socket callbacks, etc.
            //right now this is last so that stuff is displaying before sockets start doing shit
            YV.Connect(resources.socket);
        },

        update: function(gl, dt) {
            YV.Update(dt);
        },

        draw: function(gl) {
            //capture the curent frame first
            YV.Replay.CaptureFrame()

            //Draw fps
            var cur_time = Date.now()
            var fps = 1000. / (cur_time - last_frame_time)
            fps = Math.round(fps * 10) / 10
            fps_cum += fps
            ++fps_num
            if(cur_time > (last_fps_print - 1000)) {
                var fps = fps_cum / fps_num
                fps_cum = fps_num = 0
                $('#framerate').html(fps + 'fps')
                last_fps_print = cur_time
            }
            last_frame_time = cur_time

            YV.Render(gl);
        }

    }, YV.Constants.maxFrameRate);
});
