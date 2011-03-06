#ifdef GL_ES
precision highp float;
#endif
 
uniform   mat4 ModelViewProjectionMatrix;
 
attribute vec3 a_position;
attribute vec2 a_texcoord;
 
varying vec2 texcoord;
 
void main(void)
{
    gl_Position = ModelViewProjectionMatrix * vec4(a_position, 1.0);
    texcoord = a_texcoord;
}
