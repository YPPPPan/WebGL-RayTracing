//3456789_123456789_123456789_123456789_123456789_123456789_123456789_123456789_
// (JT: why the numbers? counts columns, helps me keep 80-char-wide listings)

// Tabs set to 2

/*=====================
  VBObox-Lib.js library: 
  ===================== 
Note that you don't really need 'VBObox' objects for any simple, 
    beginner-level WebGL/OpenGL programs: if all vertices contain exactly 
		the same attributes (e.g. position, color, surface normal), and use 
		the same shader program (e.g. same Vertex Shader and Fragment Shader), 
		then our textbook's simple 'example code' will suffice.  
***BUT*** that's rare -- most genuinely useful WebGL/OpenGL programs need 
		different sets of vertices with  different sets of attributes rendered 
		by different shader programs.  THUS a customized VBObox object for each 
		VBO/shader-program pair will help you remember and correctly implement ALL 
		the WebGL/GLSL steps required for a working multi-shader, multi-VBO program.
		
One 'VBObox' object contains all we need for WebGL/OpenGL to render on-screen a 
		set of shapes made from vertices stored in one Vertex Buffer Object (VBO), 
		as drawn by calls to one 'shader program' that runs on your computer's 
		Graphical Processing Unit(GPU), along with changes to values of that shader 
		program's one set of 'uniform' varibles.  
The 'shader program' consists of a Vertex Shader and a Fragment Shader written 
		in GLSL, compiled and linked and ready to execute as a Single-Instruction, 
		Multiple-Data (SIMD) parallel program executed simultaneously by multiple 
		'shader units' on the GPU.  The GPU runs one 'instance' of the Vertex 
		Shader for each vertex in every shape, and one 'instance' of the Fragment 
		Shader for every on-screen pixel covered by any part of any drawing 
		primitive defined by those vertices.
The 'VBO' consists of a 'buffer object' (a memory block reserved in the GPU),
		accessed by the shader program through its 'attribute' variables. Shader's
		'uniform' variable values also get retrieved from GPU memory, but their 
		values can't be changed while the shader program runs.  
		Each VBObox object stores its own 'uniform' values as vars in JavaScript; 
		its 'adjust()'	function computes newly-updated values for these uniform 
		vars and then transfers them to the GPU memory for use by shader program.
I have replaced'cuon-matrix' with the free, open-source 'glmatrix.js' library 
    for vectors, matrices & quaternions: Google it!  This vector/matrix library 
    is more complete, more widely-used, and runs faster than our textbook's 
    'cuon-matrix' library.  The version I put in the 'lib' directory is simple;
    just one file.  Later versions are more complicated, multi-file affairs.

	-------------------------------------------------------
	A MESSY SET OF CUSTOMIZED OBJECTS--NOT REALLY A 'CLASS'
	-------------------------------------------------------
As each 'VBObox' object can contain:
  -- a DIFFERENT GLSL shader program, 
  -- a DIFFERENT set of attributes that define a vertex for that shader program, 
  -- a DIFFERENT number of vertices to used to fill the VBOs in GPU memory, and 
  -- a DIFFERENT set of uniforms transferred to GPU memory for shader use.  
  THUS:
		I don't see any easy way to use the exact same object constructors and 
		prototypes for all VBObox objects.  Every additional VBObox objects may vary 
		substantially, so I recommend that you copy and re-name an existing VBObox 
		prototype object, and modify as needed, as shown here. 
		(e.g. to make the VBObox3 object, copy the VBObox2 constructor and 
		all its prototype functions, then modify their contents for VBObox3 
		activities.)

*/
// Written for EECS 351-2,	Intermediate Computer Graphics,
//							Northwestern Univ. EECS Dept., Jack Tumblin
// 2016.05.26 J. Tumblin-- Created; tested on 'TwoVBOs.html' starter code.
// 2017.02.20 J. Tumblin-- updated for EECS 351-1 use for Project C.
// 2018.04.11 J. Tumblin-- minor corrections/renaming for particle systems.
//    --11e: global 'gl' replaced redundant 'myGL' fcn args; 
//    --12: added 'SwitchToMe()' fcn to simplify 'init()' function and to fix 
//      weird subtle errors that sometimes appear when we alternate 'adjust()'
//      and 'draw()' functions of different VBObox objects. CAUSE: found that
//      only the 'draw()' function (and not the 'adjust()' function) made a full
//      changeover from one VBObox to another; thus calls to 'adjust()' for one
//      VBObox could corrupt GPU contents for another.
//      --Created vboStride, vboOffset members to centralize VBO layout in the 
//      constructor function.
//    -- 13 (abandoned) tried to make a 'core' or 'resuable' VBObox object to
//      which we would add on new properties for shaders, uniforms, etc., but
//      I decided there was too little 'common' code that wasn't customized.
//    --14: improved animation timing; moved all literals to the constructor;
//=============================================================================


//=============================================================================
//=============================================================================
function VBObox0() {  // (JUST ONE instance: as 'preView' var 
											// that shows webGL preview of ray-traced scene)
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox0' object that holds all data and fcns
// needed to render vertices from one Vertex Buffer Object (VBO) using one 
// separate shader program (a vertex-shader & fragment-shader pair) and one
// set of 'uniform' variables.

// Constructor goal: 
// Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
// written into code) in all other VBObox functions. Keeping all these (initial)
// values here, in this one coonstrutor function, ensures we can change them 
// easily WITHOUT disrupting any other code, ever!
  
	this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
  'attribute vec4 a_Position;\n' +	
  'attribute vec4 a_Normal;\n' +	
  'uniform mat4 u_mvpMat, modelview, normalMat;\n' +
  'varying vec3 normalInterp;'+
  'varying vec3 vertPos;'+
  //
  'void main() {\n' +
  'vec4 vertPos4 = modelview * a_Position;'+
  'vertPos = vec3(vertPos4) / vertPos4.w;'+
  'normalInterp = vec3(normalMat * a_Normal);'+
  '  gl_Position = u_mvpMat * a_Position;\n' +
//  '  gl_Position = a_Position;\n' +\
  '}\n';

	this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  'precision mediump float;'+
'varying vec3 normalInterp;'+  // Surface normal
'varying vec3 vertPos;'+       // Vertex position
'uniform float Ka;'+  // Ambient reflection coefficient
'uniform float Kd;'+   // Diffuse reflection coefficient
'uniform float Ks;'+   // Specular reflection coefficient
'uniform float shininessVal;'+ // Shininess
'uniform float mode;'+ // Shininess
'uniform float light1;'+ // Shininess
'uniform float light2;'+ // Shininess
// Material color
'uniform vec3 ambientColor;'+
'uniform vec3 diffuseColor;'+
'uniform vec3 specularColor;'+
'uniform vec3 specularColor2;'+
'uniform vec3 lightPos;'+ // Light position
'uniform vec3 lightPos2;'+ // Light position

'void main() {'+
  'vec3 N = normalize(normalInterp);'+
  'vec3 L = normalize(lightPos - vertPos);'+
  'vec3 L2 = normalize(lightPos2 - vertPos);'+

  // Lambert's cosine law
  'float lambertian = max(dot(N, L), 0.0);'+
  'if(light1 == 0.0){lambertian = 0.0;}'+
  'float lambertian2 = max(dot(N, L2), 0.0);'+
  'if(light2 == 0.0){lambertian2 = 0.0;}'+
  'float specular = 0.0;'+
  'float specular2 = 0.0;'+
  'if(lambertian > 0.0) {'+
    'vec3 R = normalize(reflect(-L, N));'+      // Reflected light vector
    'vec3 V = normalize(lightPos - vertPos);'+ // Vector to viewer
    'vec3 H = normalize(L + V);'+
    // Compute the specular term
    'if(mode == 0.0){'+
    'float specAngle = max(dot(R, V), 0.0);'+
    'specular = pow(specAngle, shininessVal);}'+
    'else{'+
    'float specAngle = max(dot(H, N), 0.0);'+
    'specular = pow(specAngle, shininessVal);}}'+
  'if(lambertian2 > 0.0) {'+
    'vec3 R2 = normalize(reflect(-L2, N));'+      // Reflected light vector
    'vec3 V = normalize(lightPos-vertPos);'+ // Vector to viewer
    'vec3 H2 = normalize(L2 + V);'+
    // Compute the specular term
    'if(mode == 0.0){'+
    'float specAngle2 = max(dot(R2, V), 0.0);'+
    'specular2 = pow(specAngle2, shininessVal);}'+
    'else{'+
    'float specAngle2 = max(dot(H2, N), 0.0);'+
    'specular2 = pow(specAngle2, shininessVal);}}'+
  'gl_FragColor = vec4(Ka * ambientColor +'+
                      'Kd * lambertian * diffuseColor +'+
                      'Kd * lambertian2 * diffuseColor * specularColor2+'+
                      'Ks * specular2 * specularColor2 +'+
                      'Ks * specular * specularColor, 1.0);}'

//--------------Draw XYZ axes as unit-length R,G,B lines:
	this.vboContents = new Float32Array (); 
	this.norContents = new Float32Array (); 
  this.floatsPerVertex = 4;
  this.vboVerts = 0;                // number of vertices used by our 3D axes.

//------------Add more shapes:
  this.bgnGrid = this.vboVerts;     // remember starting vertex for 'grid'
  this.appendWireGroundGrid();      // (see fcn below)
  this.bgnDisk = this.vboVerts;     // and the starting vertex for 'disk'
  this.appendDisk(2);               // (see fcn below)
// /*
 this.bgnSphere = this.vboVerts;    // remember starting vertex for 'sphere'
 this.appendWireSphere();           // create (default-resolution) sphere
 this.bgnBox = this.vboVerts;    // remember starting vertex for 'sphere'
 this.appendLineCube();           // create (default-resolution) sphere
 this.bgnCyl = this.vboVerts;    // remember starting vertex for 'sphere'
 this.appendCylender();           // create (default-resolution) sphere
 this.bgnCone = this.vboVerts;    // remember starting vertex for 'sphere'
 this.appendCone();           // create (default-resolution) sphere
 this.scene = 0;
// 

	this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;
	                              // bytes req'd by 1 vboContents array element;
																// (why? used to compute stride and offset 
																// in bytes for vertexAttribPointer() calls)
  this.vboBytes = this.vboContents.length * this.FSIZE;               
                                // total number of bytes stored in vboContents
                                // (#  of floats in vboContents array) * 
                                // (# of bytes/float).
	this.vboStride = this.vboBytes / this.vboVerts; 
	                              // (== # of bytes to store one complete vertex).
	                              // From any attrib in a given vertex in the VBO, 
	                              // move forward by 'vboStride' bytes to arrive 
	                              // at the same attrib for the next vertex. 

	            //----------------------Attribute sizes
  this.vboFcount_a_Position =  4;// # of floats in the VBO needed to store the
                                // attribute named a_Position (4: x,y,z,w values)

              //----------------------Attribute offsets  
	this.vboOffset_a_Position = 0;// # of bytes from START of vbo to the START
	                              // of 1st a_Position attrib value in vboContents[]
                                // (4 floats * bytes/float) 
                                // # of bytes from START of vbo to the START
                                // of 1st a_Colr0 attrib value in vboContents[]
	            //-----------------------GPU memory locations:
	this.vboLoc;									// GPU Location for Vertex Buffer Object, 
	                              // returned by gl.createBuffer() function call
	this.shaderLoc;								// GPU Location for compiled Shader-program  
	                            	// set by compile/link of VERT_SRC and FRAG_SRC.
								          //------Attribute locations in our shaders:
	this.a_PositionLoc;						// GPU location for 'a_Position' attribute
	this.a_NormalLoc;						// GPU location for 'a_Position' attribute

	            //---------------------- Uniform locations &values in our shaders
	            
// OLD version using cuon-matrix-quat03.js:
//	this.mvpMat = new Matrix4();	// Transforms CVV axes to model axes.

// NEW version using glMatrix.js:
  this.mvpMat = mat4.create();  // Transforms CVV axes to model axes.
	this.u_mvpMatLoc;							// GPU location for u_ModelMat uniform

/*  NO TEXTURE MAPPING HERE.
  this.u_TextureLoc;            // GPU location for texture map (image)
  this.u_SamplerLoc;            // GPU location for texture sampler
*/
}

