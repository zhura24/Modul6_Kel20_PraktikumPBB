import { useEffect, useState } from "react";
import {
  StyleSheet,
  Text,
  View,
} from "react-native";
import Animated, {
  cancelAnimation,
  interpolate,
  useAnimatedStyle,
  useReducedMotion,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { enableScreens } from "react-native-screens";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { StatusBar } from "expo-status-bar";
import { MonitoringScreen } from "./src/screens/MonitoringScreen.js";
import { ControlScreen } from "./src/screens/ControlScreen.js";
import { ProfileScreen } from "./src/screens/ProfileScreen.js";
import { assertConfig } from "./src/services/config.js";
import { tokens } from "./src/theme/tokens.js";

const Tab = createBottomTabNavigator();
const { color } = tokens;

enableScreens(true);

function SplashScreen() {
  const reduceMotion = useReducedMotion();
  const pulse = useSharedValue(1);
  const orbit = useSharedValue(0);
  const drift = useSharedValue(0);
  const progress = useSharedValue(0);
  const haloStyle = useAnimatedStyle(() => ({
    opacity: 0.26 + (pulse.value - 1) * 2.5,
    transform: [{ scale: pulse.value }],
  }));
  const orbitStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateX: "62deg" },
      { rotate: `${orbit.value}deg` },
    ],
  }));
  const reverseOrbitStyle = useAnimatedStyle(() => ({
    transform: [
      { rotateY: "62deg" },
      { rotate: `${-orbit.value * 0.7}deg` },
    ],
  }));
  const leftSparkStyle = useAnimatedStyle(() => ({
    opacity: 0.35 + pulse.value * 0.45,
    transform: [{ translateY: -drift.value }],
  }));
  const rightSparkStyle = useAnimatedStyle(() => ({
    opacity: 0.8 - pulse.value * 0.35,
    transform: [{ translateY: drift.value }],
  }));
  const progressStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: interpolate(progress.value, [0, 1], [-38, 118]) }],
  }));

  useEffect(() => {
    if (reduceMotion) return;
    pulse.value = withRepeat(withTiming(1.12, { duration: 900 }), -1, true);
    orbit.value = withRepeat(withTiming(360, { duration: 9000 }), -1, false);
    drift.value = withRepeat(withTiming(8, { duration: 1100 }), -1, true);
    progress.value = withRepeat(withTiming(1, { duration: 1300 }), -1, false);
    return () => {
      cancelAnimation(pulse);
      cancelAnimation(orbit);
      cancelAnimation(drift);
      cancelAnimation(progress);
    };
  }, [drift, orbit, progress, pulse, reduceMotion]);

  return (
    <View style={styles.splash}>
      <View style={styles.splashBackdropRing} />
      <View style={styles.splashBackdropRingInner} />
      <View style={styles.splashAccentTop} />
      <View style={styles.splashAccentBottom} />
      <View style={styles.splashContent}>
        <View style={styles.splashLogo}>
          <Animated.View style={[styles.splashOrbit, orbitStyle]}>
            <View style={styles.splashSatellite} />
          </Animated.View>
          <Animated.View style={[styles.splashOrbit, styles.splashOrbitAlt, reverseOrbitStyle]}>
            <View style={styles.splashSatelliteAlt} />
          </Animated.View>
          <Animated.View style={[styles.splashHalo, haloStyle]} />
          <View style={styles.splashLogoCore}>
            <Ionicons name="pulse" size={42} color="#FFFFFF" />
          </View>
          <Animated.View style={[styles.splashSpark, styles.splashSparkLeft, leftSparkStyle]} />
          <Animated.View style={[styles.splashSpark, styles.splashSparkRight, rightSparkStyle]} />
        </View>
        <View style={styles.splashBrand}>
          <Text style={styles.splashTitle}>LiveTemp</Text>
          <Text style={styles.splashSubtitle}>
            Monitoring suhu dan kelembapan
          </Text>
        </View>
        <View style={styles.splashLoading}>
          <View style={styles.splashProgressTrack}>
            <Animated.View style={[styles.splashProgressGlow, progressStyle]} />
          </View>
          <Text style={styles.splashFooter}>Kelompok 20 · Praktikum PPB</Text>
        </View>
      </View>
    </View>
  );
}

