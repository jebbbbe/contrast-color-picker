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
                    <span
                        className="headerIcon"
                        aria-hidden="true"
                        style={{ maskImage: 'url("/description.svg")' }}
                    />
                </a>
                <a
                    href="https://github.com/jebbbbe/contrast-color-picker"
                    target="_blank"
                    rel="noopener noreferrer"
                    aria-label="View source code"
                    title="View source code"
                >
                    <span
                        className="headerIcon"
                        aria-hidden="true"
                        style={{ maskImage: 'url("/code.svg")' }}
                    />
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
                    <span
                        className="headerIcon"
                        aria-hidden="true"
                        style={{ maskImage: 'url("/settings.svg")' }}
                    />
                </button>
            </nav>
        </header>
    )
}

export default Header
