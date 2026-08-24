import "./FontSwatch.css"

const textBank = [
    "The five boxing wizards jump quickly.",
    "Quick zephyrs blow, vexing daft Jim.",
    "The quick brown fox jumps over the lazy dog.",
    "b, c, f, g, h, i, j, k, m, o, p, q, u, v, w, x, y, and z are letters.",
]

const sampleStyle = {
    color: "rgb(0, 0, 255)",
    backgroundColor: "rgb(255, 255, 255)",
}

const inputStyle = {
    borderColor: "rgb(0, 0, 255)",
}

function FontSwatch() {
    const sampleText = textBank[0]

    return (
        <>
            <main id="maincontainer" className="clearfix"></main>

            <article id="maincontent">
                <div id="resultsContainer">
                    <div id="ratioContainer" className="pass">
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
                    </div>
                    <h2>Normal Text</h2>
                    <div className="results">
                        <p>
                            WCAG AA:{" "}
                            <span id="normalAA" className="pass">
                                Pass
                            </span>
                        </p>
                        <p>
                            WCAG AAA:{" "}
                            <span id="normalAAA" className="pass">
                                Pass
                            </span>
                        </p>
                    </div>
                    <span
                        id="normal"
                        style={sampleStyle}
                    >
                        {sampleText}
                    </span>
                    <h2>Large Text</h2>
                    <div className="results">
                        <p>
                            WCAG AA:{" "}
                            <span id="bigAA" className="pass">
                                Pass
                            </span>
                        </p>
                        <p>
                            WCAG AAA:{" "}
                            <span id="bigAAA" className="pass">
                                Pass
                            </span>
                        </p>
                    </div>
                    <span
                        id="big"
                        style={sampleStyle}
                    >
                        {sampleText}
                    </span>
                    <h2>Graphical Objects and User Interface Components</h2>
                    <div className="results">
                        <p>
                            WCAG AA: &nbsp;
                            <span id="uiAA" className="pass">
                                Pass
                            </span>
                        </p>
                    </div>
                    <span
                        id="ui"
                        style={sampleStyle}
                    >
                        ★
                        <input
                            type="text"
                            id="uibox"
                            value="Text Input"
                            readOnly
                            aria-label="Sample text input"
                            style={inputStyle}
                        />{" "}
                    </span>
                </div>
            </article>
        </>
    )
}

export default FontSwatch
