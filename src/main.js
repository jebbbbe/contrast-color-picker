import * as THREE from "three";
import * as ThreeTools from "threetools";
import { GUI } from 'dat.gui';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { sdfRenderMaterial } from "./material"

// globals
let world, scene, camera, renderer, container, controls;
let sceneCamera, vitualCamera
let M, aspect;
let sdfMaterial;
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
    renderer.setPixelRatio(2);

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

    const geometry = new THREE.PlaneBufferGeometry(2, 2);
    console.log(new THREE.Color(M.backgroundColor))
    const c = new THREE.Color(M.backgroundColor)
    const bk = new THREE.Vector4(
        c.r,
        c.g,
        c.b,
        1.0
    )
    sdfMaterial = materials[0] = new sdfRenderMaterial({
        // backgroundColor: { value: bk }
        // u_camPos: { value: M.virtualPosition },
        // u_camDir: { value: M.virtualDir },
        // u_fov: { value: M.virtualFov },
    })
    let mesh = meshes[0] = new THREE.Mesh(geometry, sdfMaterial);
    mesh.rotateX(-Math.PI / 2)
    scene.add(mesh);


    // addGui()
    aspect.addResizeListener(renderer, sceneCamera, render)
    animate();
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    const camera = vitualCamera
    // Update camera position.
    sdfMaterial.customUniforms.u_camPos.value.copy(camera.position);

    // Update camera direction using getWorldDirection().
    camera.getWorldDirection(sdfMaterial.customUniforms.u_camDir.value);

    // Convert the camera's field of view from degrees to radians.
    sdfMaterial.customUniforms.u_fov.value = camera.fov * Math.PI / 180.0;


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
    // controls.screenSpacePanning = false;
    // controls.enablePan = false;
    // controls.panning = false;
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