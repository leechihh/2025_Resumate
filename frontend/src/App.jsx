// src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './Layout';
import Dashboard from './pages/Dashboard';
import JobDetail from './pages/JobDetail';
import JobEdit from './pages/JobEdit';
import EmailCenter from './pages/EmailCenter';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="jobs/:jobId" element={<JobDetail />} />
          <Route path="jobs/:jobId/edit" element={<JobEdit />} />
          <Route path="email" element={<EmailCenter />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;