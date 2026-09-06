import "./Header.css"

type HeaderProps = {
    settingsOpen: boolean
    onToggleSettings: () => void
}

function Header({ settingsOpen, onToggleSettings }: HeaderProps) {
    return (
        <header className="app-header">
            <h1>Contrast Color Picker</h1>
            <nav aria-label="App links and settings">
                <a
                    href="https://jessebassett.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="Description"
                    title="Description"
                >
                    <img src="/description.svg" alt="" width="24" height="24" />
                </a>
                <a
                    href="https://github.com/jebbbbe/contrast-color-picker"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View source code"
                    title="View source code"
                >
                    <img src="/code.svg" alt="" width="24" height="24" />
                </a>
                <button
                    type="button"
                    aria-label={
                        settingsOpen ? "Close settings" : "Open settings"
                    }
                    title={settingsOpen ? "Close settings" : "Open settings"}
                    aria-expanded={settingsOpen}
                    aria-controls="scene-settings"
                    onClick={onToggleSettings}
                >
                    <img src="/settings.svg" alt="" width="24" height="24" />
                </button>
            </nav>
        </header>
    )
}

export default Header
