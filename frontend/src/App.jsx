import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Sidebar from './components/Sidebar';
import Articulos from './pages/Articulos';
import Salidas from './pages/Salidas'; // <-- Agrega esta línea

function App() {
  return (
    <Router>
      <div className="flex h-screen bg-gray-100 font-sans">
        
        {/* El Menú Lateral siempre es visible */}
        <Sidebar />

        {/* El Contenedor Dinámico cambia según la ruta de la URL */}
        <Routes>
          <Route path="/" element={<Articulos />} />
          <Route path="/entradas" element={<div className="flex-1 p-8 text-2xl text-gray-500">Módulo de Entradas (En construcción)</div>} />
          {/* Reemplaza la línea vieja por esta: */}
          <Route path="/salidas" element={<Salidas />} />
          <Route path="/cargos" element={<div className="flex-1 p-8 text-2xl text-gray-500">Módulo de Cargos Pendientes (En construcción)</div>} />
        </Routes>

      </div>
    </Router>
  );
}

export default App;