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

export class SceneGui {
    readonly gui: GUI
    private readonly onClickColorState: { value: string }
    private readonly onClickColorController: Controller

    constructor(app: ThreeSceneApp) {
        const { controls, ctx, callbackBridge } = app
        const { colorCube } = ctx
        const colorCubeMaterial = colorCube.mesh.material
        const onClickMarker = colorCube.markers.onClick
        const onClickPrimary = onClickMarker.userData.primary
        const targetColorMarker = colorCube.markers.target
        const contrastPresetState: { value: "" | number } = { value: "" }
        const onClickColor = onClickPrimary.material.color.clone()
        const onClickColorState: { value: string } = {
            value: `#${onClickPrimary.material.color.getHexString(THREE.SRGBColorSpace)}`,
        }
        const targetColorState: { value: string } = {
            value: `#${colorCubeMaterial.targetColor.getHexString(THREE.SRGBColorSpace)}`,
        }

        this.gui = new GUI({
            title: "Scene",
            container: app.container,
        })
        this.onClickColorState = onClickColorState
        const sceneGui = this

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
        const transformSpaceController = colorCubeFolder
            .add(colorCube, "transformSpaceMode", sdfColorTransformTitles)
            .name("Transform Space")
            .onChange(onTransformSpaceChange)
        const contrastPresetController = colorCubeFolder
            .add(contrastPresetState, "value", sdfColorContrastPresetValues)
            .name("WCAG Contrast")
            .onChange(onContrastPresetChange)
        const contrastRatioController = colorCubeFolder
            .add(colorCubeMaterial, "contrastRatio", 1.0, 21.0, 0.001)
            .name("Contrast Ratio")
            .onChange(onContrastRatioChange)
        const swapColorsController = colorCubeFolder
            .add(colorCubeActions, "swapColors")
            .name("Swap")
        const targetColorController = colorCubeFolder
            .addColor(targetColorState, "value")
            .name("Target Color")
            .onChange(onTargetColorChange)
        this.onClickColorController = colorCubeFolder
            .addColor(onClickColorState, "value")
            .name("Secondary Color")
            .onChange(onOnClickColorChange)

        function getHex(value: string): number {
            return Number.parseInt(value.slice(1), 16)
        }

        function updateSwatch(): void {
            callbackBridge.setSwatch({
                color: onClickColorState.value,
                backgroundColor: targetColorState.value,
            })
        }

        function updateTargetColorMaterial(value: string): void {
            colorCubeMaterial.targetColor.setHex(
                getHex(value),
                THREE.SRGBColorSpace
            )
        }

        function updateOnClickColorMaterial(value: string): void {
            onClickColor.setHex(getHex(value), THREE.SRGBColorSpace)
        }

        function updateTargetColorMarker(): void {
            targetColorMarker.updateColor(
                colorCubeMaterial.searchMode === ColorCube.SearchTargetColor,
                colorCubeMaterial.targetColor
            )
        }

        function updateOnClickMarker(): void {
            onClickMarker.updateColor(onClickMarker.visible, onClickColor)
        }

        function onTargetColorChange(value: string): void {
            updateTargetColorMaterial(value)
            updateTargetColorMarker()
            updateSwatch()
        }

        function onOnClickColorChange(value: string): void {
            updateOnClickColorMaterial(value)
            updateOnClickMarker()
            updateSwatch()
        }

        function syncContrastPresetState(value: number): void {
            contrastPresetState.value =
                value === 3 || value === 4.5 || value === 7 ? value : ""
            contrastPresetController.updateDisplay()
        }

        function onContrastPresetChange(value: "" | number): void {
            if (value === "") {
                syncContrastPresetState(colorCubeMaterial.contrastRatio)
                return
            }

            colorCubeMaterial.contrastRatio = value
            contrastRatioController.updateDisplay()
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
            outputSpaceController.updateDisplay()
            outputSpaceController.disable()
        }

        function onTransformSpaceChange(value: number): void {
            syncOutputSpaceState(value)
        }

        function syncTransformSpaceState(): void {
            transformSpaceController.updateDisplay()
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
                swapColorsController.enable()
                sceneGui.onClickColorController.enable()
                return
            }

            targetColorController.disable()
            swapColorsController.disable()
            sceneGui.onClickColorController.disable()
        }

        function onSearchModeChange(value: number): void {
            syncTargetColorState(value)
            updateTargetColorMarker()

            if (value !== ColorCube.SearchTargetColor) {
                onClickMarker.updateColor(false, onClickPrimary.material.color)
            }
        }

        function swapColors(): void {
            const previousTargetColor = targetColorState.value

            targetColorState.value = onClickColorState.value
            onClickColorState.value = previousTargetColor

            updateTargetColorMaterial(targetColorState.value)
            updateOnClickColorMaterial(onClickColorState.value)
            updateTargetColorMarker()
            updateOnClickMarker()
            targetColorController.updateDisplay()
            sceneGui.onClickColorController.updateDisplay()
            updateSwatch()
        }

        syncContrastPresetState(colorCubeMaterial.contrastRatio)
        syncOutputSpaceState(colorCube.transformSpaceMode)
        syncTargetColorState(colorCubeMaterial.searchMode)
    }

    destroy(): void {
        this.gui.destroy()
    }

    setOnClickColor(value: string): void {
        this.onClickColorState.value = value
        this.onClickColorController.updateDisplay()
    }
}

export default SceneGui