VBObox0.prototype.appendWireGroundGrid = function() {
//==============================================================================
// Create a set of vertices for an x,y grid of colored lines in the z=0 plane
// centered at x=y=z=0, and store them in local array vertSet[].  
// THEN:
// Append the contents of vertSet[] to existing contents of the this.vboContents 
// array; update this.vboVerts to include these new verts for drawing.
// NOTE: use gl.drawArrays(gl.GL_LINES,,) to draw these vertices.

  //Set # of lines in grid--------------------------------------
	this.xyMax	= 50.0;			// grid size; extends to cover +/-xyMax in x and y.
	this.xCount = 101;			// # of lines of constant-x to draw to make the grid 
	this.yCount = 101;		  // # of lines of constant-y to draw to make the grid 
	                        // xCount, yCount MUST be >1, and should be odd.
	                        // (why odd#? so that we get lines on the x,y axis)
	//Set # vertices per line-------------------------------------
	// You may wish to break up each line into separate line-segments.
	// Here I've split each line into 4 segments; two above, two below the axis.
	// (why? as of 5/2018, Chrome browser sometimes fails to draw lines whose
	// endpoints are well outside of the view frustum (Firefox works OK, though).
  var vertsPerLine = 8;      // # vertices stored in vertSet[] for each line;
  
	//Set vertex contents:----------------------------------------
/*  ALREADY SET in VBObox0 constructor
//	this.floatsPerVertex = 8;  // x,y,z,w; r,g,b,a; 
                             // later add nx,ny,nz; tx,ty,tz, matl, usr; values.
*/
  //Create (local) vertSet[] array-----------------------------
  var vertCount = (this.xCount + this.yCount) * vertsPerLine;
  var vertSet = new Float32Array(vertCount * this.floatsPerVertex); 
  var norSet = new Float32Array(vertCount * this.floatsPerVertex); 
      // This array will hold (xCount+yCount) lines, kept as
      // (xCount+yCount)*vertsPerLine vertices, kept as
      // (xCount+yCount)*vertsPerLine*floatsPerVertex array elements (floats).
  
	// Set Vertex Colors--------------------------------------
  // Each line's color is constant, but set by the line's position in the grid.
  //  For lines of constant-x, the smallest (or most-negative) x-valued line 
  //    gets color xBgnColr; the greatest x-valued line gets xEndColr, 
  //  Similarly, constant-y lines get yBgnColr for smallest, yEndColr largest y.
 	this.xBgnColr = vec4.fromValues(1.0, 0.0, 0.0, 1.0);	  // Red
 	this.xEndColr = vec4.fromValues(0.0, 1.0, 1.0, 1.0);    // Cyan
 	this.yBgnColr = vec4.fromValues(0.0, 1.0, 0.0, 1.0);	  // Green
 	this.yEndColr = vec4.fromValues(1.0, 0.0, 1.0, 1.0);    // Magenta

  // Compute how much the color changes between 1 line and the next:
  var xColrStep = vec4.create();  // [0,0,0,0]
  var yColrStep = vec4.create();
  vec4.subtract(xColrStep, this.xEndColr, this.xBgnColr); // End - Bgn
  vec4.subtract(yColrStep, this.yEndColr, this.yBgnColr);
  vec4.scale(xColrStep, xColrStep, 1.0/(this.xCount -1)); // scale by # of lines
  vec4.scale(yColrStep, yColrStep, 1.0/(this.yCount -1));

  // Local vars for vertex-making loops-------------------
	var xgap = 2*this.xyMax/(this.xCount-1);		// Spacing between lines in x,y;
	var ygap = 2*this.xyMax/(this.yCount-1);		// (why 2*xyMax? grid spans +/- xyMax).
  var xNow;           // x-value of the current line we're drawing
  var yNow;           // y-value of the current line we're drawing.
  var line = 0;       // line-number (we will draw xCount or yCount lines, each
                      // made of vertsPerLine vertices),
  var v = 0;          // vertex-counter, used for the entire grid;
  var idx = 0;        // vertSet[] array index.
  var colrNow = vec4.create();   // color of the current line we're drawing.

  //----------------------------------------------------------------------------
  // 1st BIG LOOP: makes all lines of constant-x
  for(line=0; line<this.xCount; line++) {   // for every line of constant x,
    colrNow = vec4.scaleAndAdd(             // find the color of this line,
              colrNow, this.xBgnColr, xColrStep, line);	
    xNow = -this.xyMax + (line*xgap);       // find the x-value of this line,    
    for(i=0; i<vertsPerLine; i++, v++, idx += this.floatsPerVertex) 
    { // for every vertex in this line,  find x,y,z,w;  r,g,b,a;
      // and store them sequentially in vertSet[] array.
      // We already know  xNow; find yNow:
      switch(i) { // find y coord value for each vertex in this line:
        case 0: yNow = -this.xyMax;   break;  // start of 1st line-segment;
        case 1:                               // end of 1st line-segment, and
        case 2: yNow = -this.xyMax/2; break;  // start of 2nd line-segment;
        case 3:                               // end of 2nd line-segment, and
        case 4: yNow = 0.0;           break;  // start of 3rd line-segment;
        case 5:                               // end of 3rd line-segment, and
        case 6: yNow = this.xyMax/2;  break;  // start of 4th line-segment;
        case 7: yNow = this.xyMax;    break;  // end of 4th line-segment.
        default: 
          console.log("VBObox0.appendWireGroundGrid() !ERROR! **X** line out-of-bounds!!\n\n");
        break;
      } // set all values for this vertex:
      vertSet[idx  ] = xNow;            // x value
      vertSet[idx+1] = yNow;            // y value
      vertSet[idx+2] = 0.0;             // z value
      vertSet[idx+3] = 1.0;             // w;
      norSet[idx  ] = 0.0;            // x value
      norSet[idx+1] = 0.0;            // y value
      norSet[idx+2] = 1.0;             // z value
      norSet[idx+3] = 0.0;             // w;
    }
  }
  //----------------------------------------------------------------------------
  // 2nd BIG LOOP: makes all lines of constant-y
  for(line=0; line<this.yCount; line++) {   // for every line of constant y,
    colrNow = vec4.scaleAndAdd(             // find the color of this line,
              colrNow, this.yBgnColr, yColrStep, line);	
    yNow = -this.xyMax + (line*ygap);       // find the y-value of this line,    
    for(i=0; i<vertsPerLine; i++, v++, idx += this.floatsPerVertex) 
    { // for every vertex in this line,  find x,y,z,w;  r,g,b,a;
      // and store them sequentially in vertSet[] array.
      // We already know  yNow; find xNow:
      switch(i) { // find y coord value for each vertex in this line:
        case 0: xNow = -this.xyMax;   break;  // start of 1st line-segment;
        case 1:                               // end of 1st line-segment, and
        case 2: xNow = -this.xyMax/2; break;  // start of 2nd line-segment;
        case 3:                               // end of 2nd line-segment, and
        case 4: xNow = 0.0;           break;  // start of 3rd line-segment;
        case 5:                               // end of 3rd line-segment, and
        case 6: xNow = this.xyMax/2;  break;  // start of 4th line-segment;
        case 7: xNow = this.xyMax;    break;  // end of 4th line-segment.
        default: 
          console.log("VBObox0.appendWireGroundGrid() !ERROR! **Y** line out-of-bounds!!\n\n");
        break;
      } // Set all values for this vertex:
      vertSet[idx  ] = xNow;            // x value
      vertSet[idx+1] = yNow;            // y value
      vertSet[idx+2] = 0.0;             // z value
      vertSet[idx+3] = 1.0;             // w;
      norSet[idx  ] = 0.0;            // x value
      norSet[idx+1] = 0.0;            // y value
      norSet[idx+2] = 1.0;             // z value
      norSet[idx+3] = 0.0;             // w;
    }
  }

/*
 // SIMPLEST-POSSIBLE vertSet[] array:
  var vertSet = new Float32Array([    // a vertSet[] array of just 1 green line:
      -1.00, 0.50, 0.0, 1.0,  	0.0, 1.0, 0.0, 1.0,	// GREEN
       1.00, 0.50, 0.0, 1.0,  	0.0, 1.0, 0.0, 1.0,	// GREEN
     ], this.vboContents.length);
  vertCount = 2;
*/
  // Now APPEND this to existing VBO contents:
  // Make a new array (local) big enough to hold BOTH vboContents & vertSet:
var tmp = new Float32Array(this.vboContents.length + vertSet.length);
  tmp.set(this.vboContents, 0);     // copy old VBOcontents into tmp, and
  tmp.set(vertSet,this.vboContents.length); // copy new vertSet just after it.
  this.vboVerts += vertCount;       // find number of verts in both.
  this.vboContents = tmp;           // REPLACE old vboContents with tmp

  var tmp = new Float32Array(this.norContents.length + norSet.length);
  tmp.set(this.norContents, 0);     // copy old VBOcontents into tmp, and
  tmp.set(norSet,this.norContents.length); // copy new vertSet just after it.
  this.norContents = tmp;           // REPLACE old vboContents with tmp
}

VBObox0.prototype.appendDisk = function(rad) {
//==============================================================================
// Create a set of vertices to draw a grid of colored lines that form a disk of
// radius 'rad' in the xy plane centered at world-space origin (x=y=z=0)
// and store them in local array vertSet[].  
// THEN:
// Append the contents of vertSet[] to existing contents of the this.vboContents 
// array; update this.vboVerts to include these new verts for drawing.
// NOTE: use gl.drawArrays(gl.GL_LINES,...) to draw these vertices.
  if(rad == undefined) rad = 3;   // default value.
  //Set # of lines in grid--------------------------------------
	this.xyMax	= rad;    // grid size; extends to cover +/-xyMax in x and y.
	this.xCount = rad*5 +1;	// # of lines of constant-x to draw to make the grid 
	this.yCount = rad*5 +1;	// # of lines of constant-y to draw to make the grid 
	                        // xCount, yCount MUST be >1, and should be odd.
	                        // (why odd#? so that we get lines on the x,y axis)
  var vertsPerLine =2;    // # vertices stored in vertSet[] for each line;
	//Set vertex contents:----------------------------------------
/*  ALREADY SET in VBObox0 constructor
	this.floatsPerVertex = 8;  // x,y,z,w;  r,g,b,a values.
*/	
  //Create (local) vertSet[] array-----------------------------
  var vertCount = (this.xCount + this.yCount) * vertsPerLine;
  var vertSet = new Float32Array(vertCount * this.floatsPerVertex); 
  var norSet = new Float32Array(vertCount * this.floatsPerVertex); 
      // This array will hold (xCount+yCount) lines, kept as
      // (xCount+yCount)*vertsPerLine vertices, kept as
      // (xCount+yCount)*vertsPerLine*floatsPerVertex array elements (floats).
  
	// Set Vertex Colors--------------------------------------
  // Each line's color is constant, but set by the line's position in the grid.
  //  For lines of constant-x, the smallest (or most-negative) x-valued line 
  //    gets color xBgnColr; the greatest x-valued line gets xEndColr, 
  //  Similarly, constant-y lines get yBgnColr for smallest, yEndColr largest y.
 	var xColr = vec4.fromValues(1.0, 1.0, 0.3, 1.0);	   // Light Yellow
 	var yColr = vec4.fromValues(0.3, 1.0, 1.0, 1.0);    // Light Cyan

  // Local vars for vertex-making loops-------------------
	var xgap = 2*this.xyMax/(this.xCount-2);		// Spacing between lines in x,y;
	var ygap = 2*this.xyMax/(this.yCount-2);		// (why 2*xyMax? grid spans +/- xyMax).
  var xNow;           // x-value of the current line we're drawing
  var yNow;           // y-value of the current line we're drawing.
  var diff;           // half-length of each line we draw.
  var line = 0;       // line-number (we will draw xCount or yCount lines, each
                      // made of vertsPerLine vertices),
  var v = 0;          // vertex-counter, used for the entire grid;
  var idx = 0;        // vertSet[] array index.
  //----------------------------------------------------------------------------
  // 1st BIG LOOP: makes all lines of constant-x
  for(line=0; line<this.xCount; line++) {   // for every line of constant x,
    xNow = -this.xyMax + (line+0.5)*xgap;       // find the x-value of this line,    
    diff = Math.sqrt(rad*rad - xNow*xNow);  // find +/- y-value of this line,
    for(i=0; i<vertsPerLine; i++, v++, idx += this.floatsPerVertex) 
    { // for every vertex in this line,  find x,y,z,w;  r,g,b,a;
      // and store them sequentially in vertSet[] array.
      // we already know the xNow value for this vertex; find the yNow:
      if(i==0) yNow = -diff;  // line start
      else yNow = diff;       // line end.
      // set all values for this vertex:
      vertSet[idx  ] = xNow;            // x value
      vertSet[idx+1] = yNow;            // y value
      vertSet[idx+2] = 0.0;             // z value
      vertSet[idx+3] = 1.0;             // w;
      norSet[idx  ] = 0.0;            // x value
      norSet[idx+1] = 0.0;            // y value
      norSet[idx+2] = 1.0;             // z value
      norSet[idx+3] = 0.0;             // w;
    }
  }
  //---------------------------------------------------------------------------
  // 2nd BIG LOOP: makes all lines of constant-y
  for(line=0; line<this.yCount; line++) {   // for every line of constant y,
    yNow = -this.xyMax + (line+0.5)*ygap;       // find the y-value of this line,  
    diff = Math.sqrt(rad*rad - yNow*yNow);  // find +/- y-value of this line,  
    for(i=0; i<vertsPerLine; i++, v++, idx += this.floatsPerVertex) 
    { // for every vertex in this line,  find x,y,z,w;  r,g,b,a;
      // and store them sequentially in vertSet[] array.
      // We already know  yNow; find the xNow:
      if(i==0) xNow = -diff;  // line start
      else xNow = diff;       // line end.
      // Set all values for this vertex:
      vertSet[idx  ] = xNow;            // x value
      vertSet[idx+1] = yNow;            // y value
      vertSet[idx+2] = 0.0;             // z value
      vertSet[idx+3] = 1.0;             // w;
      norSet[idx  ] = 0.0;            // x value
      norSet[idx+1] = 0.0;            // y value
      norSet[idx+2] = 1.0;             // z value
      norSet[idx+3] = 0.0;             // w;
    }
  }
  // Now APPEND this to existing VBO contents:
  // Make a new array (local) big enough to hold BOTH vboContents & vertSet:
var tmp = new Float32Array(this.vboContents.length + vertSet.length);
  tmp.set(this.vboContents, 0);     // copy old VBOcontents into tmp, and
  tmp.set(vertSet,this.vboContents.length); // copy new vertSet just after it.
  this.vboVerts += vertCount;       // find number of verts in both.
  this.vboContents = tmp;           // REPLACE old vboContents with tmp
  
  var tmp = new Float32Array(this.norContents.length + norSet.length);
  tmp.set(this.norContents, 0);     // copy old VBOcontents into tmp, and
  tmp.set(norSet,this.norContents.length); // copy new vertSet just after it.
  this.norContents = tmp;           // REPLACE old vboContents with tmp
}

