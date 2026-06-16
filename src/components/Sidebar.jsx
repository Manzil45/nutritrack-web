import { Link, useLocation, useNavigate } from 'react-router-dom';

export default function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { path: '/dashboard', label: 'Home', icon: 'home' },
    { path: '/chat', label: 'Chat', icon: 'chat' },
    { path: '/meals', label: 'Saved Meals', icon: 'restaurant_menu' },
    // === FITUR MEAL REMINDER - START ===
    // Menu baru untuk membuka halaman alarm makan.
    { path: '/meal-reminder', label: 'Meals Reminder', icon: 'notifications' },
    // === FITUR MEAL REMINDER - END ===
    { path: '/profile', label: 'Profile', icon: 'person' },
  ];

  return (
    <>
      {/* Desktop Sidebar */}
      <aside className="hidden md:flex flex-col h-screen w-64 border-r-0 bg-slate-50 sticky top-0 py-8 px-4 font-headline text-sm font-medium">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="w-10 h-10 rounded-xl bg-primary-container flex items-center justify-center text-white">
            <span className="material-symbols-outlined">restaurant</span>
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 leading-tight">NutriTrack</h1>
            <p className="text-[10px] uppercase tracking-widest text-slate-500">AI Nutrition</p>
          </div>
        </div>

        <nav className="flex-1 space-y-2">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-all active:scale-[0.98] ${isActive
                  ? 'text-green-600 bg-white shadow-sm'
                  : 'text-slate-500 hover:bg-slate-100'
                  }`}
              >
                <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                  {item.icon}
                </span>
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="mt-auto space-y-4 px-2">
          <button onClick={() => navigate('/chat')} className="w-full py-3 bg-gradient-to-tr from-primary to-primary-container text-white rounded-full font-bold shadow-lg shadow-green-200/50 hover:scale-[1.02] active:scale-[0.95] transition-all">
            Log Meal
          </button>
          <a onClick={() => navigate('/profile')} className="flex items-center gap-3 px-4 py-3 text-slate-500 hover:bg-slate-100 rounded-xl transition-all cursor-pointer">
            <span className="material-symbols-outlined">settings</span>
            <span>Settings</span>
          </a>
        </div>
      </aside>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full h-20 bg-white/70 backdrop-blur-2xl flex justify-around items-center px-4 pb-safe z-50 rounded-t-[2rem] shadow-[0_-10px_30px_rgba(0,0,0,0.03)] border-t border-slate-100">
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center px-5 py-2 active:scale-90 transition-all duration-300 ease-out ${isActive ? 'bg-green-500/10 text-green-600 rounded-2xl' : 'text-slate-400'
                }`}
            >
              <span className="material-symbols-outlined" style={isActive ? { fontVariationSettings: "'FILL' 1" } : {}}>
                {item.icon}
              </span>
              <span className="font-body text-[10px] font-medium tracking-wide mt-1">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
