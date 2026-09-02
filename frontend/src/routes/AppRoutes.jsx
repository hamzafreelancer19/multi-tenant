import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import LandingPage from "../pages/LandingPage";
import Login from "../pages/Login";
import Signup from "../pages/Signup";
import Dashboard from "../pages/Dashboard";
import Students from "../pages/Students";
import Schools from "../pages/Schools";
import SchoolProfile from "../pages/SchoolProfile";
import Users from "../pages/Users";
import Teachers from "../pages/Teachers";
import TeacherPortal from "../pages/TeacherPortal";
import TeacherAdmissions from "../pages/TeacherAdmissions";
import ParentPortal from "../pages/ParentPortal";
import ParentProfile from "../pages/parent/ParentProfile";
import ParentAttendance from "../pages/parent/ParentAttendance";
import ParentFees from "../pages/parent/ParentFees";
import ParentExams from "../pages/parent/ParentExams";
import ParentHomework from "../pages/parent/ParentHomework";
import ParentTimetable from "../pages/parent/ParentTimetable";
import ParentNotices from "../pages/parent/ParentNotices";
import ParentLibrary from "../pages/parent/ParentLibrary";
import Chat from "../pages/Chat";
import Attendance from "../pages/Attendance";
import Fees from "../pages/Fees";
import SystemExplorer from "../pages/SystemExplorer";
import Profile from "../pages/Profile";
import Subscription from "../pages/Subscription";
import Settings from "../pages/Settings";
import LandingPageSettings from "../pages/LandingPageSettings";
import Enrollments from "../pages/Enrollments";
import Exams from "../pages/Exams";
import Notices from "../pages/Notices";
import Timetable from "../pages/Timetable";
import Assignments from "../pages/Assignments";
import Library from "../pages/Library";
import StaffManagement from "../pages/StaffManagement";
import Inventory from "../pages/Inventory";
import CertificateGenerator from "../pages/CertificateGenerator";
import Classes from "../pages/Classes";
import PlatformSettings from "../pages/PlatformSettings";
import Security from "../pages/Security";
import DashboardLayout from "../layouts/DashboardLayout";
import ProtectedRoute from "./ProtectedRoute";
import RoleRoute from "./RoleRoute";

import TokenHandler from "../components/auth/TokenHandler";

import SchoolLandingPage from "../pages/SchoolLandingPage";
import SchoolAdmissionPage from "../pages/SchoolAdmissionPage";
import { useTenant } from "../context/TenantContext";

