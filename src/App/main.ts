import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { AspectLayout } from "./utils/AspectLayout.js"
import { SdfMaterial } from "./objects/SdfMaterial"

export class ThreeSceneApp {
    private readonly container: HTMLElement
    private readonly renderer: THREE.WebGLRenderer
    private readonly scene: THREE.Scene
    private readonly camera: THREE.PerspectiveCamera
    private readonly controls: OrbitControls
    private readonly aspectLayout: AspectLayout
    private readonly grid: THREE.GridHelper
    private readonly cube: THREE.Mesh<
        THREE.BoxGeometry,
        THREE.MeshStandardMaterial
    >
    private readonly sdfCube: THREE.Mesh<THREE.BoxGeometry, SdfMaterial>
    private readonly ambientLight: THREE.AmbientLight
    private readonly directionalLight: THREE.DirectionalLight
    private animationFrameId = 0

    constructor(container: HTMLElement) {
        this.container = container
        this.aspectLayout = new AspectLayout("dynamic", this.container)

        this.renderer = new THREE.WebGLRenderer({ antialias: true })
        this.renderer.setPixelRatio(globalThis.devicePixelRatio)
        this.renderer.setSize(1, 1)
        this.container.appendChild(this.renderer.domElement)

        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color("#dee4ef")

        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
        this.camera.position.set(3, 3, 5)

        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.controls.enableDamping = true
        this.controls.target.set(0, 0, 0)
        this.camera.lookAt(this.controls.target)
        this.controls.update()

        this.cube = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: "#8b5cf6" })
        )
        this.cube.position.x = 3

        this.sdfCube = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new SdfMaterial()
        )

        this.grid = new THREE.GridHelper(10, 10, 0x64748b, 0xcbd5e1)

        this.ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 2)
        this.directionalLight.position.set(4, 6, 8)

        this.scene.add(
            this.ambientLight,
            this.directionalLight,
            this.grid,
            this.cube,
            this.sdfCube
        )

        this.aspectLayout.addResizeListener(
            this.renderer,
            this.camera,
            this.handleResize
        )
        this.animate()
    }

    dispose(): void {
        globalThis.cancelAnimationFrame(this.animationFrameId)
        this.aspectLayout.removeResizeListener()
        this.controls.dispose()
        this.grid.geometry.dispose()
        if (Array.isArray(this.grid.material)) {
            this.grid.material.forEach((material) => material.dispose())
        } else {
            this.grid.material.dispose()
        }
        this.cube.geometry.dispose()
        this.cube.material.dispose()
        this.sdfCube.geometry.dispose()
        this.sdfCube.material.dispose()
        this.renderer.dispose()
        this.renderer.domElement.remove()
    }

    private readonly animate = (): void => {
        this.controls.update()
        this.renderer.render(this.scene, this.camera)
        this.animationFrameId = globalThis.requestAnimationFrame(this.animate)
    }

    private readonly handleResize = (): void => {
        this.renderer.setPixelRatio(globalThis.devicePixelRatio)
        this.controls.update()
    }
}

export default ThreeSceneApp
