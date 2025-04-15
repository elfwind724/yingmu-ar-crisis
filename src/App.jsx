import './App.css'
import Game from './game/Game'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>AI Survivor</h1>
        <p>Inspired by Vampire Survivors</p>
      </header>
      <main>
        <Game />
      </main>
      <footer>
        <p>Use arrow keys to move. Survive and reach the 33rd floor!</p>
      </footer>
    </div>
  )
}

export default App