// make our own local fcn to convert polar to rectangular coords:
VBObox0.prototype.polar2xyz = function(out4, fracEW, fracNS) {
//------------------------------------------------------------------------------
// Set the vec4 argument 'out4' to the 3D point on the unit sphere described by 
// normalized longitude and lattitude angles: 0 <= fracEW, fracNS <= 1.
// Define sphere as radius == 1 and centered at the origin, 
//  with its 'north pole' point at (0,0,+1),        where fracNS = 1.0,
//       its equator at the xy plane (where z==0)   where fracNS = 0.5,
//   and it's 'south pole' point at (0,0,-1),       where fracNS = 0.0.
// The sphere's equator, located at 'normalized lattitude' fracNS = 0.5,
// defines the +x axis point as fracEW==0.0, and Longitude increases CCW or 
// 'eastwards' around the equator to reach fracEW==0.25 at the +y axis and on up
// to 0.5 at -x axis, on up to 0.75 at -y axis, and on up until we return to +x.
  var sEW = Math.sin(2.0*Math.PI*fracEW);
  var cEW = Math.cos(2.0*Math.PI*fracEW);
  var sNS = Math.sin(Math.PI*fracNS);
  var cNS = Math.cos(Math.PI*fracNS);
  vec4.set(out4,  cEW * sNS,      // x = cos(EW)sin(NS);
                  sEW * sNS,      // y = sin(EW)sin(NS);
                  cNS, 1.0);      // z =        cos(NS); w=1.0  (point, not vec)
}

VBObox0.prototype.appendWireSphere = function() {
//==============================================================================
// Create a set of vertices to draw grid of colored lines that form a 
// sphere of radius 1, centered at x=y=z=0, when drawn with LINE_STRIP primitive
// THEN:
// Append the contents of vertSet[] to existing contents of the this.vboContents 
// array; update this.vboVerts to include these new verts for drawing.
// NOTE: use gl.drawArrays(gl.GL_LINES,...) to draw these vertices.

// set # of vertices in each ring of constant lattitude  (EWcount) and
// number of rings of constant lattitude (NScount)
  var slices = 13;		// # of slices of the sphere along the z axis. >=3 req'd
											// (choose odd # or prime# to avoid accidental symmetry)
  var sliceVerts	= 27;	// # of vertices around the top edge of the slice
											// (same number of vertices on bottom of slice, too)
  var topColr = new Float32Array([1.0, 1.0, 0.1]);	// North Pole: light gray
  var equColr = new Float32Array([1.0, 0.5, 0.8]);	// Equator:    bright green
  var equ2Colr = new Float32Array([1.0, 0.3, 0.8]);	// Equator:    bright green
  var botColr = new Float32Array([0.2, 1.0, 0.8]);	// South Pole: brightest gray.
  var sliceAngle = Math.PI/slices;	// lattitude angle spanned by one slice.
  var floatsPerVertex = 4;

	// Create a (global) array to hold this sphere's vertices:
  sphVerts = new Float32Array(  ((slices * 2* sliceVerts) -2) * floatsPerVertex);
  var norSet = new Float32Array(((slices * 2* sliceVerts) -2)  * floatsPerVertex); 
										// # of vertices * # of elements needed to store them. 
										// each slice requires 2*sliceVerts vertices except 1st and
										// last ones, which require only 2*sliceVerts-1.
										
	// Create dome-shaped top slice of sphere at z=+1
	// s counts slices; v counts vertices; 
	// j counts array elements (vertices * elements per vertex)
	var cos0 = 0.0;					// sines,cosines of slice's top, bottom edge.
	var sin0 = 0.0;
	var cos1 = 0.0;
	var sin1 = 0.0;	
	var j = 0;							// initialize our array index
	var isLast = 0;
	var isFirst = 1;
	for(s=0; s<slices; s++) {	// for each slice of the sphere,
		// find sines & cosines for top and bottom of this slice
		if(s==0) {
			isFirst = 1;	// skip 1st vertex of 1st slice.
			cos0 = 1.0; 	// initialize: start at north pole.
			sin0 = 0.0;
		}
		else {					// otherwise, new top edge == old bottom edge
			isFirst = 0;	
			cos0 = cos1;
			sin0 = sin1;
		}								// & compute sine,cosine for new bottom edge.
		cos1 = Math.cos((s+1)*sliceAngle);
		sin1 = Math.sin((s+1)*sliceAngle);
		// go around the entire slice, generating TRIANGLE_STRIP verts
		// (Note we don't initialize j; grows with each new attrib,vertex, and slice)
		if(s==slices-1) isLast=1;	// skip last vertex of last slice.
		for(v=isFirst; v< 2*sliceVerts-isLast; v++, j+=floatsPerVertex) {	
			if(v%2==0)
			{				// put even# vertices at the the slice's top edge
							// (why PI and not 2*PI? because 0 <= v < 2*sliceVerts
							// and thus we can simplify cos(2*PI(v/2*sliceVerts))  
				sphVerts[j  ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts); 	
				sphVerts[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);	
				sphVerts[j+2] = cos0;		
				sphVerts[j+3] = 1.0;			
        norSet[j ] = sin0 * Math.cos(Math.PI*(v)/sliceVerts);            // x value
        norSet[j+1] = sin0 * Math.sin(Math.PI*(v)/sliceVerts);            // y value
        norSet[j+2] = cos0;             // z value
        norSet[j+3] = 0.0;             // w;
			}
			else { 	// put odd# vertices around the slice's lower edge;
							// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
							// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
				sphVerts[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);		// x
				sphVerts[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);		// y
				sphVerts[j+2] = cos1;																				// z
				sphVerts[j+3] = 1.0;																				// w.		
        norSet[j  ] = sin1 * Math.cos(Math.PI*(v-1)/sliceVerts);            // x value
        norSet[j+1] = sin1 * Math.sin(Math.PI*(v-1)/sliceVerts);            // y value
        norSet[j+2] = cos1;             // z value
        norSet[j+3] = 0.0;             // w;
			}
		}
	}
  var tmp = new Float32Array(this.vboContents.length + sphVerts.length);
  tmp.set(this.vboContents, 0);     // copy old VBOcontents into tmp, and
  tmp.set(sphVerts,this.vboContents.length); // copy new vertSet just after it.
  this.vboVerts += sphVerts.length/4;       // find number of verts in both.
  this.vboContents = tmp;           // REPLACE old vboContents with tmp

  var tmp = new Float32Array(this.norContents.length + norSet.length);
  tmp.set(this.norContents, 0);     // copy old VBOcontents into tmp, and
  tmp.set(norSet,this.norContents.length); // copy new vertSet just after it.
  this.norContents = tmp;           // REPLACE old vboContents with tmp
}

VBObox0.prototype.appendLineCube = function() {
var vertSet = [
  1.0,1.0,1.0,1.0,
  -1.0,1.0,1.0,1.0,
  1.0,1.0,-1.0,1.0,

  -1.0,1.0,1.0,1.0,
  -1.0,1.0,-1.0,1.0,
  1.0,1.0,-1.0,1.0,

  -1.0,1.0,-1.0,1.0,
  -1.0,1.0,1.0,1.0,
  -1.0,-1.0,-1.0,1.0,
  
  -1.0,-1.0,-1.0,1.0,
  -1.0,1.0,1.0,1.0,
  -1.0,-1.0,1.0,1.0,
  
  -1.0,-1.0,-1.0,1.0,
  -1.0,-1.0,1.0,1.0,
  1.0,-1.0,-1.0,1.0,
  
  1.0,-1.0,-1.0,1.0,
  -1.0,-1.0,1.0,1.0,
  1.0,-1.0,1.0,1.0,
  
  1.0,-1.0,-1.0,1.0,
  1.0,-1.0,1.0,1.0,
  1.0,1.0,1.0,1.0,
  
  1.0,-1.0,-1.0,1.0,
  1.0,1.0,1.0,1.0,
  1.0,1.0,-1.0,1.0,

  1.0,-1.0,1.0,1.0,
  -1.0,-1.0,1.0,1.0,
  1.0,1.0,1.0,1.0,
  
  1.0,1.0,1.0,1.0,
  -1.0,-1.0,1.0,1.0,
  -1.0,1.0,1.0,1.0,

  1.0,-1.0,-1.0,1.0,
  1.0,1.0,-1.0,1.0,
  -1.0,-1.0,-1.0,1.0,
  
  1.0,1.0,-1.0,1.0,
  -1.0,1.0,-1.0,1.0,
  -1.0,-1.0,-1.0,1.0,
  ]

var norSet = [
  0.0,1.0,0.0,0.0,
  0.0,1.0,0.0,0.0,
  0.0,1.0,0.0,0.0,

  0.0,1.0,0.0,0.0,
  0.0,1.0,0.0,0.0,
  0.0,1.0,0.0,0.0,

  -1.0,0.0,0.0,0.0,
  -1.0,0.0,0.0,0.0,
  -1.0,0.0,0.0,0.0,
  
  -1.0,0.0,0.0,0.0,
  -1.0,0.0,0.0,0.0,
  -1.0,0.0,0.0,0.0,
  
  0.0,-1.0,0.0,0.0,
  0.0,-1.0,0.0,0.0,
  0.0,-1.0,0.0,0.0,
  
  0.0,-1.0,0.0,0.0,
  0.0,-1.0,0.0,0.0,
  0.0,-1.0,0.0,0.0,
  
  1.0,0.0,0.0,0.0,
  1.0,0.0,0.0,0.0,
  1.0,0.0,0.0,0.0,
  
  1.0,0.0,0.0,0.0,
  1.0,0.0,0.0,0.0,
  1.0,0.0,0.0,0.0,

  0.0,0.0,1.0,0.0,
  0.0,0.0,1.0,0.0,
  0.0,0.0,1.0,0.0,
  
  0.0,0.0,1.0,0.0,
  0.0,0.0,1.0,0.0,
  0.0,0.0,1.0,0.0,

  0.0,0.0,-1.0,0.0,
  0.0,0.0,-1.0,0.0,
  0.0,0.0,-1.0,0.0,
  
  0.0,0.0,-1.0,0.0,
  0.0,0.0,-1.0,0.0,
  0.0,0.0,-1.0,0.0,
  ]
var tmp = new Float32Array(this.vboContents.length + vertSet.length);
  tmp.set(this.vboContents, 0);     // copy old VBOcontents into tmp, and
  tmp.set(vertSet,this.vboContents.length); // copy new vertSet just after it.
  this.vboVerts += vertSet.length/4;       // find number of verts in both.
  this.vboContents = tmp;           // REPLACE old vboContents with tmp

  var tmp = new Float32Array(this.norContents.length + norSet.length);
  tmp.set(this.norContents, 0);     // copy old VBOcontents into tmp, and
  tmp.set(norSet,this.norContents.length); // copy new vertSet just after it.
  this.norContents = tmp;           // REPLACE old vboContents with tmp
}

