attribute vec3 a_position;
attribute vec2 a_texcoord;
uniform mat4 ModelViewProjectionMatrix;
varying vec2 texcoord;
 
void main(void)
{
    gl_Position = ModelViewProjectionMatrix * vec4(a_position, 1.0);
    texcoord = a_texcoord;
}
