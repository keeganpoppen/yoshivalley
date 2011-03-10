attribute vec3 a_position;

uniform mat4 ModelViewProjectionMatrix;

void main(void) {
    gl_Position = ModelViewProjectionMatrix * vec4(a_position, 1.0);
    gl_PointSize = 7.5;
}
