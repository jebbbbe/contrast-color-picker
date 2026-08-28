import GUI from "lil-gui"
import type { ThreeSceneApp } from "./main"
import * as ColorCube from "./objects/materials/ColorCubeMaterial"
import { getOppositeHexColor } from "./utils/contrast"

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
    "Font Color": ColorCube.SearchTargetColor,
    "Background Color": 4,
    "Dark Mode": ColorCube.SearchBlackAndWhite,
} as const

const sdfColorContrastPresetValues = ["", 3, 4.5, 7] as const

type SceneGuiState = {
    searchMode: number
    contrastPreset: "" | number
    fontColor: string
    backgroundColor: string
    darkModeColor: string
}

export class SceneGui {
    readonly gui: GUI
    readonly state: SceneGuiState

    constructor(app: ThreeSceneApp) {
        const { controls, ctx, callbackBridge } = app
        const { colorCube } = ctx
        const { markers } = colorCube
        const colorCubeMaterial = colorCube.mesh.material

        const state: SceneGuiState = {
            searchMode: colorCubeMaterial.searchMode,
            contrastPreset: "",
            fontColor: markers.font.getHex(),
            backgroundColor: markers.background.getHex(),
            darkModeColor: markers.darkmode.getHex(),
        }

        console.log(state)

        this.gui = new GUI({
            title: "Scene",
            container: app.container,
        })
        this.state = state

        const colorCubeFolder = this.gui

        colorCubeFolder
            .add(state, "searchMode", sdfColorSearchTitles)
            .name("Search Mode")
            .listen()
            .onChange(onSearchModeChange)
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
        colorCubeFolder.add({ fn: swapColors }, "fn").name("Swap")
        const fontController = colorCubeFolder
            .addColor(state, "fontColor")
            .name("Font")
            .listen()
        const backgroundController = colorCubeFolder
            .addColor(state, "backgroundColor")
            .name("Background")
            .listen()
        const darkModeController = colorCubeFolder
            .addColor(state, "darkModeColor")
            .name("Dark Mode")
            .listen()

        const debugFolder = this.gui.addFolder("Advanced").close()
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
        const outputSpaceController = debugFolder
            .add(colorCubeMaterial, "transformMode", sdfColorTransformTitles)
            .name("Output Space")
            .listen()
        debugFolder
            .add(colorCube, "transformSpaceMode", sdfColorTransformTitles)
            .name("Transform Space")
            .listen()
            .onChange(onTransformSpaceChange)

        function updateSwatch(): void {
            callbackBridge.setSwatch({
                color: state.fontColor,
                backgroundColor: state.backgroundColor,
                darkModeEnabled:
                    state.searchMode === ColorCube.SearchBlackAndWhite,
                darkBackgroundColor: state.darkModeColor,
            })
        }

        function updateColorCubeTargetColor(value: string) {
            colorCubeMaterial.targetColor = value
        }

        function onFontColorChange(): void {
            markers.font.updateColor(state.fontColor)
            updateSwatch()
        }

        function onBackgroundColorChange(): void {
            markers.background.updateColor(state.backgroundColor)
            updateSwatch()
        }

        function onDarkModeColorChange(): void {
            markers.darkmode.updateColor(state.darkModeColor)
            updateSwatch()
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
            let nextMode = searchMode
            if (searchMode == 4) nextMode -= 2
            colorCubeMaterial.searchMode = nextMode

            switch (searchMode) {
                case ColorCube.SearchOppositeColor:
                    fontController.enable()
                    backgroundController.enable()
                    darkModeController.disable()

                    fontController.onChange(() => {
                        const oppositeHex = getOppositeHexColor(state.fontColor)
                        state.backgroundColor = oppositeHex
                        markers.font.updateColor(state.fontColor)
                        markers.background.updateColor(oppositeHex)
                        updateSwatch()
                    })
                    backgroundController.onChange(() => {
                        const oppositeHex = getOppositeHexColor(
                            state.backgroundColor
                        )
                        state.fontColor = oppositeHex
                        markers.background.updateColor(state.backgroundColor)
                        markers.font.updateColor(oppositeHex)
                        updateSwatch()
                    })

                    markers.font.visible = true
                    markers.background.visible = true
                    markers.darkmode.visible = false
                    break
                case 4:
                    fontController.enable()
                    backgroundController.enable()
                    darkModeController.disable()

                    fontController.onChange(() => {
                        onFontColorChange()
                        updateColorCubeTargetColor(state.fontColor)
                    })
                    backgroundController.onChange(onBackgroundColorChange)

                    markers.font.visible = true
                    markers.background.visible = true
                    markers.darkmode.visible = false

                    updateColorCubeTargetColor(state.fontColor)

                    break
                case ColorCube.SearchTargetColor:
                    fontController.enable()
                    backgroundController.enable()
                    darkModeController.disable()

                    fontController.onChange(onFontColorChange)
                    backgroundController.onChange(() => {
                        onBackgroundColorChange()
                        updateColorCubeTargetColor(state.backgroundColor)
                    })

                    markers.font.visible = true
                    markers.background.visible = true
                    markers.darkmode.visible = false

                    updateColorCubeTargetColor(state.backgroundColor)

                    break
                case ColorCube.SearchBlackAndWhite:
                    console.log("SearchBlackAndWhite")

                    fontController.enable()
                    backgroundController.enable()
                    darkModeController.enable()

                    fontController.onChange(() => {
                        onFontColorChange()
                        colorCubeMaterial.targetColor = state.fontColor
                    })
                    backgroundController.onChange(() => {
                        onBackgroundColorChange()
                        colorCubeMaterial.whitePoint = state.backgroundColor
                    })
                    darkModeController.onChange(() => {
                        onDarkModeColorChange()
                        colorCubeMaterial.blackPoint = state.darkModeColor
                    })

                    colorCubeMaterial.targetColor = state.fontColor
                    colorCubeMaterial.whitePoint = state.backgroundColor
                    colorCubeMaterial.blackPoint = state.darkModeColor

                    markers.font.visible = true
                    markers.background.visible = true
                    markers.darkmode.visible = true
                    break
                case ColorCube.SearchNone:
                default:
                    console.log("SearchNone")

                    fontController.disable()
                    backgroundController.disable()
                    darkModeController.disable()

                    markers.font.visible = false
                    markers.background.visible = false
                    markers.darkmode.visible = false
                    break
            }
            updateSwatch()
        }

        function swapColors() {
            markers.font.swap(markers.background)
            const fv = fontController.getValue()
            const bv = backgroundController.getValue()
            fontController.setValue(bv)
            backgroundController.setValue(fv)
            updateSwatch()
        }

        syncContrastPresetState(colorCubeMaterial.contrastRatio)
        syncOutputSpaceState(colorCube.transformSpaceMode)
        onSearchModeChange(state.searchMode)
        updateSwatch()
    }

    destroy(): void {
        this.gui.destroy()
    }

    setFontColor(value: string): void {
        this.state.fontColor = value
    }
    setBackgroundColor(value: string): void {
        this.state.backgroundColor = value
    }
    setDarkModeColor(value: string): void {
        this.state.darkModeColor = value
    }
}

export default SceneGui