export default function AppRoutes() {
  const tenant = useTenant();

  return (
    <BrowserRouter>
      <TokenHandler />
      <Routes>
        {/* Public Routes */}
        <Route 
          path="/" 
          element={
            tenant.loading ? (
              <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center" }}>
                <div className="slp-spinner" />
              </div>
            ) : tenant.schoolName ? <SchoolLandingPage /> : <LandingPage />
          } 
        />
        <Route path="/s/:school_slug" element={<SchoolLandingPage />} />
        <Route path="/s/:school_slug/apply" element={<SchoolAdmissionPage />} />
        <Route path="/apply" element={<SchoolAdmissionPage />} />
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
            path="/teacher"
            element={
              <RoleRoute allowedRoles={["teacher"]}>
                <TeacherPortal />
              </RoleRoute>
            }
          />
          <Route
            path="/teacher/admissions"
            element={
              <RoleRoute allowedRoles={["teacher"]}>
                <TeacherAdmissions />
              </RoleRoute>
            }
          />
          <Route
            path="/parent"
            element={
              <RoleRoute allowedRoles={["parent"]}>
                <ParentPortal />
              </RoleRoute>
            }
          />
          <Route
            path="/parent/profile"
            element={
              <RoleRoute allowedRoles={["parent"]}>
                <ParentProfile />
              </RoleRoute>
            }
          />
          <Route
            path="/parent/attendance"
            element={
              <RoleRoute allowedRoles={["parent"]}>
                <ParentAttendance />
              </RoleRoute>
            }
          />
          <Route
            path="/parent/fees"
            element={
              <RoleRoute allowedRoles={["parent"]}>
                <ParentFees />
              </RoleRoute>
            }
          />
          <Route
            path="/parent/exams"
            element={
              <RoleRoute allowedRoles={["parent"]}>
                <ParentExams />
              </RoleRoute>
            }
          />
          <Route
            path="/parent/homework"
            element={
              <RoleRoute allowedRoles={["parent"]}>
                <ParentHomework />
              </RoleRoute>
            }
          />
          <Route
            path="/parent/timetable"
            element={
              <RoleRoute allowedRoles={["parent"]}>
                <ParentTimetable />
              </RoleRoute>
            }
          />
          <Route
            path="/parent/notices"
            element={
              <RoleRoute allowedRoles={["parent"]}>
                <ParentNotices />
              </RoleRoute>
            }
          />
          <Route
            path="/parent/library"
            element={
              <RoleRoute allowedRoles={["parent"]}>
                <ParentLibrary />
              </RoleRoute>
            }
          />
          <Route
            path="/parent/transport"
            element={<Navigate to="/parent" replace />}
          />
          <Route
            path="/chat"
            element={
              <RoleRoute allowedRoles={["admin", "teacher", "parent", "accountant", "student"]}>
                <Chat />
              </RoleRoute>
            }
          />
          <Route
            path="/schools"
            element={
              <RoleRoute allowedRoles={["superadmin"]}>
                <Schools />
              </RoleRoute>
            }
          />
          <Route
            path="/schools/:id"
            element={
              <RoleRoute allowedRoles={["superadmin"]}>
                <SchoolProfile />
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
            path="/classes"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <Classes />
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
              <RoleRoute allowedRoles={["admin", "accountant", "student"]}>
                <Fees />
              </RoleRoute>
            }
          />
          <Route
            path="/exams"
            element={
              <RoleRoute allowedRoles={["admin", "teacher", "student"]}>
                <Exams />
              </RoleRoute>
            }
          />
          <Route
            path="/notices"
            element={
              <RoleRoute allowedRoles={["admin", "teacher", "student"]}>
                <Notices />
              </RoleRoute>
            }
          />
          <Route
            path="/timetable"
            element={
              <RoleRoute allowedRoles={["admin", "teacher", "student"]}>
                <Timetable />
              </RoleRoute>
            }
          />
          <Route
            path="/assignments"
            element={
              <RoleRoute allowedRoles={["admin", "teacher", "student"]}>
                <Assignments />
              </RoleRoute>
            }
          />
          <Route
            path="/library"
            element={
              <RoleRoute allowedRoles={["admin", "student"]}>
                <Library />
              </RoleRoute>
            }
          />
          <Route
            path="/transport"
            element={<Navigate to="/dashboard" replace />}
          />

          <Route
            path="/staff"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <StaffManagement />
              </RoleRoute>
            }
          />
          <Route
            path="/inventory"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <Inventory />
              </RoleRoute>
            }
          />
          <Route
            path="/certificates"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <CertificateGenerator />
              </RoleRoute>
            }
          />
          <Route
            path="/security"
            element={
              <RoleRoute allowedRoles={["superadmin"]}>
                <Security />
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
          <Route
            path="/platform-settings"
            element={
              <RoleRoute allowedRoles={["superadmin"]}>
                <PlatformSettings />
              </RoleRoute>
            }
          />
          <Route 
            path="/landing-settings" 
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <LandingPageSettings />
              </RoleRoute>
            } 
          />
          <Route 
            path="/enrollments" 
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <Enrollments />
              </RoleRoute>
            } 
          />
          <Route path="/profile" element={<Profile />} />
          <Route
            path="/subscription"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <Subscription />
              </RoleRoute>
            }
          />
          <Route
            path="/settings"
            element={
              <RoleRoute allowedRoles={["admin"]}>
                <Settings />
              </RoleRoute>
            }
          />
        </Route>

        {/* Fallback to Login */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
