import './index.css'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from '@/pages/Home'
import HowToUse from '@/pages/HowToUse'
import Navbar from './components/navbar'
import Loopy from './pages/Loopy'

function App() {
  return (
    <div className="flex flex-col w-screen h-screen bg-background text-foreground font-sans">
      <BrowserRouter>
        <Navbar />
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/how-to-use" element={<HowToUse />} />
          <Route path="/loop-lab" element={<Loopy />} />
        </Routes>
      </BrowserRouter>
    </div>
  )
}

export default App
