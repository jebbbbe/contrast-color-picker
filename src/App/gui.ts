import GUI from "lil-gui"
import * as THREE from "three"

import type { ThreeSceneApp } from "./main"
import type { SdfColorCube } from "./objects/SdfColorCube"
import * as ColorCube from "./objects/materials/ColorCubeMaterial"
import * as SDF from "./objects/materials/SdfMaterial"

const sdfMaterialTargetOutputTitles = {
    Color: SDF.SdfTargetOutputColor,
    Lit: SDF.SdfTargetOutputLit,
    Normal: SDF.SdfTargetOutputNormal,
    Steps: SDF.SdfTargetOutputSteps,
    "World Position": SDF.SdfTargetOutputWorldPosition,
} as const

const sdfMaterialShapeTitles = {
    Sphere: SDF.SdfShapeSphere,
    Box: SDF.SdfShapeBox,
    "Round Box": SDF.SdfShapeRoundBox,
    Cone: SDF.SdfShapeCone,
    "Solid Angle": SDF.SdfShapeSolidAngle,
    "Cut Hollow Sphere": SDF.SdfShapeCutHollowSphere,
    Octahedron: SDF.SdfShapeOctahedron,
    Triangle: SDF.SdfShapeTriangle,
} as const

const sdfColorTargetOutputTitles = {
    Color: ColorCube.TargetOutputColor,
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
    Accumulation: ColorCube.RaycastAccumulation,
    "Binary Search": ColorCube.RaycastBinarySearch,
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

    constructor(app: ThreeSceneApp) {
        const { controls, ctx } = app
        const { clipPlane, sdfColorCube, sdfGroup } = ctx
        const colorCube: SdfColorCube = sdfColorCube
        const colorCubeMaterial = colorCube.material
        const sdfMaterial = (
            sdfGroup.children[0] as unknown as { material: SDF.SdfMaterial }
        ).material
        const contrastPresetState: { value: "" | number } = { value: "" }
        const targetColorState: { value: string } = {
            value: `#${colorCubeMaterial.targetColor.getHexString(THREE.SRGBColorSpace)}`,
        }

        this.gui = new GUI({ title: "Scene" })

        const debugFolder = this.gui.addFolder("Debug")
        const colorCubeFolder = this.gui.addFolder("Color Cube")
        const sdfFolder = this.gui.addFolder("SDF Material")
        const clipPlaneFolder = this.gui.addFolder("Clip Plane")

        sdfFolder.add(sdfMaterial, "size", 0.05, 2.0, 0.01).name("Size")
        sdfFolder.add(sdfGroup, "visible").name("Visible")

        sdfFolder
            .add(sdfMaterial, "shape", sdfMaterialShapeTitles)
            .name("Shape")
        sdfFolder
            .add(sdfMaterial, "targetOutput", sdfMaterialTargetOutputTitles)
            .name("Target Output")
        sdfFolder.add(sdfMaterial, "clipToBounds").name("Clip To Bounds")

        debugFolder
            .add(colorCubeMaterial, "targetOutput", sdfColorTargetOutputTitles)
            .name("Cube Output")
        debugFolder
            .add(colorCubeMaterial, "raycastMode", sdfColorRaycastTitles)
            .name("Raycast Mode")
        debugFolder.add(controls, "autoRotate").name("Rotate Camera")
        const searchModeController = colorCubeFolder
            .add(colorCubeMaterial, "searchMode", sdfColorSearchTitles)
            .name("Search Mode")
        const outputSpaceController = colorCubeFolder
            .add(colorCubeMaterial, "transformMode", sdfColorTransformTitles)
            .name("Output Space")
        const transformSpaceController = colorCubeFolder
            .add(colorCube, "transformSpaceMode", sdfColorTransformTitles)
            .name("Transform Space")
        const contrastPresetController = colorCubeFolder
            .add(contrastPresetState, "value", sdfColorContrastPresetValues)
            .name("WCAG Contrast")
        const contrastRatioController = colorCubeFolder
            .add(colorCubeMaterial, "contrastRatio", 1.0, 21.0, 0.1)
            .name("Contrast Ratio")
        const targetColorController = colorCubeFolder
            .addColor(targetColorState, "value")
            .name("Target Color")
            .onChange((value: string) => {
                colorCubeMaterial.targetColor.setHex(
                    Number.parseInt(value.slice(1), 16),
                    THREE.SRGBColorSpace
                )
            })

        const syncContrastPresetState = (value: number): void => {
            if (value === 3 || value === 4.5 || value === 7) {
                contrastPresetState.value = value
            } else {
                contrastPresetState.value = ""
            }

            contrastPresetController.updateDisplay()
        }

        contrastPresetController.onChange((value: "" | number) => {
            if (value === "") {
                syncContrastPresetState(colorCubeMaterial.contrastRatio)
                contrastPresetController.updateDisplay()
                return
            }

            colorCubeMaterial.contrastRatio = value
            contrastRatioController.updateDisplay()
        })
        contrastRatioController.onChange(() => {
            syncContrastPresetState(colorCubeMaterial.contrastRatio)
        })
        syncContrastPresetState(colorCubeMaterial.contrastRatio)

        const syncOutputSpaceState = (value: number): void => {
            const isDefault = value === ColorCube.TransformDefault

            if (isDefault) {
                outputSpaceController.enable()
                return
            }

            colorCubeMaterial.transformMode = ColorCube.TransformDefault
            outputSpaceController.updateDisplay()
            outputSpaceController.disable()
        }

        transformSpaceController.onChange((value: number) => {
            syncOutputSpaceState(value)
        })
        syncOutputSpaceState(colorCube.transformSpaceMode)

        debugFolder
            .add(
                {
                    randomizeCustomTransformSpaceMatrix: (): void => {
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
                        transformSpaceController.updateDisplay()
                        syncOutputSpaceState(colorCube.transformSpaceMode)
                    },
                },
                "randomizeCustomTransformSpaceMatrix"
            )
            .name("Randomize Custom Matrix")
        debugFolder
            .add(
                {
                    randomizeCustomTransformSpaceMatrixSummation: (): void => {
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
                        transformSpaceController.updateDisplay()
                        syncOutputSpaceState(colorCube.transformSpaceMode)
                    },
                },
                "randomizeCustomTransformSpaceMatrixSummation"
            )
            .name("Randomize Summation Matrix")

        const syncTargetColorState = (value: number): void => {
            if (value === ColorCube.SearchTargetColor) {
                targetColorController.enable()
                return
            }

            targetColorController.disable()
        }

        syncTargetColorState(colorCubeMaterial.searchMode)
        searchModeController.onChange((value: number) => {
            syncTargetColorState(value)
        })

        sdfFolder.close()
        clipPlaneFolder.add(clipPlane, "enabled").name("Enabled")
        clipPlaneFolder
            .add(clipPlane, "position", -5.0, 3.0, 0.01)
            .name("Clip Plane Z")

        clipPlaneFolder.close()
    }

    destroy(): void {
        this.gui.destroy()
    }
}

export default SceneGui
