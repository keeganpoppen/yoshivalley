/* Mesh:
 *  Float32Array vertices;
 *  Float32Array normals;
 *  Float32Array texCoords;
 *  Uint8Array indices;
 *  String diffiuseTex;
 *  String specularTex;
 *  String bumpTex;
 */

function makeSphere(radius, lats, longs)
{
    var geometryData = [ ];
    var normalData = [ ];
    var texCoordData = [ ];
    var indexData = [ ];

    for (var latNumber = 0; latNumber <= lats; ++latNumber) {
        for (var longNumber = 0; longNumber <= longs; ++longNumber) {
            var theta = latNumber * Math.PI / lats;
            var phi = longNumber * 2 * Math.PI / longs;
            var sinTheta = Math.sin(theta);
            var sinPhi = Math.sin(phi);
            var cosTheta = Math.cos(theta);
            var cosPhi = Math.cos(phi);

            var x = cosPhi * sinTheta;
            var y = cosTheta;
            var z = sinPhi * sinTheta;
            var u = 1-(longNumber/longs);
            var v = latNumber/lats;

            normalData.push(x);
            normalData.push(y);
            normalData.push(z);
            texCoordData.push(u);
            texCoordData.push(v);
            geometryData.push(radius * x);
            geometryData.push(radius * y);
            geometryData.push(radius * z);
        }
    }

    for (var latNumber = 0; latNumber < lats; ++latNumber) {
        for (var longNumber = 0; longNumber < longs; ++longNumber) {
            var first = (latNumber * (longs+1)) + longNumber;
            var second = first + longs + 1;
            indexData.push(first);
            indexData.push(second);
            indexData.push(first+1);

            indexData.push(second);
            indexData.push(second+1);
            indexData.push(first+1);
        }
    }

    var retval = { };
    retval.indices = new Uint16Array(indexData);
    retval.vertices = new Float32Array(geometryData);
    retval.normals = new Float32Array(normalData);
    retval.texCoords = new Float32Array(texCoordData);
    
    return retval;
}

function makeTetrahedronMesh() {
    var verts = [];
    var indices = [];

    verts.push(-1.0,-1.0,0.0);
    verts.push(1.0,-1.0,0.0);
    verts.push(0.0,1.0,0.0);
    verts.push(0.0,0.0,2.0);

    indices.push(0,1,2);
    indices.push(0,1,3);
    indices.push(0,2,3);
    indices.push(1,2,3);

    var mesh = {};
    mesh.vertices = new Float32Array(verts);
    mesh.indices = new Uint16Array(indices);

    return mesh;
}

function makeSphereMesh(radius) {
    var step = 10.0 * Math.PI / 180.0; //5 degrees at a time
    var verts_per_ring = 5.0 * Math.PI / step;

    var verts = [];
    var indices = [];
    verts.push(0,-radius,0);

    //Start with first cap
    var xzRadius = radius*Math.sin(step);
    for(var lon = step; lon < 2*Math.PI; lon += step) {
        var len = verts.push(xzRadius*Math.sin(lon), radius*Math.cos(step), xzRadius*Math.cos(lon));
        indices.push(0, len-2, len-1);
    }
    //Fill in hole at boundary
    indices.push(0, 1, verts_per_ring);

    //All stripes in the middle
    for(var lat = 2*step; lat < Math.PI-step; lat += step) {
        var xzRadius = radius*Math.sin(lat);
        for(var lon = step; lon < 2*Math.PI; lon += step) {
            var len = verts.push(xzRadius*Math.sin(lon), radius*Math.cos(lat), xzRadius*Math.cos(lon));
            indices.push(len-1,len-2,len-verts_per_ring-1);
            indices.push(len-1,len-verts_per_ring);
        }

        //Fill in hole at boundary
        indices.push(len-verts_per_ring,len-1,len-2*verts_per_ring);
        indices.push(len-verts_per_ring,len-2*verts_per_ring,len-2*verts_per_ring+1);
    }

    //Conclude with end cap
    var end = verts.push(0, radius, 0)-1;
    var xzRadius = radius*Math.sin(step);
    for(var lon = step; lon < 2*Math.PI; lon += step) {
        var len = verts.push(xzRadius*Math.sin(lon), radius*Math.cos(step), xzRadius*Math.cos(lon));
        indices.push(end, len-2, len-1);
    }
    //Fill in hole at boundary
    indices.push(end, end+1, end+verts_per_ring);

    var mesh = {};
    mesh.vertices = new Float32Array(verts);
    mesh.indices = new Uint16Array(indices);
    //mesh.vertices = verts;
    //mesh.indices = indices;
    return mesh;
}

function computeNormals(mesh) {
    //for(int i=0; i<mesh.indices.size; i += 3) {
    //    var tri1 = mesh.vertices[i];
        //Where is our vector library?
    //}
}
