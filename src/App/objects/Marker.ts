import * as THREE from "three"

const markerSphereGeometry = new THREE.SphereGeometry(0.02, 16, 16)
const markerPositionColor = new THREE.Color()
const markerInverseColor = new THREE.Color()

type Dot = THREE.Mesh<THREE.SphereGeometry, THREE.MeshBasicMaterial>
type MarkerData = {
    primary: Dot
    inverse: Dot
}

export class Marker extends THREE.Group {
    constructor(visible = false, color: THREE.ColorRepresentation = 0x000000) {
        super()

        const primary: Dot = new THREE.Mesh(
            markerSphereGeometry,
            new THREE.MeshBasicMaterial({
                color: new THREE.Color(),
                fog: false,
                vertexColors: false,
                transparent: false,
                depthTest: false,
            })
        )
        const inverse: Dot = new THREE.Mesh(
            markerSphereGeometry,
            new THREE.MeshBasicMaterial({
                color: new THREE.Color(),
                fog: false,
                vertexColors: false,
                transparent: false,
                side: THREE.BackSide,
                depthTest: false,
            })
        )

        inverse.renderOrder = 1
        primary.renderOrder = 2
        inverse.scale.setScalar(1.2)

        const userData = this.userData as MarkerData

        userData.primary = primary
        userData.inverse = inverse
        this.add(inverse, primary)

        this.update(visible, color)
    }

    update(visible: boolean, color: THREE.ColorRepresentation): void {
        const { primary, inverse } = this.userData as MarkerData

        this.visible = visible
        primary.material.color.set(color)
        primary.material.color.getRGB(markerInverseColor, THREE.SRGBColorSpace)
        inverse.material.color.setRGB(
            1 - markerInverseColor.r,
            1 - markerInverseColor.g,
            1 - markerInverseColor.b,
            THREE.SRGBColorSpace
        )

        if (!visible) {
            return
        }

        const { r, g, b } = markerPositionColor.set(color).convertLinearToSRGB()

        this.position.set(r - 0.5, g - 0.5, b - 0.5)
    }
}

export default Marker
