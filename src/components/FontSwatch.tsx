import "./FontSwatch.css"

const textBank = [
    "The five boxing wizards jump quickly.",
    "Quick zephyrs blow, vexing daft Jim.",
    "The quick brown fox jumps over the lazy dog.",
    "b, c, f, g, h, i, j, k, m, o, p, q, u, v, w, x, y, and z are letters.",
]
// const sampleText = textBank[0]
const sampleText = textBank[Math.floor(Math.random() * textBank.length)]

export type FontSwatchState = {
    color: string
    backgroundColor: string
    normalTextPassAA: boolean
    normalTextPassAAA: boolean
    largeTextPassAA: boolean
    largeTextPassAAA: boolean
    darkModeEnabled: boolean
    darkBackgroundColor: string
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
}

type FontSwatchProps = {
    swatch: FontSwatchState
}

function FontSwatch({ swatch }: FontSwatchProps) {
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
                    <span id="normal" style={sampleStyle}>
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
                    <span id="big" style={sampleStyle}>
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
