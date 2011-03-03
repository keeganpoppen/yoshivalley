var MatStack = function(){
  var stack = []

  var _cur = mat4.create()
  mat4.identity(_cur)
  stack.push(_cur)

  var reset_cur = function () {
    _cur = stack[stack.length-1]
  }

  //returns a totally-fragile reference to the current value of the stack
  this.GetValue = function() {
    return _cur;
  }

  this.Push = function() {
    var mat = mat4.create(stack[stack.length-1])
    stack.push(mat)
    reset_cur()
  }

  this.LoadIdentity = function(mat) {
    mat4.identity(_cur) 
  }

  this.LoadMatrix = function(mat) {
    mat4.set(mat, _cur)
  }

  //performs a right multiply. this is negotiable.
  this.MultMatrix = function(mult) {
    mat4.multiply(_cur, mult)
  }

  this.Pop = function() {
    if(stack.length <= 1) throw "popping off empty stack!"

    stack.pop()//could return / use this value if we wanted...
    reset_cur()
  }
}

//this could even be extended to add listeners for when particular textures are loaded
//or, at least, when all the textures have loaded
var TextureDelegate = function(texture_paths) {
  var tex_map = {}

  for(var i = 0; i < texture_paths.length; ++i) {
    (function(){
      var path = texture_paths[i]
      var i = new Image()

      $(i).load(function(){
        alert('texture at path ' + path + ' loaded!')
        tex_map[path].loaded = true
      })

      i.src = texture_paths[i]
      tex_map[path] = {'image':i, 'loaded':false}
    })()
  }

  this.TextureIsLoaded = function(path) {
    return tex_map[path] && tex_map[path].loaded
  }

  this.GetTexFromPath = function(path) {
    return tex_map[path] && tex_map[path].loaded && tex_map[path].image
  }
}

function setupWebGL(canvas, debug) {
    var gl = WebGLUtils.setupWebGL(canvas);
    if(debug) gl = WebGLDebugUtils.makeDebugContext(gl);

    gl.viewportWidth = canvas.width;
    gl.viewportHeight = canvas.height;

    return gl;
}

function loadShader(gl, sname) {
    var shaderScript = document.getElementById(sname);
	if(!shaderScript) return null;

	var shader;
	if(shaderScript.type === "x-shader/x-fragment") {
        shader = gl.createShader(gl.FRAGMENT_SHADER);
    } else if(shaderScript.type === "x-shader/x-vertex") {
        shader = gl.createShader(gl.VERTEX_SHADER);
    } else {
        return null;
	}

    gl.shaderSource(shader, shaderScript.text);
    gl.compileShader(shader);

	if(!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        alert("Shader did not compile: " + gl.getShaderInfoLog(shader));
		return null;
	}

    return shader;
}

function loadShaderProgram(gl, pname) {
    var fragmentShader = loadShader(gl, pname + ".frag.glsl");
	var vertexShader = loadShader(gl, pname + ".vert.glsl");
	var program = gl.createProgram();

	gl.attachShader(program, vertexShader);
	gl.attachShader(program, fragmentShader);

	gl.linkProgram(program);

	if(!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        alert("Shader program fail");
	}

	return program;
}
