#version 120

// see the GLSL 1.2 specification:
// https://www.khronos.org/registry/OpenGL/specs/gl/GLSLangSpec.1.20.pdf

uniform float time; // current time given from CPU

/**
 * return: signed distance function of a axis aligned box
 * pos: position to evaluate SDF
 * hsize: half size in the XYZ axis
 */
float sdf_box( vec3 pos, vec3 hsize )
{
  vec3 q = abs(pos) - hsize;
  return length(max(q,0.0)) + min(max(q.x,max(q.y,q.z)),0.0);
}

//compute the sdf of sphere
float sdf_sphere( vec3 pos, float s )
{
  return length(pos)-s;
}

//subtract shape1 from shape2
float opSubtraction( float d1, float d2 )
{
    return max(-d1,d2);
}


// Definition of singed distance funtion called from
float SDF(vec3 pos)
{
  // for "problem2", write some code below to return the SDF where
  // many small spheres are caved out from a big sphere.
  // The radius of big sphere is `0.8` and its center is at the origin
  // The radius of the small spheres is `0.12` and it's repeaded at intrval of `0.2` in the grid pattern
  // Look Inigo Quilez's article for hints:
  // https://iquilezles.org/articles/distfunctions/

  //sdf of big sphere
  float dist=sdf_sphere(pos, 0.8);

  //origin of small spheres is (xs,ys,zs)
  for ( float xs=-0.8; xs<=0.8;xs+=0.2)
  {
    for ( float ys=-0.8; ys<=0.8;ys+=0.2)
    {
      for ( float zs=-0.8; zs<=0.8;zs+=0.2)
      {
        //compute the sdf of each small sphere and subtract it
        float dist2=sdf_sphere(pos-vec3(xs,ys,zs),0.12);
        dist=opSubtraction(dist2,dist);
      }
    }
  }

  return dist;

  // for "problem2" the code below is not used.
  //return sdf_box(pos, vec3(0.1,0.2,0.3));
}

void main()
{
  // camera position
  vec3 cam_pos = normalize( vec3(sin(time),cos(time),sin(3*time)) );

  // local frame defined on the cameera
  vec3 frame_z = cam_pos;
  vec3 frame_x = normalize(cross(vec3(0,0,1),frame_z));
  vec3 frame_y = cross(frame_z,frame_x);

  // gl_FragCoord: the coordinate of the pixel
  // left-bottom is (0,0), right-top is (W,H)
  // https://www.khronos.org/registry/OpenGL-Refpages/gl4/html/gl_FragCoord.xhtml
  vec2 scr_xy = gl_FragCoord.xy / vec2(500,500) * 2.0 - vec2(1,1); // canonical screen position [-1,+1] x [-1,+1]
  vec3 src = frame_x * scr_xy.x + frame_y * scr_xy.y + frame_z * 1;  // source of ray from pixel
  vec3 dir = -frame_z;  // direction of ray (looking at the origin)

  vec3 pos_cur = src; // the current ray position
  for(int itr=0;itr<30;++itr){
    float s0 = SDF(pos_cur);
    if( s0 < 0.0 ){ // ray starting from inside the object
      gl_FragColor = vec4(1, 0, 0, 1); // paint red
      return;
    }
    if( s0 < 1.0e-3 ){ // the ray hit the implicit surfacee
      float eps = 1.0e-3;
      float sx = SDF(pos_cur+vec3(eps,0,0))-s0;
      float sy = SDF(pos_cur+vec3(0,eps,0))-s0;
      float sz = SDF(pos_cur+vec3(0,0,eps))-s0;
      vec3 nrm = normalize(vec3(sx,sy,sz)); // normal direction
      float c = -dot(nrm, dir); // Lambersian reflection. The light is at the camera position.
      gl_FragColor = vec4(c, c, c, 1);
      return;
    }
    pos_cur += s0 * dir; // advance ray
  }
  gl_FragColor = vec4(0.5, 0.7, 0.9, 1); // ray doesn't hit the object
}
