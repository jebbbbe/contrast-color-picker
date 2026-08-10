import GUI from "lil-gui"

import type { ClipPlaneController } from "./objects/clipPlane"
import * as ColorCube from "./objects/materials/ColorCubeMaterial"
import * as SDF from "./objects/materials/SdfMaterial"

const targetOutputTitles = {
    Color: SDF.SdfTargetOutputColor,
    Lit: SDF.SdfTargetOutputLit,
    Normal: SDF.SdfTargetOutputNormal,
    Steps: SDF.SdfTargetOutputSteps,
    "World Position": SDF.SdfTargetOutputWorldPosition,
} as const

const shapeTitles = {
    Sphere: SDF.SdfShapeSphere,
    Box: SDF.SdfShapeBox,
    "Round Box": SDF.SdfShapeRoundBox,
    Cone: SDF.SdfShapeCone,
    "Solid Angle": SDF.SdfShapeSolidAngle,
    "Cut Hollow Sphere": SDF.SdfShapeCutHollowSphere,
    Octahedron: SDF.SdfShapeOctahedron,
    Triangle: SDF.SdfShapeTriangle,
} as const

const colorCubeTargetOutputTitles = {
    Color: ColorCube.ColorCubeTargetOutputColor,
    Normal: ColorCube.ColorCubeTargetOutputNormal,
    Steps: ColorCube.ColorCubeTargetOutputSteps,
} as const

const colorCubeTransformTitles = {
    Default: ColorCube.ColorCubeTransformModeDefault,
    Protanopia: ColorCube.ColorCubeTransformModeProtanopia,
    Deuteranopia: ColorCube.ColorCubeTransformModeDeuteranopia,
    Tritanopia: ColorCube.ColorCubeTransformModeTritanopia,
    Monochromacy: ColorCube.ColorCubeTransformModeMonochromacy,
} as const

export class SceneGui {
    readonly gui: GUI

    constructor(
        sdfMaterial: SDF.SdfMaterial,
        colorCubeMaterial: ColorCube.ColorCubeMaterial,
        clipPlane: ClipPlaneController
    ) {
        this.gui = new GUI({ title: "Scene" })

        const colorCubeFolder = this.gui.addFolder("Color Cube")
        const sdfFolder = this.gui.addFolder("SDF Material")
        const clipPlaneFolder = this.gui.addFolder("Clip Plane")

        sdfFolder.add(sdfMaterial, "size", 0.05, 2.0, 0.01).name("Size")

        sdfFolder.add(sdfMaterial, "shape", shapeTitles).name("Shape")
        sdfFolder
            .add(sdfMaterial, "targetOutput", targetOutputTitles)
            .name("Target Output")
        sdfFolder.add(sdfMaterial, "clipToBounds").name("Clip To Bounds")

        colorCubeFolder
            .add(colorCubeMaterial, "targetOutput", colorCubeTargetOutputTitles)
            .name("Target Output")
        const outputSpaceController = colorCubeFolder
            .add(colorCubeMaterial, "transformMode", colorCubeTransformTitles)
            .name("Output Space")
        const transformSpaceController = colorCubeFolder
            .add(
                colorCubeMaterial,
                "transformSpaceMode",
                colorCubeTransformTitles
            )
            .name("Transform Space")
        colorCubeFolder
            .add(colorCubeMaterial, "contrastRatio", 1.0, 21.0, 0.1)
            .name("Contrast Ratio")
        const targetColorController = colorCubeFolder
            .addColor(colorCubeMaterial, "targetColor")
            .name("Target Color")
        const useTargetColorController = colorCubeFolder
            .add(colorCubeMaterial, "useTargetColor")
            .name("Use Target Color")

        const syncOutputSpaceState = (value: number): void => {
            const isDefault = value === ColorCube.ColorCubeTransformModeDefault

            if (isDefault) {
                outputSpaceController.enable()
                return
            }

            colorCubeMaterial.transformMode =
                ColorCube.ColorCubeTransformModeDefault
            outputSpaceController.updateDisplay()
            outputSpaceController.disable()
        }

        transformSpaceController.onChange((value: number) => {
            syncOutputSpaceState(value)
        })
        syncOutputSpaceState(colorCubeMaterial.transformSpaceMode)

        const syncTargetColorState = (value: boolean): void => {
            if (value) {
                targetColorController.enable()
                return
            }

            targetColorController.disable()
        }

        syncTargetColorState(colorCubeMaterial.useTargetColor)
        useTargetColorController.onChange((value: boolean) => {
            syncTargetColorState(value)
        })

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
