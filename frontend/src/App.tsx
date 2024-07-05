import './App.css'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { Landing } from './components/Landing'
import { Room } from './components/Room'

function App() {

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/room" element={<Room />} />
      </Routes>
    </BrowserRouter>

  )
}

export default App
