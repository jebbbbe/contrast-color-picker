import * as THREE from "three";
import * as ThreeTools from "threetools";
import { GUI } from 'dat.gui';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";


let vert = /*glsl*/`
#ifdef GL_ES
precision mediump float;
#endif

// uniform vec2 u_resolution;
// uniform vec2 u_mouse;
// uniform float u_time;
varying vec2 vUv;
uniform vec3 u_camPos;
uniform vec3 u_camDir;
uniform float u_fov;

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
const float MAX_DEPTH = 5.;

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
    vec2 bounds = intersectBox(rayOrigin, rayDir, vec3(0.0), vec3(1.0));
    if (bounds.x > bounds.y) {
        gl_FragColor = vec4(0.021, 0.470, 0.299, 1.0);
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
        vec3 sampleColor = pos + vec3(0.0);
        // vec3 transformedColor = applyProtanopia(sampleColor);
        vec3 transformedColor = sampleColor;

        
        // Use a high constant density if red is above threshold; zero otherwise.
        // float density = (sampleColor.r > 0.586) ? 0.0 :MAX_DEPTH; 
        // float density = (distance(transformedColor, vec3(0.626,0.740,0.540)) < 0.466) ? 0.0 :MAX_DEPTH;
        float density = MAX_DEPTH;      
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
         	gl_FragColor = vec4(0.021, 0.470, 0.299, 1.0); 
     }else{
         
    gl_FragColor = vec4(accumulatedColor, accumulatedAlpha);  
    // gl_FragColor = vec4( vec3(1.-stepsTaken/float(MAX_STEPS)), 1.0);
     }


}
`



// globals
let world, scene, camera, renderer, container, controls;
let sceneCamera, vitualCamera
let M, aspect;
let materials = []
let meshes = []

M = {
    backgroundColor: 0xc9807b,
    cubeColor: 0x3555e6,
    virtualPosition: undefined,
    virtualTarget: undefined,
    virtualDir: undefined,
    virtualFov: 10,
};


init();
animate();

function init() {
    //renderer
    renderer = new THREE.WebGLRenderer({
        antialias: true,
        preserveDrawingBuffer: true,
    });
    container = document.getElementById("app");
    container.appendChild(renderer.domElement);
    aspect = new ThreeTools.AspectLayout("dynamic", container);
    renderer.setSize(aspect.x, aspect.y);
    renderer.setPixelRatio(M.pixelRatio);

    sceneCamera = new THREE.OrthographicCamera(- 1, 1, 1, - 1, 0, 1000);
    sceneCamera.position.set(0, 10, 0);
    sceneCamera.lookAt(0, 0, 0);

    //scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(M.backgroundColor);
    // camera = new THREE.OrthographicCamera(aspect.cam.l, aspect.cam.r, aspect.cam.t, aspect.cam.b, aspect.cam.n, aspect.cam.f);
    // camera.aspect = aspect.aspect;
    vitualCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.001, 1000);
    vitualCamera.position.set(0, 10, 0);
    initOrbit(vitualCamera, renderer)

    M.virtualDir = vitualCamera.fov

    M.virtualPosition = vitualCamera.position
    M.virtualTarget = controls.target
    M.virtualDir = new THREE.Vector3().subVectors(M.virtualTarget, M.virtualPosition).normalize();
    M.virtualFov = vitualCamera.fov



    //world
    world = {
        scene: scene,
        camera: [sceneCamera, vitualCamera],
        renderer: renderer,
        meshes: meshes,
        materials: materials,
    };
    window.world = world;

    addMesh()


    // addGui()
    aspect.addResizeListener(renderer, sceneCamera, render)
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    const camera = vitualCamera
      // Update camera position.
      materials[0].uniforms.u_camPos.value.copy(camera.position);

    // Update camera direction using getWorldDirection().
    camera.getWorldDirection(materials[0].uniforms.u_camDir.value);

    // Convert the camera's field of view from degrees to radians.
    materials[0].uniforms.u_fov.value = camera.fov * Math.PI / 180.0;


    controls.update()
    renderer.render(scene, sceneCamera);
}


function addGui() {
    let gui = new GUI({ width: 300 });
    gui.addColor(M, "backgroundColor").name("Background Color").listen().onChange(updateBackground);
    gui.addColor(M, "cubeColor").name("cube Color").listen().onChange(updateCube);

    function updateBackground() {
        scene.background = new THREE.Color(M.backgroundColor);
    }
    function updateCube() {
        materials[0].color = new THREE.Color(M.cubeColor);
    }
}