VBObox0.prototype.appendCylender = function(){
  var ctrColr = new Float32Array([0.1, 0.1, 0.1]);	// dark gray
 var topColr = new Float32Array([0.1, 0.1, 0.1]);	// light green
 var botColr = new Float32Array([0.1, 0.1, 0.1]);	// light blue
 var capVerts = 16;	// # of vertices around the topmost 'cap' of the shape
 var botRadius = 1;		// radius of bottom of cylinder (top always 1.0)
 
 // Create a (global) array to hold this cylinder's vertices;
 var floatsPerVertex = 4;
 cylVerts = new Float32Array(  ((capVerts*6) -2) * floatsPerVertex);
  var norSet = new Float32Array(((capVerts*6) -2) * floatsPerVertex); 
										// # of vertices * # of elements needed to store them. 

	// Create circle-shaped top cap of cylinder at z=+1.0, radius 1.0
	// v counts vertices: j counts array elements (vertices * elements per vertex)
	for(v=1,j=0; v<2*capVerts; v++,j+=floatsPerVertex) {	
		// skip the first vertex--not needed.
		if(v%2==0)
		{				// put even# vertices at center of cylinder's top cap:
			cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,1,1
			cylVerts[j+1] = 0.0;	
			cylVerts[j+2] = 1.0; 
			cylVerts[j+3] = 1.0;			// r,g,b = topColr[]
      norSet[j  ] = 0.0;            // x value
      norSet[j+1] = 0.0;            // y value
      norSet[j+2] = 1.0;             // z value
      norSet[j+3] = 0.0;             // w;
		}
		else { 	// put odd# vertices around the top cap's outer edge;
						// x,y,z,w == cos(theta),sin(theta), 1.0, 1.0
						// 					theta = 2*PI*((v-1)/2)/capVerts = PI*(v-1)/capVerts
			cylVerts[j  ] = Math.cos(Math.PI*(v-1)/capVerts);			// x
			cylVerts[j+1] = Math.sin(Math.PI*(v-1)/capVerts);			// y
			//	(Why not 2*PI? because 0 < =v < 2*capVerts, so we
			//	 can simplify cos(2*PI * (v-1)/(2*capVerts))
			cylVerts[j+2] = 1.0;	// z
			cylVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
      norSet[j  ] = 0.0;            // x value
      norSet[j+1] = 0.0;            // y value
      norSet[j+2] = 1.0;             // z value
      norSet[j+3] = 0.0;             // w;
		}
	}
	// Create the cylinder side walls, made of 2*capVerts vertices.
	// v counts vertices within the wall; j continues to count array elements
	for(v=0; v< 2*capVerts; v++, j+=floatsPerVertex) {
		if(v%2==0)	// position all even# vertices along top cap:
		{		
				cylVerts[j  ] = Math.cos(Math.PI*(v)/capVerts);		// x
				cylVerts[j+1] = Math.sin(Math.PI*(v)/capVerts);		// y
				cylVerts[j+2] = 1.0;	// z
				cylVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
        norSet[j  ] = Math.cos(Math.PI*(v)/capVerts);            // x value
        norSet[j+1] = Math.sin(Math.PI*(v)/capVerts);	           // y value
        norSet[j+2] = 0.0;             // z value
        norSet[j+3] = 0.0;             // w;
		}
		else		// position all odd# vertices along the bottom cap:
		{
				cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v-1)/capVerts);		// x
				cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v-1)/capVerts);		// y
				cylVerts[j+2] =-1.0;	// z
				cylVerts[j+3] = 1.0;	// w.
				// r,g,b = topColr[]
        norSet[j  ] = botRadius * Math.cos(Math.PI*(v-1)/capVerts);	           // x value
        norSet[j+1] = botRadius * Math.sin(Math.PI*(v-1)/capVerts);	           // y value
        norSet[j+2] = 0.0;             // z value
        norSet[j+3] = 0.0;   
		}
	}
	// Create the cylinder bottom cap, made of 2*capVerts -1 vertices.
	// v counts the vertices in the cap; j continues to count array elements
	for(v=0; v < (2*capVerts -1); v++, j+= floatsPerVertex) {
		if(v%2==0) {	// position even #'d vertices around bot cap's outer edge
			cylVerts[j  ] = botRadius * Math.cos(Math.PI*(v)/capVerts);		// x
			cylVerts[j+1] = botRadius * Math.sin(Math.PI*(v)/capVerts);		// y
			cylVerts[j+2] =-1.0;	// z
			cylVerts[j+3] = 1.0;	// w.
			// r,g,b = topColr[]
      norSet[j  ] = 0.0;            // x value
      norSet[j+1] = 0.0;            // y value
      norSet[j+2] = -1.0;             // z value
      norSet[j+3] = 0.0;             // w;
		}
		else {				// position odd#'d vertices at center of the bottom cap:
			cylVerts[j  ] = 0.0; 			// x,y,z,w == 0,0,-1,1
			cylVerts[j+1] = 0.0;	
			cylVerts[j+2] =-1.0; 
			cylVerts[j+3] = 1.0;			// r,g,b = botColr[]
      norSet[j  ] = 0.0;            // x value
      norSet[j+1] = 0.0;            // y value
      norSet[j+2] = -1.0;             // z value
      norSet[j+3] = 0.0;             // w;
		}
	}
  var tmp = new Float32Array(this.vboContents.length + cylVerts.length);
  tmp.set(this.vboContents, 0);     // copy old VBOcontents into tmp, and
  tmp.set(cylVerts,this.vboContents.length); // copy new vertSet just after it.
  this.vboVerts += cylVerts.length/4;       // find number of verts in both.
  this.vboContents = tmp;           // REPLACE old vboContents with tmp

  var tmp = new Float32Array(this.norContents.length + norSet.length);
  tmp.set(this.norContents, 0);     // copy old VBOcontents into tmp, and
  tmp.set(norSet,this.norContents.length); // copy new vertSet just after it.
  this.norContents = tmp;           // REPLACE old vboContents with tmp
}

VBObox0.prototype.appendCone = function(){
  var sliceVerts	= 54;	// # of vertices around the top edge of the slice
											// (same number of vertices on bottom of slice, too)
  var topColr = new Float32Array([1.0, 1.0, 0.8]);	// North Pole: light gray
  var equColr = new Float32Array([1.0, 1.0, 0.8]);	// Equator:    bright green
  var equ2Colr = new Float32Array([1.0, 1.0, 0.8]);	// Equator:    bright green
  var botColr = new Float32Array([1.0, 1.0, 0.8]);	// South Pole: brightest gray.
  var floatsPerVertex = 4;

	// Create a (global) array to hold this sphere's vertices:
  coneVerts = new Float32Array(  ((2* sliceVerts) +1) * floatsPerVertex);
  var norSet = new Float32Array(((2* sliceVerts) +1) * floatsPerVertex); 
										// # of vertices * # of elements needed to store them. 
										// each slice requires 2*sliceVerts vertices except 1st and
										// last ones, which require only 2*sliceVerts-1.
										
	// Create dome-shaped top slice of sphere at z=+1
	// s counts slices; v counts vertices; 
	// j counts array elements (vertices * elements per vertex)
  for (var i = 0; i < sliceVerts; i++) {
	  if (i == 0) {
		  coneVerts[i] = Math.sin(Math.PI*i*2/sliceVerts);
		  coneVerts[i+1] = Math.cos(Math.PI*i*2/sliceVerts);
		  coneVerts[i+2] = -1;
		  coneVerts[i+3] = 1;
      norSet[i  ] = Math.sin(Math.PI*i*2/sliceVerts);            // x value
      norSet[i+1] = Math.cos(Math.PI*i*2/sliceVerts);            // y value
      norSet[i+2] = 0.5;             // z value
      norSet[i+3] = 0.0;             // w;
	  }
	  for (var j = 0; j < 2; j++) {
		  if (j == 1) {
			  coneVerts[(i*2+j+1)*floatsPerVertex] = Math.sin(Math.PI*(i+1)*2/sliceVerts);
		  	coneVerts[(i*2+j+1)*floatsPerVertex+1] = Math.cos(Math.PI*(i+1)*2/sliceVerts);
		    coneVerts[(i*2+j+1)*floatsPerVertex+2] = -1;
        norSet[(i*2+j+1)*floatsPerVertex  ] = Math.sin(Math.PI*(i+1)*2/sliceVerts);          // x value
        norSet[(i*2+j+1)*floatsPerVertex+1] = Math.cos(Math.PI*(i+1)*2/sliceVerts);           // y value
        norSet[(i*2+j+1)*floatsPerVertex+2] = 0.5;             // z value
        norSet[(i*2+j+1)*floatsPerVertex+3] = 0.0;             // w;
		  }
		  else {
			  coneVerts[(i*2+j+1)*floatsPerVertex] = 0;
		  	coneVerts[(i*2+j+1)*floatsPerVertex+1] = 0;
		    coneVerts[(i*2+j+1)*floatsPerVertex+2] = 1;
        norSet[(i*2+j+1)*floatsPerVertex  ] = Math.sin(Math.PI*i*2/sliceVerts);          // x value
        norSet[(i*2+j+1)*floatsPerVertex+1] = Math.cos(Math.PI*i*2/sliceVerts);           // y value
        norSet[(i*2+j+1)*floatsPerVertex+2] = 0.5;             // z value
        norSet[(i*2+j+1)*floatsPerVertex+3] = 0.0;             // w;
		  }
		  coneVerts[(i*2+j+1)*floatsPerVertex+3] = 1;
	  }
  }
  var tmp = new Float32Array(this.vboContents.length + coneVerts.length);
  tmp.set(this.vboContents, 0);     // copy old VBOcontents into tmp, and
  tmp.set(coneVerts,this.vboContents.length); // copy new vertSet just after it.
  this.vboVerts += coneVerts.length/4;       // find number of verts in both.
  this.vboContents = tmp;           // REPLACE old vboContents with tmp

  var tmp = new Float32Array(this.norContents.length + norSet.length);
  tmp.set(this.norContents, 0);     // copy old VBOcontents into tmp, and
  tmp.set(norSet,this.norContents.length); // copy new vertSet just after it.
  this.norContents = tmp;           // REPLACE old vboContents with tmp
}

VBObox0.prototype.init = function() {
//==============================================================================
// Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
// already created in this VBObox by its constructor function VBObox0();
// NOTE: The init() function is usually called only once, within main())
// Specifically:
// a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
//  executable 'program' stored and ready to use inside the GPU.  
// b) create a new VBO object in GPU memory and fill it by transferring in all
//  the vertex data held in our Float32array member 'VBOcontents'. 
// c) If shader uses texture-maps, create and load them and their samplers,
// d) Find & save the GPU location of all our shaders' attribute-variables and 
//  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
// -------------------
// CAREFUL!  before you can draw pictures using this VBObox contents, 
//  be sure to call this VBObox object's switchToMe() function too!
//--------------------
  
// a) Compile,link,upload shaders-----------------------------------------------
	this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
// CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
//  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

	gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

// b) Create VBO on GPU, fill it------------------------------------------------
	this.vboLoc = gl.createBuffer();	
	this.norLoc = gl.createBuffer();	
  if (!this.vboLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
    return;
  }
  // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
  //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
  // (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
  // that each select one vertex from a vertex array stored in another VBO.
  gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
  								this.vboLoc);				  // the ID# the GPU uses for this buffer.

  // Fill the GPU's newly-created VBO object with the vertex data we stored in
  //  our 'vboContents' member (JavaScript Float32Array object).
  //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
  //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
  gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
 					 				this.vboContents, 		// JavaScript Float32Array
  							 	gl.STATIC_DRAW);			// Usage hint.

  
  //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
  //	(see OpenGL ES specification for more info).  Your choices are:
  //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
  //				contents rarely or never change.
  //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
  //				contents may change often as our program runs.
  //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
  // 			times and then discarded; for rapidly supplied & consumed VBOs.

  // c) Make/Load Texture Maps & Samplers:------------------------------------------
		//  NONE.
		// see VBObox1.prototype.init = function(myGL) below for a working example)

  // d1) Find All Attributes:---------------------------------------------------
  //  Find & save the GPU location of all our shaders' attribute-variables and 
  //  uniform-variables (for switchToMe(), adjust(), draw(), reload(),etc.)
  this.a_PositionLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
  if(this.a_PositionLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() Failed to get GPU location of attribute a_Position');
    return -1;	// error exit.
  }
  this.a_NormalLoc = gl.getAttribLocation(this.shaderLoc, 'a_Normal');
  // d2) Find All Uniforms:-----------------------------------------------------
  //Get GPU storage location for each uniform var used in our shader programs: 

	this.u_mvpMatLoc = gl.getUniformLocation(this.shaderLoc, 'u_mvpMat');
  if (!this.u_mvpMatLoc) { 
    console.log(this.constructor.name + 
    						'.init() failed to get GPU location for u_mvpMat uniform');
    return;
  }  
  this.u_NormalMatrix = gl.getUniformLocation(this.shaderLoc, 'normalMat');
  this.u_ModelMatrix = gl.getUniformLocation(this.shaderLoc, 'modelview');
  this.Ka = gl.getUniformLocation(this.shaderLoc, 'Ka');
  this.Kd = gl.getUniformLocation(this.shaderLoc, 'Kd');
  this.Ks = gl.getUniformLocation(this.shaderLoc, 'Ks');
  this.ambientColor = gl.getUniformLocation(this.shaderLoc, 'ambientColor');
  this.diffuseColor = gl.getUniformLocation(this.shaderLoc, 'diffuseColor');
  this.specularColor = gl.getUniformLocation(this.shaderLoc, 'specularColor');
  this.specularColor2 = gl.getUniformLocation(this.shaderLoc, 'specularColor2');
  this.lightPos = gl.getUniformLocation(this.shaderLoc, 'lightPos');
  this.lightPos2 = gl.getUniformLocation(this.shaderLoc, 'lightPos2');
  this.shininessVal = gl.getUniformLocation(this.shaderLoc, 'shininessVal');
  this.mode = gl.getUniformLocation(this.shaderLoc, 'mode');
  this.light1 = gl.getUniformLocation(this.shaderLoc, 'light1');
  this.light2 = gl.getUniformLocation(this.shaderLoc, 'light2');
}

