import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
// 1. Aquí importamos el componente real que acabas de crear
import VistaCategoria from './components/VistaCategoria';

// Dejamos solo el placeholder del Dashboard por ahora
const Dashboard = () => <div className="p-8"><h2 className="text-2xl font-bold">Dashboard de Resumen</h2></div>;

export default function App() {
  return (
    <Router>
      <div className="flex min-h-screen bg-slate-100">
        {/* Menú fijo a la izquierda */}
        <Sidebar />
        
        {/* Contenedor principal a la derecha */}
        <div className="flex-1 ml-64">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            {/* 2. Ahora sí está usando tu componente real */}
            <Route path="/categoria/:categoriaId" element={<VistaCategoria />} />
          </Routes>
        </div>
      </div>
    </Router>
  );
}