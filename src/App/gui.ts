import GUI from "lil-gui"
import * as THREE from "three"
import type { ThreeSceneApp } from "./main"
import * as ColorCube from "./objects/materials/ColorCubeMaterial"

const sdfColorTargetOutputTitles = {
    Color: ColorCube.TargetOutputColor,
    Luminance: ColorCube.TargetOutputLuminance,
    Steps: ColorCube.TargetOutputSteps,
} as const

const sdfColorTransformTitles = {
    Default: ColorCube.TransformDefault,
    Protanopia: ColorCube.TransformProtanopia,
    Deuteranopia: ColorCube.TransformDeuteranopia,
    Tritanopia: ColorCube.TransformTritanopia,
    Monochromacy: ColorCube.TransformMonochromacy,
    Custom: ColorCube.TransformCustom,
} as const

const sdfColorRaycastTitles = {
    "Binary Search": ColorCube.RaycastBinarySearch,
    Bracketed: ColorCube.RaycastBracketed,
    Bracketed2: ColorCube.RaycastBracketed2,
    Bracketed3: ColorCube.RaycastBracketed3,
} as const

const sdfColorSearchTitles = {
    None: ColorCube.SearchNone,
    "Opposite Color": ColorCube.SearchOppositeColor,
    "Target Color": ColorCube.SearchTargetColor,
    "Black + White": ColorCube.SearchBlackAndWhite,
} as const

const sdfColorContrastPresetValues = ["", 3, 4.5, 7] as const

type SceneGuiState = {
    searchMode: number
    contrastPreset: "" | number
    color0: string
    color1: string
    color2: string
    updateSwatchInverse: boolean
}

export class SceneGui {
    readonly gui: GUI
    private readonly state: SceneGuiState

