#ifdef GL_ES
precision highp float;
#endif
 
uniform  mat4 ModelMatrix;
uniform  mat4 ViewMatrix;
uniform  mat4 ModelViewProjectionMatrix;
 
attribute vec3 a_position;
attribute vec2 a_texcoord;
 
varying vec3 worldPosition;
varying vec2 texcoord;
 
void main(void)
{
    vec4 worldPositionTemp = ModelMatrix * vec4(a_position, 1.0);
    worldPosition = worldPositionTemp.xyz;
    gl_Position = ModelViewProjectionMatrix * vec4(a_position, 1.0);
    texcoord = a_texcoord;
}
