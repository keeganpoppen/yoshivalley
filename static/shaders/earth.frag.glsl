#ifdef GL_ES
precision highp float;
#endif

uniform sampler2D surfaceTexture;
uniform sampler2D spectralTexture;
uniform sampler2D nightTexture;
uniform vec3 planetCenter;
uniform vec3 sunCenter;
uniform vec3 cameraPosition;
 
varying vec3 worldPosition;
varying vec2 texcoord;

void main(void)
{
  vec3 N = normalize(worldPosition - planetCenter);
  vec3 L = normalize(worldPosition - sunCenter);
  vec3 V = normalize(worldPosition - cameraPosition);

  //Specular
  float shininess = 5.0;
  vec3 R = reflect(-L, N);
  float Rs = pow(max(0.0, dot(V, R)), shininess);
  vec3 Ts = texture2D(spectralTexture, texcoord).rgb;
  vec3 specular = Rs * Ts * 0.3;
  
  vec3 daycolor = texture2D(surfaceTexture, texcoord).rgb;
  vec3 nightcolor = texture2D(nightTexture, texcoord).rgb;
  float rd = max(0.0, dot(-L, N)); 
  float rn = 1.0-rd;
  vec3 diffuse = rd * daycolor + rn * nightcolor;

  gl_FragColor = vec4(diffuse + specular, 1.0);
}
