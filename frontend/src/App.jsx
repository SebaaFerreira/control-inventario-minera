import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import VistaCategoria from './components/VistaCategoria';
import Salidas from './pages/Salidas';
import Historial from './pages/Historial';
import Dashboard from './pages/Dashboard';
import Trabajadores from './pages/Trabajadores';
// Importación del nuevo Buscador Data Table
import Buscador from './pages/Buscador';

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
        
        <div className="flex-1 ml-64">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            
            {/* NUEVA RUTA PARA EL BUSCADOR */}
            <Route path="/buscador" element={<Buscador />} />
            
            <Route path="/categoria/:categoriaId" element={<VistaCategoria />} />
            <Route path="/salidas" element={<Salidas />} />
            <Route path="/historial" element={<Historial />} />
            <Route path="/trabajadores" element={<Trabajadores />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}