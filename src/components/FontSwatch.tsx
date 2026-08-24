import "./FontSwatch.css"
import { useState } from "react"

const textBank = [
    "The five boxing wizards jump quickly.",
    "Quick zephyrs blow, vexing daft Jim.",
    "The quick brown fox jumps over the lazy dog.",
    "b, c, f, g, h, i, j, k, m, o, p, q, u, v, w, x, y, and z are letters.",
]

function FontSwatch() {
    const sampleText = textBank[0]

    const [swatch, setSwatch] = useState({
        color: "#0000ff",
        backgroundColor: "#ffffff",

        normalTextPassAA: true,
        normalTextPassAAA: false,

        largeTextPassAA: true,
        largeTextPassAAA: false,

        darkModeEnabled: false,
        darkBackgroundColor: "#000000",
    })

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
                            <span
                                id="normalAA"
                                className={
                                    swatch.normalTextPassAA ? "pass" : "fail"
                                }
                            >
                                {swatch.normalTextPassAA ? "Pass" : "Fail"}
                            </span>
                        </p>
                        <p>
                            WCAG AAA:{" "}
                            <span
                                id="normalAAA"
                                className={
                                    swatch.normalTextPassAAA ? "pass" : "fail"
                                }
                            >
                                {swatch.normalTextPassAAA ? "Pass" : "Fail"}
                            </span>
                        </p>
                    </div>
                    <span
                        id="normal"
                        style={{
                            color: swatch.color,
                            backgroundColor: swatch.backgroundColor,
                        }}
                    >
                        {sampleText}
                    </span>
                    <h2>Large Text</h2>
                    <div className="results">
                        <p>
                            WCAG AA:{" "}
                            <span
                                id="bigAA"
                                className={
                                    swatch.largeTextPassAA ? "pass" : "fail"
                                }
                            >
                                {swatch.largeTextPassAA ? "Pass" : "Fail"}
                            </span>
                        </p>
                        <p>
                            WCAG AAA:{" "}
                            <span
                                id="bigAAA"
                                className={
                                    swatch.largeTextPassAAA ? "pass" : "fail"
                                }
                            >
                                {swatch.largeTextPassAAA ? "Pass" : "Fail"}
                            </span>
                        </p>
                    </div>
                    <span
                        id="big"
                        style={{
                            color: swatch.color,
                            backgroundColor: swatch.backgroundColor,
                        }}
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
