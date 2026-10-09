import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-[#0f0f14]">
      {/* Sidebar */}
      <div className="w-64 bg-[#1a1a22] border-r border-[#2a2a32] p-6">
        <h2 className="text-xl font-bold text-white mb-8">Painel</h2>

        <nav className="space-y-2">
          <a href="/" className="block px-4 py-2 text-[#a0a0b0] hover:text-white rounded">Dashboard</a>
          <a href="/campanhas" className="block px-4 py-2 text-[#a0a0b0] hover:text-white rounded">Campanhas</a>
          <a href="/logs" className="block px-4 py-2 text-[#a0a0b0] hover:text-white rounded">Logs</a>
        </nav>
      </div>

      {/* Main */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="h-16 bg-[#1a1a22] border-b border-[#2a2a32] flex items-center justify-between px-8">
          <h1 className="text-xl font-bold text-white">Dashboard</h1>

          <div className="flex items-center space-x-4">
            <span className="text-[#a0a0b0]">{user?.name}</span>
            <button onClick={handleLogout} className="px-4 py-2 bg-[#ef4444] text-white rounded">
              Sair
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-8">
          {children}
        </div>
      </div>
    </div>
  );
}
