import { useEffect, useState } from "react"
import { button, folder, Leva, useControls } from "leva"
import type { ColorSyncChangeEvent } from "../App/ColorSync"
import { SearchBackgroundColor } from "../App/ColorSync"
import type ThreeSceneApp from "../App/main"
import * as ColorCube from "../App/objects/materials/ColorCubeMaterial"
import { contrastPresetValues, searchTitles } from "../constants"

type ContrastPresetState = "" | number

type LevaComponentProps = {
    app: ThreeSceneApp | null
}

function getContrastPresetValue(contrastRatio: number): ContrastPresetState {
    return contrastRatio === 3 || contrastRatio === 4.5 || contrastRatio === 7
        ? contrastRatio
        : ""
}

function getColorControlState(searchMode: number): {
    fontDisabled: boolean
    backgroundDisabled: boolean
    darkModeDisabled: boolean
} {
    switch (searchMode) {
        case ColorCube.SearchOppositeColor:
        case SearchBackgroundColor:
        case ColorCube.SearchTargetColor:
            return {
                fontDisabled: false,
                backgroundDisabled: false,
                darkModeDisabled: true,
            }
        case ColorCube.SearchBlackAndWhite:
            return {
                fontDisabled: false,
                backgroundDisabled: false,
                darkModeDisabled: false,
            }
        case ColorCube.SearchNone:
        default:
            return {
                fontDisabled: true,
                backgroundDisabled: true,
                darkModeDisabled: true,
            }
    }
}

function LevaSceneControls({ app }: { app: ThreeSceneApp }) {
    const [searchMode, setSearchMode] = useState(app.gui.local.colorSync.state.searchMode)
    const [fontColor, setFontColor] = useState(app.gui.local.colorSync.state.fontColor)
    const [backgroundColor, setBackgroundColor] = useState(
        app.gui.local.colorSync.state.backgroundColor
    )
    const [darkModeColor, setDarkModeColor] = useState(
        app.gui.local.colorSync.state.darkModeColor
    )
    const [contrastRatio, setContrastRatio] = useState(
        app.gui.local.colorCubeMaterial.contrastRatio
    )
    const [contrastPreset, setContrastPreset] = useState<ContrastPresetState>(
        getContrastPresetValue(app.gui.local.colorCubeMaterial.contrastRatio)
    )

    function syncFromAppState(): void {
        const { colorSync, colorCubeMaterial } = app.gui.local
        setSearchMode(colorSync.state.searchMode)
        setFontColor(colorSync.state.fontColor)
        setBackgroundColor(colorSync.state.backgroundColor)
        setDarkModeColor(colorSync.state.darkModeColor)
        setContrastRatio(colorCubeMaterial.contrastRatio)
        setContrastPreset(getContrastPresetValue(colorCubeMaterial.contrastRatio))
    }

    useEffect(() => {
        syncFromAppState()

        const handleChange = (_event: ColorSyncChangeEvent): void => {
            syncFromAppState()
        }

        app.gui.local.colorSync.addEventListener("change", handleChange)

        return () => {
            app.gui.local.colorSync.removeEventListener("change", handleChange)
        }
    }, [app])

    const { fontDisabled, backgroundDisabled, darkModeDisabled } =
        getColorControlState(searchMode)

    useControls(
        () => ({
            Scene: folder(
                {
                    "Search Mode": {
                        value: searchMode,
                        options: searchTitles,
                        onChange: (value: number) => {
                            app.gui.setSearchMode(value)
                            syncFromAppState()
                        },
                    },
                    "WCAG Contrast": {
                        value: contrastPreset,
                        options: {
                            "": contrastPresetValues[0],
                            "3": contrastPresetValues[1],
                            "4.5": contrastPresetValues[2],
                            "7": contrastPresetValues[3],
                        },
                        onChange: (value: ContrastPresetState) => {
                            if (value === "") {
                                setContrastPreset(
                                    getContrastPresetValue(
                                        app.gui.local.colorCubeMaterial.contrastRatio
                                    )
                                )
                                return
                            }

                            app.gui.setContrastPreset(value)
                            setContrastRatio(
                                app.gui.local.colorCubeMaterial.contrastRatio
                            )
                            setContrastPreset(
                                getContrastPresetValue(
                                    app.gui.local.colorCubeMaterial.contrastRatio
                                )
                            )
                        },
                    },
                    "Contrast Ratio": {
                        value: contrastRatio,
                        min: 1,
                        max: 21,
                        step: 0.001,
                        onChange: (value: number) => {
                            app.gui.local.colorCubeMaterial.contrastRatio = value
                            setContrastRatio(
                                app.gui.local.colorCubeMaterial.contrastRatio
                            )
                            setContrastPreset(
                                getContrastPresetValue(
                                    app.gui.local.colorCubeMaterial.contrastRatio
                                )
                            )
                        },
                    },
                    Swap: button(() => {
                        app.gui.swapColors()
                        syncFromAppState()
                    }),
                    Font: {
                        value: fontColor,
                        disabled: fontDisabled,
                        onChange: (value: string) => {
                            app.gui.setFontColor(value)
                            syncFromAppState()
                        },
                    },
                    Background: {
                        value: backgroundColor,
                        disabled: backgroundDisabled,
                        onChange: (value: string) => {
                            app.gui.setBackgroundColor(value)
                            syncFromAppState()
                        },
                    },
                    "Dark Mode": {
                        value: darkModeColor,
                        disabled: darkModeDisabled,
                        onChange: (value: string) => {
                            app.gui.setDarkModeColor(value)
                            syncFromAppState()
                        },
                    },
                },
                { collapsed: false }
            ),
        }),
        [
            app,
            searchMode,
            contrastPreset,
            contrastRatio,
            fontColor,
            backgroundColor,
            darkModeColor,
            fontDisabled,
            backgroundDisabled,
            darkModeDisabled,
        ]
    )

    return null
}

function LevaComponent({ app }: LevaComponentProps) {
    return (
        <>
            <Leva
                fill={true}
                flat={true}
                collapsed={false}
                titleBar={{
                    title: "Leva",
                    drag: false,
                    filter: false,
                }}
                neverHide={true}
            />
            {app ? <LevaSceneControls app={app} /> : null}
        </>
    )
}

export default LevaComponent