    constructor(app: ThreeSceneApp) {
        const { controls, ctx, callbackBridge } = app
        const { colorCube } = ctx
        const { markers } = colorCube
        const colorCubeMaterial = colorCube.mesh.material

        const state: SceneGuiState = {
            searchMode: colorCubeMaterial.searchMode,
            contrastPreset: "",
            color0: markers.target.getHex(),
            color1: markers.sample1.getHex(),
            color2: markers.sample2.getHex(),
            updateSwatchInverse: false,
        }

        console.log(state)

        this.gui = new GUI({
            title: "Scene",
            container: app.container,
        })
        this.state = state

        const debugFolder = this.gui.addFolder("Debug").close()
        debugFolder
            .add(colorCubeMaterial, "targetOutput", sdfColorTargetOutputTitles)
            .name("Cube Output")
        debugFolder
            .add(colorCubeMaterial, "raycastMode", sdfColorRaycastTitles)
            .name("Raycast Mode")
        debugFolder
            .add(colorCubeMaterial, "quantizeSearch")
            .name("Quantize Search")
        debugFolder.add(controls, "autoRotate").name("Rotate Camera")
        debugFolder
            .add({ fn: randomizeCustomTransformSpaceMatrix }, "fn")
            .name("Randomize Custom Matrix")
        debugFolder
            .add({ fn: randomizeCustomTransformSpaceMatrixSummation }, "fn")
            .name("Randomize Summation Matrix")

        const colorCubeFolder = this.gui

        colorCubeFolder
            .add(state, "searchMode", sdfColorSearchTitles)
            .name("Search Mode")
            .listen()
            .onChange(onSearchModeChange)
        const outputSpaceController = colorCubeFolder
            .add(colorCubeMaterial, "transformMode", sdfColorTransformTitles)
            .name("Output Space")
            .listen()
        colorCubeFolder
            .add(colorCube, "transformSpaceMode", sdfColorTransformTitles)
            .name("Transform Space")
            .listen()
            .onChange(onTransformSpaceChange)
        colorCubeFolder
            .add(state, "contrastPreset", sdfColorContrastPresetValues)
            .name("WCAG Contrast")
            .listen()
            .onChange(onContrastPresetChange)
        colorCubeFolder
            .add(colorCubeMaterial, "contrastRatio", 1.0, 21.0, 0.001)
            .name("Contrast Ratio")
            .listen()
            .onChange(onContrastRatioChange)
        colorCubeFolder
            .add({ fn: swapColors }, "fn")
            .name("Swap")
            .onChange(updateSwatch)
        const color0Controller = colorCubeFolder
            .addColor(state, "color0")
            .name("")
            .listen()
            .onChange(onTargetColorChange)
        const color1Controller = colorCubeFolder
            .addColor(state, "color1")
            .name("")
            .listen()
            .onChange(onSample1ColorChange)
        const color2Controller = colorCubeFolder
            .addColor(state, "color2")
            .name("")
            .onChange(onSample2ColorChange)

        function updateSwatch(): void {
            const update = {
                color: state.color1,
                backgroundColor: state.color0,
                darkModeEnabled:
                    state.searchMode === ColorCube.SearchBlackAndWhite,
                darkBackgroundColor: state.color2,
            }
            if (state.updateSwatchInverse) {
                ;[update.color, update.backgroundColor] = [
                    update.backgroundColor,
                    update.color,
                ]
            }
            callbackBridge.setSwatch(update)
        }

        function onTargetColorChange(value: string): void {
            colorCubeMaterial.targetColor = value
            markers.target.updateColor(colorCubeMaterial.targetColor)
            updateSwatch()
        }

        function onSample1ColorChange(): void {
            markers.sample1.updateColor(state.color1)
            updateSwatch()
        }

        function onSample1ColorChangeBlackAndWhite(): void {
            markers.sample1.updateColor(state.color1)
            colorCubeMaterial.whitePoint = state.color1
            updateSwatch()
        }

        function onSample2ColorChange(value: string): void {
            markers.sample2.updateColor(state.color2)
            colorCubeMaterial.blackPoint = value
        }

        function syncContrastPresetState(value: number): void {
            state.contrastPreset =
                value === 3 || value === 4.5 || value === 7 ? value : ""
        }

        function onContrastPresetChange(
            value: SceneGuiState["contrastPreset"]
        ): void {
            if (value === "") {
                syncContrastPresetState(colorCubeMaterial.contrastRatio)
                return
            }

            colorCubeMaterial.contrastRatio = value
        }

        function onContrastRatioChange(): void {
            syncContrastPresetState(colorCubeMaterial.contrastRatio)
        }

        function syncOutputSpaceState(value: number): void {
            if (value === ColorCube.TransformDefault) {
                outputSpaceController.enable()
                return
            }

            colorCubeMaterial.transformMode = ColorCube.TransformDefault
            outputSpaceController.disable()
        }

        function onTransformSpaceChange(value: number): void {
            syncOutputSpaceState(value)
        }

        function syncTransformSpaceState(): void {
            syncOutputSpaceState(colorCube.transformSpaceMode)
        }

        function randomizeCustomTransformSpaceMatrix(): void {
            colorCube.customTransformSpaceMatrix.set(
                Math.random(),
                Math.random(),
                Math.random(),
                Math.random(),
                Math.random(),
                Math.random(),
                Math.random(),
                Math.random(),
                Math.random()
            )
            colorCube.transformSpaceMode = ColorCube.TransformCustom
            syncTransformSpaceState()
        }

        function randomizeCustomTransformSpaceMatrixSummation(): void {
            const mat = colorCube.customTransformSpaceMatrix
            let e0 = Math.random()
            let e1 = Math.random()
            let e2 = Math.random()
            let e3 = Math.random()
            let e4 = Math.random()
            let e5 = Math.random()
            let e6 = Math.random()
            let e7 = Math.random()
            let e8 = Math.random()
            const s1 = e0 + e1 + e2
            const s2 = e3 + e4 + e5
            const s3 = e6 + e7 + e8

            e0 = e0 / s1
            e1 = e1 / s1
            e2 = e2 / s1
            e3 = e3 / s2
            e4 = e4 / s2
            e5 = e5 / s2
            e6 = e6 / s3
            e7 = e7 / s3
            e8 = e8 / s3

            mat.set(e0, e1, e2, e3, e4, e5, e6, e7, e8)
            colorCube.transformSpaceMode = ColorCube.TransformCustom
            syncTransformSpaceState()
        }

        function onSearchModeChange(searchMode: number): void {
            colorCubeMaterial.searchMode = searchMode

            switch (searchMode) {
                case ColorCube.SearchTargetColor:
                    color0Controller.enable()
                    color0Controller.onChange(onTargetColorChange)
                    color1Controller.enable()
                    color1Controller.onChange(onSample1ColorChange)
                    color2Controller.disable()
                    colorCube.activeMarker = markers.sample1
                    colorCubeMaterial.targetColor = state.color0
                    markers.target.visible = true
                    markers.sample1.visible = true
                    markers.target.updateColor(colorCubeMaterial.targetColor)
                    break
                case ColorCube.SearchBlackAndWhite:
                    color0Controller.enable()
                    color1Controller.onChange(onSample1ColorChangeBlackAndWhite)
                    color1Controller.enable()
                    color2Controller.onChange(onSample2ColorChange)
                    color2Controller.enable()
                    colorCube.activeMarker = markers.target
                    colorCubeMaterial.targetColor = state.color0
                    colorCubeMaterial.whitePoint = state.color1
                    colorCubeMaterial.blackPoint = state.color2
                    markers.target.visible = true
                    markers.target.updateColor(colorCubeMaterial.targetColor)
                    markers.sample1.visible = true
                    markers.sample2.visible = true
                    break
                case ColorCube.SearchOppositeColor:
                case ColorCube.SearchNone:
                default:
                    color0Controller.disable()
                    color1Controller.disable()
                    color2Controller.disable()
                    markers.target.visible = false
                    markers.sample1.visible = false
                    markers.sample2.visible = false
                    break
            }
        }

        function swapColors() {
            state.updateSwatchInverse = !state.updateSwatchInverse
        }

        syncContrastPresetState(colorCubeMaterial.contrastRatio)
        syncOutputSpaceState(colorCube.transformSpaceMode)
        onSearchModeChange(state.searchMode)
    }

    destroy(): void {
        this.gui.destroy()
    }

    setColor1(value: string): void {
        this.state.color1 = value
    }
}

export default SceneGui
