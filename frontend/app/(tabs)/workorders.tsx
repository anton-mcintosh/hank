import React, { useEffect, useState } from "react";
import { StyleSheet, FlatList, View, ActivityIndicator, TouchableOpacity } from "react-native";
import { router } from "expo-router";

import ThemedText from "../components/ThemedText";
import ThemedView from "../components/ThemedView";
import api from "../api";
import { WorkOrder } from "../api/types";

export default function WorkordersScreen() {
  const [workorders, setWorkorders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load customers when the component mounts
  useEffect(() => {
    loadWorkorders();
  }, []);

  // Function to load customers from the API
  const loadWorkorders = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const data = await api.workorders.getAll();
      setWorkorders(data);
    } catch (err: any) {
      setError(err.message || "Failed to load work orders");
      console.error("Error loading work orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Render a work order card
  const renderWorkorder = ({ item }: { item: WorkOrder }) => (
    <TouchableOpacity 
      style={styles.workorderCard}
      onPress={() => router.push(`/workorders/${item.id}`)}
    >
      <ThemedText type="defaultSemiBold">
        {item.id}
      </ThemedText>
      <ThemedText>{item.vehicle_info}</ThemedText>
    </TouchableOpacity>
  );

  // Render loading state
  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading work orders...</ThemedText>
      </ThemedView>
    );
  }

  // Render error state
  if (error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadWorkorders}>
          <ThemedText style={styles.retryText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // Render empty state
  if (workorders.length === 0) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText>No work orders found</ThemedText>
        <TouchableOpacity 
          style={styles.addButton} 
          onPress={() => router.push("/workorders/new")}
        >
          <ThemedText style={styles.addButtonText}>Create Work Order</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // Render work orders list
  return (
    <ThemedView style={styles.container}>
      <FlatList
        data={workorders}
        renderItem={renderWorkorder}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
      <TouchableOpacity 
        style={styles.floatingButton}
        onPress={() => router.push("/workorders/new")}
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
  workorderCard: {
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
