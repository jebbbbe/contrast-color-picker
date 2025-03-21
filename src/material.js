import * as THREE from "three";
import * as ThreeTools from "threetools";

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
// vec3 u_camDir = vec3(vec2(-0.350,-0.250), -0.808);        // Camera direction at the center (for uv = 0.5,0.5).
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

const mat3 protanopiaMatrix = mat3(
    0.567, 0.558, 0.0,
    0.433, 0.442, 0.0,
    0.0,   0.242, 0.758
);

vec3 applyProtanopia(vec3 color) {
    return vec3(
        color.r * 0.567 + color.g * 0.433 + color.b * 0.0,
        color.r * 0.558 + color.g * 0.442 + color.b * 0.0,
        color.r * 0.0   + color.g * 0.242 + color.b * 0.758
    );
}

const int MAX_STEPS = 128*8;
const float MAX_DEPTH = 500000.;

float densityByContrast(vec3 color) {
    // Compute relative luminance using sRGB coefficients.
    float luminance = dot(color, vec3(0.2126, 0.7152, 0.0722));
    // Compute the opposite color (inversion).
    vec3 oppositeColor = vec3(1.0) - color;
    float luminanceOpp = dot(oppositeColor, vec3(0.2126, 0.7152, 0.0722));
    // Determine the higher and lower luminance.
    float L1 = max(luminance, luminanceOpp);
    float L2 = min(luminance, luminanceOpp);
    // Compute contrast ratio as (L1 + 0.05) / (L2 + 0.05).
    float contrastRatio = (L1 + 0.05) / (L2 + 0.05);
    // If the contrast ratio is less than 4.5, set density to zero; otherwise, use a high density.
    return (contrastRatio < 4.068) ? 0.0 : MAX_DEPTH;
}

void main() {
    // Normalized pixel coordinates.
    // vec2 st = gl_FragCoord.xy / u_resolution.xy;
    // st.x *= u_resolution.x / u_resolution.y;
    vec2 st = vUv;

    vec2 uv = st;
    float stepsTaken = 0.;
    mat3 e = inverse(protanopiaMatrix);
    // Compute the offset from the center.
    vec2 offset = uv - vec2(0.5);
    
    // Construct a camera basis from the camera's central direction.
    // Use a default world up (assumed non-parallel to u_camDir).
    vec3 up    = vec3(0.0, 1.0, 0.0);
    vec3 right = normalize(cross(u_camDir, up));
    vec3 camUp = cross(right, u_camDir);
    
    // Calculate the ray direction.
    // The center pixel (uv = 0.5,0.5) gets u_camDir.
    // Other pixels offset from center are adjusted by the right and up vectors scaled by u_fov.
    vec3 rayDir = normalize(u_camDir + (offset.x * right + offset.y * camUp) * u_fov);
    
    // Ray origin comes from the camera position.
    vec3 rayOrigin = u_camPos;
    
    // Define the volume as a cube from -0.5 to 0.5.
    vec2 bounds = intersectBox(rayOrigin, rayDir, vec3(-0.5), vec3(0.5));
    if (bounds.x > bounds.y) {
        gl_FragColor = backgroundColor;
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
        // vec3 transformedColor = applyProtanopia(sampleColor);
        vec3 transformedColor = sampleColor;

        
        // Use a high constant density if red is above threshold; zero otherwise.
        // float density = (sampleColor.r > 0.586) ? 0.0 :MAX_DEPTH; 
        float density = (distance(transformedColor, vec3(0.626,0.740,0.540)) < 0.466) ? 0.0 :MAX_DEPTH;
        // float density = MAX_DEPTH;      
		// float density = ( 
		// transformedColor.x > 0.376
		// ) ? 0.0 :MAX_DEPTH;
			// float density = densityByContrast(transformedColor);
        
        // Calculate opacity contribution for this step.
        float alphaStep = 1.0 - exp(-density * dt);
        
        // Front-to-back compositing.
        accumulatedColor += (1.0 - accumulatedAlpha) * transformedColor * alphaStep;
        accumulatedAlpha += (1.0 - accumulatedAlpha) * alphaStep;
        
        if (accumulatedAlpha >= 0.95) break;
    }
    if(accumulatedAlpha == 0.){
        gl_FragColor = backgroundColor; 
    }else{
        gl_FragColor = vec4(accumulatedColor, accumulatedAlpha);  
        // gl_FragColor = vec4( vec3(1.-stepsTaken/float(MAX_STEPS)), 1.0);
    }
}
`
export class sdfRenderMaterial extends ThreeTools.CustomShaderMaterial {
    constructor(parameters = {}, share) {
        const customProperties = {
            vUv: { qualifier: "varying", type: "vec2" },
            backgroundColor: { qualifier: "uniform", type: "vec4", value: new THREE.Vector4(0.021, 0.470, 0.299, 1.0) },
            u_camPos: { qualifier: "uniform", type: "vec3", value: new THREE.Vector3() },
            u_camDir: { qualifier: "uniform", type: "vec3", value: new THREE.Vector3() },
            u_fov: { qualifier: "uniform", type: "float", value: 10 },
            u_aspect: { qualifier: "uniform", type: "float", value: 1 },
        }
        super(parameters, customProperties)
        this.onBeforeCompile = (shader) => {
            this.linkUnifromsToShader(shader)
            // console.log(shader.vertexShader)
            // console.log(shader.fragmentShader)
            shader.vertexShader = this.headers.vertex + vert
            shader.fragmentShader = this.headers.fragment + frag
            this.userData.shader = shader;
        }
    }
}