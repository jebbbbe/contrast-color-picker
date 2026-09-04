import GUI from "lil-gui"
import type { ColorSyncChangeEvent, ColorSyncState } from "./ColorSync"
import { SearchBackgroundColor } from "./ColorSync"
import type { ThreeSceneApp } from "./main"
import * as ColorCube from "./objects/materials/ColorCubeMaterial"
import {
    contrastPresetValues,
    raycastTitles,
    searchTitles,
    targetOutputTitles,
    transformTitles,
} from "../constants"

type ContrastPresetState = {
    contrastPreset: "" | number
}

export class SceneGui {
    readonly gui: GUI
    readonly local: {
        colorCube: ThreeSceneApp["ctx"]["colorCube"]
        colorSync: ThreeSceneApp["colorSync"]
        colorCubeMaterial: ColorCube.ColorCubeMaterial
    }
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
            container: app.guiContainer,
        })
        this.local = {
            colorCube,
            colorSync,
            colorCubeMaterial,
        }

        const colorCubeFolder = this.gui

        colorCubeFolder
            .add(state, "searchMode", searchTitles)
            .name("Search Mode")
            .listen()
            .onChange(this.setSearchMode)
        colorCubeFolder
            .add(contrastPresetState, "contrastPreset", contrastPresetValues)
            .name("WCAG Contrast")
            .listen()
            .onChange((value: ContrastPresetState["contrastPreset"]) => {
                if (value === "") {
                    contrastPresetState.contrastPreset =
                        colorCubeMaterial.contrastRatio === 3 ||
                        colorCubeMaterial.contrastRatio === 4.5 ||
                        colorCubeMaterial.contrastRatio === 7
                            ? colorCubeMaterial.contrastRatio
                            : ""
                    return
                }

                this.setContrastPreset(value)
            })
        colorCubeFolder
            .add(colorCubeMaterial, "contrastRatio", 1.0, 21.0, 0.001)
            .name("Contrast Ratio")
            .listen()
            .onChange(() => {
                contrastPresetState.contrastPreset =
                    colorCubeMaterial.contrastRatio === 3 ||
                    colorCubeMaterial.contrastRatio === 4.5 ||
                    colorCubeMaterial.contrastRatio === 7
                        ? colorCubeMaterial.contrastRatio
                        : ""
            })
        colorCubeFolder.add({ fn: this.swapColors }, "fn").name("Swap")
        const fontController = colorCubeFolder
            .addColor(state, "fontColor")
            .name("Font")
            .listen()
            .onChange(this.setFontColor)
        const backgroundController = colorCubeFolder
            .addColor(state, "backgroundColor")
            .name("Background")
            .listen()
            .onChange(this.setBackgroundColor)
        const darkModeController = colorCubeFolder
            .addColor(state, "darkModeColor")
            .name("Dark Mode")
            .listen()
            .onChange(this.setDarkModeColor)

        const debugFolder = this.gui.addFolder("Advanced").close()
        debugFolder
            .add(colorCubeMaterial, "targetOutput", targetOutputTitles)
            .name("Cube Output")
        debugFolder
            .add(colorCubeMaterial, "raycastMode", raycastTitles)
            .name("Raycast Mode")
        debugFolder
            .add(colorCubeMaterial, "quantizeSearch")
            .name("Quantize Search")
        debugFolder.add(controls, "autoRotate").name("Rotate Camera")
        debugFolder
            .add(
                {
                    fn: () => {
                        this.randomizeCustomTransformSpaceMatrix(false)
                        syncOutputSpaceState(colorCube.transformSpaceMode)
                    },
                },
                "fn"
            )
            .name("Randomize Custom Matrix")
        debugFolder
            .add(
                {
                    fn: () => {
                        this.randomizeCustomTransformSpaceMatrix(true)
                        syncOutputSpaceState(colorCube.transformSpaceMode)
                    },
                },
                "fn"
            )
            .name("Randomize Summation Matrix")
        const outputSpaceController = debugFolder
            .add(colorCubeMaterial, "transformMode", transformTitles)
            .name("Output Space")
            .listen()
        debugFolder
            .add(colorCube, "transformSpaceMode", transformTitles)
            .name("Transform Space")
            .listen()
            .onChange(onTransformSpaceChange)

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

        const handleColorSyncChange = ({
            searchModeChanged,
        }: ColorSyncChangeEvent): void => {
            if (searchModeChanged) {
                syncSearchModeState()
            }
        }

        colorSync.addEventListener("change", handleColorSyncChange)
        this.handleColorSyncChange = handleColorSyncChange

        contrastPresetState.contrastPreset =
            colorCubeMaterial.contrastRatio === 3 ||
            colorCubeMaterial.contrastRatio === 4.5 ||
            colorCubeMaterial.contrastRatio === 7
                ? colorCubeMaterial.contrastRatio
                : ""
        syncOutputSpaceState(colorCube.transformSpaceMode)
        syncSearchModeState()
    }

    readonly setSearchMode = (searchMode: number): void => {
        this.local.colorSync.setSearchMode(searchMode)
    }

    readonly setContrastPreset = (contrastRatio: number): void => {
        this.local.colorCubeMaterial.contrastRatio = contrastRatio
    }

    readonly setFontColor = (value: string): void => {
        this.local.colorSync.setFontColor(value)
    }

    readonly setBackgroundColor = (value: string): void => {
        this.local.colorSync.setBackgroundColor(value)
    }

    readonly setDarkModeColor = (value: string): void => {
        this.local.colorSync.setDarkModeColor(value)
    }

    readonly swapColors = (): void => {
        this.local.colorSync.swapColors()
    }

    readonly randomizeCustomTransformSpaceMatrix = (
        useSummation: boolean
    ): void => {
        let e0 = Math.random()
        let e1 = Math.random()
        let e2 = Math.random()
        let e3 = Math.random()
        let e4 = Math.random()
        let e5 = Math.random()
        let e6 = Math.random()
        let e7 = Math.random()
        let e8 = Math.random()
        if (useSummation) {
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
        }

        this.local.colorCube.customTransformSpaceMatrix.set(
            e0,
            e1,
            e2,
            e3,
            e4,
            e5,
            e6,
            e7,
            e8
        )
        this.local.colorCube.transformSpaceMode = ColorCube.TransformCustom
    }

    destroy(): void {
        this.local.colorSync.removeEventListener(
            "change",
            this.handleColorSyncChange
        )
        this.gui.destroy()
    }
}

export default SceneGui
