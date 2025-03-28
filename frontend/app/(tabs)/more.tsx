import React, { useState, useEffect } from "react";
import { 
  StyleSheet, 
  ScrollView, 
  Switch, 
  TouchableOpacity, 
  View, 
  Alert
} from "react-native";
import { FontAwesome5, MaterialIcons, Ionicons } from '@expo/vector-icons';

import ThemedText from "../components/ThemedText";
import ThemedView from "../components/ThemedView";
import { useColorScheme } from "../hooks/useColorScheme";
import { Colors } from "../constants/Colors";

// App version - would be dynamic in production
const APP_VERSION = "1.0.0";

export default function More() {
  const colorScheme = useColorScheme();
  const [isDarkMode, setIsDarkMode] = useState(colorScheme === 'dark');
  const [isSystemTheme, setIsSystemTheme] = useState(true);

  // Update dark mode state when system theme changes
  useEffect(() => {
    if (isSystemTheme) {
      setIsDarkMode(colorScheme === 'dark');
    }
  }, [colorScheme, isSystemTheme]);

  const handleToggleSystemTheme = (value: boolean) => {
    setIsSystemTheme(value);
    if (value) {
      // If using system theme, set dark mode based on system setting
      setIsDarkMode(colorScheme === 'dark');
    }
  };

  const handleToggleDarkMode = (value: boolean) => {
    setIsDarkMode(value);
  };

  return (
    <ThemedView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.contentContainer}>
        {/* THEMING SECTION */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Appearance</ThemedText>
          
          <ThemedView 
            style={styles.settingItem}
            lightColor="#ffffff"
            darkColor="#333333"
          >
            <View style={styles.settingItemContent}>
              <View style={styles.settingItemIcon}>
                <Ionicons 
                  name="phone-portrait-outline" 
                  size={24} 
                  color={colorScheme === 'dark' ? Colors.dark.icon : Colors.light.icon} 
                />
              </View>
              <ThemedText>Use device settings</ThemedText>
            </View>
            <Switch
              value={isSystemTheme}
              onValueChange={handleToggleSystemTheme}
              trackColor={{ false: "#767577", true: "#4a90e2" }}
              thumbColor={"#f4f3f4"}
            />
          </ThemedView>
          
          <ThemedView 
            style={styles.settingItem}
            lightColor="#ffffff"
            darkColor="#333333"
          >
            <View style={styles.settingItemContent}>
              <View style={styles.settingItemIcon}>
                <Ionicons 
                  name={isDarkMode ? "moon" : "sunny"} 
                  size={24} 
                  color={colorScheme === 'dark' ? Colors.dark.icon : Colors.light.icon} 
                />
              </View>
              <ThemedText>Dark theme</ThemedText>
            </View>
            <Switch
              value={isDarkMode}
              onValueChange={handleToggleDarkMode}
              disabled={isSystemTheme}
              trackColor={{ false: "#767577", true: "#4a90e2" }}
              thumbColor={"#f4f3f4"}
              style={{ opacity: isSystemTheme ? 0.5 : 1 }}
            />
          </ThemedView>
        </ThemedView>
        
        {/* HELP & SUPPORT SECTION */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Help & Support</ThemedText>
          
          <TouchableOpacity 
            style={styles.menuItem}
            lightColor="#ffffff"
            darkColor="#333333"
            onPress={() => Alert.alert("Coming Soon", "User guide will be available in a future update.")}
          >
            <View style={styles.menuItemContent}>
              <View style={styles.menuItemIcon}>
                <FontAwesome5 
                  name="book" 
                  size={20} 
                  color={colorScheme === 'dark' ? Colors.dark.icon : Colors.light.icon} 
                />
              </View>
              <ThemedText>User Guide</ThemedText>
            </View>
            <MaterialIcons 
              name="chevron-right" 
              size={24} 
              color={colorScheme === 'dark' ? Colors.dark.icon : Colors.light.icon} 
            />
          </TouchableOpacity>
        </ThemedView>
        
        {/* ABOUT SECTION */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">About</ThemedText>
          
          <ThemedView 
            style={styles.infoCard}
            lightColor="#f8f8f8"
            darkColor="#222"
          >
            <ThemedText style={styles.appName}>Auto Shop Manager</ThemedText>
            <ThemedText style={styles.versionText}>Version {APP_VERSION}</ThemedText>
            <ThemedText style={styles.copyrightText}>© 2025 Auto Shop Software</ThemedText>
          </ThemedView>
        </ThemedView>

        {/* ACCOUNT/LOGIN PLACEHOLDER */}
        <ThemedView style={[styles.section, styles.accountSection]}>
          <TouchableOpacity 
            style={styles.accountButton}
            onPress={() => Alert.alert("Coming Soon", "User accounts and authentication will be available in a future update.")}
          >
            <FontAwesome5 name="user-circle" size={20} color="#fff" style={styles.accountButtonIcon} />
            <ThemedText style={styles.accountButtonText}>Sign In / Register</ThemedText>
          </TouchableOpacity>
          <ThemedText style={styles.accountNote}>
            User accounts coming soon. Unlock cloud backup, multi-device sync, and team collaboration.
          </ThemedText>
        </ThemedView>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 24,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  settingItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  settingItemIcon: {
    marginRight: 12,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  menuItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  menuItemIcon: {
    marginRight: 12,
    width: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCard: {
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  appName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  versionText: {
    marginBottom: 4,
  },
  copyrightText: {
    opacity: 0.7,
    fontSize: 12,
    marginBottom: 16,
  },
  accountSection: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 40,
  },
  accountButton: {
    backgroundColor: '#0a7ea4',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 14,
    borderRadius: 8,
    width: '100%',
    marginBottom: 12,
  },
  accountButtonIcon: {
    marginRight: 8,
  },
  accountButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 16,
  },
  accountNote: {
    textAlign: 'center',
    opacity: 0.7,
    fontSize: 12,
    paddingHorizontal: 20,
  },
});
