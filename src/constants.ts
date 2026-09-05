import { SearchBackgroundColor } from "./App/ColorSync"
import * as ColorCube from "./App/objects/materials/ColorCubeMaterial"

export const targetOutputTitles = {
    Color: ColorCube.TargetOutputColor,
    Luminance: ColorCube.TargetOutputLuminance,
    Steps: ColorCube.TargetOutputSteps,
} as const

export const transformTitles = {
    Default: ColorCube.TransformDefault,
    Protanopia: ColorCube.TransformProtanopia,
    Deuteranopia: ColorCube.TransformDeuteranopia,
    Tritanopia: ColorCube.TransformTritanopia,
    Monochromacy: ColorCube.TransformMonochromacy,
    Custom: ColorCube.TransformCustom,
} as const

export const raycastTitles = {
    "Binary Search": ColorCube.RaycastBinarySearch,
    Bracketed: ColorCube.RaycastBracketed,
    Bracketed2: ColorCube.RaycastBracketed2,
    Bracketed3: ColorCube.RaycastBracketed3,
} as const

export const searchTitles = {
    "Font Color": ColorCube.SearchTargetColor,
    "Background Color": SearchBackgroundColor,
    "Dark Mode": ColorCube.SearchBlackAndWhite,
    "Opposite Color": ColorCube.SearchOppositeColor,
    None: ColorCube.SearchNone,
} as const

export const contrastPresetValues = ["", 3, 4.5, 7] as const

const noop = (..._args: any[]): void => {}

export const appStub = {
    gui: {
        local: {
            colorSync: {
                state: {
                    searchMode: ColorCube.SearchTargetColor,
                    fontColor: "#000000",
                    backgroundColor: "#ffffff",
                    darkModeColor: "#000000",
                },
                addEventListener: noop,
                removeEventListener: noop,
            },
            colorCubeMaterial: {
                contrastRatio: 4.5,
            },
        },
        setSearchMode: noop,
        setContrastPreset: noop,
        setFontColor: noop,
        setBackgroundColor: noop,
        setDarkModeColor: noop,
        swapColors: noop,
    },
}

// https://leva.pmnd.rs/?path=/story/advanced-theme--default
export type AppStubType = typeof appStub
export const levaStub = appStub.gui
export const levaTheme = {
    colors: {
        elevation1: "#ffffff",
        elevation2: "#ffffff", //dee4ef
        elevation3: "#c8c8c8",
        accent1: "#bf1722",
        accent2: "#bf1722",
        accent3: "#590b10",
        // highlight1: "#004cff",
        highlight2: "#000000",
        // highlight3: "#ff0000",
        // vivid1: "#ffcc00",
    },
    space: {
        md: "1px", // 10
    },
    fontSizes: {
        root: "12px", // 11
    },
    sizes: {
        // controlWidth: "160px", // 160
        colorPickerWidth: "192px", // 160
        colorPickerHeight: "120px", //100
    },
}
