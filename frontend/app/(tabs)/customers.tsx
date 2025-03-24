import React, { useEffect, useState } from "react";
import { StyleSheet, FlatList, View, ActivityIndicator, TouchableOpacity } from "react-native";
import { router } from "expo-router";

import ThemedText from "../components/ThemedText";
import ThemedView from "../components/ThemedView";
import api from "../api";
import { Customer } from "../api/types";

export default function CustomersScreen() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load customers when the component mounts
  useEffect(() => {
    loadCustomers();
  }, []);

  // Function to load customers from the API
  const loadCustomers = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.customers.getAll();
      setCustomers(data);
    } catch (err: any) {
      setError(err.message || "Failed to load customers");
      console.error("Error loading customers:", err);
    } finally {
      setLoading(false);
    }
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
        <TouchableOpacity style={styles.retryButton} onPress={loadCustomers}>
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
    <ThemedView style={styles.container}>
      <FlatList
        data={customers}
        renderItem={renderCustomer}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => router.push("/customers/new")}
      >
        <ThemedText style={styles.floatingButtonText}>+</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  listContent: {
    padding: 16,
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
  floatingButton: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: "#0a7ea4",
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  floatingButtonText: {
    color: "white",
    fontSize: 24,
  },
});
