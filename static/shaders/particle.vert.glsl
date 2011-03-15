attribute vec3 a_position;
uniform float particleSize;
uniform mat4 ModelViewProjectionMatrix;

void main(void) {
    gl_Position = ModelViewProjectionMatrix * vec4(a_position, 1.0);
    gl_PointSize = particleSize / length(gl_Position.xyz);
}
