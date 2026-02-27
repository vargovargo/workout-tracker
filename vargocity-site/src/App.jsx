import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import SiteNav from './components/layout/SiteNav'
import Footer from './components/layout/Footer'
import HomePage from './pages/HomePage'
import AboutPage from './pages/AboutPage'
import ResearchPage from './pages/ResearchPage'
import MakingPage from './pages/MakingPage'
import AdventuresPage from './pages/AdventuresPage'
import WritingPage from './pages/WritingPage'

export default function App() {
  return (
    <BrowserRouter>
      <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', backgroundColor: '#FAFAF8' }}>
        <SiteNav />
        <main style={{ flex: 1 }}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/research" element={<ResearchPage />} />
            <Route path="/making" element={<MakingPage />} />
            <Route path="/adventures" element={<AdventuresPage />} />
            <Route path="/writing/*" element={<WritingPage />} />
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </BrowserRouter>
  )
}
