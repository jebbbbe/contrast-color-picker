import * as THREE from "three";
import * as ThreeTools from "threetools";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { sdfRenderMaterial } from "./material"
import { addGui } from "./libraries/ui.js"
import { outputTargets, densityFunctions } from "./libraries/constants.js"


// globals
let world, scene, camera, renderer, container, controls;
let sceneCamera, vitualCamera
let M, aspect;
let sdfMaterial;
let materials = []
let meshes = []


M = {
    var: {
        backgroundColor: 0x05784C,
        backgroundOpacity: 1.0,

        camPosition: undefined,
        camDir: new THREE.Vector3(),
        camFov: 10,
        camAspect: 10,

        spherePos: new THREE.Vector4(0.5, 0.5, 0.5, 0.6),
        drawingTarget: outputTargets.color,
    },
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
    scene.background = new THREE.Color(M.var.backgroundColor);
    // camera = new THREE.OrthographicCamera(aspect.cam.l, aspect.cam.r, aspect.cam.t, aspect.cam.b, aspect.cam.n, aspect.cam.f);
    // camera.aspect = aspect.aspect;
    vitualCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.001, 1000);
    vitualCamera.position.set(0, 10, 0);
    initOrbit(vitualCamera, renderer)


    M.var.camPosition = vitualCamera.position
    vitualCamera.getWorldDirection(M.var.camDir)
    M.var.camFov = vitualCamera.fov * Math.PI / 180.0;
    M.var.camAspect = aspect.aspect

    console.log(M)

    //world
    world = {
        scene: scene,
        camera: [sceneCamera, vitualCamera],
        renderer: renderer,
        meshes: meshes,
        materials: materials,
    };
    window.world = world;
    window.THREE = THREE;

    const geometry = new THREE.PlaneBufferGeometry(2, 2);

    sdfMaterial = materials[0] = new sdfRenderMaterial({
        backgroundColor: new THREE.Color(M.var.backgroundColor),
        backgroundOpacity: M.var.backgroundOpacity,
        u_camPos: M.var.camPosition,
        u_camDir: M.var.camDir,
        u_fov: M.var.camFov,
        u_aspect: M.var.camAspect,
        spherePos: M.var.spherePos,
    })

    let mesh = meshes[0] = new THREE.Mesh(geometry, sdfMaterial);
    mesh.rotateX(-Math.PI / 2)
    scene.add(mesh);

    addGui({ M, scene, sdfMaterial })
    aspect.addResizeListener(renderer, sceneCamera, resize)
    animate();
}

function resize() {
    sdfMaterial.customUniforms.u_fov.value = vitualCamera.fov * Math.PI / 180.0;
    sdfMaterial.customUniforms.u_aspect.value = aspect.aspect;
    render()
}

function animate() {
    requestAnimationFrame(animate);
    render();
}

function render() {
    // sdfMaterial.customUniforms.u_camPos.value.copy(vitualCamera.position);
    vitualCamera.getWorldDirection(sdfMaterial.customUniforms.u_camDir.value);
    // sdfMaterial.customUniforms.u_fov.value = vitualCamera.fov * Math.PI / 180.0;
    // sdfMaterial.customUniforms.u_aspect.value = aspect.aspect;
    controls.update()
    renderer.render(scene, sceneCamera);
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
    camera.position.set(1.5, 1.5, 1.5);
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