VBObox0.prototype.switchToMe = function(lightON,lightPt) {
//==============================================================================
// Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
//
// We only do this AFTER we called the init() function, which does the one-time-
// only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
// even then, you are STILL not ready to draw our VBObox's contents onscreen!
// We must also first complete these steps:
//  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
//  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
//  c) tell the GPU to connect the shader program's attributes to that VBO.

// a) select our shader program:
  gl.useProgram(this.shaderLoc);	
//		Each call to useProgram() selects a shader program from the GPU memory,
// but that's all -- it does nothing else!  Any previously used shader program's 
// connections to attributes and uniforms are now invalid, and thus we must now
// establish new connections between our shader program's attributes and the VBO
// we wish to use.  
  
// b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
//  instead connect to our own already-created-&-filled VBO.  This new VBO can 
//    supply values to use as attributes in our newly-selected shader program:
	gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer 
										this.vboLoc);			    // the ID# the GPU uses for our VBO.

// c) connect our newly-bound VBO to supply attribute variable values for each
// vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
// this sets up data paths from VBO to our shader units:
  // 	Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  gl.vertexAttribPointer(
		this.a_PositionLoc,//index == ID# for the attribute var in your GLSL shader pgm;
		this.vboFcount_a_Position,// # of floats used by this attribute: 1,2,3 or 4?
		gl.FLOAT,			// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that the GPU
									//								 must normalize before use? true or false
		this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
		              // stored attrib for this vertex to the same stored attrib
		              //  for the next vertex in our VBO.  This is usually the 
									// number of bytes used to store one complete vertex.  If set 
									// to zero, the GPU gets attribute values sequentially from 
									// VBO, starting at 'Offset'.	
									// (Our vertex size in bytes: 4 floats for pos + 3 for color)
		this.vboOffset_a_Position);						
		              // Offset == how many bytes from START of buffer to the first
  								// value we will actually use?  (We start with position).
  							
// --Enable this assignment of each of these attributes to its' VBO source:

  gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
  								this.norLoc);				  // the ID# the GPU uses for this buffer.

  // Fill the GPU's newly-created VBO object with the vertex data we stored in
  //  our 'vboContents' member (JavaScript Float32Array object).
  //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
  //    use gl.bufferSubData() to modify VBO contents without changing VBO size)
  gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
 					 				this.norContents, 		// JavaScript Float32Array
  							 	gl.STATIC_DRAW);			// Usage hint.
  gl.vertexAttribPointer(
		this.a_NormalLoc,//index == ID# for the attribute var in your GLSL shader pgm;
		this.vboFcount_a_Position,// # of floats used by this attribute: 1,2,3 or 4?
		gl.FLOAT,			// type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that the GPU
									//								 must normalize before use? true or false
		this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
		              // stored attrib for this vertex to the same stored attrib
		              //  for the next vertex in our VBO.  This is usually the 
									// number of bytes used to store one complete vertex.  If set 
									// to zero, the GPU gets attribute values sequentially from 
									// VBO, starting at 'Offset'.	
									// (Our vertex size in bytes: 4 floats for pos + 3 for color)
		this.vboOffset_a_Position);						
		              // Offset == how many bytes from START of buffer to the first
  								// value we will actually use?  (We start with position).
                  
  gl.enableVertexAttribArray(this.a_PositionLoc);
  gl.enableVertexAttribArray(this.a_NormalLoc);

  
	gl.bindBuffer(gl.ARRAY_BUFFER,	        // GLenum 'target' for this GPU buffer 
										this.vboLoc);			    // the ID# the GPU uses for our VBO.
  gl.uniform1f(this.Ka, 1.0);
  gl.uniform1f(this.Kd, 1.0);
  gl.uniform1f(this.Ks, 1.0);
  gl.uniform1f(this.shininessVal, 100.0);
  gl.uniform3fv(this.ambientColor, [0.3,0.3,0.3]);	
  gl.uniform3fv(this.diffuseColor, [0.7,0.7,0.7]);	
  gl.uniform3fv(this.specularColor, [1.0,1.0,1.0]);	
  gl.uniform3fv(this.specularColor2, [1.0,1.0,1.0]);	
  gl.uniform1f(this.mode, 0.0);	
  gl.uniform1f(this.light1, lightON[1]);	
  gl.uniform1f(this.light2, lightON[0]);	
  gl.uniform3fv(this.lightPos2, [lightPt[0],lightPt[1],lightPt[2]]);
}

VBObox0.prototype.isReady = function() {
//==============================================================================
// Returns 'true' if our WebGL rendering context ('gl') is ready to render using
// this objects VBO and shader program; else return false.
// see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

var isOK = true;

  if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
    console.log(this.constructor.name + 
    						'.isReady() false: shader program at this.shaderLoc not in use!');
    isOK = false;
  }
  if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
      console.log(this.constructor.name + 
  						'.isReady() false: vbo at this.vboLoc not in use!');
    isOK = false;
  }
  return isOK;
}

VBObox0.prototype.adjust = function() {
//==============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on 
// the GPU; and (if needed) update each attribute's stride and offset in VBO.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
  						'.adjust() call you needed to call this.switchToMe()!!');
  }  
	// Adjust values for our uniforms:--------------
  // NEW glMatrix version:
  // SURPRISE! the mat4 'perspective()' and 'lookAt()' fcns ignore / overwrite
  //            any previous matrix contents. You have to do your own matrix
  //            multiply to combine the perspective and view matrices:
  var camProj = mat4.create();          // Let our global GUIbox object set camera
										// based on user controls, if any:
  // We can either use the perspective() function, like this:       
  mat4.perspective(camProj,             // out
              glMatrix.toRadian(gui.camFovy), // fovy in radians 
              gui.camAspect,                  // aspect ratio width/height
              gui.camNear,                    // znear
              gui.camFar);                    // zfar
/*
  // or use the frustum() function, like this:
  mat4.frustum(camProj, -1.0, 1.0,      // left, right
                        -1.0, 1.0,      // bottom, top
                        1.0, 10000.0);  // near, far
 */
  var camView = mat4.create();			// 'view' matrix sets camera pose
  mat4.lookAt(camView, gui.camEyePt, gui.camAimPt, gui.camUpVec);
  gl.uniform3fv(this.lightPos, [gui.camEyePt[0],gui.camEyePt[1],gui.camEyePt[2]]);
  mat4.multiply(this.mvpMat, camProj, camView);
  // mvpMat now set for WORLD drawing axes. 
  // If you want to draw in various 'model' coord systems you'll need to make
  // further modifications of the mvpMat matrix and u_mvpMat uniform in the
  // VBObox0.draw() function below.

  //  Transfer new uniforms' values to the GPU:-------------
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
  gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.mvpMat);	// send data from Javascript.

  // Adjust the attributes' stride and offset (if necessary)
  // (use gl.vertexAttribPointer() calls and gl.enableVertexAttribArray() calls)

}

VBObox0.prototype.setScene = function(){
  if(this.scene == 3){
    this.scene = 0;
  }
  else{
    this.scene +=1 ;
  }
}

