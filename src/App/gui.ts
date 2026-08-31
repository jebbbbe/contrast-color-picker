import GUI from "lil-gui"
import type { ColorSyncChangeEvent, ColorSyncState } from "./ColorSync"
import { SearchBackgroundColor } from "./ColorSync"
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
    "Font Color": ColorCube.SearchTargetColor,
    "Background Color": SearchBackgroundColor,
    "Dark Mode": ColorCube.SearchBlackAndWhite,
} as const

const sdfColorContrastPresetValues = ["", 3, 4.5, 7] as const

type ContrastPresetState = {
    contrastPreset: "" | number
}

export class SceneGui {
    readonly gui: GUI
    private readonly colorSync: ThreeSceneApp["colorSync"]
    private readonly handleColorSyncChange: (
        event: ColorSyncChangeEvent
    ) => void

    constructor(app: ThreeSceneApp) {
        const { colorSync, controls, ctx, transformControls } = app
        const { colorCube } = ctx
        const colorCubeMaterial = colorCube.mesh.material

        const state: ColorSyncState = colorSync.state
        const contrastPresetState: ContrastPresetState = {
            contrastPreset: "",
        }

        this.gui = new GUI({
            title: "Scene",
            container: app.container,
        })
        this.colorSync = colorSync

        const colorCubeFolder = this.gui

        colorCubeFolder
            .add(state, "searchMode", sdfColorSearchTitles)
            .name("Search Mode")
            .listen()
            .onChange(onSearchModeChange)
        colorCubeFolder
            .add(
                contrastPresetState,
                "contrastPreset",
                sdfColorContrastPresetValues
            )
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
        fontController.onChange((value: string) => colorSync.setFontColor(value))
        backgroundController.onChange((value: string) =>
            colorSync.setBackgroundColor(value)
        )
        darkModeController.onChange((value: string) =>
            colorSync.setDarkModeColor(value)
        )

        function syncContrastPresetState(value: number): void {
            contrastPresetState.contrastPreset =
                value === 3 || value === 4.5 || value === 7 ? value : ""
        }

        function onContrastPresetChange(
            value: ContrastPresetState["contrastPreset"]
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
            syncOutputSpaceState(colorCube.transformSpaceMode)
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
            syncOutputSpaceState(colorCube.transformSpaceMode)
        }

        function onSearchModeChange(searchMode: number): void {
            colorSync.setSearchMode(searchMode)
        }

        function syncSearchModeState(): void {
            transformControls.detach()

            switch (state.searchMode) {
                case ColorCube.SearchOppositeColor:
                case SearchBackgroundColor:
                case ColorCube.SearchTargetColor:
                    fontController.enable()
                    backgroundController.enable()
                    darkModeController.disable()
                    break
                case ColorCube.SearchBlackAndWhite:
                    fontController.enable()
                    backgroundController.enable()
                    darkModeController.enable()
                    break
                case ColorCube.SearchNone:
                default:
                    fontController.disable()
                    backgroundController.disable()
                    darkModeController.disable()
                    break
            }
        }

        function swapColors() {
            colorSync.swapColors()
        }

        const handleColorSyncChange = ({
            searchModeChanged,
        }: ColorSyncChangeEvent): void => {
            if (searchModeChanged) {
                syncSearchModeState()
            }
        }

        colorSync.addEventListener("change", handleColorSyncChange)
        this.handleColorSyncChange = handleColorSyncChange

        syncContrastPresetState(colorCubeMaterial.contrastRatio)
        syncOutputSpaceState(colorCube.transformSpaceMode)
        syncSearchModeState()
    }

    destroy(): void {
        this.colorSync.removeEventListener("change", this.handleColorSyncChange)
        this.gui.destroy()
    }
}

export default SceneGui
