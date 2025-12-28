import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { ThemeProvider } from '@/components/shared/ThemeProvider'
import { Layout } from '@/components/layout/Layout'
import { Home } from '@/pages/Home'
import { Docs } from '@/pages/Docs'
import { API } from '@/pages/API'
import { Examples } from '@/pages/Examples'
import { Playground } from '@/pages/Playground'

function App() {
  return (
    <ThemeProvider>
      <BrowserRouter>
        <Layout>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/docs" element={<Docs />} />
            <Route path="/docs/api" element={<API />} />
            <Route path="/examples" element={<Examples />} />
            <Route path="/playground" element={<Playground />} />
            <Route path="*" element={<Home />} />
          </Routes>
        </Layout>
      </BrowserRouter>
    </ThemeProvider>
  )
}

export default App