VBObox0.prototype.draw = function() {
//=============================================================================
// Render current VBObox contents.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
  						'.draw() call you needed to call this.switchToMe()!!');
  }  
  // ----------------------------Draw the contents of the currently-bound VBO:
  // SPLIT UP the drawing into separate shapes, as each needs different
  // transforms in its mvpMatrix uniform.  VBObox0.adjust() already set value
  // to the GPU's uniform u_mvpMat for drawing in world coords, so we're ready
  // to draw the ground-plane grid (first vertex at this.bgnGrid)

  // SAVE world-space coordinate transform-----
  // (LATER replace this naive method with a push-down stack
  //   so that we can traverse a scene-graph).
  var tmp = mat4.create();    
  mat4.copy(tmp, this.mvpMat); 
  var modelMat = mat4.create();
  gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										modelMat);	// send data from Javascript.

  // Draw each World-space object:-------------
  // xyz axes, ground-plane grid.  Uniforms already set properly.
  gl.drawArrays(gl.LINES, 	    // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
                  // WHICH vertices to draw:  see constructor fcn to see how we
                  //  filled our VBO...
  								0, 							// location of 1st vertex to draw;
  								                // The number of vertices to draw on-screen:
  								                // (see constructor to understand)
                  this.bgnDisk);  // draw only the axes & ground-plane.

  // Draw Model-space objects:--------------
  var tmp = mat4.create();    
  mat4.copy(tmp, this.mvpMat);    // SAVE current value (needs push-down stack!)

  if(this.scene == 0){
  // 1) -----------------copy transforms for Disk 1 in CScene.initScene(0) :
    var modelMat = mat4.create();
    var normalMat = mat4.create();
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(1.0, 1.0, 1.3));
    mat4.rotate(this.mvpMat, this.mvpMat, 0.25*Math.PI, vec3.fromValues(1,0,0));
    mat4.rotate(this.mvpMat, this.mvpMat, 0.25*Math.PI, vec3.fromValues(0,0,1));// Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
    mat4.translate(modelMat, modelMat, vec3.fromValues(1.0, 1.0, 1.3));
    mat4.rotate(modelMat, modelMat, 0.25*Math.PI, vec3.fromValues(1,0,0));
    mat4.rotate(modelMat, modelMat, 0.25*Math.PI, vec3.fromValues(0,0,1));// Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
    mat4.invert(normalMat,modelMat);
    mat4.transpose(normalMat,normalMat);
    gl.uniform1f(this.shininessVal, 100.0);
    gl.uniform3fv(this.ambientColor, [0.0,0.3,0.3]);	
    gl.uniform3fv(this.diffuseColor, [0.0,0.7,0.7]);	
    gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.mvpMat);	// send data from Javascript.                
    gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										modelMat);	// send data from Javascript.     
    gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										normalMat);	// send data from Javascript.
    mat4.copy(this.mvpMat, tmp);      // restore world-space mvpMat values.
    gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
  								this.bgnDisk, 	// location of 1st vertex to draw;
                  this.bgnSphere - this.bgnDisk);  // How many vertices to draw
  // 2) -----------------copy transforms for Disk 2 in CScene.initScene(0) :
    mat4.copy(this.mvpMat, tmp); // RESTORE current value (needs push-down stack!)

    var modelMat = mat4.create();
    var normalMat = mat4.create();
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(-1.0, 1.0, 1.3));
    mat4.rotate(this.mvpMat, this.mvpMat, 0.75*Math.PI, vec3.fromValues(1,0,0));
    mat4.rotate(this.mvpMat, this.mvpMat, Math.PI/3.0,  vec3.fromValues(0,0,1));
    mat4.translate(modelMat, modelMat, vec3.fromValues(-1.0, 1.0, 1.3));
    mat4.rotate(modelMat, modelMat, 0.75*Math.PI, vec3.fromValues(1,0,0));
    mat4.rotate(modelMat, modelMat, Math.PI/3.0,  vec3.fromValues(0,0,1));
    mat4.invert(normalMat,modelMat);
    mat4.transpose(normalMat,normalMat);
    gl.uniform1f(this.shininessVal, 100.0);
    gl.uniform3fv(this.ambientColor, [0.0,0.0,0.3]);	
    gl.uniform3fv(this.diffuseColor, [0.0,0.2,0.7]);	
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
    gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.mvpMat);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										modelMat);	// send data from Javascript.     
    gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										normalMat);	// send data from Javascript.
    mat4.copy(this.mvpMat, tmp);      // restore world-space mvpMat values.
    gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
  								this.bgnDisk, 	// location of 1st vertex to draw;
                  this.bgnSphere - this.bgnDisk);  // How many vertices to draw

  // 3)--------------------copy transforms for Sphere 1 in CScene.initScene(0)
    mat4.copy(this.mvpMat, tmp); // RESTORE current value (needs push-down stack!)

    var modelMat = mat4.create();
    var normalMat = mat4.create();
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(-2.3, 1.0, 1.3));
    mat4.rotate(this.mvpMat, this.mvpMat, 0.3*Math.PI, vec3.fromValues(1,0,0));
    mat4.rotate(this.mvpMat, this.mvpMat, Math.PI/5,  vec3.fromValues(0,0,1));
    mat4.translate(modelMat, modelMat, vec3.fromValues(-2.3, 1.0, 1.3));
    mat4.rotate(modelMat, modelMat, 0.3*Math.PI, vec3.fromValues(1,0,0));
    mat4.rotate(modelMat, modelMat, Math.PI/5,  vec3.fromValues(0,0,1));
    mat4.invert(normalMat,modelMat);
    mat4.transpose(normalMat,normalMat);
    gl.uniform1f(this.shininessVal, 100.0);
    gl.uniform3fv(this.ambientColor, [0.2,0.0,0.3]);	
    gl.uniform3fv(this.diffuseColor, [0.5,0.2,0.7]);	
    gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.mvpMat);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										modelMat);	// send data from Javascript.     
    gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										normalMat);	// send data from Javascript.
    mat4.copy(this.mvpMat, tmp);      // restore world-space mvpMat values.
    gl.drawArrays(gl.TRIANGLE_STRIP, 	    // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
  								this.bgnDisk, 	// location of 1st vertex to draw;
                  this.bgnSphere - this.bgnDisk);  // How many vertices to draw

  // 3)--------------------copy transforms for Sphere 1 in CScene.initScene(0)
    mat4.copy(this.mvpMat, tmp); // RESTORE current value (needs push-down stack!)
  }

  else if(this.scene == 1){
    var modelMat = mat4.create();
    var normalMat = mat4.create();
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(2.0, -2.0, 2.3));
    mat4.translate(modelMat, modelMat, vec3.fromValues(2.0, -2.0, 2.3));
    mat4.invert(normalMat,modelMat);
    mat4.transpose(normalMat,normalMat);
    gl.uniform1f(this.shininessVal, 50.0);
    gl.uniform3fv(this.ambientColor, [0.0,0.3,0.3]);	
    gl.uniform3fv(this.diffuseColor, [0.0,0.7,0.7]);
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
    gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.mvpMat);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										modelMat);	// send data from Javascript.     
    gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										normalMat);	// send data from Javascript.
    mat4.copy(this.mvpMat, tmp);      // restore world-space mvpMat values.
    gl.drawArrays(gl.TRIANGLES, 	      // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
  								this.bgnBox, 	// location of 1st vertex to draw;
                  this.bgnCyl - this.bgnBox); // How many vertices to draw
    mat4.copy(this.mvpMat, tmp); // RESTORE current value (needs push-down stack!) 

    var modelMat = mat4.create();
    var normalMat = mat4.create();
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(3.0, -1.0, 0.3));
    mat4.translate(modelMat, modelMat, vec3.fromValues(3.0, -1.0, 0.3));
    mat4.invert(normalMat,modelMat);
    mat4.transpose(normalMat,normalMat);
    gl.uniform1f(this.shininessVal, 40.0);
    gl.uniform3fv(this.ambientColor, [0.2,0.0,0.3]);	
    gl.uniform3fv(this.diffuseColor, [0.5,0.2,0.7]);	
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
    gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.mvpMat);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										modelMat);	// send data from Javascript.     
    gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										normalMat);	// send data from Javascript.
    mat4.copy(this.mvpMat, tmp);      // restore world-space mvpMat values.
    gl.drawArrays(gl.TRIANGLES, 	      // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
  								this.bgnBox, 	// location of 1st vertex to draw;
                  this.bgnCyl - this.bgnBox); // How many vertices to draw
    mat4.copy(this.mvpMat, tmp); // RESTORE current value (needs push-down stack!) 

    var modelMat = mat4.create();
    var normalMat = mat4.create();
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(-4.3, 1.0, 4.3));
    mat4.translate(modelMat, modelMat, vec3.fromValues(-4.3, 1.0, 4.3));
    mat4.invert(normalMat,modelMat);
    mat4.transpose(normalMat,normalMat);
    gl.uniform1f(this.shininessVal, 100.0);
    gl.uniform3fv(this.ambientColor, [0.2,0.0,0.3]);	
    gl.uniform3fv(this.diffuseColor, [0.5,0.2,0.7]);
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
    gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.mvpMat);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										modelMat);	// send data from Javascript.     
    gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										normalMat);	// send data from Javascript.
    mat4.copy(this.mvpMat, tmp);      // restore world-space mvpMat values.
    gl.drawArrays(gl.TRIANGLES, 	      // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
  								this.bgnBox, 	// location of 1st vertex to draw;
                  this.bgnCyl - this.bgnBox); // How many vertices to draw
    mat4.copy(this.mvpMat, tmp); // RESTORE current value (needs push-down stack!) 
  }

  else if(this.scene == 2){
    var modelMat = mat4.create();
    var normalMat = mat4.create();
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(3.0, -1.0, 1.3));
    mat4.translate(modelMat, modelMat, vec3.fromValues(3.0, -1.0, 1.3));
    mat4.invert(normalMat,modelMat);
    mat4.transpose(normalMat,normalMat);
    gl.uniform1f(this.shininessVal, 100.0);
    gl.uniform3fv(this.ambientColor, [0.0,0.3,0.3]);	
    gl.uniform3fv(this.diffuseColor, [0.0,0.7,0.7]);
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
    gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.mvpMat);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										modelMat);	// send data from Javascript.     
    gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										normalMat);	// send data from Javascript.
    mat4.copy(this.mvpMat, tmp);      // restore world-space mvpMat values.
    gl.drawArrays(gl.TRIANGLE_STRIP, 	      // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
  								this.bgnCyl, 	// location of 1st vertex to draw;
                  this.bgnCone - this.bgnCyl); // How many vertices to draw
    mat4.copy(this.mvpMat, tmp); // RESTORE current value (needs push-down stack!) 

    var modelMat = mat4.create();
    var normalMat = mat4.create();
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(-1.0, 1.0, 0.5));
    mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(0.5, 0.5, 0.7));
    mat4.translate(modelMat, modelMat, vec3.fromValues(-1.0, 1.0, 0.5));
    mat4.scale(modelMat, modelMat, vec3.fromValues(0.5, 0.5, 0.7));
    mat4.invert(normalMat,modelMat);
    mat4.transpose(normalMat,normalMat);
    gl.uniform1f(this.shininessVal, 40.0);
    gl.uniform3fv(this.ambientColor, [0.2,0.0,0.3]);	
    gl.uniform3fv(this.diffuseColor, [0.5,0.2,0.7]);	
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
    gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.mvpMat);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										modelMat);	// send data from Javascript.     
    gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										normalMat);	// send data from Javascript.
    mat4.copy(this.mvpMat, tmp);      // restore world-space mvpMat values.
    gl.drawArrays(gl.TRIANGLE_STRIP, 	      // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
  								this.bgnCyl, 	// location of 1st vertex to draw;
                  this.bgnCone - this.bgnCyl); // How many vertices to draw
    mat4.copy(this.mvpMat, tmp); // RESTORE current value (needs push-down stack!) 

    var modelMat = mat4.create();
    var normalMat = mat4.create();
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(-1.5, -1.5, 2.3));
    mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(0.7, 0.7, 0.5));
    mat4.translate(modelMat, modelMat, vec3.fromValues(-1.5, -1.5, 2.3));
    mat4.scale(modelMat, modelMat, vec3.fromValues(0.7, 0.7, 0.5));
    mat4.invert(normalMat,modelMat);
    mat4.transpose(normalMat,normalMat);
    gl.uniform1f(this.shininessVal, 20.0);
    gl.uniform3fv(this.ambientColor, [0.2,0.0,0.3]);	
    gl.uniform3fv(this.diffuseColor, [0.5,0.2,0.7]);
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
    gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.mvpMat);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										modelMat);	// send data from Javascript.     
    gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										normalMat);	// send data from Javascript.
    mat4.copy(this.mvpMat, tmp);      // restore world-space mvpMat values.
    gl.drawArrays(gl.TRIANGLE_STRIP, 	      // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
  								this.bgnCyl, 	// location of 1st vertex to draw;
                  this.bgnCone - this.bgnCyl); // How many vertices to draw
    mat4.copy(this.mvpMat, tmp); // RESTORE current value (needs push-down stack!) 
  }
  else{
    var modelMat = mat4.create();
    var normalMat = mat4.create();
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(2.0, -1.0, 1.0));
    mat4.translate(modelMat, modelMat, vec3.fromValues(2.0, -1.0, 1.0));
    mat4.invert(normalMat,modelMat);
    mat4.transpose(normalMat,normalMat);
    gl.uniform1f(this.shininessVal, 100.0);
    gl.uniform3fv(this.ambientColor, [0.0,0.3,0.3]);	
    gl.uniform3fv(this.diffuseColor, [0.0,0.7,0.7]);
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
    gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.mvpMat);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										modelMat);	// send data from Javascript.     
    gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										normalMat);	// send data from Javascript.
    mat4.copy(this.mvpMat, tmp);      // restore world-space mvpMat values.
    gl.drawArrays(gl.TRIANGLE_STRIP, 	      // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
  								this.bgnCone, 	// location of 1st vertex to draw;
                  this.vboVerts - this.bgnCone); // How many vertices to draw
    mat4.copy(this.mvpMat, tmp); // RESTORE current value (needs push-down stack!) 

    var modelMat = mat4.create();
    var normalMat = mat4.create();
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(-2.0, -2.0, 0.5));
    mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(0.5, 0.5, 0.7));
    mat4.translate(modelMat, modelMat, vec3.fromValues(-2.0, -2.0, 0.5));
    mat4.scale(modelMat, modelMat, vec3.fromValues(0.5, 0.5, 0.7));
    mat4.invert(normalMat,modelMat);
    mat4.transpose(normalMat,normalMat);
    gl.uniform1f(this.shininessVal, 10.0);
    gl.uniform3fv(this.ambientColor, [0.2,0.0,0.3]);	
    gl.uniform3fv(this.diffuseColor, [0.5,0.2,0.7]);	
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
    gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.mvpMat);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										modelMat);	// send data from Javascript.     
    gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										normalMat);	// send data from Javascript.
    mat4.copy(this.mvpMat, tmp);      // restore world-space mvpMat values.
    gl.drawArrays(gl.TRIANGLE_STRIP, 	      // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
  								this.bgnCone, 	// location of 1st vertex to draw;
                  this.vboVerts - this.bgnCone); // How many vertices to draw
    mat4.copy(this.mvpMat, tmp); // RESTORE current value (needs push-down stack!) 

    var modelMat = mat4.create();
    var normalMat = mat4.create();
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(-2.5, -0.5, 1.3));
    mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(0.7, 0.7, 0.5));
    mat4.translate(modelMat, modelMat, vec3.fromValues(-2.5, -0.5, 1.3));
    mat4.scale(modelMat, modelMat, vec3.fromValues(0.7, 0.7, 0.5));
    mat4.invert(normalMat,modelMat);
    mat4.transpose(normalMat,normalMat);
    gl.uniform1f(this.shininessVal, 80.0);
    gl.uniform3fv(this.ambientColor, [0.2,0.0,0.3]);	
    gl.uniform3fv(this.diffuseColor, [0.5,0.2,0.7]);
    // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
    gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.mvpMat);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										modelMat);	// send data from Javascript.     
    gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										normalMat);	// send data from Javascript.
    mat4.copy(this.mvpMat, tmp);      // restore world-space mvpMat values.
    gl.drawArrays(gl.TRIANGLE_STRIP, 	      // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
  								this.bgnCone, 	// location of 1st vertex to draw;
                  this.vboVerts - this.bgnCone); // How many vertices to draw
    mat4.copy(this.mvpMat, tmp); // RESTORE current value (needs push-down stack!) 
  }
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
  
  var modelMat = mat4.create();
  var normalMat = mat4.create();
  if(this.scene == 0){
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(1.2, -1.0, 1.0));
    mat4.translate(modelMat, modelMat, vec3.fromValues(1.2, -1.0, 1.0));
  }
  else if(this.scene == 1){
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(2.1, -2.0, 0.5));
    mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(0.5, 0.5, 0.5));
    mat4.translate(modelMat, modelMat, vec3.fromValues(2.1, -2.0, 0.5));
    mat4.scale(modelMat, modelMat, vec3.fromValues(0.5, 0.5, 0.5));
  }
  else if(this.scene == 2){
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(1.1, -2.0, 0.9));
    mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(0.5, 0.5, 0.5));
    mat4.translate(modelMat, modelMat, vec3.fromValues(1.1, -2.0, 0.9));
    mat4.scale(modelMat, modelMat, vec3.fromValues(0.5, 0.5, 0.5))
  }
  else{
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(0.5, -2.0, 0.3));
    mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(0.3, 0.3, 0.3));
    mat4.translate(modelMat, modelMat, vec3.fromValues(0.5, -2.0, 0.3));
    mat4.scale(modelMat, modelMat, vec3.fromValues(0.3, 0.3, 0.3));
  }
  mat4.invert(normalMat,modelMat);
  mat4.transpose(normalMat,normalMat);
    gl.uniform1f(this.shininessVal, 70.0);
    gl.uniform3fv(this.ambientColor, [0.2,0.0,0.3]);	
    gl.uniform3fv(this.diffuseColor, [0.6,0.0,0.7]);
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
  gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.mvpMat);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										modelMat);	// send data from Javascript.     
    gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										normalMat);	// send data from Javascript.
  mat4.copy(this.mvpMat, tmp);      // restore world-space mvpMat values.
    gl.drawArrays(gl.TRIANGLE_STRIP, 	      // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
  								this.bgnSphere, 	// location of 1st vertex to draw;
                  this.bgnBox - this.bgnSphere); // How many vertices to draw
  mat4.copy(this.mvpMat, tmp); // RESTORE current value (needs push-down stack!)
  
  var modelMat = mat4.create();
  var normalMat = mat4.create();
  if(this.scene == 0){
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(2.2, 0.5, 1.2));
    mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(0.7, 0.7, 0.7));
    mat4.translate(modelMat, modelMat, vec3.fromValues(2.2, 0.5, 1.2));
    mat4.scale(modelMat, modelMat, vec3.fromValues(0.7, 0.7, 0.7));
  }
  else if(this.scene == 1){
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(0.5, 0.1, 0.3));
    mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(0.7, 1.2, 1.2));
    mat4.translate(modelMat, modelMat, vec3.fromValues(0.5, 0.1, 0.3));
    mat4.scale(modelMat, modelMat, vec3.fromValues(0.7, 1.2, 1.2));
  }
  else if(this.scene == 2){
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(0.5, 0.1, 1.5));
    mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(1.2, 1.2, 1.2));
    mat4.translate(modelMat, modelMat, vec3.fromValues(0.5, 0.1, 1.5));
    mat4.scale(modelMat, modelMat, vec3.fromValues(1.2, 1.2, 1.2));
  }
  else{
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(-0.7, 0.1, 2.5));
    mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(1.1, 1.3, 1.2));
    mat4.translate(modelMat, modelMat, vec3.fromValues(-0.7, 0.1, 2.5));
    mat4.scale(modelMat, modelMat, vec3.fromValues(1.1, 1.3, 1.2));
  }
  mat4.invert(normalMat,modelMat);
  mat4.transpose(normalMat,normalMat);
    gl.uniform1f(this.shininessVal, 10.0);
    gl.uniform3fv(this.ambientColor, [0.2,0.2,0.0]);	
    gl.uniform3fv(this.diffuseColor, [0.5,0.7,0.0]);	
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
  gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.mvpMat);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										modelMat);	// send data from Javascript.     
    gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										normalMat);	// send data from Javascript.
  mat4.copy(this.mvpMat, tmp);      // restore world-space mvpMat values.
    gl.drawArrays(gl.TRIANGLE_STRIP, 	      // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
  								this.bgnSphere, 	// location of 1st vertex to draw;
                  this.bgnBox - this.bgnSphere); // How many vertices to draw
  mat4.copy(this.mvpMat, tmp); // RESTORE current value (needs push-down stack!)  
  
  var modelMat = mat4.create();
  var normalMat = mat4.create();
  if(this.scene == 0){
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(1.7, 0.0, 1.5));
    mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(0.5, 0.5, 0.8));
    mat4.translate(modelMat, modelMat, vec3.fromValues(1.7, 0.0, 1.5));
    mat4.scale(modelMat, modelMat, vec3.fromValues(0.5, 0.5, 0.8));
  }
  else if(this.scene == 1){
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(-1.7, 0.0, 0.0));
    mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(0.8, 0.8, 0.8));
    mat4.translate(modelMat, modelMat, vec3.fromValues(-1.7, 0.0, 0.0));
    mat4.scale(modelMat, modelMat, vec3.fromValues(0.8, 0.8, 0.8));
  }
  else if(this.scene == 2){
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(-1.7, 0.0, 1.7));
    mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(0.8, 0.8, 0.8));
    mat4.translate(modelMat, modelMat, vec3.fromValues(-1.7, 0.0, 1.7));
    mat4.scale(modelMat, modelMat, vec3.fromValues(0.8, 0.8, 0.8));
  }
  else{
    mat4.translate(this.mvpMat, this.mvpMat, vec3.fromValues(-1.0, 0.0, 0.7));
    mat4.scale(this.mvpMat, this.mvpMat, vec3.fromValues(0.8, 0.8, 0.8));
    mat4.translate(modelMat, modelMat, vec3.fromValues(-1.0, 0.0, 0.7));
    mat4.scale(modelMat, modelMat, vec3.fromValues(0.8, 0.8, 0.8));
  }
  mat4.invert(normalMat,modelMat);
  mat4.transpose(normalMat,normalMat);
    gl.uniform1f(this.shininessVal, 30.0);
    gl.uniform3fv(this.ambientColor, [0.2,0.3,0.3]);	
    gl.uniform3fv(this.diffuseColor, [0.5,0.6,0.7]);
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
  gl.uniformMatrix4fv(this.u_mvpMatLoc,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										this.mvpMat);	// send data from Javascript.
    gl.uniformMatrix4fv(this.u_ModelMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										modelMat);	// send data from Javascript.     
    gl.uniformMatrix4fv(this.u_NormalMatrix,	// GPU location of the uniform
  										false, 				// use matrix transpose instead?
  										normalMat);	// send data from Javascript.
  mat4.copy(this.mvpMat, tmp);      // restore world-space mvpMat values.
    gl.drawArrays(gl.TRIANGLE_STRIP, 	      // select the drawing primitive to draw,
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP, ...
  								this.bgnSphere, 	// location of 1st vertex to draw;
                  this.bgnBox - this.bgnSphere); // How many vertices to draw
  mat4.copy(this.mvpMat, tmp); // RESTORE current value (needs push-down stack!)   
}

