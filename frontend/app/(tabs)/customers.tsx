import React, { useEffect, useState } from "react";
import { 
  StyleSheet, 
  FlatList, 
  View, 
  ActivityIndicator, 
  TouchableOpacity, 
  RefreshControl,
  Platform,
  Dimensions,
  SafeAreaView
} from "react-native";
import { router } from "expo-router";

import ThemedText from "../components/ThemedText";
import ThemedView from "../components/ThemedView";
import api from "../api";
import { Customer } from "../api/types";

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load customers when the component mounts
  useEffect(() => {
    loadCustomers();
  }, []);

  // Function to load customers from the API
  const loadCustomers = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const data = await api.customers.getAll();
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load customers");
      console.error("Error loading customers:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadCustomers(true);
  };

  // Render a customer card
  const renderCustomer = ({ item }: { item: Customer }) => (
    <TouchableOpacity 
      style={styles.customerCard}
      onPress={() => router.push(`/customers/${item.id}`)}
    >
      <ThemedText type="defaultSemiBold">
        {item.first_name} {item.last_name}
      </ThemedText>
      <ThemedText>{item.phone}</ThemedText>
      <ThemedText>{item.email}</ThemedText>
    </TouchableOpacity>
  );

  // Floating action button component
  const FloatingActionButton = () => (
    <View style={styles.fabContainer}>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/customers/new")}
        activeOpacity={0.8}
      >
        <ThemedText style={styles.fabText}>+</ThemedText>
      </TouchableOpacity>
    </View>
  );

  // Render loading state
  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading customers...</ThemedText>
      </ThemedView>
    );
  }

  // Render error state
  if (error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={() => loadCustomers()}>
          <ThemedText style={styles.retryText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // Render empty state
  if (customers.length === 0) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText>No customers found</ThemedText>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => router.push("/customers/new")}
        >
          <ThemedText style={styles.addButtonText}>Add Customer</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // Render customers list
  return (
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <FlatList
          data={customers}
          renderItem={renderCustomer}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={["#0a7ea4"]}
              tintColor="#0a7ea4"
            />
          }
        />
        
        {/* We place the FAB outside of other scrollable content */}
        <FloatingActionButton />
      </ThemedView>
    </SafeAreaView>
  );
}

// Get screen dimensions for positioning
const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  listContent: {
    padding: 16,
    // Add bottom padding to ensure the last item isn't covered by the FAB
    paddingBottom: 80,
  },
  customerCard: {
    padding: 16,
    borderRadius: 8,
    backgroundColor: "#f5f5f5",
  },
  separator: {
    height: 12,
  },
  loadingText: {
    marginTop: 8,
  },
  errorText: {
    color: "red",
    marginBottom: 16,
  },
  retryButton: {
    padding: 12,
    backgroundColor: "#0a7ea4",
    borderRadius: 4,
  },
  retryText: {
    color: "white",
  },
  addButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#0a7ea4",
    borderRadius: 4,
  },
  addButtonText: {
    color: "white",
  },
  // FAB container to enforce proper positioning
  fabContainer: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 80 : 24, // Higher position on iOS for safe area
    right: 24,
    // Higher z-index for iOS to ensure visibility
    zIndex: 9999,
    elevation: Platform.OS === 'android' ? 8 : 0,
    // Ensure it's rendered
    width: 56,
    height: 56,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      }
    })
  },
  // Actual FAB button
  fab: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0a7ea4",
    justifyContent: "center",
    alignItems: "center",
    // iOS shadow needs to be on the view that has the background
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
      },
      android: {
        elevation: 8,
      }
    })
  },
  fabText: {
    color: "white",
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    // Fix alignment issues on iOS
    marginTop: Platform.OS === 'ios' ? -2 : 0,
  },
});
