import { useEffect, useRef, useState } from "react"
import ThreeSceneApp from "./App/main"
import FontSwatch, {
    initialFontSwatchState,
    type FontSwatchState,
} from "./components/FontSwatch"
import Footer from "./components/Footer"
import Header from "./components/Header"

function App() {
    const threeSceneMountRef = useRef<HTMLDivElement | null>(null)
    const [swatch, setSwatch] = useState<FontSwatchState>(
        initialFontSwatchState
    )

    useEffect(() => {
        if (!threeSceneMountRef.current) {
            return
        }

        const app = new ThreeSceneApp(threeSceneMountRef.current, {
            setSwatch: setSwatch,
        })
        app.animate()
        ;(globalThis as any).app = app

        return () => {
            app.dispose()
        }
    }, [])

    return (
        <main>
            <Header />
            <article className="content">
                <div className="container">
                    <div className="app-holder">
                        <div id="app" ref={threeSceneMountRef} />
                    </div>
                </div>
                <div className="container">
                    <FontSwatch swatch={swatch} />
                </div>
            </article>
            <Footer />
        </main>
    )
}

export default App
