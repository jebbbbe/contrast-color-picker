import * as THREE from "three";
import * as ThreeTools from "threetools";


export class sdfRenderMaterial extends ThreeTools.CustomShaderMaterial {
    constructor(parameters = {}, share) {
        const customProperties = {
            vUv: { qualifier: "varying", type: "vec2" },
            backgroundColor: { qualifier: "uniform", type: "vec3", value: new THREE.Vector3(0.021, 0.470, 0.299) },
            backgroundOpacity: { qualifier: "uniform", type: "float", value: 1.0 },
            mixBackground: { qualifier: "uniform", type: "bool", value: true },
            u_camPos: { qualifier: "uniform", type: "vec3", value: new THREE.Vector3() },
            u_camDir: { qualifier: "uniform", type: "vec3", value: new THREE.Vector3() },
            u_fov: { qualifier: "uniform", type: "float", value: 10 },
            u_aspect: { qualifier: "uniform", type: "float", value: 1 },
            MAX_STEPS: { qualifier: "uniform", type: "int", value: 128 },
            MAX_DEPTH: { qualifier: "uniform", type: "float", value: 500000 },
            drawingTarget: { qualifier: "uniform", type: "int", value: 0 },
            spherePos: { qualifier: "uniform", type: "vec4", value: new THREE.Vector4(0.626, 0.740, 0.540, 0.466) },
            densityFunction: { qualifier: "uniform", type: "int", value: 0 },
            contrastRatio: { qualifier: "uniform", type: "float", value: 4.5 },
            transformMode: { qualifier: "uniform", type: "int", value: 0 },
            customTransformMatrix: { qualifier: "uniform", type: "mat3", value: new THREE.Matrix3() },
            selectedColor: { qualifier: "uniform", type: "vec3", value: new THREE.Color(0xff00f0) },

        }
        super(parameters, customProperties)
        this.onBeforeCompile = (shader) => {
            this.linkUnifromsToShader(shader)
            shader.vertexShader = this.headers.vertex + vert
            shader.fragmentShader = this.headers.fragment + frag
            this.userData.shader = shader;
        }
    }
}



