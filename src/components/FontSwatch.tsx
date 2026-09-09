import { memo, useRef, useState, type FormEvent } from "react"
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
    contrastRatio: string
    contrastRatioPass: boolean
    normalTextPassAA: boolean
    normalTextPassAAA: boolean
    largeTextPassAA: boolean
    largeTextPassAAA: boolean
    darkModeEnabled: boolean
    contrastRatioDark: string
    contrastRatioDarkPass: boolean
    darkBackgroundColor: string
    normalDarkTextPassAA: boolean
    normalDarkTextPassAAA: boolean
    largeDarkTextPassAA: boolean
    largeDarkTextPassAAA: boolean
}

export const initialFontSwatchState: FontSwatchState = {
    color: "#000000",
    backgroundColor: "#ffffff",
    contrastRatio: "21",
    contrastRatioPass: true,
    normalTextPassAA: true,
    normalTextPassAAA: true,
    largeTextPassAA: true,
    largeTextPassAAA: true,
    darkModeEnabled: false,
    contrastRatioDark: "1",
    contrastRatioDarkPass: false,
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
    const [initialSampleText] = useState(
        () => textBank[Math.floor(Math.random() * textBank.length)]
    )
    const normalSampleRef = useRef<HTMLSpanElement>(null)
    const largeSampleRef = useRef<HTMLSpanElement>(null)

    function onSampleTextInput(event: FormEvent<HTMLSpanElement>): void {
        const nextValue = event.currentTarget.textContent?.slice(0, 60) ?? ""

        if (event.currentTarget.textContent !== nextValue) {
            event.currentTarget.textContent = nextValue
        }

        const otherSample =
            event.currentTarget === normalSampleRef.current
                ? largeSampleRef.current
                : normalSampleRef.current

        if (otherSample) {
            otherSample.textContent = nextValue
        }
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
            <article>
                <div className="resultsContainer">
                    <div className="ratioContainer">
                        <span
                            className={
                                swatch.contrastRatioPass ? "pass" : "fail"
                            }
                        >
                            Contrast Ratio
                            <span
                                className="ratio"
                                aria-live="polite"
                                aria-atomic="false"
                            >
                                <b>{swatch.contrastRatio}</b>:1
                            </span>
                        </span>
                        {swatch.darkModeEnabled && (
                            <span
                                className={
                                    swatch.contrastRatioDarkPass
                                        ? "pass"
                                        : "fail"
                                }
                            >
                                Dark Contrast Ratio
                                <span
                                    className="ratio"
                                    aria-live="polite"
                                    aria-atomic="false"
                                >
                                    <b>{swatch.contrastRatioDark}</b>:1
                                </span>
                            </span>
                        )}
                    </div>

                    <h2>WCAG Normal Text</h2>
                    <div className="results">
                        <p>
                            <span className="resultLabel">AA:</span>
                            <span className="resultBadges">
                                <PassFail pass={swatch.normalTextPassAA} />
                            </span>
                            {swatch.darkModeEnabled && (
                                <PassFail pass={swatch.normalDarkTextPassAA} />
                            )}
                        </p>
                        <p>
                            <span className="resultLabel">AAA:</span>
                            <span className="resultBadges">
                                <PassFail pass={swatch.normalTextPassAAA} />
                            </span>
                            {swatch.darkModeEnabled && (
                                <PassFail pass={swatch.normalDarkTextPassAAA} />
                            )}
                        </p>
                        <span
                            ref={normalSampleRef}
                            className="textSample"
                            style={sampleStyle}
                            contentEditable="plaintext-only"
                            spellCheck="false"
                            suppressContentEditableWarning
                            onInput={onSampleTextInput}
                        >
                            {initialSampleText}
                        </span>
                    </div>
                    <h2>WCAG Large Text</h2>
                    <div className="results">
                        <p>
                            <span className="resultLabel">AA:</span>
                            <span className="resultBadges">
                                <PassFail pass={swatch.largeTextPassAA} />
                            </span>
                            {swatch.darkModeEnabled && (
                                <PassFail pass={swatch.largeDarkTextPassAA} />
                            )}
                        </p>
                        <p>
                            <span className="resultLabel">AAA:</span>
                            <span className="resultBadges">
                                <PassFail pass={swatch.largeTextPassAAA} />
                            </span>
                            {swatch.darkModeEnabled && (
                                <PassFail pass={swatch.largeDarkTextPassAAA} />
                            )}
                        </p>
                        <span
                            ref={largeSampleRef}
                            className="textSample largeTextSample"
                            style={sampleStyle}
                            contentEditable="plaintext-only"
                            spellCheck="false"
                            suppressContentEditableWarning
                            onInput={onSampleTextInput}
                        >
                            {initialSampleText}
                        </span>
                    </div>
                </div>
            </article>
        </div>
    )
}

export default memo(FontSwatch)
