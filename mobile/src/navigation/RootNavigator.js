import React from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useAuth } from "../auth/AuthContext";
import { isSchoolAdmin } from "../utils";
import { colors } from "../theme";
import { navigationRef } from "./rootNav";
import LoginScreen from "../screens/LoginScreen";
import DashboardScreen from "../screens/DashboardScreen";
import StudentsScreen from "../screens/StudentsScreen";
import TeachersScreen from "../screens/TeachersScreen";
import ClassesScreen from "../screens/ClassesScreen";
import AttendanceScreen from "../screens/AttendanceScreen";
import FeesScreen from "../screens/FeesScreen";
import ExamsScreen from "../screens/ExamsScreen";
import NoticesScreen from "../screens/NoticesScreen";
import TimetableScreen from "../screens/TimetableScreen";
import AssignmentsScreen from "../screens/AssignmentsScreen";
import EnrollmentsScreen from "../screens/EnrollmentsScreen";
import StaffScreen from "../screens/StaffScreen";
import LibraryScreen from "../screens/LibraryScreen";
import InventoryScreen from "../screens/InventoryScreen";
import TransportScreen from "../screens/TransportScreen";
import ChatScreen from "../screens/ChatScreen";
import ProfileScreen from "../screens/ProfileScreen";
import SettingsScreen from "../screens/SettingsScreen";
import SubscriptionScreen from "../screens/SubscriptionScreen";
import TeacherHomeScreen from "../screens/TeacherHomeScreen";
import MoreScreen from "../screens/MoreScreen";
import SchoolsScreen from "../screens/SchoolsScreen";
import PlatformUsersScreen from "../screens/PlatformUsersScreen";
import PlansScreen from "../screens/PlansScreen";
import PlatformSettingsScreen from "../screens/PlatformSettingsScreen";
import {
  ParentAttendanceScreen,
  ParentExamsScreen,
  ParentFeesScreen,
  ParentHomeScreen,
  ParentHomeworkScreen,
  ParentLibraryScreen,
  ParentNoticesScreen,
  ParentProfileScreen,
  ParentTimetableScreen,
} from "../screens/ParentScreens";

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const navTheme = {
  ...DefaultTheme,
  colors: { ...DefaultTheme.colors, background: colors.bg, card: colors.navy, text: colors.text, border: colors.border, primary: colors.primary },
};

const screenOptions = {
  headerStyle: { backgroundColor: colors.navy },
  headerTintColor: colors.text,
  headerTitleStyle: { fontWeight: "800" },
  contentStyle: { backgroundColor: colors.bg },
};

function tabIcon(name) {
  return ({ color, size }) => <Ionicons name={name} color={color} size={size} />;
}

const tabBarOpts = {
  headerShown: false,
  tabBarStyle: { backgroundColor: colors.navy, borderTopColor: colors.border },
  tabBarActiveTintColor: colors.primary,
  tabBarInactiveTintColor: colors.muted,
};

function AdminTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOpts}>
      <Tab.Screen name="HomeTab" component={DashboardScreen} options={{ title: "Home", tabBarIcon: tabIcon("grid-outline") }} />
      <Tab.Screen name="StudentsTab" component={StudentsScreen} options={{ title: "Students", tabBarIcon: tabIcon("people-outline") }} />
      <Tab.Screen name="AttendanceTab" component={AttendanceScreen} options={{ title: "Attendance", tabBarIcon: tabIcon("checkmark-circle-outline") }} />
      <Tab.Screen name="FeesTab" component={FeesScreen} options={{ title: "Fees", tabBarIcon: tabIcon("card-outline") }} />
      <Tab.Screen name="MoreTab" component={MoreScreen} options={{ title: "More", tabBarIcon: tabIcon("menu-outline") }} />
    </Tab.Navigator>
  );
}

function TeacherTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOpts}>
      <Tab.Screen name="HomeTab" component={TeacherHomeScreen} options={{ title: "Home", tabBarIcon: tabIcon("school-outline") }} />
      <Tab.Screen name="AttendanceTab" component={AttendanceScreen} options={{ title: "Attendance", tabBarIcon: tabIcon("checkmark-circle-outline") }} />
      <Tab.Screen name="HomeworkTab" component={AssignmentsScreen} options={{ title: "Homework", tabBarIcon: tabIcon("document-text-outline") }} />
      <Tab.Screen name="MoreTab" component={MoreScreen} options={{ title: "More", tabBarIcon: tabIcon("menu-outline") }} />
    </Tab.Navigator>
  );
}

function ParentTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOpts}>
      <Tab.Screen name="HomeTab" component={ParentHomeScreen} options={{ title: "Home", tabBarIcon: tabIcon("home-outline") }} />
      <Tab.Screen name="AttendanceTab" component={ParentAttendanceScreen} options={{ title: "Attendance", tabBarIcon: tabIcon("checkmark-circle-outline") }} />
      <Tab.Screen name="FeesTab" component={ParentFeesScreen} options={{ title: "Fees", tabBarIcon: tabIcon("card-outline") }} />
      <Tab.Screen name="HomeworkTab" component={ParentHomeworkScreen} options={{ title: "Homework", tabBarIcon: tabIcon("document-text-outline") }} />
      <Tab.Screen name="MoreTab" component={MoreScreen} options={{ title: "More", tabBarIcon: tabIcon("menu-outline") }} />
    </Tab.Navigator>
  );
}

function StudentTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOpts}>
      <Tab.Screen name="HomeTab" component={DashboardScreen} options={{ title: "Home", tabBarIcon: tabIcon("home-outline") }} />
      <Tab.Screen name="FeesTab" component={FeesScreen} options={{ title: "Fees", tabBarIcon: tabIcon("card-outline") }} />
      <Tab.Screen name="HomeworkTab" component={AssignmentsScreen} options={{ title: "Homework", tabBarIcon: tabIcon("document-text-outline") }} />
      <Tab.Screen name="ExamsTab" component={ExamsScreen} options={{ title: "Exams", tabBarIcon: tabIcon("clipboard-outline") }} />
      <Tab.Screen name="MoreTab" component={MoreScreen} options={{ title: "More", tabBarIcon: tabIcon("menu-outline") }} />
    </Tab.Navigator>
  );
}

function AccountantTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOpts}>
      <Tab.Screen name="HomeTab" component={DashboardScreen} options={{ title: "Home", tabBarIcon: tabIcon("grid-outline") }} />
      <Tab.Screen name="FeesTab" component={FeesScreen} options={{ title: "Fees", tabBarIcon: tabIcon("card-outline") }} />
      <Tab.Screen name="MoreTab" component={MoreScreen} options={{ title: "More", tabBarIcon: tabIcon("menu-outline") }} />
    </Tab.Navigator>
  );
}

function SuperTabs() {
  return (
    <Tab.Navigator screenOptions={tabBarOpts}>
      <Tab.Screen name="HomeTab" component={DashboardScreen} options={{ title: "Home", tabBarIcon: tabIcon("grid-outline") }} />
      <Tab.Screen name="SchoolsTab" component={SchoolsScreen} options={{ title: "Schools", tabBarIcon: tabIcon("business-outline") }} />
      <Tab.Screen name="PlansTab" component={PlansScreen} options={{ title: "Plans", tabBarIcon: tabIcon("card-outline") }} />
      <Tab.Screen name="MoreTab" component={MoreScreen} options={{ title: "More", tabBarIcon: tabIcon("menu-outline") }} />
    </Tab.Navigator>
  );
}

function RoleTabs() {
  const { role } = useAuth();
  if (role === "teacher") return <TeacherTabs />;
  if (role === "parent") return <ParentTabs />;
  if (role === "student") return <StudentTabs />;
  if (role === "accountant") return <AccountantTabs />;
  if (role === "superadmin") return <SuperTabs />;
  if (isSchoolAdmin(role)) return <AdminTabs />;
  return <AdminTabs />;
}

function AppStack() {
  return (
    <Stack.Navigator screenOptions={screenOptions}>
      <Stack.Screen name="Tabs" component={RoleTabs} options={{ headerShown: false }} />
      <Stack.Screen name="Students" component={StudentsScreen} />
      <Stack.Screen name="Teachers" component={TeachersScreen} />
      <Stack.Screen name="Classes" component={ClassesScreen} />
      <Stack.Screen name="Attendance" component={AttendanceScreen} />
      <Stack.Screen name="Fees" component={FeesScreen} />
      <Stack.Screen name="Exams" component={ExamsScreen} />
      <Stack.Screen name="Notices" component={NoticesScreen} />
      <Stack.Screen name="Timetable" component={TimetableScreen} />
      <Stack.Screen name="Assignments" component={AssignmentsScreen} />
      <Stack.Screen name="Homework" component={AssignmentsScreen} />
      <Stack.Screen name="Enrollments" component={EnrollmentsScreen} />
      <Stack.Screen name="Staff" component={StaffScreen} />
      <Stack.Screen name="Library" component={LibraryScreen} />
      <Stack.Screen name="Inventory" component={InventoryScreen} />
      <Stack.Screen name="Transport" component={TransportScreen} />
      <Stack.Screen name="Chat" component={ChatScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="Settings" component={SettingsScreen} />
      <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: "Subscription" }} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="Schools" component={SchoolsScreen} />
      <Stack.Screen name="PlatformUsers" component={PlatformUsersScreen} options={{ title: "School admins" }} />
      <Stack.Screen name="Plans" component={PlansScreen} options={{ title: "Plans" }} />
      <Stack.Screen name="PlatformSettings" component={PlatformSettingsScreen} options={{ title: "Platform settings" }} />
      <Stack.Screen name="ParentProfile" component={ParentProfileScreen} options={{ title: "Child profile" }} />
      <Stack.Screen name="ParentAttendance" component={ParentAttendanceScreen} options={{ title: "Attendance" }} />
      <Stack.Screen name="ParentFees" component={ParentFeesScreen} options={{ title: "Fees" }} />
      <Stack.Screen name="ParentExams" component={ParentExamsScreen} options={{ title: "Exams" }} />
      <Stack.Screen name="ParentHomework" component={ParentHomeworkScreen} options={{ title: "Homework" }} />
      <Stack.Screen name="ParentTimetable" component={ParentTimetableScreen} options={{ title: "Timetable" }} />
      <Stack.Screen name="ParentNotices" component={ParentNoticesScreen} options={{ title: "Notices" }} />
      <Stack.Screen name="ParentLibrary" component={ParentLibraryScreen} options={{ title: "Library" }} />
    </Stack.Navigator>
  );
}

export default function RootNavigator() {
  const { ready, user } = useAuth();
  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }
  return (
    <NavigationContainer ref={navigationRef} theme={navTheme}>
      {user ? <AppStack /> : <LoginScreen />}
    </NavigationContainer>
  );
}
