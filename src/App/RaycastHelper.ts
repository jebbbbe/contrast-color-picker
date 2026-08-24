import * as THREE from "three"

export class RaycastHelper {
    raycaster = new THREE.Raycaster()
    pointer = new THREE.Vector2()
    camera: THREE.Camera
    targets: THREE.Object3D[]
    domElem: HTMLCanvasElement

    constructor(
        camera: THREE.Camera,
        targets: THREE.Scene | THREE.Object3D[] = [],
        domElem: HTMLCanvasElement
    ) {
        this.camera = camera
        this.targets = targets instanceof THREE.Scene ? [...targets.children] : targets
        this.domElem = domElem
    }

    castFromEvent(
        e: MouseEvent,
        objects: THREE.Object3D[] = this.targets,
        recursive: boolean = false
    ) {
        const bounds = this.domElem.getBoundingClientRect()

        this.pointer.set(
            ((e.clientX - bounds.left) / bounds.width) * 2 - 1,
            -((e.clientY - bounds.top) / bounds.height) * 2 + 1
        )
        this.raycaster.setFromCamera(this.pointer, this.camera)

        return this.raycaster.intersectObjects(objects, recursive)
    }
}

export default RaycastHelper
