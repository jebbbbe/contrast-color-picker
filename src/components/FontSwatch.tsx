const textBank = [
    "The five boxing wizards jump quickly.",
    "Quick zephyrs blow, vexing daft Jim.",
    "The quick brown fox jumps over the lazy dog.",
    "b, c, f, g, h, i, j, k, m, o, p, q, u, v, w, x, y, and z are letters.",
]

function FontSwatch() {
    const txt = textBank[Math.floor(Math.random() * textBank.length)]
    return (
        <>
            <span
                id="normal"
                style={{
                    color: "rgb(0, 0, 255)",
                    backgroundColor: "rgb(255, 255, 255)",
                }}
            >
                {txt}
            </span>

            <span
                id="big"
                style={{
                    color: "rgb(0, 0, 255)",
                    backgroundColor: "rgb(255, 255, 255)",
                    fontSize: "2rem",
                }}
            >
                {txt}
            </span>
        </>
    )
}

export default FontSwatch
