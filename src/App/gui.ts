import GUI from "lil-gui"

import type { ClipPlaneController } from "./objects/clipPlane"
import type { SdfMaterial } from "./objects/SdfMaterial"

const targetOutputTitles = {
    Color: 0,
    Lit: 1,
    Normal: 2,
    Steps: 3,
} as const

const shapeTitles = {
    "Sphere": 0,
    "Box": 1,
    "Round Box": 2,
    "Cone": 3,
    "Solid Angle": 4,
    "Cut Hollow Sphere": 5,
    "Octahedron": 6,
    "Triangle": 7,
} as const

export class SceneGui {
    readonly gui: GUI

    constructor(sdfMaterial: SdfMaterial, clipPlane: ClipPlaneController) {
        this.gui = new GUI({ title: "Scene" })

        this.gui
            .add(sdfMaterial, "size", 0.05, 2.0, 0.01)
            .name("Size")

        this.gui.add(sdfMaterial, "shape", shapeTitles).name("Shape")
        this.gui.add(sdfMaterial, "targetOutput", targetOutputTitles).name("Target Output")
        this.gui.add(sdfMaterial, "clipToBounds").name("Clip To Bounds")
        this.gui
            .add(clipPlane, "enabled")
            .name("Clip Plane")
        this.gui
            .add(clipPlane, "position", -5.0, 3.0, 0.01)
            .name("Clip Plane Z")
    }

    destroy(): void {
        this.gui.destroy()
    }
}

export default SceneGui
