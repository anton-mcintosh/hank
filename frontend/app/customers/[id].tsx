import React, { useEffect, useState } from "react";
import { StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert } from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";

import ThemedText from "../components/ThemedText";
import ThemedView from "../components/ThemedView";
import api from "../api";
import { Customer, Vehicle, WorkOrder } from "../api/types";

export default function CustomerDetailScreen() {
  const { id } = useLocalSearchParams();
  const customerId = id as string;
  
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [workOrders, setWorkOrders] = useState<WorkOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadCustomerData();
  }, [customerId]);

  const loadCustomerData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load customer details
      const customerData = await api.customers.getById(customerId);
      setCustomer(customerData);

      // Load customer's vehicles
      const vehiclesData = await api.vehicles.getByCustomer(customerId);
      setVehicles(vehiclesData);

      // Load customer's work orders
      const workOrdersData = await api.workorders.getByCustomer(customerId);
      setWorkOrders(workOrdersData);
    } catch (err: any) {
      setError(err.message || "Failed to load customer data");
      console.error("Error loading customer data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteCustomer = () => {
    Alert.alert(
      "Delete Customer",
      "Are you sure you want to delete this customer? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.customers.delete(customerId);
              Alert.alert("Success", "Customer deleted successfully", [
                { text: "OK", onPress: () => router.back() }
              ]);
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete customer");
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ActivityIndicator size="large" />
        <ThemedText style={styles.loadingText}>Loading customer data...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadCustomerData}>
          <ThemedText style={styles.retryText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (!customer) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText>Customer not found</ThemedText>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: `${customer.first_name} ${customer.last_name}`,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push(`/customers/edit/${customerId}`)}>
              <ThemedText style={styles.editButton}>Edit</ThemedText>
            </TouchableOpacity>
          )
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Customer Info Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Customer Information</ThemedText>
          
          <ThemedView style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Name:</ThemedText>
            <ThemedText>{customer.first_name} {customer.last_name}</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Email:</ThemedText>
            <ThemedText>{customer.email}</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Phone:</ThemedText>
            <ThemedText>{customer.phone}</ThemedText>
          </ThemedView>
          
          <ThemedView style={styles.infoRow}>
            <ThemedText style={styles.infoLabel}>Address:</ThemedText>
            <ThemedText>{customer.address}</ThemedText>
          </ThemedView>
        </ThemedView>
        
        {/* Vehicles Section */}
        <ThemedView style={styles.section}>
          <ThemedView style={styles.sectionHeader}>
            <ThemedText type="subtitle">Vehicles</ThemedText>
            <TouchableOpacity 
              onPress={() => router.push(`/vehicles/new?customerId=${customerId}`)}
            >
              <ThemedText style={styles.addButton}>+ Add</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          {vehicles.length === 0 ? (
            <ThemedText style={styles.emptyText}>No vehicles found</ThemedText>
          ) : (
            vehicles.map(vehicle => (
              <TouchableOpacity 
                key={vehicle.id} 
                style={styles.vehicleCard}
                onPress={() => router.push(`/vehicles/${vehicle.id}`)}
              >
                <ThemedText type="defaultSemiBold">
                  {vehicle.year} {vehicle.make} {vehicle.model}
                </ThemedText>
                {vehicle.vin && (
                  <ThemedText>VIN: {vehicle.vin}</ThemedText>
                )}
                {vehicle.mileage && (
                  <ThemedText>Mileage: {vehicle.mileage.toLocaleString()}</ThemedText>
                )}
              </TouchableOpacity>
            ))
          )}
        </ThemedView>
        
        {/* Work Orders Section */}
        <ThemedView style={styles.section}>
          <ThemedView style={styles.sectionHeader}>
            <ThemedText type="subtitle">Work Orders</ThemedText>
            <TouchableOpacity 
              onPress={() => router.push(`/workorders/new?customerId=${customerId}`)}
            >
              <ThemedText style={styles.addButton}>+ Add</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          {workOrders.length === 0 ? (
            <ThemedText style={styles.emptyText}>No work orders found</ThemedText>
          ) : (
            workOrders.map(order => (
              <TouchableOpacity 
                key={order.id} 
                style={styles.workOrderCard}
                onPress={() => router.push(`/workorders/${order.id}`)}
              >
                <ThemedView style={styles.workOrderHeader}>
                  <ThemedText type="defaultSemiBold">
                    Order #{order.id.slice(0, 8)}
                  </ThemedText>
                  <ThemedText style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(order.status) }
                  ]}>
                    {order.status.toUpperCase()}
                  </ThemedText>
                </ThemedView>
                
                <ThemedText numberOfLines={2} style={styles.workSummary}>
                  {order.work_summary || "No work summary"}
                </ThemedText>
                
                <ThemedText style={styles.orderTotal}>
                  Total: ${order.total.toFixed(2)}
                </ThemedText>
              </TouchableOpacity>
            ))
          )}
        </ThemedView>
        
        {/* Delete Button */}
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDeleteCustomer}
        >
          <ThemedText style={styles.deleteButtonText}>Delete Customer</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

// Helper function to get color based on work order status
function getStatusColor(status: string): string {
  switch (status.toLowerCase()) {
    case 'draft':
      return '#aaaaaa';
    case 'pending':
      return '#f5a623';
    case 'processed':
      return '#4a90e2';
    case 'invoiced':
      return '#7ed321';
    case 'estimated':
      return '#50e3c2';
    case 'error':
      return '#d0021b';
    default:
      return '#aaaaaa';
  }
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
  scrollContent: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: "row",
    marginBottom: 8,
  },
  infoLabel: {
    width: 80,
    fontWeight: "600",
  },
  vehicleCard: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 12,
  },
  workOrderCard: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginBottom: 12,
  },
  workOrderHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    color: "white",
  },
  workSummary: {
    marginBottom: 8,
  },
  orderTotal: {
    textAlign: "right",
    fontWeight: "600",
  },
  emptyText: {
    fontStyle: "italic",
    color: "#999999",
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
  backButton: {
    marginTop: 16,
    padding: 12,
    backgroundColor: "#0a7ea4",
    borderRadius: 4,
  },
  backButtonText: {
    color: "white",
  },
  editButton: {
    color: "#0a7ea4",
    fontSize: 16,
    fontWeight: "600",
    padding: 8,
  },
  addButton: {
    color: "#0a7ea4",
    fontWeight: "600",
  },
  deleteButton: {
    backgroundColor: "#ff3b30",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
    marginBottom: 40,
  },
  deleteButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
});
