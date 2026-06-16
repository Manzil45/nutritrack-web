import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import AppLayout from './layouts/AppLayout';
import DashboardLayout from './layouts/DashboardLayout';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Dashboard from './pages/Dashboard';
import Chat from './pages/Chat';
import Meals from './pages/Meals';
// === FITUR MEAL REMINDER - START ===
import MealReminderPage from './pages/MealReminderPage';
// === FITUR MEAL REMINDER - END ===
import Profile from './pages/Profile';

function App() {
  return (
    <Router>
      <Routes>
        {/* Unauthenticated / Main Layout */}
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Landing />} />
        </Route>

        {/* Auth Pages (No Layout) */}
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Dashboard Pages */}
        <Route element={<DashboardLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/meals" element={<Meals />} />
          {/* === FITUR MEAL REMINDER - START === */}
          <Route path="/meal-reminder" element={<MealReminderPage />} />
          {/* === FITUR MEAL REMINDER - END === */}
          <Route path="/profile" element={<Profile />} />
        </Route>
      </Routes>
    </Router>
  );
}

export default App;
