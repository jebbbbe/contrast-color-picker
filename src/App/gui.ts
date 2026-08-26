import GUI, { type Controller } from "lil-gui"
import * as THREE from "three"

import type { ThreeSceneApp } from "./main"
import type { ColorCubeVolume } from "./objects/ColorCubeVolume"
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
    contrastPreset: "" | number
    onClickColor: string
    targetColor: string
    blackPoint: string
    whitePoint: string
}

export class SceneGui {
    readonly gui: GUI
    private readonly state: SceneGuiState

    constructor(app: ThreeSceneApp) {
        const { controls, ctx, callbackBridge } = app
        const { colorCube } = ctx
        const colorCubeMaterial = colorCube.mesh.material
        const onClickMarker = colorCube.markers.onClick
        const onClickPrimary = onClickMarker.userData.primary
        const targetColorMarker = colorCube.markers.target
        const onClickColor = onClickPrimary.material.color.clone()
        const state: SceneGuiState = {
            contrastPreset: "",
            onClickColor: `#${onClickPrimary.material.color.getHexString(THREE.SRGBColorSpace)}`,
            targetColor: `#${colorCubeMaterial.targetColor1.getHexString(THREE.SRGBColorSpace)}`,
            blackPoint: "#000000",
            whitePoint: "#ffffff",
        }

        this.gui = new GUI({
            title: "Scene",
            container: app.container,
        })
        this.state = state

        let updateSwatchInverse = false

        const colorCubeActions = {
            swapColors,
        }

        const debugActions = {
            randomizeCustomTransformSpaceMatrix,
            randomizeCustomTransformSpaceMatrixSummation,
        }

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
            .add(debugActions, "randomizeCustomTransformSpaceMatrix")
            .name("Randomize Custom Matrix")
        debugFolder
            .add(debugActions, "randomizeCustomTransformSpaceMatrixSummation")
            .name("Randomize Summation Matrix")

        const colorCubeFolder = this.gui

        colorCubeFolder
            .add(colorCubeMaterial, "searchMode", sdfColorSearchTitles)
            .name("Search Mode")
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
        const swapColorsController = colorCubeFolder
            .add(colorCubeActions, "swapColors")
            .name("Swap")
            .onChange(updateSwatch)
        const targetColorController = colorCubeFolder
            .addColor(state, "targetColor")
            // .name("Target Color")
            .name("")
            .listen()
            .onChange(onTargetColorChange)
        const onClickColorController = colorCubeFolder
            .addColor(state, "onClickColor")
            // .name("Secondary Color")
            .name("")
            .listen()
            .onChange(onOnClickColorChange)
        const blackPointController = colorCubeFolder
            .addColor(state, "blackPoint")
            // .name("Black Point")
            .name("")
            .onChange(onBlackPointChange)
        const whitePointController = colorCubeFolder
            .addColor(state, "whitePoint")
            // .name("White Point")
            .name("")
            .onChange(onWhitePointChange)

        function getHex(value: string): number {
            return Number.parseInt(value.slice(1), 16)
        }

        function updateSwatch(): void {
            const update = {
                color: state.onClickColor,
                backgroundColor: state.targetColor,
            }
            if (updateSwatchInverse) {
                ;[update.color, update.backgroundColor] = [
                    update.backgroundColor,
                    update.color,
                ]
            }
            callbackBridge.setSwatch(update)
        }

        function updateTargetColorMaterial(value: string): void {
            colorCubeMaterial.targetColor1.setHex(
                getHex(value),
                THREE.SRGBColorSpace
            )
        }

        function updateOnClickColorMaterial(value: string): void {
            onClickColor.setHex(getHex(value), THREE.SRGBColorSpace)
        }

        function updateWhitePointMaterial(value: string): void {
            colorCubeMaterial.targetColor2.setHex(
                getHex(value),
                THREE.SRGBColorSpace
            )
        }

        function syncSearchColorsToMaterial(searchMode: number): void {
            if (searchMode === ColorCube.SearchTargetColor) {
                updateTargetColorMaterial(state.targetColor)
                return
            }

            if (searchMode === ColorCube.SearchBlackAndWhite) {
                updateTargetColorMaterial(state.blackPoint)
                updateWhitePointMaterial(state.whitePoint)
            }
        }

        function updateTargetColorMarker(): void {
            targetColorMarker.visible =
                colorCubeMaterial.searchMode === ColorCube.SearchTargetColor
            targetColorMarker.updateColor(colorCubeMaterial.targetColor1)
        }

        function updateOnClickMarker(): void {
            onClickMarker.updateColor(onClickColor)
        }

        function onTargetColorChange(value: string): void {
            if (colorCubeMaterial.searchMode === ColorCube.SearchTargetColor) {
                updateTargetColorMaterial(value)
            }

            updateTargetColorMarker()
            updateSwatch()
        }

        function onOnClickColorChange(value: string): void {
            updateOnClickColorMaterial(value)
            updateOnClickMarker()
            updateSwatch()
        }

        function onBlackPointChange(value: string): void {
            if (
                colorCubeMaterial.searchMode === ColorCube.SearchBlackAndWhite
            ) {
                updateTargetColorMaterial(value)
            }
        }

        function onWhitePointChange(value: string): void {
            if (
                colorCubeMaterial.searchMode === ColorCube.SearchBlackAndWhite
            ) {
                updateWhitePointMaterial(value)
            }
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

        function syncTargetColorState(value: number): void {
            if (value === ColorCube.SearchTargetColor) {
                targetColorController.enable()
            } else {
                targetColorController.disable()
            }

            if (value === ColorCube.SearchTargetColor) {
                swapColorsController.enable()
                onClickColorController.enable()
            } else {
                swapColorsController.disable()
                onClickColorController.disable()
            }

            if (value === ColorCube.SearchBlackAndWhite) {
                blackPointController.enable()
                whitePointController.enable()
                return
            }

            blackPointController.disable()
            whitePointController.disable()
        }

        function onSearchModeChange(value: number): void {
            syncTargetColorState(value)
            syncSearchColorsToMaterial(value)
            updateTargetColorMarker()

            if (value !== ColorCube.SearchTargetColor) {
                onClickMarker.visible = false
            }
        }

        function swapColors() {
            updateSwatchInverse = !updateSwatchInverse
        }

        syncContrastPresetState(colorCubeMaterial.contrastRatio)
        syncOutputSpaceState(colorCube.transformSpaceMode)
        syncTargetColorState(colorCubeMaterial.searchMode)
        syncSearchColorsToMaterial(colorCubeMaterial.searchMode)
    }

    destroy(): void {
        this.gui.destroy()
    }

    setOnClickColor(value: string): void {
        this.state.onClickColor = value
    }
}

export default SceneGui
