import * as THREE from "three"

function createMarkerTexture(): THREE.CanvasTexture {
    const canvas = document.createElement("canvas")
    const size = 64
    const context = canvas.getContext("2d")

    canvas.width = size
    canvas.height = size

    if (!context) {
        throw new Error("Unable to create marker texture")
    }

    context.clearRect(0, 0, size, size)
    context.fillStyle = "white"
    context.beginPath()
    context.arc(size * 0.5, size * 0.5, size * 0.5, 0, Math.PI * 2)
    context.fill()

    const texture = new THREE.CanvasTexture(canvas)

    texture.colorSpace = THREE.SRGBColorSpace

    return texture
}

const markerTexture = createMarkerTexture()
const markerScale = 0.03
const markerPositionColor = new THREE.Color()
const markerInverseColor = new THREE.Color()

type Dot = THREE.Sprite
type MarkerData = {
    primary: Dot
    inverse: Dot
}

export class Marker extends THREE.Group {
    constructor(visible = false, color: THREE.ColorRepresentation = 0x000000) {
        super()

        const primary: Dot = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: markerTexture,
                color: new THREE.Color(),
                fog: false,
                transparent: true,
                depthTest: false,
                depthWrite: false,
                sizeAttenuation: false,
            })
        )
        const inverse: Dot = new THREE.Sprite(
            new THREE.SpriteMaterial({
                map: markerTexture,
                color: new THREE.Color(),
                fog: false,
                transparent: true,
                depthTest: false,
                depthWrite: false,
                sizeAttenuation: false,
            })
        )

        inverse.renderOrder = 1
        primary.renderOrder = 2
        primary.scale.setScalar(markerScale)
        inverse.scale.setScalar(markerScale * 1.25)

        const userData = this.userData as MarkerData

        userData.primary = primary
        userData.inverse = inverse
        this.add(inverse, primary)
        this.visible = visible

        this.updateColor(color)
    }

    updateColor(color: THREE.ColorRepresentation): void {
        const { primary, inverse } = this.userData as MarkerData

        primary.material.color.set(color)
        primary.material.color.getRGB(markerInverseColor, THREE.SRGBColorSpace)
        inverse.material.color.setRGB(
            1 - markerInverseColor.r,
            1 - markerInverseColor.g,
            1 - markerInverseColor.b,
            THREE.SRGBColorSpace
        )

        const { r, g, b } = markerPositionColor.set(color).convertLinearToSRGB()

        this.position.set(r - 0.5, g - 0.5, b - 0.5)
    }

    updatePosition(position: THREE.Vector3): void {
        const { primary, inverse } = this.userData as MarkerData

        this.position.copy(position)
        primary.material.color.setRGB(
            position.x + 0.5,
            position.y + 0.5,
            position.z + 0.5,
            THREE.SRGBColorSpace
        )
        primary.material.color.getRGB(markerInverseColor, THREE.SRGBColorSpace)
        inverse.material.color.setRGB(
            1 - markerInverseColor.r,
            1 - markerInverseColor.g,
            1 - markerInverseColor.b,
            THREE.SRGBColorSpace
        )
    }
}

export default Marker
