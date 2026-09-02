import { useState, type FormEvent } from "react"
import "./FontSwatch.css"
import PassFail from "./PassFail"

const textBank = [
    "The five boxing wizards jump quickly.",
    "Quick zephyrs blow, vexing daft Jim.",
    "The quick brown fox jumps over the lazy dog.",
    "b, c, f, g, h, i, j, k, m, o, p, q, u, v, w, x, y, and z are letters.",
]

export type FontSwatchState = {
    color: string
    backgroundColor: string
    normalTextPassAA: boolean
    normalTextPassAAA: boolean
    largeTextPassAA: boolean
    largeTextPassAAA: boolean
    darkModeEnabled: boolean
    darkBackgroundColor: string
    normalDarkTextPassAA: boolean
    normalDarkTextPassAAA: boolean
    largeDarkTextPassAA: boolean
    largeDarkTextPassAAA: boolean
}

export const initialFontSwatchState: FontSwatchState = {
    color: "#000000",
    backgroundColor: "#ffffff",
    normalTextPassAA: true,
    normalTextPassAAA: true,
    largeTextPassAA: true,
    largeTextPassAAA: true,
    darkModeEnabled: false,
    darkBackgroundColor: "#000000",
    normalDarkTextPassAA: true,
    normalDarkTextPassAAA: false,
    largeDarkTextPassAA: false,
    largeDarkTextPassAAA: false,
}

type FontSwatchProps = {
    swatch: FontSwatchState
}

function FontSwatch({ swatch }: FontSwatchProps) {
    const [sampleText, setSampleText] = useState(
        () => textBank[Math.floor(Math.random() * textBank.length)]
    )

    function onSampleTextInput(event: FormEvent<HTMLSpanElement>): void {
        const nextValue = event.currentTarget.textContent?.slice(0, 60) ?? ""

        if (event.currentTarget.textContent !== nextValue) {
            event.currentTarget.textContent = nextValue
        }

        setSampleText(nextValue)
    }

    const sampleStyle = swatch.darkModeEnabled
        ? {
              color: swatch.color,
              background: `linear-gradient(to right, ${swatch.backgroundColor} 0 50%, ${swatch.darkBackgroundColor} 50% 100%)`,
          }
        : {
              color: swatch.color,
              backgroundColor: swatch.backgroundColor,
          }

    return (
        <div className="fontSwatch">
            <article id="maincontent">
                <div id="resultsContainer">
                    {/* <div id="ratioContainer" className="pass">
                        <span>
                            Contrast Ratio
                            <span
                                id="ratio"
                                aria-live="polite"
                                aria-atomic="false"
                            >
                                <b>8.59</b>:1
                            </span>
                        </span>
                        <a
                            id="permalink"
                            className="permalink"
                            href="./?fcolor=0000FF&amp;bcolor=FFFFFF"
                        >
                            permalink
                        </a>
                    </div> */}
                    <h2>Normal Text</h2>
                    <div className="results">
                        <p>
                            WCAG AA:{" "}
                            <span className="resultBadges">
                                <PassFail
                                    id="normalAA"
                                    pass={swatch.normalTextPassAA}
                                />
                                {swatch.darkModeEnabled && (
                                    <PassFail
                                        id="normalDarkAA"
                                        pass={swatch.normalDarkTextPassAA}
                                    />
                                )}
                            </span>
                        </p>
                        <p>
                            WCAG AAA:{" "}
                            <span className="resultBadges">
                                <PassFail
                                    id="normalAAA"
                                    pass={swatch.normalTextPassAAA}
                                />
                                {swatch.darkModeEnabled && (
                                    <PassFail
                                        id="normalDarkAAA"
                                        pass={swatch.normalDarkTextPassAAA}
                                    />
                                )}
                            </span>
                        </p>
                    </div>
                    <span
                        id="normal"
                        style={sampleStyle}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={onSampleTextInput}
                    >
                        {sampleText}
                    </span>
                    <h2>Large Text</h2>
                    <div className="results">
                        <p>
                            WCAG AA:{" "}
                            <span className="resultBadges">
                                <PassFail
                                    id="bigAA"
                                    pass={swatch.largeTextPassAA}
                                />
                                {swatch.darkModeEnabled && (
                                    <PassFail
                                        id="largeDarkAA"
                                        pass={swatch.largeDarkTextPassAA}
                                    />
                                )}
                            </span>
                        </p>
                        <p>
                            WCAG AAA:{" "}
                            <span className="resultBadges">
                                <PassFail
                                    id="bigAAA"
                                    pass={swatch.largeTextPassAAA}
                                />
                                {swatch.darkModeEnabled && (
                                    <PassFail
                                        id="largeDarkAAA"
                                        pass={swatch.largeDarkTextPassAAA}
                                    />
                                )}
                            </span>
                        </p>
                    </div>
                    <span
                        id="big"
                        style={sampleStyle}
                        contentEditable
                        suppressContentEditableWarning
                        onInput={onSampleTextInput}
                    >
                        {sampleText}
                    </span>
                    {/* <h2>Graphical Objects and User Interface Components</h2>
                    <div className="results">
                        <p>
                            WCAG AA: &nbsp;
                            <span id="uiAA" className="pass">
                                Pass
                            </span>
                        </p>
                    </div>
                    <span id="ui" style={sampleStyle}>
                        ★
                        <input
                            type="text"
                            id="uibox"
                            value="Text Input"
                            readOnly
                            aria-label="Sample text input"
                            style={inputStyle}
                        />{" "}
                    </span> */}
                </div>
            </article>
        </div>
    )
}

export default FontSwatch
