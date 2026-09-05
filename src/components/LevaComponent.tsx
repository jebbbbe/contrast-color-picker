import { useEffect, useState } from "react"
import {
    button,
    buttonGroup,
    LevaPanel,
    useControls,
    useCreateStore,
} from "leva"
import type { ColorSyncChangeEvent } from "../App/ColorSync"
import { SearchBackgroundColor } from "../App/ColorSync"
import * as ColorCube from "../App/objects/materials/ColorCubeMaterial"
import { searchTitles, levaTheme, type AppStubType } from "../constants"

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

function LevaComponent({ bridge }: { bridge: AppStubType["gui"] }) {
    const [oneLineLabels, setOneLineLabels] = useState(false)
    const [searchMode, setSearchMode] = useState(
        bridge.local.colorSync.state.searchMode
    )
    const [fontColor, setFontColor] = useState(
        bridge.local.colorSync.state.fontColor
    )
    const [backgroundColor, setBackgroundColor] = useState(
        bridge.local.colorSync.state.backgroundColor
    )
    const [darkModeColor, setDarkModeColor] = useState(
        bridge.local.colorSync.state.darkModeColor
    )
    const [contrastRatio, setContrastRatio] = useState(
        bridge.local.colorCubeMaterial.contrastRatio
    )
    const { fontDisabled, backgroundDisabled, darkModeDisabled } =
        getColorControlState(searchMode)

    const otherStore = useCreateStore()
    const colorStore = useCreateStore()

    const [, setOther] = useControls(
        () => ({
            searchMode: {
                label: "Search Mode",
                value: searchMode,
                options: searchTitles,
                onChange: (value: number) => {
                    bridge.setSearchMode(value)
                    syncFromBridgeState()
                },
            },
            contrastRatio: {
                label: "Contrast Ratio",
                value: contrastRatio,
                min: 1,
                max: 21,
                step: 0.001,
                onChange: (value: number) => {
                    bridge.local.colorCubeMaterial.contrastRatio = value
                    syncFromBridgeState()
                },
            },
            presets: buttonGroup({
                // label: "WCAG Contrast",
                label: "",
                opts: {
                    "3 ": () => {
                        bridge.setContrastPreset(3)
                        syncFromBridgeState()
                    },
                    "4.5 ": () => {
                        bridge.setContrastPreset(4.5)
                        syncFromBridgeState()
                    },
                    "7 ": () => {
                        bridge.setContrastPreset(7)
                        syncFromBridgeState()
                    },
                },
            }),
            Swap: button(() => {
                bridge.swapColors()
                syncFromBridgeState()
            }),
        }),
        { store: otherStore },
        [bridge, searchMode, contrastRatio]
    )

    const [, setColors] = useControls(
        () => ({
            font: {
                label: "Font",
                value: fontColor,
                disabled: fontDisabled,
                onChange: (value: string) => {
                    bridge.setFontColor(value)
                    syncFromBridgeState()
                },
            },
            background: {
                label: "Background",
                value: backgroundColor,
                disabled: backgroundDisabled,
                onChange: (value: string) => {
                    bridge.setBackgroundColor(value)
                    syncFromBridgeState()
                },
            },
            darkMode: {
                label: "Dark Mode",
                value: darkModeColor,
                disabled: darkModeDisabled,
                onChange: (value: string) => {
                    bridge.setDarkModeColor(value)
                    syncFromBridgeState()
                },
            },
        }),
        { store: colorStore },
        [
            bridge,
            fontColor,
            backgroundColor,
            darkModeColor,
            fontDisabled,
            backgroundDisabled,
            darkModeDisabled,
        ]
    )

    function syncFromBridgeState(): void {
        const { colorSync, colorCubeMaterial } = bridge.local
        const nextSearchMode = colorSync.state.searchMode
        const nextFontColor = colorSync.state.fontColor
        const nextBackgroundColor = colorSync.state.backgroundColor
        const nextDarkModeColor = colorSync.state.darkModeColor
        const nextContrastRatio = colorCubeMaterial.contrastRatio

        setSearchMode(nextSearchMode)
        setFontColor(nextFontColor)
        setBackgroundColor(nextBackgroundColor)
        setDarkModeColor(nextDarkModeColor)
        setContrastRatio(nextContrastRatio)
        setOther({
            searchMode: nextSearchMode,
            contrastRatio: nextContrastRatio,
        })
        setColors({
            font: nextFontColor,
            background: nextBackgroundColor,
            darkMode: nextDarkModeColor,
        })
    }

    // turn on one line labels
    useEffect(() => {
        const media = globalThis.matchMedia("(min-width: 701px)")
        const syncOneLineLabels = (): void => {
            setOneLineLabels(media.matches)
        }

        syncOneLineLabels()
        media.addEventListener("change", syncOneLineLabels)

        return () => {
            media.removeEventListener("change", syncOneLineLabels)
        }
    }, [])

    useEffect(() => {
        syncFromBridgeState()

        const handleChange = (_event: ColorSyncChangeEvent): void => {
            syncFromBridgeState()
        }

        bridge.local.colorSync.addEventListener("change", handleChange)

        return () => {
            bridge.local.colorSync.removeEventListener("change", handleChange)
        }
    }, [bridge])

    return (
        <>
            <div className="leva-column">
                <LevaPanel
                    store={otherStore}
                    theme={levaTheme}
                    fill={true}
                    flat={true}
                    oneLineLabels={oneLineLabels}
                    collapsed={false}
                    titleBar={false}
                    neverHide={true}
                />
            </div>
            <div className="leva-column">
                <LevaPanel
                    store={colorStore}
                    theme={levaTheme}
                    fill={true}
                    flat={true}
                    oneLineLabels={oneLineLabels}
                    collapsed={false}
                    titleBar={false}
                    neverHide={true}
                />
            </div>
        </>
    )
}

export default LevaComponent