const vert = /* glsl */ `
void main()	{
    vUv = uv;
    vUv.x -= 0.5;
    vUv.x *= u_aspect;
    vUv.x += 0.5;
    gl_Position = vec4( position, 1.0 );
}
`
const frag = /* glsl */ /*glsl*/`
// #ifdef GL_ES
// precision mediump float;
// #endif

// uniform vec2 u_resolution;
// uniform vec2 u_mouse;
// uniform float u_time;

// vec3 u_camPos = vec3(vec2(0.560,0.470)*2.888, 2.984);    // Camera position.
// vec3 u_camDir = vec3(vec2(-0.350,-0.250), -0.808);        // Camera direction at the center (for st = 0.5,0.5).
// float u_fov = 0.712;/
//   u_camPos = vec3(0.0, 0.0, 4.0)
//   u_camDir = vec3(0.0, 0.0, -1.0)
//   u_fov    = 1.0

// Ray–box intersection for an axis-aligned cube.
vec2 intersectBox(vec3 ro, vec3 rd, vec3 boxMin, vec3 boxMax) {
    vec3 invR = 1.0 / rd;
    vec3 tbot = invR * (boxMin - ro);
    vec3 ttop = invR * (boxMax - ro);
    vec3 tmin = min(ttop, tbot);
    vec3 tmax = max(ttop, tbot);
    float tNear = max(max(tmin.x, tmin.y), tmin.z);
    float tFar = min(min(tmax.x, tmax.y), tmax.z);
    return vec2(tNear, tFar);
}

vec3 pushPointFromPlane(vec3 p, vec3 planePoint, vec3 planeNormal, float a ){
    // Ensure the normal is normalized
    vec3 N = normalize(planeNormal);
    // Signed distance from point to plane
    float d = dot(p - planePoint, N);
    // Clamp distance to [0, a]
    float clampedDist = clamp(d, 0.0, a);
    // Movement factor: 1 at 0 distance, 0 at distance a
    float factor = 1.0 - (clampedDist / a);
    // Push point away from plane along the normal
    // return p + N * factor * (a - clampedDist);  // or just factor * a
    return p + N * sign(d) * factor * a;

}




mat3 invertMatrix(mat3 m) { // if there is no inverse()
    // Because GLSL matrices are stored in column-major order,
    // we extract the elements accordingly:
    float a = m[0][0], d = m[0][1], g = m[0][2];
    float b = m[1][0], e = m[1][1], h = m[1][2];
    float c = m[2][0], f = m[2][1], i = m[2][2];

    // Compute the determinant of m.
    float det = a * (e * i - f * h) -
                b * (d * i - f * g) +
                c * (d * h - e * g);

    // Compute the inverse using the adjugate matrix and the determinant.
    return mat3(
        (e * i - f * h) / det,  (c * h - b * i) / det,  (b * f - c * e) / det,
        (f * g - d * i) / det,  (a * i - c * g) / det,  (c * d - a * f) / det,
        (d * h - e * g) / det,  (b * g - a * h) / det,  (a * e - b * d) / det
    );
}


const float a = 0.728;
const float b = 0.592;
const float c = 0.200;
const mat3 protanopiaMatrix = mat3(
        0.567, 0.558, 0.0,
        0.433, 0.442, 0.242,
        0.0,   0.0,   0.758

        // a   ,  1.-b,    0.0,
        // 1.-a,     b,   1.-c,
        // 0.0 ,   0.0,      c

        // 0.625,0.7, 0.0,
        // 0.375,0.3, 0.3,
        // 0.000,0.0, 0.7
    	
        // 0.950,0.433,0.0,
        // 0.05,0.567,0.475,
        // 0.0,0.567,0.525
    

    
);

vec3 applyProtanopia(vec3 color) {
    return vec3(
        color.r * 0.567 + color.g * 0.433 + color.b * 0.0,
        color.r * 0.558 + color.g * 0.442 + color.b * 0.0,
        color.r * 0.0   + color.g * 0.242 + color.b * 0.758
    );
}

// const int MAX_STEPS = 128*8;
// const float MAX_DEPTH = 500000.;

float densityByOppositeContrast(vec3 color) {
    // Compute relative luminance using sRGB coefficients.
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    // Compute the opposite color (inversion).
    vec3 oppositeColor = vec3(1.0) - color;
    float luminanceOpp = dot(oppositeColor, vec3(0.2126, 0.7152, 0.0722));
    // Determine the higher and lower luminance.
    float L1 = max(luminance, luminanceOpp);
    float L2 = min(luminance, luminanceOpp);
    // Compute contrast ratio as (L1 + 0.05) / (L2 + 0.05).
    float contrastRatioCalc = (L1 + 0.05) / (L2 + 0.05);
    // If the contrast ratio is less than 4.5, set density to zero; otherwise, use a high density.
    return (contrastRatioCalc < contrastRatio) ? 0.0 : MAX_DEPTH;
}

float densityByColorContrast(vec3 selColor, vec3 color) {
    float luminance = dot(selColor, vec3(0.2126, 0.7152, 0.0722));
    // vec3 oppositeColor = color;
    float luminanceOpp = dot(color, vec3(0.2126, 0.7152, 0.0722));
    // Determine the higher and lower luminance.
    float L1 = max(luminance, luminanceOpp);
    float L2 = min(luminance, luminanceOpp);
    // Compute contrast ratio as (L1 + 0.05) / (L2 + 0.05).
    float contrastRatioCalc = (L1 + 0.05) / (L2 + 0.05);
    // If the contrast ratio is less than 4.5, set density to zero; otherwise, use a high density.
    return (contrastRatioCalc < contrastRatio) ? 0.0 : MAX_DEPTH;
}

vec3 calculateTransform( vec3 sampleColor){
    vec3 transformedColor;
    if( transformMode == 0 ){
        transformedColor = sampleColor;
    }else if ( transformMode == 1 ){
        transformedColor = applyProtanopia(sampleColor);
    }
    else if ( transformMode == 100 ){
        transformedColor = sampleColor * customTransformMatrix;
    }
    return transformedColor;
}

float protanopiaDensity(vec3 pos){
	float outd = 0.0;
	// if(pos.x <= (pos.x * 0.567 + 1.0 * 0.433) ){
	// outd = MAX_DEPTH;
	// }
	// if(pos.y <= (1.0 * 0.567 + pos.y  * 0.433) ){
	// outd = MAX_DEPTH;
	// }
	// // if(pos.z >= 0.567 ){
	// // 	outd = MAX_DEPTH;
	// // }
	// return outd;


	    // Recover the original color from the deformed color.
	// mat3 inverseProtanopiaMatrix = invertMatrix(protanopiaMatrix);
	mat3 inverseProtanopiaMatrix = inverse(protanopiaMatrix);
    vec3 inversePos = inverseProtanopiaMatrix * pos;
    // Check if each component is within the 0-1 range.
    if( 
        (inversePos.r >= 0.0 && inversePos.r <= 1.0) 
        &&
        (inversePos.g >= 0.0 && inversePos.g <= 1.0) 
        &&
        (inversePos.b >= 0.0 && inversePos.b <= 1.0)
    ){
        outd = MAX_DEPTH;
    }
    return outd;

}

float customMat3Density(vec3 pos){
    float outd = 0.0;
	mat3 inverseCustomMatrix = inverse(customTransformMatrix);
    vec3 inversePos = inverseCustomMatrix * pos;
    // Check if each component is within the 0-1 range.
    if( 
        (inversePos.r >= 0.0 && inversePos.r <= 1.0) 
        &&
        (inversePos.g >= 0.0 && inversePos.g <= 1.0) 
        &&
        (inversePos.b >= 0.0 && inversePos.b <= 1.0)
    ){
        outd = MAX_DEPTH;
    }
    return outd;

}

float map(float value, float min1, float max1, float min2, float max2) {
  return min2 + (value - min1) * (max2 - min2) / (max1 - min1);
}

float calculateDensity( vec3 sampleColor, vec3 transformedColor){
    float density;
    if( densityFunction == 0 ){ // none
        density = MAX_DEPTH;      
    }else if ( densityFunction == 1 ){ // section
        density = (transformedColor.r > spherePos.x) ? 0.0 :MAX_DEPTH; 
    }else if ( densityFunction == 2 ){ // sphere
        density = (distance(transformedColor, spherePos.xyz) < spherePos.w) ? 0.0 :MAX_DEPTH;
    }else if ( densityFunction == 3 ){ // contrast
        density = densityByOppositeContrast(transformedColor);
    }else if ( densityFunction == 4 ){ // Transformed Matrix
        // density = protanopiaDensity(sampleColor);
        density = protanopiaDensity(transformedColor);
    }else if ( densityFunction == 5 ){ // Transformed Matrix
        density = customMat3Density(transformedColor);
    }else if ( densityFunction == 6 ){ // TtransformedMatrixContrast
        // vec3 scaleDir = normalize( vec3(0.5,0.5,0.5) );
        vec3 scaleDir = spherePos.xyz ;
        float r = spherePos.w;
        // transformedColor -= vec3(0.5);
        // transformedColor *= scaleDir * (1./r);
        // transformedColor += vec3(0.5);

        // transformedColor = pushPointFromPlane(transformedColor, vec3(0.5), scaleDir, r);


        scaleDir = vec3 (0.284,0.954,0.096);
        r = 0.466;
        // transformedColor = pushPointFromPlane(transformedColor, vec3(0.5), scaleDir, r);
        vec3 planeNormal = vec3(0.284,0.954,0.096);
        vec3 planeOrigin = vec3(0.5);
        float maxDistance = 0.466;
        float minDist = spherePos.w;//0.167;
        vec3 point = transformedColor;// sampleColor
        vec3 diff = point - planeOrigin;
        float sdf = dot(diff, normalize(planeNormal));
        float s = sign(sdf);
        sdf = abs(sdf);
        if (sdf < maxDistance) {
            // Point is within the influence zone
            float d = clamp(sdf,0.,maxDistance);
            d -= maxDistance;
            d = map(d,maxDistance,0., 0.,minDist);
            d *= s;
            transformedColor += d * planeNormal;
        }
        density = densityByOppositeContrast(transformedColor);
    }else if ( densityFunction == 7 ){
        density = densityByColorContrast( selectedColor,transformedColor );
    }
    return density;
}

void main() {
    vec2 st = vUv;
    float stepsTaken = 0.;
    vec4 outputColor;
    // Compute the offset from the center.
    vec2 offset = st - vec2(0.5);
    // Construct a camera basis from the camera's central direction.
    // Use a default world up (assumed non-parallel to u_camDir).
    vec3 up    = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(u_camDir, up));
    vec3 camUp = cross(right, u_camDir);
    
    // Calculate the ray direction.
    // The center pixel (st = 0.5,0.5) gets u_camDir.
    // Other pixels offset from center are adjusted by the right and up vectors scaled by u_fov.
    vec3 rayDir = normalize(u_camDir + (offset.x * right + offset.y * camUp) * u_fov);
    
    // Ray origin comes from the camera position.
    vec3 rayOrigin = u_camPos;
    
    // Define the volume as a cube from -0.5 to 0.5.
    vec2 bounds = intersectBox(rayOrigin, rayDir, vec3(-0.5), vec3(0.5));
    if (bounds.x > bounds.y) {
        gl_FragColor = vec4(backgroundColor, backgroundOpacity);
        return;
    }
    
    float tStart = max(bounds.x, 0.0);
    float tEnd = bounds.y;
    float dt = (tEnd - tStart) / float(MAX_STEPS);
    
    vec3 accumulatedColor = vec3(0.0);
    float accumulatedAlpha = 0.0;
    
    // Volume integration loop.
    for (int i = 0; i < MAX_STEPS; i++) {
        stepsTaken++;
        float t = tStart + float(i) * dt;
        vec3 pos = rayOrigin + t * rayDir;
        // Remap position from [-0.5,0.5] to [0,1] to get an RGB value.
        vec3 sampleColor = pos + vec3(0.5);
        vec3 transformedColor = calculateTransform(sampleColor);

        float density = calculateDensity(sampleColor, transformedColor);
     
        
        // Calculate opacity contribution for this step.
        float alphaStep = 1.0 - exp(-density * dt);
        
        // Front-to-back compositing.
        accumulatedColor += (1.0 - accumulatedAlpha) * transformedColor * alphaStep;
        accumulatedAlpha += (1.0 - accumulatedAlpha) * alphaStep;
        
        if (accumulatedAlpha >= 0.95) break;
    }

    
    if( drawingTarget == 0 ){
        outputColor = vec4 ( accumulatedColor, accumulatedAlpha);
    }else if ( drawingTarget == 1 ){
        outputColor = vec4(vec3(1.-stepsTaken/float(MAX_STEPS)), accumulatedAlpha);
    }


    // mix bk color
    if(mixBackground){ // premultipled alpha issue?
        outputColor.rgb = mix( backgroundColor, outputColor.rgb , outputColor.a);
        outputColor.a = backgroundOpacity;

    }
    // if(accumulatedAlpha == 0.){
        // outputColor = vec4(backgroundColor, backgroundOpacity);
    // }
    gl_FragColor = outputColor;
     
}
`
