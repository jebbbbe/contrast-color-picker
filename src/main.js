import * as THREE from "three";
import * as ThreeTools from "threetools";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { sdfRenderMaterial } from "./material"
import { addGui } from "./libraries/ui.js"
import { outputTargets, densityFunctions, transformModes } from "./libraries/constants.js"


// globals
let world, scene, camera, renderer, container, controls;
let sceneCamera, virtualCamera
let M, aspect;
let sdfMaterial;
let materials = []
let meshes = []
let animationController = new ThreeTools.AnimationController()

M = {
    var: {
        backgroundColor: 0x05784C,
        backgroundOpacity: 1.0,

        camPosition: undefined,
        camDir: new THREE.Vector3(),
        camFov: 10,
        camAspect: 10,

        spherePos: new THREE.Vector4(0.5, 0.5, 0.5, 0.0),
        drawingTarget: outputTargets.color,
        densityFunction: densityFunctions.none,
        contrastRatio: 4.5,
        transformMode: transformModes.none,

        maxRayStep:128,
        maxRayDepth:500000,
        turnTable:true,
        customTransformMatrix:new THREE.Matrix3(),

        selectedColor:0xffffff,
        sdfMaxDist:0.466,
        sdfMinDist:2.35,
        visualizeSolution:false,
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
    virtualCamera = new THREE.PerspectiveCamera(60, window.innerWidth / window.innerHeight, 0.001, 1000);
    virtualCamera.position.set(0, 10, 0);
    controls = initOrbit(virtualCamera, renderer)

    M.var.camPosition = virtualCamera.position
    virtualCamera.getWorldDirection(M.var.camDir)
    M.var.camFov = virtualCamera.fov * Math.PI / 180.0;
    M.var.camAspect = aspect.aspect

    console.log(M)

    //world
    world = {
        scene: scene,
        camera: [sceneCamera, virtualCamera],
        renderer: renderer,
        meshes: meshes,
        materials: materials,
        controls:controls,
    };
    window.world = world;
    window.THREE = THREE;

    const geometry = new THREE.PlaneBufferGeometry(2, 2);

    sdfMaterial = materials[0] = new sdfRenderMaterial({
        backgroundColor: new THREE.Color(M.var.backgroundColor),
        backgroundOpacity: M.var.backgroundOpacity,
        mixBackground:true,
        u_camPos: M.var.camPosition,
        u_camDir: M.var.camDir,
        u_fov: M.var.camFov,
        u_aspect: M.var.camAspect,
        MAX_STEPS:128*8,
        MAX_DEPTH:500000,
        drawingTarget:M.var.drawingTarget,
        spherePos: M.var.spherePos,
        densityFunction: M.var.densityFunction,
        contrastRatio: M.var.contrastRatio,
        transformMode: M.var.transformMode,
        customTransformMatrix: M.var.customTransformMatrix,
        selectedColor:new THREE.Color( M.var.selectedColor ),
        sdfMaxDist:M.var.sdfMaxDist,
        sdfMinDist:M.var.sdfMinDist,
        visualizeSolution:M.var.visualizeSolution,
    })

    let mesh = meshes[0] = new THREE.Mesh(geometry, sdfMaterial);
    mesh.rotateX(-Math.PI / 2)
    scene.add(mesh);

    addGui({ M, scene, sdfMaterial })
    aspect.addResizeListener(renderer, sceneCamera, resize)
    animationController.setRenderer(render)
    animate();
    // animationController.renderFrame()
    // renderer.domElement.addEventListener("touchstart", (e)=>{animationController.play(); console.log("start")})
    // renderer.domElement.addEventListener("touchend", (e)=>{animationController.pause(); console.log("end")})
}

function resize() {
    sdfMaterial.customUniforms.u_fov.value = virtualCamera.fov * Math.PI / 180.0;
    sdfMaterial.customUniforms.u_aspect.value = aspect.aspect;
    render()
}

function animate() {
    animationController.play()
}

function render() {
    if(M.var.turnTable){
        const p = virtualCamera.position
        const r = new THREE.Vector2(p.x,p.z).distanceTo(new THREE.Vector2(0,0))   
        const t = Math.atan2(p.z, p.x);
        const d = 0.005;
        virtualCamera.position.x = r*Math.cos(t+d);
        virtualCamera.position.z = r*Math.sin(t+d);
        controls.update();
    }
    // sdfMaterial.customUniforms.u_camPos.value.copy(virtualCamera.position);
    virtualCamera.getWorldDirection(sdfMaterial.customUniforms.u_camDir.value);
    // sdfMaterial.customUniforms.u_fov.value = virtualCamera.fov * Math.PI / 180.0;
    // sdfMaterial.customUniforms.u_aspect.value = aspect.aspect;
    controls.update()
    renderer.render(scene, sceneCamera);
}



function initOrbit(camera, renderer) {
    // ORBIT controls
    const controls = new OrbitControls(camera, renderer.domElement);
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
    return controls
}

function rand(min = 0, max = 1) {
    return (max - min) * Math.random() + min;
}
function rInt(min = 0, max = 1) {
    return Math.floor(rand(min, max));
}