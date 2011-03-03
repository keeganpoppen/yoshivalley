/* Mesh:
 *  Float32Array verticies;
 *  Float32Array normals;
 *  Float32Array texCoords;
 *  Uint8Array indicies;
 */

function makeSphereMesh(radius) {
  var step = 10 * Math.PI / 180; //5 degrees at a time
  var verts_per_ring = 5 * Math.PI / step;

  var verts = [];
  var indicies = [];
  verts.push(0,-radius,0);
  
  //Start with first cap
  var xzRadius = radius*Math.sin(step);
  for(var lon = step; lon < 2*Math.PI; lon += step) {
    var len = verts.push(xzRadius*Math.sin(lon), radius*Math.cos(step), xzRadius*Math.cos(lon));
    indicies.push(0, len-2, len-1);
  }
  //Fill in hole at boundary
  indicies.push(0, 1, verts_per_ring);

  //All stripes in the middle
  for(var lat = 2*step; lat < Math.PI-step; lat += step) {
    var xzRadius = radius*Math.sin(lat);
    for(var lon = step; lon < 2*Math.PI; lon += step) {
      var len = verts.push(xzRadius*Math.sin(lon), radius*Math.cos(lat), xzRadius*Math.cos(lon));
      indicies.push(len-1,len-2,len-verts_per_ring-1);
      indicies.push(len-1,len-verts_per_ring);
    }

    //Fill in hole at boundary
    indicies.push(len-verts_per_ring,len-1,len-2*verts_per_ring);
    indicies.push(len-verts_per_ring,len-2*verts_per_ring,len-2*verts_per_ring+1);
  }

  //Conclude with end cap
  var end = verts.push(0, radius, 0)-1;
  var xzRadius = radius*Math.sin(step);
  for(var lon = step; lon < 2*Math.PI; lon += step) {
    var len = verts.push(xzRadius*Math.sin(lon), radius*Math.cos(step), xzRadius*Math.cos(lon));
    indicies.push(end, len-2, len-1);
  }
  //Fill in hole at boundary
  indicies.push(end, end+1, end+verts_per_ring);

  var mesh = {};
  mesh.verticies = new Float32Array(verts);
  mesh.indicies = new Uint16Array(indicies);
  return mesh;
}