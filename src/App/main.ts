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
import { logScenePixel, quantizeToPassingColor } from "./utils/logScenePixel"
import { SceneGui } from "./gui"
import { levaTheme } from "../constants"
import { StatsPanel } from "./utils/stat.js"
import {
    AnimationController,
    CameraAnimation,
    MaterialAnimation,
} from "./utils/AnimationController.js"
const sceneBackgroundHex = levaTheme.colors.elevation2

export class ThreeSceneApp {
    readonly container: HTMLElement
    readonly guiContainer: HTMLElement
    readonly callbackBridge: CallbackBridge
    readonly colorSync: ColorSync
    private readonly renderer: THREE.WebGLRenderer
    private readonly scene: THREE.Scene
    private readonly camera: THREE.OrthographicCamera | THREE.PerspectiveCamera
    private readonly aspectLayout: AspectLayout
    readonly gui: SceneGui
    readonly controls: OrbitControls
    private readonly raycastHelper: RaycastHelper
    readonly transformControls: TransformControls
    readonly ctx: {
        colorCube: ColorCubeVolume
    }
    private stats?: StatsPanel
    private animationFrameId = 0
    private looping = import.meta.env.DEV // false
    onStartAnimation = true

    constructor(
        container: HTMLElement,
        guiContainer: HTMLElement,
        reactCallbacks: ReactCallbacks = {}
    ) {
        // layout
        const aspectLayout = new AspectLayout("dynamic", container)
        const callbackBridge = new CallbackBridge(reactCallbacks)

        // renderer
        const renderer = new THREE.WebGLRenderer({ antialias: true })
        // renderer.outputColorSpace = THREE.LinearSRGBColorSpace
        renderer.outputColorSpace = THREE.SRGBColorSpace
        renderer.toneMapping = THREE.NoToneMapping
        renderer.setPixelRatio(globalThis.devicePixelRatio)
        renderer.setSize(1, 1, false)
        container.appendChild(renderer.domElement)

        // scene
        const scene = new THREE.Scene()
        scene.background = new THREE.Color(sceneBackgroundHex)

        // camera
        const endingPos = new THREE.Vector3(1.2, 0.5, 1.2)
        // const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100)
        // camera.position.set(-0.6, 0.15, 1.6)
        const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 100)
        camera.position.copy(endingPos)

        // controls
        const controls = new OrbitControls(camera, renderer.domElement)
        controls.enableDamping = true
        controls.autoRotateSpeed = 2.5
        controls.target.set(0, 0, 0)

        if (camera instanceof THREE.OrthographicCamera) {
            const initialDistance = camera.position.distanceTo(controls.target)
            controls.minZoom = initialDistance / 1.95
            controls.maxZoom = initialDistance / 0.25
        } else {
            controls.minDistance = 0.25
            controls.maxDistance = 1.95
        }

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
            this.requestRender()
        })
        // disable orbit controls
        transformControls.addEventListener("dragging-changed", (event) => {
            controls.enabled = !event.value
            this.requestRender()
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
        this.guiContainer = guiContainer
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

        //stats
        if (import.meta.env.DEV) {
            const statsPanel = new StatsPanel(container, import.meta.env.DEV)
            this.stats = statsPanel
        }

        // listeners
        controls.addEventListener("change", this.requestRender)
        controls.addEventListener("start", this.requestRender)
        controls.addEventListener("end", this.requestRender)
        colorSync.addEventListener("change", this.requestRender)
        aspectLayout.addResizeListener(renderer, camera, this.handleResize)
        renderer.domElement.addEventListener(
            "pointerdown",
            this.handleCanvasClick
        )

        // inital animation
        if (this.onStartAnimation) {
            const animation = new AnimationController(
                renderer,
                controls,
                transformControls,
                // prettier-ignore
                [
                    new CameraAnimation(camera, controls.target, [
                        { frame: new THREE.Vector3(0, 0, -1.769), time: 0.05 },
                        { frame: new THREE.Vector3(1.106, 0.55, -1.266), time: 0.366667 },
                        { frame: new THREE.Vector3(1.577, 0.8, -0.044), time: 0.683333 },
                        { frame: endingPos, time: 1 },
                    ]),
                    new MaterialAnimation(
                        colorCube.mesh.material.uniforms.contrastRatio,
                        [
                            { frame: 1, time: 0 },
                            { frame: 4.5, time: 0.67 },
                        ]
                    ),
                ],
                2000
            )
            this.frame = (time: number): void => {
                this.animationFrameId = 0
                animation.update(time)
                this.render()
                if (!animation.active) {
                    this.frame = this.animate
                }
                this.requestRender()
            }
        }
        this.requestRender()
    }

    dispose(): void {
        this.aspectLayout.removeResizeListener()
        this.controls.removeEventListener("change", this.requestRender)
        this.controls.removeEventListener("start", this.requestRender)
        this.controls.removeEventListener("end", this.requestRender)
        this.colorSync.removeEventListener("change", this.requestRender)
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
        globalThis.cancelAnimationFrame(this.animationFrameId)
        this.animationFrameId = 0
    }

    get animateLoop(): boolean {
        return this.looping
    }

    set animateLoop(value: boolean) {
        this.looping = value
        this.requestRender()
    }

    readonly requestRender = (): void => {
        if (!this.animationFrameId) {
            this.animationFrameId = globalThis.requestAnimationFrame(this.frame)
        }
    }

    private readonly animate = (): void => {
        this.animationFrameId = 0
        this.controls.update()
        this.render()

        if (
            this.animateLoop ||
            (this.controls.enabled && this.controls.autoRotate)
        ) {
            this.requestRender()
        }
    }

    private frame: FrameRequestCallback = this.animate

    private render(): void {
        if (import.meta.env.DEV) this.stats?.update()
        this.renderer.render(this.scene, this.camera)
    }

    private readonly handleResize = (): void => {
        this.renderer.setPixelRatio(globalThis.devicePixelRatio)
        this.requestRender()
    }

    private readonly handleCanvasClick = (event: MouseEvent): void => {
        // Let the gizmo consume the pointerdown that starts a transform drag.
        if (this.transformControls.dragging) return

        //exit if not in right search mode
        const mode = this.colorSync.state.searchMode
        if (mode === ColorCube.SearchNone) return

        const material = this.ctx.colorCube.mesh.material
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

        let hitHex = logScenePixel(
            this.renderer,
            this.scene,
            this.camera,
            this.controls,
            event.clientX,
            event.clientY
        )
        // quantize in the shader OR when we sample
        if (!material.quantizeResult) {
            hitHex = quantizeToPassingColor(
                hitHex,
                material.contrastRatio,
                mode,
                this.colorSync.state.fontColor,
                this.colorSync.state.backgroundColor,
                this.colorSync.state.darkModeColor
            )
        }

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
