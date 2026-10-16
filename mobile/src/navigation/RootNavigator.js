import React, { useMemo } from "react";
import { Platform, StyleSheet, View } from "react-native";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../auth/AuthContext";
import { isSchoolAdmin } from "../utils";
import { useTheme } from "../theme/ThemeContext";
import { navigationRef } from "./rootNav";
import { LoadingBlock } from "../components/ui";
import LoginScreen from "../screens/LoginScreen";
import SignupScreen from "../screens/SignupScreen";
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

function TabIcon({ outline, filled, color, focused, showActiveLine = true }) {
  const { colors } = useTheme();
  return (
    <View style={tabStyles.iconWrap}>
      {focused && showActiveLine ? (
        <View style={[tabStyles.activeDot, { backgroundColor: colors.primary }]} />
      ) : (
        <View style={tabStyles.activeDotSpacer} />
      )}
      <Ionicons name={focused ? filled : outline} color={color} size={focused ? 24 : 22} />
    </View>
  );
}

function tabIcon(outline, filled, { showActiveLine = true } = {}) {
  return ({ color, focused }) => (
    <TabIcon
      outline={outline}
      filled={filled || outline.replace("-outline", "")}
      color={color}
      focused={focused}
      showActiveLine={showActiveLine}
    />
  );
}

function useTabBarOptions() {
  const insets = useSafeAreaInsets();
  const { colors, isDark } = useTheme();
  const bottom = Math.max(insets.bottom, Platform.OS === "android" ? 8 : 6);
  return {
    headerShown: false,
    tabBarActiveTintColor: colors.primary,
    tabBarInactiveTintColor: colors.muted,
    tabBarHideOnKeyboard: true,
    tabBarStyle: {
      backgroundColor: colors.bg2,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: isDark ? "rgba(255,255,255,0.1)" : "rgba(15,23,42,0.08)",
      height: 58 + bottom,
      paddingTop: 6,
      paddingBottom: bottom,
      elevation: 12,
      shadowColor: "#000",
      shadowOpacity: isDark ? 0.35 : 0.08,
      shadowRadius: 12,
      shadowOffset: { width: 0, height: -4 },
    },
    tabBarItemStyle: {
      paddingVertical: 2,
    },
    tabBarLabelStyle: {
      fontSize: 11,
      fontWeight: "700",
      letterSpacing: 0.2,
      marginTop: 2,
    },
  };
}

function AdminTabs() {
  const tabBarOpts = useTabBarOptions();
  return (
    <Tab.Navigator screenOptions={tabBarOpts}>
      <Tab.Screen name="HomeTab" component={DashboardScreen} options={{ title: "Home", tabBarIcon: tabIcon("grid-outline", "grid") }} />
      <Tab.Screen name="StudentsTab" component={StudentsScreen} options={{ title: "Students", tabBarIcon: tabIcon("people-outline", "people") }} />
      <Tab.Screen name="AttendanceTab" component={AttendanceScreen} options={{ title: "Attendance", tabBarIcon: tabIcon("checkmark-circle-outline", "checkmark-circle") }} />
      <Tab.Screen name="FeesTab" component={FeesScreen} options={{ title: "Fees", tabBarIcon: tabIcon("card-outline", "card") }} />
      <Tab.Screen name="MoreTab" component={MoreScreen} options={{ title: "More", tabBarIcon: tabIcon("menu-outline", "menu", { showActiveLine: false }) }} />
    </Tab.Navigator>
  );
}

function TeacherTabs() {
  const tabBarOpts = useTabBarOptions();
  return (
    <Tab.Navigator screenOptions={tabBarOpts}>
      <Tab.Screen name="HomeTab" component={TeacherHomeScreen} options={{ title: "Home", tabBarIcon: tabIcon("school-outline", "school") }} />
      <Tab.Screen name="AttendanceTab" component={AttendanceScreen} options={{ title: "Attendance", tabBarIcon: tabIcon("checkmark-circle-outline", "checkmark-circle") }} />
      <Tab.Screen name="HomeworkTab" component={AssignmentsScreen} options={{ title: "Homework", tabBarIcon: tabIcon("document-text-outline", "document-text") }} />
      <Tab.Screen name="MoreTab" component={MoreScreen} options={{ title: "More", tabBarIcon: tabIcon("menu-outline", "menu", { showActiveLine: false }) }} />
    </Tab.Navigator>
  );
}

function ParentTabs() {
  const tabBarOpts = useTabBarOptions();
  return (
    <Tab.Navigator screenOptions={tabBarOpts}>
      <Tab.Screen name="HomeTab" component={ParentHomeScreen} options={{ title: "Home", tabBarIcon: tabIcon("home-outline", "home") }} />
      <Tab.Screen name="AttendanceTab" component={ParentAttendanceScreen} options={{ title: "Attendance", tabBarIcon: tabIcon("checkmark-circle-outline", "checkmark-circle") }} />
      <Tab.Screen name="FeesTab" component={ParentFeesScreen} options={{ title: "Fees", tabBarIcon: tabIcon("card-outline", "card") }} />
      <Tab.Screen name="HomeworkTab" component={ParentHomeworkScreen} options={{ title: "Homework", tabBarIcon: tabIcon("document-text-outline", "document-text") }} />
      <Tab.Screen name="MoreTab" component={MoreScreen} options={{ title: "More", tabBarIcon: tabIcon("menu-outline", "menu", { showActiveLine: false }) }} />
    </Tab.Navigator>
  );
}

