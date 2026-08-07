import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, Search, HardHat, Nut, Droplet, 
  FlaskConical, Wrench, Zap, ClipboardList, Users, Settings, UserCheck, History
} from 'lucide-react';

export default function Sidebar() {
  const location = useLocation();

  const menuItems = [
    { name: 'Resumen', path: '/', icon: <LayoutDashboard size={20} /> },
    { name: 'Buscador Global', path: '/buscador', icon: <Search size={20} /> },
    { name: 'Historial y Devoluciones', path: '/historial', icon: <History size={20} /> },
    { name: 'Ficha de Cargos', path: '/cargos', icon: <UserCheck size={20} /> },
    { name: 'EPP', path: '/categoria/epp', icon: <HardHat size={20} /> },
    { name: 'Fijaciones y Sujeciones', path: '/categoria/fijaciones', icon: <Nut size={20} /> },
    { name: 'Tuberías y Fitting', path: '/categoria/tuberias', icon: <Droplet size={20} /> },
    { name: 'Sustancias Peligrosas', path: '/categoria/sustancias', icon: <FlaskConical size={20} /> },
    { name: 'Herramientas Manuales', path: '/categoria/manuales', icon: <Wrench size={20} /> },
    { name: 'Herramientas Eléctricas', path: '/categoria/electricas', icon: <Zap size={20} /> },
    { name: 'Personal / Operarios', path: '/trabajadores', icon: <Users size={20} /> },
    { name: 'Reportes y Config', path: '/configuracion', icon: <Settings size={20} /> },
  ];

  return (
    <div className="w-64 h-screen bg-slate-800 text-white flex flex-col fixed left-0 top-0">
      <div className="p-4 bg-slate-900 border-b border-slate-700">
        <h1 className="text-xl font-bold text-amber-400">Bodega Promet</h1>
        <p className="text-xs text-slate-400">Control de Inventario</p>
      </div>
      
      <nav className="flex-1 py-4 overflow-y-auto">
        <ul className="space-y-1 px-2">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <li key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center gap-3 px-3 py-2 rounded-md transition-colors ${
                    isActive 
                      ? 'bg-amber-500 text-slate-900 font-semibold' 
                      : 'hover:bg-slate-700 text-slate-300'
                  }`}
                >
                  {item.icon}
                  <span className="text-sm">{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-slate-700 text-xs text-slate-400 text-center">
        Usuario: Admin Pañol
      </div>
    </div>
  );
}