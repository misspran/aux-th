import { Routes, Route } from 'react-router-dom'
import { Login } from './components/Login'
import { Board } from './components/Board'

function App() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/board" element={<Board />} />
    </Routes>
  )
}

export default App
