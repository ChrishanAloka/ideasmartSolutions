import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import Navigation from './components/Navigation';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import ProjectDetails from './pages/ProjectDetails';
import Invoice from './pages/Invoice';
import Quotation from './pages/Quotation';
import Proposal from './pages/Proposal';
import Tasks from './pages/Tasks';
import Subscriptions from './pages/Subscriptions';
import SubscriptionInvoice from './pages/SubscriptionInvoice';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user is logged in
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setLoading(false);
  }, []);

  const handleLogin = (userData) => {
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: '100vh' }}>
        <div className="spinner-border text-primary" role="status">
          <span className="visually-hidden">Loading...</span>
        </div>
      </div>
    );
  }

  return (
    <Router>
      {user && <Navigation user={user} onLogout={handleLogout} />}
      <Routes>
        <Route
          path="/login"
          element={user ? <Navigate to="/dashboard" /> : <Login onLogin={handleLogin} />}
        />
        <Route
          path="/register"
          element={user ? <Navigate to="/dashboard" /> : <Register onLogin={handleLogin} />}
        />
        <Route
          path="/dashboard"
          element={user ? <Dashboard user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/project/:id"
          element={user ? <ProjectDetails user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/invoice/:id"
          element={user ? <Invoice user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/quotation/:id"
          element={user ? <Quotation user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/proposal/:id"
          element={user ? <Proposal user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/tasks"
          element={user ? <Tasks user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/subscriptions"
          element={user ? <Subscriptions user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/subscription-invoice/:id"
          element={user ? <SubscriptionInvoice user={user} /> : <Navigate to="/login" />}
        />
        <Route
          path="/"
          element={<Navigate to={user ? "/dashboard" : "/login"} />}
        />
      </Routes>
    </Router>
  );
}

export default App;