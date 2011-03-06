(function(){
    WGL = {}

    var start = function() {
        console.log("creating web gl context")

        var canvas = document.getElementById("gl_canvas");
        var gl = createWebGLContext(canvas)

        console.log("done making a context")

        console.log("loading shader")
        var simple = loadShaderProgram(gl, "simple") 
        gl.useProgram(simple)
        console.log("done loading shader")

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        //gl.clear(gl.COLOR_BUFFER_BIT);

        //var mesh = makeSphereMesh(3);
        var mesh = makeTetrahedronMesh();
        //var mesh = makeBox(gl);
        //renderMesh(gl, mesh, simple);

        var angle = 0.0;
        function animate() {
            window.requestAnimFrame(animate, canvas);
            renderMesh(gl, mesh, simple, angle);
            angle += 1;
        };

        animate();
    }
    WGL.start = start

    var createWebGLContext = function(canvas) {
        var gl = setupWebGL(canvas, true);

        gl.enable(gl.DEPTH_TEST);
        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);

        gl.clearDepth(1.0);
        gl.clearColor(0., 0., 0., 1.); //note that the alpha is 1.0, ;) (@Bill)
        return gl;
    }
    WGL.createWebGLContext = createWebGLContext

    var renderTriangle = function(gl, simple) {
        simple.vertexPositionAttribute = gl.getAttribLocation(simple, "aVertexPosition");
        gl.enableVertexAttribArray(simple.vertexPositionAttribute);

        simple.pMatrixUniform = gl.getUniformLocation(simple, "uPMatrix");
        simple.mvMatrixUniform = gl.getUniformLocation(simple, "uMVMatrix");

        var triangleVertexPositionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);

        var vertices = [
            0.0,  1.0,  0.0,
            -1.0, -1.0,  0.0,
            1.0, -1.0,  0.0
        ];

        gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(vertices), gl.STATIC_DRAW);
        triangleVertexPositionBuffer.itemSize = 3;
        triangleVertexPositionBuffer.numItems = 3;

        console.log("setting up modelview and projection matrices")
        var mvMatrix = mat4.create();
        var pMatrix = mat4.create();

        gl.viewport(0, 0, gl.viewportWidth, gl.viewportHeight);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        mat4.perspective(45, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);

        mat4.identity(mvMatrix);

        mat4.translate(mvMatrix, [-1.5, 0.0, -7.0]);
        gl.bindBuffer(gl.ARRAY_BUFFER, triangleVertexPositionBuffer);
        gl.vertexAttribPointer(simple.vertexPositionAttribute, triangleVertexPositionBuffer.itemSize, gl.FLOAT, false, 0, 0);

        gl.uniformMatrix4fv(simple.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(simple.mvMatrixUniform, false, mvMatrix);

        gl.drawArrays(gl.TRIANGLES, 0, triangleVertexPositionBuffer.numItems);
    }

    WGL.renderTriangle = renderTriangle

    var renderMesh = function(gl, mesh, shader, angle) {
        gl.clear(gl.COLOR_BUFFER_BIT, gl.DEPTH_BUFFER_BIT);
        
        //DIRTY! SETTING MV AND PROJ MATS
        var mvMatrix = mat4.create();
        var pMatrix = mat4.create();
        mat4.perspective(60.0, gl.viewportWidth / gl.viewportHeight, 0.1, 100.0, pMatrix);
        mat4.identity(mvMatrix);
        //Set camera
        mat4.translate(mvMatrix, [0.0, 0.0, -15.0]);
        //Set model 
        mat4.rotate(mvMatrix, -Math.PI/16, [1,0,0]);
        mat4.rotate(mvMatrix, angle * Math.PI / 180.0, [0,1,0]);

        //send through the projection and mv matrices
        shader.pMatrixUniform = gl.getUniformLocation(shader, "uPMatrix");
        shader.mvMatrixUniform = gl.getUniformLocation(shader, "uMVMatrix");
        gl.uniformMatrix4fv(shader.pMatrixUniform, false, pMatrix);
        gl.uniformMatrix4fv(shader.mvMatrixUniform, false, mvMatrix);

        //Compute normal matrix and send it through
        var nMatrix = mat4.toInverseMat3(mvMatrix);
        shader.nMatrix = gl.getUniformLocation(shader, "uNMatrix");
        gl.uniformMatrix3fv(shader.nMatrix, false, nMatrix);

        //Normal buffer
        /*
        var normalBuff = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, normalBuff);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.normals, gl.STATIC_DRAW);
        shader.aNormal = gl.getAttribLocation(shader, "aNormal");
        gl.vertexAttribPointer(shader.aNormal, 3, gl.FLOAT, false, 0, 0);
        */

        //set up vertex buffer
        shader.vertexPositionAttribute = gl.getAttribLocation(shader, "aVertexPosition");
        gl.enableVertexAttribArray(shader.vertexPositionAttribute);

        var vertexBuff = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, vertexBuff);
        gl.bufferData(gl.ARRAY_BUFFER, mesh.vertices, gl.STATIC_DRAW);
        gl.vertexAttribPointer(shader.vertexPositionAttribute, 3, gl.FLOAT, false, 0, 0);

        var indexBuff = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, indexBuff);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, mesh.indices, gl.STATIC_DRAW);

        gl.drawElements(gl.TRIANGLES, mesh.indices.length, gl.UNSIGNED_SHORT, 0);
    }

    WGL.renderMesh = renderMesh

    return WGL;
})()