VBObox0.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU inside our already-created VBO: use 
// gl.bufferSubData() call to re-transfer some or all of our Float32Array 
// contents to our VBO without changing any GPU memory allocations.

 gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                  0,                  // byte offset to where data replacement
                                      // begins in the VBO.
 					 				this.vboContents);   // the JS source-data array used to fill VBO

}
/*
VBObox0.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox0.prototype.restore = function() {
//=============================================================================
// Replace/restore all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  Use our retained Float32Array data, all values for  uniforms, 
// all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/

//=============================================================================
//=============================================================================
function VBObox1() { // (JUST ONE instance: as 'rayView' var 
                      // that shows ray-traced image-on-screen as a texture map
//=============================================================================
//=============================================================================
// CONSTRUCTOR for one re-usable 'VBObox1' object that holds all data and fcns
// needed to render vertices from one Vertex Buffer Object (VBO) using one 
// separate shader program (a vertex-shader & fragment-shader pair) and one
// set of 'uniform' variables.

// Constructor goal: 
// Create and set member vars that will ELIMINATE ALL LITERALS (numerical values 
// written into code) in all other VBObox functions. Keeping all these (initial)
// values here, in this one coonstrutor function, ensures we can change them 
// easily WITHOUT disrupting any other code, ever!
  
	this.VERT_SRC =	//--------------------- VERTEX SHADER source code 
  'attribute vec4 a_Position;\n' +	
  'attribute vec2 a_TexCoord;\n' +
  'varying vec2 v_TexCoord;\n' +
  //
  'void main() {\n' +
  '  gl_Position = a_Position;\n' +
  '  v_TexCoord = a_TexCoord;\n' +
  '}\n';

	this.FRAG_SRC = //---------------------- FRAGMENT SHADER source code 
  'precision mediump float;\n' +							// set default precision
  //
  'uniform sampler2D u_Sampler;\n' +
  'varying vec2 v_TexCoord;\n' +
  //
  'void main() {\n' +
  '  gl_FragColor = texture2D(u_Sampler, v_TexCoord);\n' +
  '}\n';

	this.vboContents = //--------------------- 
	new Float32Array ([					// Array of vertex attribute values we will
                              // transfer to GPU's vertex buffer object (VBO);
    // Quad vertex coordinates(x,y in CVV); texture coordinates tx,ty
    -1.00,  1.00,   	0.0, 1.0,			// upper left corner  (borderless)
    -1.00, -1.00,   	0.0, 0.0,			// lower left corner,
     1.00,  1.00,   	1.0, 1.0,			// upper right corner,
     1.00, -1.00,   	1.0, 0.0,			// lower left corner.
		 ]);

	this.vboVerts = 4;							// # of vertices held in 'vboContents' array;
	this.FSIZE = this.vboContents.BYTES_PER_ELEMENT;  
	                              // bytes req'd by 1 vboContents array element;
																// (why? used to compute stride and offset 
																// in bytes for vertexAttribPointer() calls)
  this.vboBytes = this.vboContents.length * this.FSIZE;               
                                // (#  of floats in vboContents array) * 
                                // (# of bytes/float).
	this.vboStride = this.vboBytes / this.vboVerts;     
	                              // (== # of bytes to store one complete vertex).
	                              // From any attrib in a given vertex in the VBO, 
	                              // move forward by 'vboStride' bytes to arrive 
	                              // at the same attrib for the next vertex.
	                               
	            //----------------------Attribute sizes
  this.vboFcount_a_Position = 2;  // # of floats in the VBO needed to store the
                                  // attribute named a_Pos1. (2: x,y values)
  this.vboFcount_a_TexCoord = 2;  // # of floats for this attrib (r,g,b values)
  console.assert((this.vboFcount_a_Position +     // check the size of each and
                  this.vboFcount_a_TexCoord) *   // every attribute in our VBO
                  this.FSIZE == this.vboStride, // for agreeement with'stride'
                  "Uh oh! VBObox1.vboStride disagrees with attribute-size values!");
                  
              //----------------------Attribute offsets
	this.vboOffset_a_Position = 0;  //# of bytes from START of vbo to the START
	                                // of 1st a_Position attrib value in vboContents[]
  this.vboOffset_a_TexCoord = (this.vboFcount_a_Position) * this.FSIZE;  
                                // == 2 floats * bytes/float
                                //# of bytes from START of vbo to the START
                                // of 1st a_TexCoord attrib value in vboContents[]

	            //-----------------------GPU memory locations:                                
	this.vboLoc;									// GPU Location for Vertex Buffer Object, 
	                              // returned by gl.createBuffer() function call
	this.shaderLoc;								// GPU Location for compiled Shader-program  
	                            	// set by compile/link of VERT_SRC and FRAG_SRC.
								          //------Attribute locations in our shaders:
	this.a_PositionLoc;				    // GPU location: shader 'a_Position' attribute
	this.a_TexCoordLoc;						// GPU location: shader 'a_TexCoord' attribute

	            //---------------------- Uniform locations &values in our shaders
/*	// ***NOT NEEDED** for this VBObox; 
	//						because it draws its one texture-mapped image in the CVV.
	this.mvpMat = mat4.create();	    // Transforms CVV axes to model axes.
	this.u_mvpMatLoc;					// GPU location for u_mvpMat uniform
*/
  this.u_TextureLoc;            // GPU location for texture map (image)
  this.u_SamplerLoc;            // GPU location for texture sampler
};

