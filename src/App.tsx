import { Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ProjectPage } from './pages/ProjectPage';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Layout />} />
      <Route path="/work/:slug" element={<ProjectPage />} />
    </Routes>
  );
}

export default App;
