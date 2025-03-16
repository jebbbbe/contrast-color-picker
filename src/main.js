import * as THREE from "three";
import * as ThreeTools from "threetools";
import { GUI } from 'dat.gui';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// globals
let world, scene, camera, renderer, container, controls;
let sceneCamera, vitualCamera
let M, aspect;
let materials = []
let meshes = []

M = {
    backgroundColor: 0xc9807b,
    cubeColor: 0x3555e6,
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
    aspect = new ThreeTools.AspectLayout("dynamic",container);
    renderer.setSize(aspect.x, aspect.y);
    renderer.setPixelRatio(M.pixelRatio);

    sceneCamera = new THREE.OrthographicCamera( - 1, 1, 1, - 1, 0, 1000 );
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



    //world
    world = {
        scene: scene,
        camera: [sceneCamera, vitualCamera],
        renderer: renderer,
        meshes:meshes,
        materials:materials,
    };
    window.world = world;

    addMesh()

   
    // addGui()
    aspect.addResizeListener(renderer,sceneCamera,render)
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    controls.update()
    renderer.render(scene, sceneCamera);
}


function addGui() {
    let gui = new GUI({width:300});
    gui.addColor(M, "backgroundColor").name("Background Color").listen().onChange(updateBackground);
    gui.addColor(M, "cubeColor").name("cube Color").listen().onChange(updateCube);

    function updateBackground(){
        scene.background = new THREE.Color(M.backgroundColor);
    }
   function updateCube(){
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


function addMesh(){
    const size = 2//1
    const geometry = new THREE.PlaneBufferGeometry( size,  size);
    const uniforms = {
        // time: { value: 0.0 },
        cameraMatrix:{value:vitualCamera.matrix},
        /*
        seed:{value:M.var.shaderSeeds},
        noiseType:{value:M.var.noiseType},

        C_scale: { value: M.var.scale },
        C_detal: { value: M.var.detail },
        C_rough: { value: M.var.rough },
        
        C_randomness: { value: M.var.randomness },
        C_metric: { value: M.var.metric },
        C_exponent: { value: M.var.exponent },
        C_smoothness: { value: M.var.smoothness },
        
        useClipColors: { value: M.var.useClipColors },
        bottomClipColor: { value: new THREE.Color(M.var.bottomClipColor) },
        topClipColor: { value: new THREE.Color(M.var.topClipColor) },
        blackPoint: { value: M.var.blackPoint },
        whitePoint: { value: M.var.whitePoint },
        displayVoronoiOut:{value: M.var.displayVoronoiOut},
        
        scalePos:{value: new THREE.Vector2(0.5,0.5)},
        movePos:{value: new THREE.Vector2(0.0,0.0)},
        
        cameraMatrix:{value:M.var.cameraMatrix},
        animate:{value:useAnim},
        start_scale: { value: M.var.scale },
        */
    };
    // const material = materials[0] = new THREE.MeshBasicMaterial({color:0xff000f})
    const material = materials[0] = new THREE.ShaderMaterial( {

        uniforms: uniforms,
        vertexShader: /*glsl*/`
        varying vec2 vUv;
        uniform mat4 cameraMatrix;
        void main()	{
            // UV coordinates
            // vUv = uv;
            vUv = (cameraMatrix * vec4(uv,0.,1.0)).xy;

            //gl_Position
            // gl_Position = vec4( position, 1.0 );

            // gl_Position = vec4(position.xy, 0.0, 1.0); // doesnt work
            vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
            gl_Position = projectionMatrix * mvPosition;
            // gl_Position = vec4( position, 1.0 );
        }
        `,
        fragmentShader: /*glsl*/`
        varying vec2 vUv;
        uniform mat4 cameraMatrix;

        void main() {
            //vec2 st = gl_FragCoord.xy/u_resolution.xy;
            //st.x *= u_resolution.x/u_resolution.y;
            vec2 st = vUv;
            vec3 color = vec3(st,0.0);
            if( 
                0.25< st.x && st.x < 0.75 &&
                0.25< st.y && st.y < 0.75
            ){
                color.z = 1.0;
            }
            gl_FragColor = vec4(color,1.0);
        }
        `,
        onBeforeCompile: shader => {
            //shader.vertexShader = `${shader.vertexShader}`;
            //console.log(shader)
            //console.log(shader.vertexShader)
            //console.log(shader.fragmentShader)
        }
       
    } );
     
    let mesh = meshes[0] = new THREE.Mesh( geometry, material );
    mesh.rotateX(-Math.PI/2)
    scene.add( mesh );
}