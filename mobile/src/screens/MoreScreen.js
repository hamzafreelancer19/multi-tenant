import React from "react";
import { useAuth } from "../auth/AuthContext";
import { Hero, MenuRow, Screen } from "../components/ui";
import { displayName, isSchoolAdmin, roleLabel } from "../utils";
import { getApiBaseUrl } from "../config";
import { rootNavigate } from "../navigation/rootNav";

export default function MoreScreen() {
  const { user, role, logout } = useAuth();
  const navigation = { navigate: rootNavigate };
  const admin = isSchoolAdmin(role);
  const teacher = role === "teacher";
  const parent = role === "parent";
  const student = role === "student";
  const accountant = role === "accountant";
  const superadmin = role === "superadmin";

  return (
    <Screen>
      <Hero kicker={roleLabel(role)} title={displayName(user)} subtitle={user?.school_name || "Classora"} />
      {admin && (
        <>
          <MenuRow title="Teachers" onPress={() => navigation.navigate("Teachers")} />
          <MenuRow title="Classes" onPress={() => navigation.navigate("Classes")} />
          <MenuRow title="Admission requests" onPress={() => navigation.navigate("Enrollments")} />
          <MenuRow title="Exams" onPress={() => navigation.navigate("Exams")} />
          <MenuRow title="Homework" onPress={() => navigation.navigate("Assignments")} />
          <MenuRow title="Timetable" onPress={() => navigation.navigate("Timetable")} />
          <MenuRow title="Notices" onPress={() => navigation.navigate("Notices")} />
          <MenuRow title="Library" onPress={() => navigation.navigate("Library")} />
          <MenuRow title="Staff & payroll" onPress={() => navigation.navigate("Staff")} />
          <MenuRow title="Inventory" onPress={() => navigation.navigate("Inventory")} />
          <MenuRow title="Transport" onPress={() => navigation.navigate("Transport")} />
          <MenuRow title="Chat" onPress={() => navigation.navigate("Chat")} />
          <MenuRow title="Subscription" onPress={() => navigation.navigate("Subscription")} />
          <MenuRow title="School settings" onPress={() => navigation.navigate("Settings")} />
        </>
      )}
      {teacher && (
        <>
          <MenuRow title="Students" onPress={() => navigation.navigate("Students")} />
          <MenuRow title="Exams" onPress={() => navigation.navigate("Exams")} />
          <MenuRow title="Timetable" onPress={() => navigation.navigate("Timetable")} />
          <MenuRow title="Notices" onPress={() => navigation.navigate("Notices")} />
          <MenuRow title="Class admissions" onPress={() => navigation.navigate("Enrollments")} />
          <MenuRow title="Chat" onPress={() => navigation.navigate("Chat")} />
        </>
      )}
      {parent && (
        <>
          <MenuRow title="Child profile" onPress={() => navigation.navigate("ParentProfile")} />
          <MenuRow title="Exams" onPress={() => navigation.navigate("ParentExams")} />
          <MenuRow title="Timetable" onPress={() => navigation.navigate("ParentTimetable")} />
          <MenuRow title="Notices" onPress={() => navigation.navigate("ParentNotices")} />
          <MenuRow title="Library" onPress={() => navigation.navigate("ParentLibrary")} />
          <MenuRow title="Chat" onPress={() => navigation.navigate("Chat")} />
        </>
      )}
      {student && (
        <>
          <MenuRow title="Notices" onPress={() => navigation.navigate("Notices")} />
          <MenuRow title="Timetable" onPress={() => navigation.navigate("Timetable")} />
          <MenuRow title="Library" onPress={() => navigation.navigate("Library")} />
          <MenuRow title="Chat" onPress={() => navigation.navigate("Chat")} />
        </>
      )}
      {accountant && (
        <>
          <MenuRow title="Notices" onPress={() => navigation.navigate("Notices")} />
          <MenuRow title="Chat" onPress={() => navigation.navigate("Chat")} />
        </>
      )}
      {superadmin && (
        <>
          <MenuRow title="Dashboard" onPress={() => navigation.navigate("Dashboard")} />
          <MenuRow title="Schools" onPress={() => navigation.navigate("Schools")} />
          <MenuRow title="Plans" onPress={() => navigation.navigate("Plans")} />
          <MenuRow title="School admins" onPress={() => navigation.navigate("PlatformUsers")} />
          <MenuRow title="Platform settings" onPress={() => navigation.navigate("PlatformSettings")} />
        </>
      )}
      <MenuRow title="Profile" onPress={() => navigation.navigate("Profile")} />
      <MenuRow title="Log out" subtitle={getApiBaseUrl()} onPress={logout} />
    </Screen>
  );
}