function initOrbit(camera, renderer) {
    // ORBIT controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.15; //0.05
    controls.screenSpacePanning = false;
    controls.enablePan = false;
    controls.panning = false;
    controls.minDistance = 1; //zoom min scaling
    controls.maxDistance = 2000; //zoom max scaling
    // camera.position.set(0, 90, 0);
    // camera.zoom = 0.06;
    controls.update();
    // controls.addEventListener("change", () => { // for no aniumation loop()
    // renderer.render(scene, camera);
    // });
}

function rand(min = 0, max = 1) {
    return (max - min) * Math.random() + min;
}
function rInt(min = 0, max = 1) {
    return Math.floor(rand(min, max));
}


function addMesh() {
    const size = 2//1
    const geometry = new THREE.PlaneBufferGeometry(size, size);
    const uniforms = {
        // time: { value: 0.0 },
        cameraMatrix: { value: vitualCamera.matrix },
        u_camPos: { value: M.virtualPosition },
        u_camDir: { value: M.virtualDir },
        u_fov: { value: M.virtualFov },

    };
    // const material = materials[0] = new THREE.MeshBasicMaterial({color:0xff000f})
    const material = materials[0] = new THREE.ShaderMaterial({

        uniforms: uniforms,
        vertexShader: /*glsl*/`
        varying vec2 vUv;
        void main()	{
            vUv = uv;
            gl_Position = vec4( position, 1.0 );
        }
        `,
        fragmentShader: vert,

         /*glsl*//*`
        varying vec2 vUv;
        uniform vec3 u_camPos;
        uniform vec3 u_camDir;
        uniform float u_fov;

        // void main() {
        //     vec2 st = vUv;
        //     vec3 color = vec3(st,0.0);
        //     if( 
        //         0.25< st.x && st.x < 0.75 &&
        //         0.25< st.y && st.y < 0.75
        //     ){
        //         color.z = 1.0;
        //     }
        //     gl_FragColor = vec4(color,1.0);
        // }


        // Camera uniforms (to be updated from three.js)
        // uniform vec3 u_camPos;    // e.g., (0.0, 0.0, 4.0)
        // uniform vec3 u_camDir;    // e.g., (0.0, 0.0, -1.0)
        // uniform float u_fov;      // e.g., tan(camera.fov * 0.5 in radians)

        const float EPSILON = 0.001;
        const int MAX_STEPS = 100;
        const float MAX_DIST = 10.0;
                
        // SDF for a box centered at the origin with half-extents 'b'
        float sdBox(vec3 p, vec3 b) {
            vec3 d = abs(p) - b;
            return length(max(d, 0.0)) + min(max(d.x, max(d.y, d.z)), 0.0);
        }
        // SDF for a box from (0,0,0) to (1,1,1)
        // We shift p by subtracting vec3(0.5) so that the box is centered at (0.5,0.5,0.5)
        // with half-extents of 0.5.
        float sdfBox(vec3 p) {
            return sdBox(p - vec3(0.5), vec3(0.5));
        }
        
        void main() {
            // Normalize pixel coordinates to [0,1] then to [0,1] with aspect ratio correction.
            // vec2 st = gl_FragCoord.xy / u_resolution.xy;
            // st.x *= u_resolution.x / u_resolution.y;
            vec2 st = vUv;
            vec2 uv = st;
        
            // Compute offset from center (0.5,0.5)
            vec2 offset = uv - vec2(0.5);
        
            // Construct a camera basis.
            vec3 up = vec3(0.0, 1.0, 0.0);
            vec3 right = normalize(cross(u_camDir, up));
            vec3 camUp = cross(right, u_camDir);
        
            // Compute the ray direction:
            // The center pixel gets u_camDir; other pixels are offset by the right and up vectors,
            // scaled by u_fov.
            vec3 rd = normalize(u_camDir + (offset.x * right + offset.y * camUp) * u_fov);
        
            // Ray origin from the camera uniform.
            vec3 ro = u_camPos;
        
            // Raymarching loop.
            float t = 0.0;
            bool hit = false;
            for (int i = 0; i < MAX_STEPS; i++) {
            vec3 pos = ro + t * rd;
            float d = sdfBox(pos);
            if (d < EPSILON) {
                hit = true;
                break;
            }
            t += d;
            if (t > MAX_DIST) break;
            }
            
            // If we hit the box, render it white; otherwise, render a black background.
            if (hit) {
            gl_FragColor = vec4(vec3(1.0), 1.0);
            } else {
            gl_FragColor = vec4(vec3(0.0), 1.0);
            }
        }

        `*/
        onBeforeCompile: shader => {
            //console.log(shader)
            //console.log(shader.vertexShader)
            //console.log(shader.fragmentShader)
        }

    });

    let mesh = meshes[0] = new THREE.Mesh(geometry, material);
    mesh.rotateX(-Math.PI / 2)
    scene.add(mesh);
}