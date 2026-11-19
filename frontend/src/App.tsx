import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { AppLayout } from './components/layout/AppLayout';
import { ProtectedRoute } from './components/layout/ProtectedRoute';

// Pages
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { RoomGrid } from './pages/Rooms/RoomGrid';
import { RoomList } from './pages/Rooms/RoomList';
import { AllocationsList } from './pages/Allocations/AllocationsList';
import { StudentList } from './pages/Students/StudentList';
import { StudentAdmission } from './pages/Students/StudentAdmission';
import { StudentProfile } from './pages/Students/StudentProfile';
import { InvoicesList } from './pages/Fees/InvoicesList';
import { DefaultersList } from './pages/Fees/DefaultersList';
import { AttendanceRollCall } from './pages/Attendance/AttendanceRollCall';
import { LeavesList } from './pages/Leaves/LeavesList';
import { ComplaintsList } from './pages/Complaints/ComplaintsList';
import { GateTerminal } from './pages/Security/GateTerminal';
import { VisitorLog } from './pages/Security/VisitorLog';
import { MessMenuPage } from './pages/Mess/MessMenuPage';
import { NoticesPage } from './pages/Notices/NoticesPage';
import { ReportsPage } from './pages/Reports/ReportsPage';
import { SettingsPage } from './pages/Settings/SettingsPage';

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />

          {/* Protected Application Routes */}
          <Route
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Navigate to="/dashboard" replace />} />
            <Route path="dashboard" element={<Dashboard />} />

            {/* Accommodation */}
            <Route path="rooms/grid" element={<RoomGrid />} />
            <Route path="rooms/list" element={<RoomList />} />
            <Route
              path="allocations"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'WARDEN']}>
                  <AllocationsList />
                </ProtectedRoute>
              }
            />

            {/* Students */}
            <Route path="students" element={<StudentList />} />
            <Route
              path="students/admit"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'WARDEN']}>
                  <StudentAdmission />
                </ProtectedRoute>
              }
            />
            <Route path="students/:id" element={<StudentProfile />} />

            {/* Finance */}
            <Route path="fees/invoices" element={<InvoicesList />} />
            <Route
              path="fees/defaulters"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'WARDEN', 'ACCOUNTANT']}>
                  <DefaultersList />
                </ProtectedRoute>
              }
            />

            {/* Operations */}
            <Route
              path="attendance"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'WARDEN', 'SECURITY']}>
                  <AttendanceRollCall />
                </ProtectedRoute>
              }
            />
            <Route path="leaves" element={<LeavesList />} />
            <Route path="complaints" element={<ComplaintsList />} />
            <Route
              path="security/terminal"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'WARDEN', 'SECURITY']}>
                  <GateTerminal />
                </ProtectedRoute>
              }
            />
            <Route path="security/visitors" element={<VisitorLog />} />

            {/* Campus Life */}
            <Route path="mess" element={<MessMenuPage />} />
            <Route path="notices" element={<NoticesPage />} />

            {/* Management */}
            <Route
              path="reports"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'WARDEN', 'ACCOUNTANT']}>
                  <ReportsPage />
                </ProtectedRoute>
              }
            />
            <Route
              path="settings"
              element={
                <ProtectedRoute allowedRoles={['SUPER_ADMIN', 'WARDEN']}>
                  <SettingsPage />
                </ProtectedRoute>
              }
            />
          </Route>

          {/* Fallback */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
