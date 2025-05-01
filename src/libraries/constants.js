export const outputTargets = {
    color: 0,
    raySteps: 1,
    normal: 2,
    light: 0,
}

export const densityFunctions = {
    none: 0,
    section:1,
    sphere: 2,
    contrast: 3,
    "Transformed matrix": 4,
    "Custom Transformed Matrix": 5,
    "Transformed Matrix Contrast": 6,
    "Selected Color": 7,
    "Matrix With Contrast": 8,
}

export const transformModes = {
    none: 0,
    protanopia: 1,
    deuteranopia: 2,
    tritanopia: 3,
    monochromacy: 4,
    custom:100,
}

export const solutions = {
    none:0,
    "sdf Lerp Fail":1,
    "sdf Boundary":2,
}