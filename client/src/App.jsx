import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import ProtectedRoute from './routes/ProtectedRoute';
import ProtectedLayout from './components/ProtectedLayout';
import { ROUTES } from './constants/Routes';
import { PERMISSIONS } from './constants/Permissions';

// Direct Static Imports for Instant 0ms Page Navigation (No Lazy Spinners)
import Login from './pages/Login/Login';
import Dashboard from './pages/Dashboard/Dashboard';
import Modules from './pages/Modules/Modules';
import Settings from './pages/Settings/Settings';
import Attendance from './Modules/Attendance/pages/Attendance';
import FeesManagement from './Modules/FeesManagement/pages/FeesManagement';
import LeadDashboard from './Modules/LeadManagement/pages/LeadDashboard';
import CertificateManagement from './Modules/CertificateManagement/pages/CertificateManagement';
import VerifyCertificate from './pages/CertificateVerification/VerifyCertificate';
import Unauthorized from './pages/Unauthorized';
import Notifications from './pages/Notifications/Notifications';

// Employee Attendance Standalone Pages
import EmployeeSplash from './pages/EmployeeAttendance/EmployeeSplash';
import EmployeeLogin from './pages/EmployeeAttendance/EmployeeLogin';
import EmployeeRegister from './pages/EmployeeAttendance/EmployeeRegister';
import EmployeeDashboard from './pages/EmployeeAttendance/EmployeeDashboard';

function App() {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path={ROUTES.LOGIN} element={<Login />} />
      <Route path={ROUTES.VERIFY_CERTIFICATE} element={<VerifyCertificate />} />

      {/* Employee Attendance Standalone Routes */}
      <Route path={ROUTES.EMPLOYEE_SPLASH} element={<EmployeeSplash />} />
      <Route path="/employee/" element={<EmployeeSplash />} />
      <Route path={ROUTES.EMPLOYEE_LOGIN} element={<EmployeeLogin />} />
      <Route path="/employee/login/" element={<EmployeeLogin />} />
      <Route path={ROUTES.EMPLOYEE_REGISTER} element={<EmployeeRegister />} />
      <Route path="/employee/register/" element={<EmployeeRegister />} />
      <Route path={ROUTES.EMPLOYEE_DASHBOARD} element={<EmployeeDashboard />} />
      <Route path="/employee/dashboard/" element={<EmployeeDashboard />} />

      {/* Core Navigation Routes */}
      <Route
        path={ROUTES.DASHBOARD}
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <Dashboard />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.MODULES}
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <Modules />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.SETTINGS}
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <Settings />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.NOTIFICATIONS}
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <Notifications />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      {/* Module Routes — permission-gated */}
      <Route
        path={ROUTES.ATTENDANCE}
        element={
          <ProtectedRoute requiredPermission={PERMISSIONS.ACCESS_ATTENDANCE}>
            <ProtectedLayout>
              <Attendance />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      <Route
        path={ROUTES.FEES_MANAGEMENT}
        element={
          <ProtectedRoute requiredPermission={PERMISSIONS.ACCESS_FEES}>
            <ProtectedLayout>
              <FeesManagement />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      {/* Short route alias for fees */}
      <Route path="/fees" element={<Navigate to={ROUTES.FEES_MANAGEMENT} replace />} />

      <Route
        path={ROUTES.LEAD_MANAGEMENT}
        element={
          <ProtectedRoute requiredPermission={PERMISSIONS.ACCESS_LEADS}>
            <ProtectedLayout>
              <LeadDashboard />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      {/* Short route alias for leads */}
      <Route path="/leads" element={<Navigate to={ROUTES.LEAD_MANAGEMENT} replace />} />

      <Route
        path={ROUTES.CERTIFICATE_MANAGEMENT}
        element={
          <ProtectedRoute requiredPermission={PERMISSIONS.ACCESS_CERTIFICATES}>
            <ProtectedLayout>
              <CertificateManagement />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />
      {/* Short route alias for certificates */}
      <Route path="/certificates" element={<Navigate to={ROUTES.CERTIFICATE_MANAGEMENT} replace />} />

      <Route
        path={ROUTES.UNAUTHORIZED}
        element={
          <ProtectedRoute>
            <ProtectedLayout>
              <Unauthorized />
            </ProtectedLayout>
          </ProtectedRoute>
        }
      />

      {/* Default Redirections */}
      <Route path="/" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}

export default App;
