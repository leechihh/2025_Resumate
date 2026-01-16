// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import JobDetail from './pages/JobDetail'; // 暫時還是空的

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="jobs/:jobId" element={<JobDetail />} />
          <Route path="email" element={<div className="text-center py-20">信件中心開發中...</div>} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;