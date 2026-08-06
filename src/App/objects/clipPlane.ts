import * as THREE from "three"

const defaultClipPlaneZ = -5

export class ClipPlaneController {
    readonly plane: THREE.Plane
    readonly outline: THREE.LineLoop<
        THREE.BufferGeometry,
        THREE.LineBasicMaterial
    >

    private readonly renderer: THREE.WebGLRenderer
    private enabledValue = false
    private positionValue = defaultClipPlaneZ

    constructor(renderer: THREE.WebGLRenderer) {
        this.renderer = renderer
        this.plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
        this.outline = new THREE.LineLoop(
            new THREE.BufferGeometry().setFromPoints([
                new THREE.Vector3(-4, -4, 0),
                new THREE.Vector3(4, -4, 0),
                new THREE.Vector3(4, 4, 0),
                new THREE.Vector3(-4, 4, 0),
            ]),
            new THREE.LineBasicMaterial({ color: 0x0f172a })
        )

        this.enabled = false
        this.position = defaultClipPlaneZ
    }

    get enabled(): boolean {
        return this.enabledValue
    }

    set enabled(value: boolean) {
        this.enabledValue = value
        this.renderer.clippingPlanes = value ? [this.plane] : []
        this.outline.visible = value
    }

    get position(): number {
        return this.positionValue
    }

    set position(value: number) {
        this.positionValue = value
        this.plane.constant = -value
        this.outline.position.z = value
    }
}

export { defaultClipPlaneZ }
