import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import EmployeeLayout from './layouts/EmployeeLayout';
import AdminLayout from './layouts/AdminLayout';
import RestaurantLayout from './layouts/RestaurantLayout';
import EmployeeDashboard from './pages/employee/Dashboard';
import EmployeeHistory from './pages/employee/History';
import AdminDashboard from './pages/admin/Dashboard';
import AdminEmployees from './pages/admin/Employees';
import AdminAttendance from './pages/admin/Attendance';
import AdminSettings from './pages/admin/Settings';
import AdminReports from './pages/admin/Reports';
import RestaurantDashboard from './pages/restaurant/Dashboard';
import RestaurantRequirements from './pages/restaurant/Requirements';
import RestaurantHistory from './pages/restaurant/History';
import RestaurantReports from './pages/restaurant/Reports';

function ProtectedRoute({ children, allowedRoles }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="flex items-center justify-center h-screen"><div className="text-lg">Loading...</div></div>;
  if (!user) return <Navigate to="/login" />;
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    if (user.role === 'employee') return <Navigate to="/employee" />;
    if (user.role === 'admin') return <Navigate to="/admin" />;
    if (user.role === 'restaurant_owner') return <Navigate to="/restaurant" />;
  }
  return children;
}

export default function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return <div className="flex items-center justify-center h-screen"><div className="text-lg">Loading...</div></div>;
  }

  return (
    <Routes>
      <Route path="/login" element={user ? (
        user.role === 'employee' ? <Navigate to="/employee" /> :
        user.role === 'admin' ? <Navigate to="/admin" /> :
        <Navigate to="/restaurant" />
      ) : <LoginPage />} />

      <Route path="/employee" element={
        <ProtectedRoute allowedRoles={['employee']}>
          <EmployeeLayout />
        </ProtectedRoute>
      }>
        <Route index element={<EmployeeDashboard />} />
        <Route path="history" element={<EmployeeHistory />} />
      </Route>

      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['admin']}>
          <AdminLayout />
        </ProtectedRoute>
      }>
        <Route index element={<AdminDashboard />} />
        <Route path="employees" element={<AdminEmployees />} />
        <Route path="attendance" element={<AdminAttendance />} />
        <Route path="reports" element={<AdminReports />} />
        <Route path="settings" element={<AdminSettings />} />
      </Route>

      <Route path="/restaurant" element={
        <ProtectedRoute allowedRoles={['restaurant_owner']}>
          <RestaurantLayout />
        </ProtectedRoute>
      }>
        <Route index element={<RestaurantDashboard />} />
        <Route path="requirements" element={<RestaurantRequirements />} />
        <Route path="history" element={<RestaurantHistory />} />
        <Route path="reports" element={<RestaurantReports />} />
      </Route>

      <Route path="*" element={<Navigate to="/login" />} />
    </Routes>
  );
}
