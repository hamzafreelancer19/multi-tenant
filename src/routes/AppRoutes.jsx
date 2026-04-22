import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import Students from "../pages/Students";
import Schools from "../pages/Schools";
import Users from "../pages/Users";
import Teachers from "../pages/Teachers";
import Attendance from "../pages/Attendance";
import Fees from "../pages/Fees";
import SystemExplorer from "../pages/SystemExplorer";
import Profile from "../pages/Profile";
import Subscription from "../pages/Subscription";
import Settings from "../pages/Settings";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

export default function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected Dashboard Routes (Wrapped in Layout) */}
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/dashboard" element={<Dashboard />} />
          <Route
            path="/schools"
            element={
              <RoleRoute allowedRoles={["superadmin"]}>
                <Schools />
              </RoleRoute>
            }
          />
          <Route
            path="/users"
            element={
              <RoleRoute allowedRoles={["superadmin"]}>
                <Users />
              </RoleRoute>
            }
          />
          <Route
            path="/students"
            element={
              <RoleRoute allowedRoles={["admin", "teacher"]}>
                <Students />
              </RoleRoute>
            }
          />
          <Route
            path="/teachers"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <Teachers />
              </RoleRoute>
            }
          />
          <Route
            path="/attendance"
            element={
              <RoleRoute allowedRoles={["admin", "teacher"]}>
                <Attendance />
              </RoleRoute>
            }
          />
          <Route
            path="/fees"
            element={
              <RoleRoute allowedRoles={["admin", "accountant"]}>
                <Fees />
              </RoleRoute>
            }
          />
          <Route
            path="/database"
            element={
              <RoleRoute allowedRoles={["superadmin"]}>
                <SystemExplorer />
              </RoleRoute>
            }
          />
          <Route path="/profile" element={<Profile />} />
          <Route path="/subscription" element={<Subscription />} />
          <Route path="/settings" element={<Settings />} />
        </Route>

        {/* Fallback to Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
