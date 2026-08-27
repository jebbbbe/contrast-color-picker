import { Color, SRGBColorSpace, type ColorRepresentation } from "three"

const lumCoefficients = [0.2126, 0.7152, 0.0722] as const
const _color = new Color()
const _inverseColor = new Color()

type SRGB = readonly [number, number, number]

function colorToSRGB(color: ColorRepresentation): SRGB {
    _color.set(color)
    _color.getRGB(_color, SRGBColorSpace)

    return [
        _color.r,
        _color.g,
        _color.b,
    ]
}

function sRGBToLinearChannel(channel: number): number {
    return channel < 0.04045
        ? channel / 12.92
        : ((channel + 0.055) / 1.055) ** 2.4
}

function sRGBToLinear(color: SRGB): SRGB {
    return [
        sRGBToLinearChannel(color[0]),
        sRGBToLinearChannel(color[1]),
        sRGBToLinearChannel(color[2]),
    ]
}

function getLuminanceFromSRGB(color: SRGB): number {
    const linear = sRGBToLinear(color)

    return linear.reduce((sum, channel, index) => {
        return sum + channel * lumCoefficients[index]
    }, 0)
}

export function getContrastRatio(
    color1: ColorRepresentation,
    color2: ColorRepresentation
): number {
    const lum1 = getLuminanceFromSRGB(colorToSRGB(color1))
    const lum2 = getLuminanceFromSRGB(colorToSRGB(color2))
    const lighter = Math.max(lum1, lum2)
    const darker = Math.min(lum1, lum2)

    return (lighter + 0.05) / (darker + 0.05)
}

export function getOppositeHexColor(hex: string): string {
    _inverseColor.set(hex)
    _inverseColor.setRGB(
        1 - _inverseColor.r,
        1 - _inverseColor.g,
        1 - _inverseColor.b
    )

    return `#${_inverseColor.getHexString(SRGBColorSpace)}`
}