function StudentTabs() {
  const tabBarOpts = useTabBarOptions();
  return (
    <Tab.Navigator screenOptions={tabBarOpts}>
      <Tab.Screen name="HomeTab" component={DashboardScreen} options={{ title: "Home", tabBarIcon: tabIcon("home-outline", "home") }} />
      <Tab.Screen name="FeesTab" component={FeesScreen} options={{ title: "Fees", tabBarIcon: tabIcon("card-outline", "card") }} />
      <Tab.Screen name="HomeworkTab" component={AssignmentsScreen} options={{ title: "Homework", tabBarIcon: tabIcon("document-text-outline", "document-text") }} />
      <Tab.Screen name="ExamsTab" component={ExamsScreen} options={{ title: "Exams", tabBarIcon: tabIcon("clipboard-outline", "clipboard") }} />
      <Tab.Screen name="MoreTab" component={MoreScreen} options={{ title: "More", tabBarIcon: tabIcon("menu-outline", "menu", { showActiveLine: false }) }} />
    </Tab.Navigator>
  );
}

function AccountantTabs() {
  const tabBarOpts = useTabBarOptions();
  return (
    <Tab.Navigator screenOptions={tabBarOpts}>
      <Tab.Screen name="HomeTab" component={DashboardScreen} options={{ title: "Home", tabBarIcon: tabIcon("grid-outline", "grid") }} />
      <Tab.Screen name="FeesTab" component={FeesScreen} options={{ title: "Fees", tabBarIcon: tabIcon("card-outline", "card") }} />
      <Tab.Screen name="MoreTab" component={MoreScreen} options={{ title: "More", tabBarIcon: tabIcon("menu-outline", "menu", { showActiveLine: false }) }} />
    </Tab.Navigator>
  );
}

function SuperTabs() {
  const tabBarOpts = useTabBarOptions();
  return (
    <Tab.Navigator screenOptions={tabBarOpts}>
      <Tab.Screen name="HomeTab" component={DashboardScreen} options={{ title: "Home", tabBarIcon: tabIcon("grid-outline", "grid") }} />
      <Tab.Screen name="SchoolsTab" component={SchoolsScreen} options={{ title: "Schools", tabBarIcon: tabIcon("business-outline", "business") }} />
      <Tab.Screen name="PlansTab" component={PlansScreen} options={{ title: "Plans", tabBarIcon: tabIcon("card-outline", "card") }} />
      <Tab.Screen name="MoreTab" component={MoreScreen} options={{ title: "More", tabBarIcon: tabIcon("menu-outline", "menu", { showActiveLine: false }) }} />
    </Tab.Navigator>
  );
}

const tabStyles = StyleSheet.create({
  iconWrap: {
    alignItems: "center",
    justifyContent: "center",
    minWidth: 40,
  },
  activeDot: {
    width: 18,
    height: 3,
    borderRadius: 2,
    marginBottom: 4,
  },
  activeDotSpacer: {
    width: 18,
    height: 3,
    marginBottom: 4,
  },
});

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

function subscriptionLocked(user) {
  if (!user || user.role === "superadmin") return false;
  if (user.subscription_active === false) return true;
  if (user.plan_status && user.plan_status !== "Active") return true;
  return false;
}

function SubscriptionLock() {
  const { colors } = useTheme();
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.bg2 },
        headerTintColor: colors.text,
        headerTitleStyle: { fontWeight: "700", fontSize: 17 },
        headerShown: false,
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="Subscription" component={SubscriptionScreen} options={{ title: "Subscription" }} />
    </Stack.Navigator>
  );
}

function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="Signup" component={SignupScreen} />
    </Stack.Navigator>
  );
}

function AppStack() {
  const { colors } = useTheme();
  const screenOptions = useMemo(
    () => ({
      headerStyle: { backgroundColor: colors.bg2 },
      headerTintColor: colors.text,
      headerTitleStyle: { fontWeight: "700", fontSize: 17 },
      headerShown: false,
      contentStyle: { backgroundColor: colors.bg },
    }),
    [colors]
  );
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
  const { colors, navTheme, isDark } = useTheme();
  const theme = useMemo(
    () => ({
      ...DefaultTheme,
      dark: isDark,
      colors: { ...DefaultTheme.colors, ...navTheme.colors },
    }),
    [isDark, navTheme]
  );

  if (!ready) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.bg, alignItems: "center", justifyContent: "center" }}>
        <LoadingBlock />
      </View>
    );
  }
  return (
    <NavigationContainer ref={navigationRef} theme={theme}>
      {user ? (subscriptionLocked(user) ? <SubscriptionLock /> : <AppStack />) : <AuthStack />}
    </NavigationContainer>
  );
}
