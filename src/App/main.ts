import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"

export class ThreeSceneApp {
    private readonly container: HTMLElement
    private readonly renderer: THREE.WebGLRenderer
    private readonly scene: THREE.Scene
    private readonly camera: THREE.PerspectiveCamera
    private readonly controls: OrbitControls
    private readonly cube: THREE.Mesh<THREE.BoxGeometry, THREE.MeshStandardMaterial>
    private readonly ambientLight: THREE.AmbientLight
    private readonly directionalLight: THREE.DirectionalLight
    private animationFrameId = 0

    constructor(container: HTMLElement) {
        this.container = container

        this.renderer = new THREE.WebGLRenderer({ antialias: true })
        this.renderer.setPixelRatio(globalThis.devicePixelRatio)
        this.renderer.setSize(1, 1)
        this.container.appendChild(this.renderer.domElement)

        this.scene = new THREE.Scene()
        this.scene.background = new THREE.Color("#111827")

        this.camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
        this.camera.position.set(3, 3, 5)

        this.controls = new OrbitControls(this.camera, this.renderer.domElement)
        this.controls.enableDamping = true
        this.controls.target.set(0, 0, 0)

        this.cube = new THREE.Mesh(
            new THREE.BoxGeometry(1, 1, 1),
            new THREE.MeshStandardMaterial({ color: "#8b5cf6" })
        )

        this.ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
        this.directionalLight = new THREE.DirectionalLight(0xffffff, 2)
        this.directionalLight.position.set(4, 6, 8)

        this.scene.add(this.ambientLight, this.directionalLight, this.cube)

        this.handleResize()
        globalThis.addEventListener("resize", this.handleResize)
        this.animate()
    }

    dispose(): void {
        globalThis.cancelAnimationFrame(this.animationFrameId)
        globalThis.removeEventListener("resize", this.handleResize)
        this.controls.dispose()
        this.cube.geometry.dispose()
        this.cube.material.dispose()
        this.renderer.dispose()
        this.renderer.domElement.remove()
    }

    private readonly animate = (): void => {
        this.controls.update()
        this.renderer.render(this.scene, this.camera)
        this.animationFrameId = globalThis.requestAnimationFrame(this.animate)
    }

    private readonly handleResize = (): void => {
        const width = this.container.clientWidth || 1
        const height = this.container.clientHeight || 1

        this.camera.aspect = width / height
        this.camera.updateProjectionMatrix()
        this.renderer.setPixelRatio(globalThis.devicePixelRatio)
        this.renderer.setSize(width, height, false)
    }
}

export default ThreeSceneApp
