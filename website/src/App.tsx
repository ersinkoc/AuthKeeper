import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from './components/theme-provider'
import { Navigation } from './components/layout/Navigation'
import { Footer } from './components/layout/Footer'
import { Home } from './pages/Home'
import { Docs } from './pages/Docs'
import { API } from './pages/API'
import { Examples } from './pages/Examples'
import { Playground } from './pages/Playground'

function App() {
  return (
    <ThemeProvider defaultTheme="dark" storageKey="authkeeper-theme">
      <BrowserRouter>
        <div className="flex min-h-screen flex-col">
          <Navigation />
          <main className="flex-1">
            <Routes>
              <Route path="/" element={<Home />} />
              <Route path="/docs" element={<Docs />} />
              <Route path="/api" element={<API />} />
              <Route path="/examples" element={<Examples />} />
              <Route path="/playground" element={<Playground />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
