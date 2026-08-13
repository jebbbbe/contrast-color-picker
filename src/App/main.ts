import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { SdfColorCube } from "./objects/SdfColorCube"
import { ClipPlaneController, defaultClipPlaneZ } from "./objects/clipPlane"
import * as SDF from "./objects/materials/SdfMaterial.js"
import { AspectLayout } from "./utils/AspectLayout.js"
import { logScenePixel } from "./utils/logScenePixel"
import { SceneGui } from "./gui"

export class ThreeSceneApp {
    private readonly renderer: THREE.WebGLRenderer
    private readonly scene: THREE.Scene
    private readonly camera: THREE.PerspectiveCamera
    private readonly aspectLayout: AspectLayout
    private readonly gui: SceneGui
    readonly controls: OrbitControls
    readonly ctx: {
        clipPlane: ClipPlaneController
        sdfColorCube: SdfColorCube
        sdfGroup: THREE.Group
    }
    private animationFrameId = 0

    constructor(container: HTMLElement) {
        // layout
        const aspectLayout = new AspectLayout("dynamic", container)

        // renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        // renderer.outputColorSpace = THREE.LinearSRGBColorSpace
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.NoToneMapping
        renderer.setPixelRatio(globalThis.devicePixelRatio)
        renderer.setSize(1, 1)
        container.appendChild(renderer.domElement)

        // scene
        const scene = new THREE.Scene()
        scene.background = new THREE.Color("#dee4ef")

        // camera
        const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
        camera.position.set(-0.75, 0.25, 1.75)

        // controls
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.autoRotateSpeed = 2.5
        controls.target.set(0, 0, 0)
        camera.lookAt(controls.target)
        controls.update()

        // lights
        // const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
        // const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
        // directionalLight.position.set(4, 6, 8)

        // content
        const sdfColorCube = new SdfColorCube()

        const sdfGroup = new THREE.Group()
        const sdfMesh = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new SDF.SdfMaterial({
                // lightPosition: directionalLight.position,
                lightPosition: new THREE.Vector3(4, 6, 8),
                color: 0xffffff,
                targetOutput: SDF.SdfTargetOutputLit,
                shape: SDF.SdfShapeCutHollowSphere,
                // side:THREE.DoubleSide,
            })
        )
        const sdfWireframe = new THREE.LineSegments(
            new THREE.EdgesGeometry(sdfMesh.geometry),
            new THREE.LineBasicMaterial({ color: 0x9ca3af })
        )
        sdfGroup.add(sdfMesh, sdfWireframe)
        sdfGroup.scale.set(1, 1, 1)
        sdfGroup.rotation.set(0, 0, 0)
        sdfGroup.position.set(2, 0, 2)
        sdfGroup.visible = false

        const clipPlane = new ClipPlaneController(renderer)
        clipPlane.position = defaultClipPlaneZ

        scene.add(
            // ambientLight,
            // directionalLight,
            sdfColorCube,
            sdfGroup,
            clipPlane.outline
        )

        // ui
        // props
        this.aspectLayout = aspectLayout
        this.renderer = renderer
        this.scene = scene
        this.camera = camera
        this.controls = controls
        this.ctx = {
            clipPlane,
            sdfColorCube,
            sdfGroup,
        }

        const gui = new SceneGui(this)

        this.gui = gui

        // listeners
        aspectLayout.addResizeListener(renderer, camera, this.handleResize)
        renderer.domElement.addEventListener("click", this.handleCanvasClick)
    }

    dispose(): void {
        globalThis.cancelAnimationFrame(this.animationFrameId)
        this.aspectLayout.removeResizeListener()
        this.controls.dispose()
        this.gui.destroy()
        this.disposeSceneResources()
        this.renderer.dispose()
        this.renderer.domElement.removeEventListener(
            "click",
            this.handleCanvasClick
        )
        this.renderer.domElement.remove()
        this.animationFrameId = 0
    }

    readonly animate = (): void => {
        this.controls.update()
        this.renderer.render(this.scene, this.camera)
        this.animationFrameId = globalThis.requestAnimationFrame(this.animate)
    }

    private readonly handleResize = (): void => {
        this.renderer.setPixelRatio(globalThis.devicePixelRatio)
        this.controls.update()
    }

    private readonly handleCanvasClick = (event: MouseEvent): void => {
        logScenePixel(
            this.renderer,
            this.scene,
            this.camera,
            this.controls,
            event.clientX,
            event.clientY
        )
    }

    private disposeSceneResources(): void {
        this.scene.traverse((object) => {
            const mesh = object as THREE.Object3D & {
                geometry?: THREE.BufferGeometry
                material?: THREE.Material | THREE.Material[]
            }

            mesh.geometry?.dispose()

            if (Array.isArray(mesh.material)) {
                mesh.material.forEach((material) => material.dispose())
            } else {
                mesh.material?.dispose()
            }
        })
    }
}

export default ThreeSceneApp
