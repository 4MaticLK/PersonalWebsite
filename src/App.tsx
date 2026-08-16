import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProjectPage } from './pages/ProjectPage';
import { PortfolioPage } from './pages/PortfolioPage';
import { NotFoundPage } from './pages/NotFoundPage';

function App() {
  return (
    <>
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>
      <Routes>
        <Route path="/" element={<Layout />} />
        <Route path="/portfolio" element={<PortfolioPage />} />
        <Route path="/work/:slug" element={<ProjectPage />} />
        <Route path="*" element={<NotFoundPage />} />
      </Routes>
    </>
  );
}

export default App;