export default function App() {
  const [showSplash, setShowSplash] = useState(true);

  useEffect(() => {
    assertConfig();
    const timer = setTimeout(() => setShowSplash(false), 2200);
    return () => clearTimeout(timer);
  }, []);

  const theme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      background: color.bg,
      card: color.surface,
      text: color.text,
      border: color.border,
      primary: color.primary,
    },
  };

  return (
    <SafeAreaProvider>
      <StatusBar style={showSplash ? "light" : "dark"} />
      {showSplash ? (
        <SplashScreen />
      ) : (
        <NavigationContainer theme={theme}>
          <Tab.Navigator
            screenOptions={({ route }) => ({
              headerShown: true,
              headerTitle: "LiveTemp",
              headerTitleAlign: "left",
              headerTintColor: color.text,
              headerStyle: {
                backgroundColor: color.surface,
                borderBottomWidth: 1,
                borderBottomColor: color.border,
              },
              headerTitleStyle: {
                fontWeight: "600",
                fontSize: 17,
                // ponytail: system monospace, no custom font dep
                fontFamily: "monospace",
                letterSpacing: -0.5,
              },
              tabBarActiveTintColor: color.primary,
              tabBarInactiveTintColor: color.text2,
              tabBarLabelStyle: { fontSize: 12, fontWeight: "500" },
              tabBarStyle: {
                backgroundColor: color.surface,
                borderTopWidth: 1,
                borderTopColor: color.border,
              },
              tabBarHideOnKeyboard: true,
              tabBarIcon: ({ color: iconColor }) => {
                const iconName =
                  route.name === "Monitoring"
                    ? "pulse"
                    : route.name === "Control"
                      ? "options"
                      : "person-circle";
                return <Ionicons name={iconName} size={24} color={iconColor} />;
              },
            })}
          >
            <Tab.Screen name="Monitoring" component={MonitoringScreen} />
            <Tab.Screen name="Control" component={ControlScreen} />
            <Tab.Screen name="Profil" component={ProfileScreen} />
          </Tab.Navigator>
        </NavigationContainer>
      )}
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    backgroundColor: "#0B1220",
  },
  splashBackdropRing: {
    position: "absolute",
    width: 430,
    height: 430,
    borderRadius: 215,
    borderWidth: 1,
    borderColor: "rgba(96, 165, 250, 0.07)",
  },
  splashBackdropRingInner: {
    position: "absolute",
    width: 340,
    height: 340,
    borderRadius: 170,
    borderWidth: 1,
    borderColor: "rgba(96, 165, 250, 0.06)",
  },
  splashAccentTop: {
    position: "absolute",
    top: "21%",
    right: "16%",
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#7DD3FC",
    opacity: 0.8,
  },
  splashAccentBottom: {
    position: "absolute",
    bottom: "24%",
    left: "18%",
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#A78BFA",
    opacity: 0.7,
  },
  splashContent: {
    alignItems: "center",
    paddingHorizontal: 28,
  },
  splashLogo: {
    width: 116,
    height: 116,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 26,
  },
  splashOrbit: {
    position: "absolute",
    width: 112,
    height: 48,
    borderRadius: 56,
    borderWidth: 1.5,
    borderColor: "rgba(125, 211, 252, 0.62)",
    alignItems: "flex-end",
    justifyContent: "center",
  },
  splashOrbitAlt: {
    width: 104,
    height: 42,
    borderColor: "rgba(167, 139, 250, 0.46)",
  },
  splashSatellite: {
    width: 8,
    height: 8,
    marginRight: 8,
    borderRadius: 4,
    backgroundColor: "#BAE6FD",
    boxShadow: "0 0 9px rgba(125, 211, 252, 0.8)",
  },
  splashSatelliteAlt: {
    width: 6,
    height: 6,
    marginRight: 7,
    borderRadius: 3,
    backgroundColor: "#C4B5FD",
  },
  splashHalo: {
    position: "absolute",
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 2,
    borderColor: "rgba(96, 165, 250, 0.5)",
  },
  splashLogoCore: {
    width: 78,
    height: 78,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
    backgroundColor: "#2563EB",
  },
  splashSpark: {
    position: "absolute",
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: "#E0F2FE",
  },
  splashSparkLeft: {
    top: 17,
    left: 15,
  },
  splashSparkRight: {
    right: 12,
    bottom: 23,
    backgroundColor: "#C4B5FD",
  },
  splashTitle: {
    color: "#F8FAFC",
    fontSize: 32,
    fontWeight: "700",
    letterSpacing: -0.5,
  },
  splashSubtitle: {
    marginTop: 7,
    color: "#94A3B8",
    fontSize: 14,
    textAlign: "center",
  },
  splashBrand: {
    alignItems: "center",
  },
  splashLoading: {
    alignItems: "center",
    marginTop: 42,
  },
  splashProgressTrack: {
    width: 118,
    height: 3,
    marginBottom: 17,
    overflow: "hidden",
    borderRadius: 2,
    backgroundColor: "rgba(148, 163, 184, 0.2)",
  },
  splashProgressGlow: {
    position: "absolute",
    width: 38,
    height: 3,
    borderRadius: 2,
    backgroundColor: "#7DD3FC",
    boxShadow: "0 0 8px rgba(125, 211, 252, 0.9)",
  },
  splashFooter: {
    color: "#64748B",
    fontSize: 12,
  },
});
