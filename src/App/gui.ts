import GUI from "lil-gui"

import type { SdfMaterial } from "./objects/SdfMaterial"

export class SceneGui {
    readonly gui: GUI

    constructor(sdfMaterial: SdfMaterial) {
        this.gui = new GUI({ title: "Scene" })

        this.gui
            .add(sdfMaterial, "sphereRadius", 0.00, 1.0, 0.01)
            .name("Sphere Radius")
    }

    destroy(): void {
        this.gui.destroy()
    }
}

export default SceneGui
