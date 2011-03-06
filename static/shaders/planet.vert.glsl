#ifdef GL_ES
precision highp float;
#endif
 
uniform   mat4 u_mvp;
uniform   mat4 u_mv;
uniform   mat3 u_normalMat;
 
attribute vec3 a_position;
attribute vec3 a_normal;
attribute vec2 a_texcoord;
 
varying   vec3 normal;
varying   vec3 eyePosition;
varying   vec2 texcoord;
 
void main(void)
{
    vec4 eyeTemp = u_mv * vec4(a_position, 1.0);
    eyePosition = eyeTemp.xyz;
  gl_Position = u_mvp * vec4(a_position, 1.0);
    normal = u_normalMat * a_normal;
    texcoord = a_texcoord;
}
