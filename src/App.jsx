import './App.css'
import Game from './game/Game'

function App() {
  return (
    <div className="app">
      <header className="app-header">
        <h1>影目AR危机</h1>
        <p>作者：冯老师</p>
      </header>
      <main>
        <Game />
      </main>
      <footer>
        <p>使用方向键移动。生存下来并到达33层！</p>
      </footer>
    </div>
  )
}

export default App
