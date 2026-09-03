import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import LoginPage from './pages/LoginPage';
import KitchenView from './pages/KitchenView';
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
    if (user.role === 'EMPLOYEE') return <Navigate to="/employee" />;
    if (user.role === 'SUPER_ADMIN') return <Navigate to="/admin" />;
    if (user.role === 'RESTAURANT_MANAGER') return <Navigate to="/restaurant" />;
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
      {/* Public route — no login required */}
      <Route path="/kitchen/:restaurantId" element={<KitchenView />} />

      <Route path="/login" element={user ? (
        user.role === 'EMPLOYEE' ? <Navigate to="/employee" /> :
        user.role === 'SUPER_ADMIN' ? <Navigate to="/admin" /> :
        user.role === 'RESTAURANT_MANAGER' ? <Navigate to="/restaurant" /> :
        <Navigate to="/login" />
      ) : <LoginPage />} />

      <Route path="/employee" element={
        <ProtectedRoute allowedRoles={['EMPLOYEE']}>
          <EmployeeLayout />
        </ProtectedRoute>
      }>
        <Route index element={<EmployeeDashboard />} />
        <Route path="history" element={<EmployeeHistory />} />
      </Route>

      <Route path="/admin" element={
        <ProtectedRoute allowedRoles={['SUPER_ADMIN']}>
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
        <ProtectedRoute allowedRoles={['RESTAURANT_MANAGER']}>
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
