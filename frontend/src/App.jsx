import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import VistaCategoria from './components/VistaCategoria';
import Salidas from './pages/Salidas';
import Historial from './pages/Historial';
import Dashboard from './pages/Dashboard';
import Trabajadores from './pages/Trabajadores';
import Buscador from './pages/Buscador';
import Configuracion from './pages/Configuracion';
import CargosActivos from './pages/CargosActivos';

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-100">
        <Sidebar />
        
        <div className="flex-1 ml-64">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/buscador" element={<Buscador />} />
            <Route path="/categoria/:categoriaId" element={<VistaCategoria />} />
            <Route path="/salidas" element={<Salidas />} />
            <Route path="/historial" element={<Historial />} />
            <Route path="/trabajadores" element={<Trabajadores />} />
            <Route path="/cargos" element={<CargosActivos />} />
            <Route path="/configuracion" element={<Configuracion />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}