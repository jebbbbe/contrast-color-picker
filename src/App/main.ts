import * as THREE from "three"
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js"
import { TransformControls } from "three/examples/jsm/controls/TransformControls.js"
import { Marker } from "./objects/Marker"
import { ColorCubeVolume } from "./objects/ColorCubeVolume"
import * as ColorCube from "./objects/materials/ColorCubeMaterial"
import CallbackBridge, { type ReactCallbacks } from "./CallbackBridge"
import ColorSync from "./ColorSync"
import { RaycastHelper } from "./RaycastHelper"
import { AspectLayout } from "./utils/AspectLayout.js"
import { getContrastRatio } from "./utils/contrast"
import { logScenePixel } from "./utils/logScenePixel"
import { SceneGui } from "./gui"

const sceneBackgroundHex = "#dee4ef"
export class ThreeSceneApp {
    readonly container: HTMLElement
    readonly callbackBridge: CallbackBridge
    readonly colorSync: ColorSync
    private readonly renderer: THREE.WebGLRenderer
    private readonly scene: THREE.Scene
    private readonly camera: THREE.PerspectiveCamera
    private readonly aspectLayout: AspectLayout
    private readonly gui: SceneGui
    readonly controls: OrbitControls
    private readonly raycastHelper: RaycastHelper
    readonly transformControls: TransformControls
    readonly ctx: {
        colorCube: ColorCubeVolume
    }
    private animationFrameId = 0

    constructor(container: HTMLElement, reactCallbacks: ReactCallbacks = {}) {
        // layout
        const aspectLayout = new AspectLayout("dynamic", container)
        const callbackBridge = new CallbackBridge(reactCallbacks)

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
        scene.background = new THREE.Color(sceneBackgroundHex)

        // camera
        const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
        camera.position.set(-0.75, 0.25, 1.75)

        // controls
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.autoRotateSpeed = 2.5
        controls.minDistance = 0.25
        controls.maxDistance = 2.5
        controls.target.set(0, 0, 0)
        camera.lookAt(controls.target)
        controls.update()

        // transform controls
        const transformControls = new TransformControls(
            camera,
            renderer.domElement
        )
        const transformControlsHelper = transformControls.getHelper()
        transformControls.setMode("translate")
        transformControls.setColors(0xff0000, 0x00ff00, 0x0000ff, 0xffff00)
        //@ts-ignore
        transformControls.minX = -0.5
        transformControls.maxX = 0.5
        transformControls.minY = -0.5
        transformControls.maxY = 0.5
        transformControls.minZ = -0.5
        transformControls.maxZ = 0.5

        // content
        const colorCube = new ColorCubeVolume(
            0x000000, // font
            0xffffff, // bk
            0x000000 // darkmode
        )
        const colorSync = new ColorSync(colorCube, callbackBridge)

        // callback for move
        transformControls.addEventListener("change", () => {
            const object = transformControls.object
            if (!(object instanceof Marker)) return
            // we can direclty modify object.position here to constrain

            const mode = this.colorSync.state.searchMode
            if (mode === ColorCube.SearchNone) return

            // marker update
            object.updatePosition(object.position)
            this.colorSync.syncMarker(object)
        })
        // disable orbit controls
        transformControls.addEventListener("dragging-changed", (event) => {
            controls.enabled = !event.value
        })

        // lights
        // const ambientLight = new THREE.AmbientLight(0xffffff, 1.2)
        // const directionalLight = new THREE.DirectionalLight(0xffffff, 2)
        // directionalLight.position.set(4, 6, 8)

        //helpers
        // const grid = new THREE.GridHelper()

        scene.add(
            // ambientLight,
            // directionalLight,
            // grid,
            colorCube,
            transformControlsHelper
        )

        const rayTargets = [...Object.values(colorCube.markers), colorCube.mesh]
        const raycastHelper = new RaycastHelper(
            camera,
            rayTargets,
            renderer.domElement
        )

        // props
        this.container = container
        this.callbackBridge = callbackBridge
        this.colorSync = colorSync
        this.aspectLayout = aspectLayout
        this.renderer = renderer
        this.scene = scene
        this.camera = camera
        this.controls = controls
        this.raycastHelper = raycastHelper
        this.transformControls = transformControls
        this.ctx = {
            colorCube,
        }

        // ui
        const gui = new SceneGui(this)
        this.gui = gui

        // listeners
        aspectLayout.addResizeListener(renderer, camera, this.handleResize)
        renderer.domElement.addEventListener(
            "pointerdown",
            this.handleCanvasClick
        )
    }

    dispose(): void {
        globalThis.cancelAnimationFrame(this.animationFrameId)
        this.aspectLayout.removeResizeListener()
        this.controls.dispose()
        this.transformControls.dispose()
        this.gui.destroy()
        this.disposeSceneResources()
        this.renderer.dispose()
        this.renderer.domElement.removeEventListener(
            "pointerdown",
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
        // Let the gizmo consume the pointerdown that starts a transform drag.
        if (this.transformControls.dragging) return

        //exit if not in right search mode
        const mode = this.colorSync.state.searchMode
        if (mode === ColorCube.SearchNone) return

        // raycast
        const hits = this.raycastHelper.castFromEvent(event, undefined, true)

        const markers = Object.values(this.ctx.colorCube.markers).filter(
            (marker) => marker.visible
        )

        const markerHit = hits.find((hit) =>
            markers.some(
                (marker) =>
                    marker === hit.object || marker === hit.object.parent
            )
        )

        if (!markerHit) {
            this.transformControls.detach()
        }

        // market hit
        if (markerHit) {
            const marker = markers.find(
                (candidate) =>
                    candidate === markerHit.object ||
                    candidate === markerHit.object.parent
            )

            if (marker) {
                this.transformControls.attach(marker)
            }

            return
        }

        // color cube not hit
        if (!hits.some((hit) => hit.object === this.ctx.colorCube.mesh)) {
            return
        }

        const hitHex = logScenePixel(
            this.renderer,
            this.scene,
            this.camera,
            this.controls,
            event.clientX,
            event.clientY
        )

        // clicked background
        if (hitHex === sceneBackgroundHex) return

        // successful hit:
        const fontHex = this.ctx.colorCube.markers.font.getHex()
        const bkHex = this.ctx.colorCube.markers.background.getHex()
        const dmHex = this.ctx.colorCube.markers.darkmode.getHex()
        console.log("")
        console.log(hitHex)
        console.log(fontHex, getContrastRatio(hitHex, fontHex))
        console.log(bkHex, getContrastRatio(hitHex, bkHex))
        console.log(dmHex, getContrastRatio(hitHex, dmHex))

        this.colorSync.pickColor(hitHex)
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
