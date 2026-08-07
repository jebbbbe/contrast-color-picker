import GUI from "lil-gui"

import type { ClipPlaneController } from "./objects/clipPlane"
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

export class SceneGui {
    readonly gui: GUI

    constructor(sdfMaterial: SDF.SdfMaterial, clipPlane: ClipPlaneController) {
        this.gui = new GUI({ title: "Scene" })

        this.gui.add(sdfMaterial, "size", 0.05, 2.0, 0.01).name("Size")

        this.gui.add(sdfMaterial, "shape", shapeTitles).name("Shape")
        this.gui
            .add(sdfMaterial, "targetOutput", targetOutputTitles)
            .name("Target Output")
        this.gui.add(sdfMaterial, "clipToBounds").name("Clip To Bounds")
        this.gui.add(clipPlane, "enabled").name("Clip Plane")
        this.gui
            .add(clipPlane, "position", -5.0, 3.0, 0.01)
            .name("Clip Plane Z")
    }

    destroy(): void {
        this.gui.destroy()
    }
}

export default SceneGui