VBObox1.prototype.init = function() {
//==============================================================================
// Prepare the GPU to use all vertices, GLSL shaders, attributes, & uniforms 
// kept in this VBObox. (This function usually called only once, within main()).
// Specifically:
// a) Create, compile, link our GLSL vertex- and fragment-shaders to form an 
//  executable 'program' stored and ready to use inside the GPU.  
// b) create a new VBO object in GPU memory and fill it by transferring in all
//  the vertex data held in our Float32array member 'VBOcontents'. 
// c) If shader uses texture-maps, create and load them and their samplers.
// d) Find & save the GPU location of all our shaders' attribute-variables and 
//  uniform-variables (needed by switchToMe(), adjust(), draw(), reload(), etc.)
// -------------------
// CAREFUL!  before you can draw pictures using this VBObox contents, 
//  you must call this VBObox object's switchToMe() function too!
//--------------------
// a) Compile,link,upload shaders-----------------------------------------------
	this.shaderLoc = createProgram(gl, this.VERT_SRC, this.FRAG_SRC);
	if (!this.shaderLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create executable Shaders on the GPU. Bye!');
    return;
  }
// CUTE TRICK: let's print the NAME of this VBObox object: tells us which one!
//  else{console.log('You called: '+ this.constructor.name + '.init() fcn!');}

	gl.program = this.shaderLoc;		// (to match cuon-utils.js -- initShaders())

// b) Create VBO on GPU, fill it------------------------------------------------
	this.vboLoc = gl.createBuffer();	
  if (!this.vboLoc) {
    console.log(this.constructor.name + 
    						'.init() failed to create VBO in GPU. Bye!'); 
    return;
  }
  
  // Specify the purpose of our newly-created VBO on the GPU.  Your choices are:
  //	== "gl.ARRAY_BUFFER" : the VBO holds vertices, each made of attributes 
  // (positions, colors, normals, etc), or 
  //	== "gl.ELEMENT_ARRAY_BUFFER" : the VBO holds indices only; integer values 
  // that each select one vertex from a vertex array stored in another VBO.
  gl.bindBuffer(gl.ARRAY_BUFFER,	      // GLenum 'target' for this GPU buffer 
  								this.vboLoc);				  // the ID# the GPU uses for this buffer.
  											
  // Fill the GPU's newly-created VBO object with the vertex data we stored in
  //  our 'vboContents' member (JavaScript Float32Array object).
  //  (Recall gl.bufferData() will evoke GPU's memory allocation & management: 
  //	 use gl.bufferSubData() to modify VBO contents without changing VBO size)
  gl.bufferData(gl.ARRAY_BUFFER, 			  // GLenum target(same as 'bindBuffer()')
 					 				this.vboContents, 		// JavaScript Float32Array
  							 	gl.STATIC_DRAW);			// Usage hint.  
  //	The 'hint' helps GPU allocate its shared memory for best speed & efficiency
  //	(see OpenGL ES specification for more info).  Your choices are:
  //		--STATIC_DRAW is for vertex buffers rendered many times, but whose 
  //				contents rarely or never change.
  //		--DYNAMIC_DRAW is for vertex buffers rendered many times, but whose 
  //				contents may change often as our program runs.
  //		--STREAM_DRAW is for vertex buffers that are rendered a small number of 
  // 			times and then discarded; for rapidly supplied & consumed VBOs.

// c) Make/Load Texture Maps & Samplers:----------------------------------------
  this.u_TextureLoc = gl.createTexture(); // Create object in GPU memory to
                                          // to hold texture image.
  if (!this.u_TextureLoc) {
    console.log(this.constructor.name + 
    						'.init() Failed to create the texture object on the GPU');
    return -1;	// error exit.
  }
  // Get the GPU location for the texture sampler assigned to us (as uniform) 
  var u_SamplerLoc = gl.getUniformLocation(this.shaderLoc, 'u_Sampler');
  if (!u_SamplerLoc) {
    console.log(this.constructor.name + 
    						'.init() Failed to find GPU location for texture u_Sampler');
    return -1;	// error exit.
  }

  // Fill our global floating-point image object 'g_myPic' with a test-pattern.
  g_myPic.setTestPattern(1);    // 0 == colorful 'L' shape. 1 == all orange.
  // the g_myPic.iBuf member is a uint8 array; data source for WebGL texture map

  // Enable texture unit0 for our use
  gl.activeTexture(gl.TEXTURE0);
  // Bind the texture object we made in initTextures() to the target
  gl.bindTexture(gl.TEXTURE_2D, this.u_TextureLoc);
  // allocate memory and load the texture image into the GPU
  gl.texImage2D(gl.TEXTURE_2D,    //  'target'--the use of this texture
  						0, 									//  MIP-map level (default: 0)
  						gl.RGB, 					  // GPU's data format (RGB? RGBA? etc)
              g_myPic.xSiz,         // texture image width in pixels
              g_myPic.ySiz,         // texture image height in pixels.
							0,									// byte offset to start of data
  						gl.RGB, 					  // source/input data format (RGB? RGBA?)
  						gl.UNSIGNED_BYTE,	  // data type for each color channel				
              g_myPic.iBuf);        // 8-bit RGB image data source.
  // Set the WebGL texture-filtering parameters
  gl.texParameteri(gl.TEXTURE_2D,		// texture-sampling params: 
  						     gl.TEXTURE_MIN_FILTER, 
  						     gl.LINEAR);
  // Set the texture unit 0 to be driven by our texture sampler:
  gl.uniform1i(this.u_SamplerLoc, 0);
 
// d1) Find All Attributes:-----------------------------------------------------
//  Find & save the GPU location of all our shaders' attribute-variables and 
//  uniform-variables (for switchToMe(), adjust(), draw(), reload(), etc.)
  this.a_PositionLoc = gl.getAttribLocation(this.shaderLoc, 'a_Position');
  if(this.a_PositionLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() Failed to get GPU location of attribute a_Position');
    return -1;	// error exit.
  }
 	this.a_TexCoordLoc = gl.getAttribLocation(this.shaderLoc, 'a_TexCoord');
  if(this.a_TexCoordLoc < 0) {
    console.log(this.constructor.name + 
    						'.init() failed to get the GPU location of attribute a_TexCoord');
    return -1;	// error exit.
  }
  // d2) Find All Uniforms:-----------------------------------------------------
  //Get GPU storage location for each uniform var used in our shader programs: 
/* NONE yet...
 this.u_ModelMatrixLoc = gl.getUniformLocation(this.shaderLoc, 'u_ModelMatrix');
  if (!this.u_ModelMatrixLoc) { 
    console.log(this.constructor.name + 
    						'.init() failed to get GPU location for u_ModelMatrix uniform');
    return;
  }
*/
}

VBObox1.prototype.switchToMe = function () {
//==============================================================================
// Set GPU to use this VBObox's contents (VBO, shader, attributes, uniforms...)
//
// We only do this AFTER we called the init() function, which does the one-time-
// only setup tasks to put our VBObox contents into GPU memory.  !SURPRISE!
// even then, you are STILL not ready to draw our VBObox's contents onscreen!
// We must also first complete these steps:
//  a) tell the GPU to use our VBObox's shader program (already in GPU memory),
//  b) tell the GPU to use our VBObox's VBO  (already in GPU memory),
//  c) tell the GPU to connect the shader program's attributes to that VBO.

// a) select our shader program:
  gl.useProgram(this.shaderLoc);	
//		Each call to useProgram() selects a shader program from the GPU memory,
// but that's all -- it does nothing else!  Any previously used shader program's 
// connections to attributes and uniforms are now invalid, and thus we must now
// establish new connections between our shader program's attributes and the VBO
// we wish to use.  
  
// b) call bindBuffer to disconnect the GPU from its currently-bound VBO and
//  instead connect to our own already-created-&-filled VBO.  This new VBO can 
//    supply values to use as attributes in our newly-selected shader program:
	gl.bindBuffer(gl.ARRAY_BUFFER,	    // GLenum 'target' for this GPU buffer 
										this.vboLoc);			// the ID# the GPU uses for our VBO.

// c) connect our newly-bound VBO to supply attribute variable values for each
// vertex to our SIMD shader program, using 'vertexAttribPointer()' function.
// this sets up data paths from VBO to our shader units:
  // 	Here's how to use the almost-identical OpenGL version of this function:
	//		http://www.opengl.org/sdk/docs/man/xhtml/glVertexAttribPointer.xml )
  gl.vertexAttribPointer(
		this.a_PositionLoc,//index == ID# for the attribute var in GLSL shader pgm;
		this.vboFcount_a_Position, // # of floats used by this attribute: 1,2,3 or 4?
		gl.FLOAT,		  // type == what data type did we use for those numbers?
		false,				// isNormalized == are these fixed-point values that we need
									//									normalize before use? true or false
		this.vboStride,// Stride == #bytes we must skip in the VBO to move from the
		              // stored attrib for this vertex to the same stored attrib
		              //  for the next vertex in our VBO.  This is usually the 
									// number of bytes used to store one complete vertex.  If set 
									// to zero, the GPU gets attribute values sequentially from 
									// VBO, starting at 'Offset'.	
									// (Our vertex size in bytes: 4 floats for pos + 3 for color)
		this.vboOffset_a_Position);						
		              // Offset == how many bytes from START of buffer to the first
  								// value we will actually use?  (we start with position).
  gl.vertexAttribPointer(this.a_TexCoordLoc, this.vboFcount_a_TexCoord,
                         gl.FLOAT, false, 
  						           this.vboStride,  this.vboOffset_a_TexCoord);
  //-- Enable this assignment of the attribute to its' VBO source:
  gl.enableVertexAttribArray(this.a_PositionLoc);
  gl.enableVertexAttribArray(this.a_TexCoordLoc);
}

VBObox1.prototype.isReady = function() {
//==============================================================================
// Returns 'true' if our WebGL rendering context ('gl') is ready to render using
// this objects VBO and shader program; else return false.
// see: https://developer.mozilla.org/en-US/docs/Web/API/WebGLRenderingContext/getParameter

var isOK = true;

  if(gl.getParameter(gl.CURRENT_PROGRAM) != this.shaderLoc)  {
    console.log(this.constructor.name + 
    						'.isReady() false: shader program at this.shaderLoc not in use!');
    isOK = false;
  }
  if(gl.getParameter(gl.ARRAY_BUFFER_BINDING) != this.vboLoc) {
      console.log(this.constructor.name + 
  						'.isReady() false: vbo at this.vboLoc not in use!');
    isOK = false;
  }
  return isOK;
}

VBObox1.prototype.adjust = function() {
//==============================================================================
// Update the GPU to newer, current values we now store for 'uniform' vars on 
// the GPU; and (if needed) update each attribute's stride and offset in VBO.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
  						'.adjust() call you needed to call this.switchToMe()!!');
  }
/* NONE!
	// Adjust values for our uniforms,
  this.ModelMatrix.setRotate(g_angleNow1, 0, 0, 1);	// -spin drawing axes,
  this.ModelMatrix.translate(0.35, -0.15, 0);						// then translate them.
  //  Transfer new uniforms' values to the GPU:-------------
  // Send  new 'ModelMat' values to the GPU's 'u_ModelMat1' uniform: 
  gl.uniformMatrix4fv(this.u_ModelMatrixLoc,	// GPU location of the uniform
  										false, 										// use matrix transpose instead?
  										this.ModelMatrix.elements);	// send data from Javascript.
*/
}

VBObox1.prototype.draw = function() {
//=============================================================================
// Send commands to GPU to select and render current VBObox contents.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
  						'.draw() call you needed to call this.switchToMe()!!');
  }
  
  // ----------------------------Draw the contents of the currently-bound VBO:
  gl.drawArrays(gl.TRIANGLE_STRIP, // select the drawing primitive to draw:
                  // choices: gl.POINTS, gl.LINES, gl.LINE_STRIP, gl.LINE_LOOP, 
                  //          gl.TRIANGLES, gl.TRIANGLE_STRIP,
  							0, 								// location of 1st vertex to draw;
  							this.vboVerts);		// number of vertices to draw on-screen.
}


VBObox1.prototype.reload = function() {
//=============================================================================
// Over-write current values in the GPU for our already-created VBO: use 
// gl.bufferSubData() call to re-transfer some or all of our Float32Array 
// contents to our VBO without changing any GPU memory allocations.

  // check: was WebGL context set to use our VBO & shader program?
  if(this.isReady()==false) {
        console.log('ERROR! before' + this.constructor.name + 
  						'.reload() call you needed to call this.switchToMe()!!');
  }

 gl.bufferSubData(gl.ARRAY_BUFFER, 	// GLenum target(same as 'bindBuffer()')
                  0,                  // byte offset to where data replacement
                                      // begins in the VBO.
 					 				this.vboContents);   // the JS source-data array used to fill VBO

// Modify/update the contents of the texture map(s) stored in the GPU;
// Copy current contents of CImgBuf object 'g_myPic'  (see initTextures() above)
// into the existing texture-map object stored in the GPU:

  gl.texSubImage2D(gl.TEXTURE_2D, 	//  'target'--the use of this texture
  							0, 							//  MIP-map level (default: 0)
  							0,0,						// xoffset, yoffset (shifts the image)
								g_myPic.xSiz,			// image width in pixels,
								g_myPic.ySiz,			// image height in pixels,
  							gl.RGB, 				// source/input data format (RGB? RGBA?)
  							gl.UNSIGNED_BYTE, 	// data type for each color channel				
								g_myPic.iBuf);	  // texture-image data source.
}


/*
VBObox1.prototype.empty = function() {
//=============================================================================
// Remove/release all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  However, make sure this step is reversible by a call to 
// 'restoreMe()': be sure to retain all our Float32Array data, all values for 
// uniforms, all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}

VBObox1.prototype.restore = function() {
//=============================================================================
// Replace/restore all GPU resources used by this VBObox object, including any 
// shader programs, attributes, uniforms, textures, samplers or other claims on 
// GPU memory.  Use our retained Float32Array data, all values for  uniforms, 
// all stride and offset values, etc.
//
//
// 		********   YOU WRITE THIS! ********
//
//
//
}
*/

//=============================================================================
//=============================================================================
//=============================================================================
