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
import { styles } from "../constants/PageStyles";

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
    <ThemedView
      style={styles.customerCard}
      lightColor="#ffffff"
      darkColor="#333333"
      >
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
    </ThemedView>
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
