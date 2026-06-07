import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="fixed top-0 w-full z-50 bg-white/70 backdrop-blur-xl font-headline antialiased shadow-sm">
      <div className="flex justify-between items-center px-6 h-16 w-full max-w-screen-2xl mx-auto">
        <div className="flex items-center gap-8">
          <Link to="/" className="text-2xl font-bold tracking-tight text-slate-900">
            NutriTrack
          </Link>
          <div className="hidden md:flex gap-6 items-center">
            {/* <Link to="/" className="text-green-600 font-semibold cursor-pointer active:scale-95 transition-transform duration-200">
              Home
            </Link>
            <a href="#features" className="text-slate-500 hover:scale-105 transition-transform duration-200 cursor-pointer active:scale-95">
              Features
            </a>
            <a href="#pricing" className="text-slate-500 hover:scale-105 transition-transform duration-200 cursor-pointer active:scale-95">
              Pricing
            </a> */}
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="hidden sm:flex items-center bg-slate-100 px-3 py-1.5 rounded-full gap-2 border-none">
            <span className="material-symbols-outlined text-slate-400 text-sm">search</span>
            <input 
              className="bg-transparent border-none focus:ring-0 text-sm p-0 w-24 lg:w-32 outline-none font-body" 
              placeholder="Search" 
              type="text" 
            />
          </div>
          
          <div className="flex items-center gap-4">
            <Link to="/login" className="text-secondary font-semibold hover:text-primary transition-colors">
              Log in
            </Link>
            <Link to="/signup" className="gradient-button px-5 py-2.5 rounded-full text-white font-bold text-sm shadow-md hover:scale-[1.03] active:scale-95 transition-all">
              Sign up
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}
