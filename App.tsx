import React from 'react';
import AdminDashboard from './components/AdminDashboard';

const App: React.FC = () => {
  return (
    <div className="min-h-screen bg-black text-white font-sans selection:bg-emerald-500 selection:text-black">
      <AdminDashboard onBack={() => {}} />
    </div>
  );
};

export default App;
