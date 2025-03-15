import * as THREE from "three";
import * as ThreeTools from "threetools";
import { GUI } from 'dat.gui';
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

// globals
let world, scene, camera, renderer, container, controls;
let M, aspect;
let materials = []

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

    //scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(M.backgroundColor);
    camera = new THREE.OrthographicCamera(aspect.cam.l, aspect.cam.r, aspect.cam.t, aspect.cam.b, aspect.cam.n, aspect.cam.f);
    camera.aspect = aspect.aspect;

    //world
    world = {
        scene: scene,
        camera: camera,
        renderer: renderer,
    };

    scene.add(new THREE.GridHelper());
    const box = new THREE.BoxBufferGeometry();
    const mat = new THREE.MeshBasicMaterial({ color: M.cubeColor });
    let cube = new THREE.Mesh(box, mat);
    scene.add(cube);
    materials.push(mat)

    initOrbit();
    addGui()
    aspect.addResizeListener(renderer,camera,render)
}

function animate() {

    requestAnimationFrame(animate);
    render();
}

function render() {
    controls.update()
    renderer.render(scene, camera);
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

function initOrbit() {
    // ORBIT controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // an animation loop is required when either damping or auto-rotation are enabled
    controls.dampingFactor = 0.15; //0.05
    controls.screenSpacePanning = false;
    controls.enablePan = false;
    controls.panning = false;
    controls.minDistance = 1; //zoom min scaling
    controls.maxDistance = 2000; //zoom max scaling
    camera.position.set(0, 90, 0);
    camera.zoom = 0.06;
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
