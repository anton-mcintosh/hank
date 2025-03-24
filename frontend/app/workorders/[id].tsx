import React, { useEffect, useState } from "react";
import { StyleSheet, ActivityIndicator, TouchableOpacity, ScrollView, Alert, View } from "react-native";
import { useLocalSearchParams, Stack, router } from "expo-router";

import ThemedText from "../components/ThemedText";
import ThemedView from "../components/ThemedView";
import api from "../api";
import { Customer, Vehicle, WorkOrder, LineItem } from "../api/types";

export default function WorkorderDetailScreen() {
  const { id } = useLocalSearchParams();
  const workOrderId = id as string;
  
  const [workOrder, setWorkOrder] = useState<WorkOrder | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [vehicle, setVehicle] = useState<Vehicle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadWorkOrderData();
  }, [workOrderId]);

  const loadWorkOrderData = async () => {
    setLoading(true);
    setError(null);

    try {
      // Load work order details
      const workOrderData = await api.workorders.getById(workOrderId);
      setWorkOrder(workOrderData);
      
      // If we have customer and vehicle info in the work order response, use it
      if (workOrderData.customer) {
        setCustomer(workOrderData.customer);
      } else if (workOrderData.customer_id) {
        // Otherwise, fetch the customer if we have the ID
        try {
          const customerData = await api.customers.getById(workOrderData.customer_id);
          setCustomer(customerData);
        } catch (err) {
          console.warn("Could not load customer data:", err);
        }
      }
      
      // Same for vehicle
      if (workOrderData.vehicle) {
        setVehicle(workOrderData.vehicle);
      } else if (workOrderData.vehicle_id) {
        try {
          const vehicleData = await api.vehicles.getById(workOrderData.vehicle_id);
          setVehicle(vehicleData);
        } catch (err) {
          console.warn("Could not load vehicle data:", err);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load work order data");
      console.error("Error loading work order data:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteWorkOrder = () => {
    Alert.alert(
      "Delete Work Order",
      "Are you sure you want to delete this work order? This action cannot be undone.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await api.workorders.delete(workOrderId);
              Alert.alert("Success", "Work order deleted successfully", [
                { text: "OK", onPress: () => router.back() }
              ]);
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to delete work order");
            }
          }
        }
      ]
    );
  };

  const handleGenerateInvoice = () => {
    Alert.alert(
      "Generate Invoice",
      "Do you want to generate an invoice for this work order?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Generate PDF",
          onPress: async () => {
            try {
              await api.invoices.generateInvoice(workOrderId, {
                generate_pdf: true,
                send_email: false
              });
              Alert.alert("Success", "Invoice generated successfully");
              // Refresh data to see updated status
              loadWorkOrderData();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to generate invoice");
            }
          }
        }
      ]
    );
  };

  const handleGenerateEstimate = () => {
    Alert.alert(
      "Generate Estimate",
      "Do you want to generate an estimate for this work order?",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Generate PDF",
          onPress: async () => {
            try {
              await api.invoices.generateEstimate(workOrderId, {
                generate_pdf: true,
                send_email: false
              });
              Alert.alert("Success", "Estimate generated successfully");
              // Refresh data to see updated status
              loadWorkOrderData();
            } catch (err: any) {
              Alert.alert("Error", err.message || "Failed to generate estimate");
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
        <ThemedText style={styles.loadingText}>Loading work order data...</ThemedText>
      </ThemedView>
    );
  }

  if (error) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText style={styles.errorText}>{error}</ThemedText>
        <TouchableOpacity style={styles.retryButton} onPress={loadWorkOrderData}>
          <ThemedText style={styles.retryText}>Retry</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  if (!workOrder) {
    return (
      <ThemedView style={styles.centerContainer}>
        <ThemedText>Work order not found</ThemedText>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ThemedText style={styles.backButtonText}>Go Back</ThemedText>
        </TouchableOpacity>
      </ThemedView>
    );
  }

  // Get vehicle information from either the vehicle object or the vehicle_info
  const vehicleInfo = vehicle || workOrder.vehicle_info;
  const vehicleYear = vehicle?.year || workOrder.vehicle_info?.year;
  const vehicleMake = vehicle?.make || workOrder.vehicle_info?.make;
  const vehicleModel = vehicle?.model || workOrder.vehicle_info?.model;
  const vehicleVin = vehicle?.vin || workOrder.vehicle_info?.vin;
  const vehicleMileage = vehicle?.mileage || workOrder.vehicle_info?.mileage;
  
  // Get customer name
  const customerName = customer 
    ? `${customer.first_name} ${customer.last_name}`
    : workOrder.customer_id 
    ? "Loading customer..." 
    : "No customer assigned";

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen 
        options={{ 
          title: `Work Order #${workOrder.id.slice(0, 8)}`,
          headerRight: () => (
            <TouchableOpacity onPress={() => router.push(`/workorders/edit/${workOrderId}`)}>
              <ThemedText style={styles.editButton}>Edit</ThemedText>
            </TouchableOpacity>
          )
        }} 
      />
      
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Status Badge */}
        <ThemedView style={styles.statusContainer}>
          <ThemedText style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(workOrder.status) }
          ]}>
            {workOrder.status.toUpperCase()}
          </ThemedText>
        </ThemedView>
        
        {/* Customer Info Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Customer Information</ThemedText>
          
          <TouchableOpacity 
            style={styles.infoCard}
            onPress={() => customer && router.push(`/customers/${customer.id}`)}
            disabled={!customer}
          >
            <ThemedText type="defaultSemiBold">{customerName}</ThemedText>
            
            {customer && (
              <>
                <ThemedText>{customer.phone}</ThemedText>
                <ThemedText>{customer.email}</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </ThemedView>
        
        {/* Vehicle Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Vehicle Information</ThemedText>
          
          <TouchableOpacity 
            style={styles.infoCard}
            onPress={() => vehicle && router.push(`/vehicles/${vehicle.id}`)}
            disabled={!vehicle}
          >
            {vehicleYear && vehicleMake && vehicleModel ? (
              <ThemedText type="defaultSemiBold">
                {vehicleYear} {vehicleMake} {vehicleModel}
              </ThemedText>
            ) : (
              <ThemedText type="defaultSemiBold">Vehicle Information</ThemedText>
            )}
            
            {vehicleVin && (
              <ThemedText>VIN: {vehicleVin}</ThemedText>
            )}
            
            {vehicleMileage && (
              <ThemedText>Mileage: {typeof vehicleMileage === 'number' ? vehicleMileage.toLocaleString() : vehicleMileage}</ThemedText>
            )}
          </TouchableOpacity>
        </ThemedView>
        
        {/* Work Summary Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Work Summary</ThemedText>
          
          <ThemedView style={styles.summaryCard}>
            <ThemedText>{workOrder.work_summary || "No work summary available"}</ThemedText>
          </ThemedView>
        </ThemedView>
        
        {/* Line Items Section */}
        <ThemedView style={styles.section}>
          <ThemedText type="subtitle">Line Items</ThemedText>
          
          {workOrder.line_items.length === 0 ? (
            <ThemedText style={styles.emptyText}>No line items recorded</ThemedText>
          ) : (
            <View>
              {workOrder.line_items.map((item: LineItem, index: number) => (
                <ThemedView key={index} style={styles.lineItemCard}>
                  <ThemedView style={styles.lineItemHeader}>
                    <ThemedText type="defaultSemiBold">{item.description}</ThemedText>
                    <ThemedText style={styles.itemType}>{item.type.toUpperCase()}</ThemedText>
                  </ThemedView>
                  
                  <ThemedView style={styles.lineItemDetails}>
                    <ThemedText>Qty: {item.quantity}</ThemedText>
                    <ThemedText>Unit: ${item.unit_price.toFixed(2)}</ThemedText>
                    <ThemedText style={styles.lineItemTotal}>Total: ${item.total.toFixed(2)}</ThemedText>
                  </ThemedView>
                </ThemedView>
              ))}
              
              {/* Totals Section */}
              <ThemedView style={styles.totalsCard}>
                <ThemedView style={styles.totalRow}>
                  <ThemedText>Parts Total:</ThemedText>
                  <ThemedText>${workOrder.total_parts.toFixed(2)}</ThemedText>
                </ThemedView>
                
                <ThemedView style={styles.totalRow}>
                  <ThemedText>Labor Total:</ThemedText>
                  <ThemedText>${workOrder.total_labor.toFixed(2)}</ThemedText>
                </ThemedView>
                
                <ThemedView style={[styles.totalRow, styles.grandTotalRow]}>
                  <ThemedText type="defaultSemiBold">GRAND TOTAL:</ThemedText>
                  <ThemedText type="defaultSemiBold">${workOrder.total.toFixed(2)}</ThemedText>
                </ThemedView>
              </ThemedView>
            </View>
          )}
        </ThemedView>
        
        {/* Action Buttons */}
        <ThemedView style={styles.actionsContainer}>
          <TouchableOpacity 
            style={styles.actionButton}
            onPress={handleGenerateInvoice}
          >
            <ThemedText style={styles.actionButtonText}>Generate Invoice</ThemedText>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.actionButton, styles.estimateButton]}
            onPress={handleGenerateEstimate}
          >
            <ThemedText style={styles.actionButtonText}>Generate Estimate</ThemedText>
          </TouchableOpacity>
        </ThemedView>
        
        {/* Delete Button */}
        <TouchableOpacity 
          style={styles.deleteButton}
          onPress={handleDeleteWorkOrder}
        >
          <ThemedText style={styles.deleteButtonText}>Delete Work Order</ThemedText>
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
  infoCard: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginTop: 8,
  },
  summaryCard: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginTop: 8,
  },
  lineItemCard: {
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginTop: 8,
  },
  lineItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  itemType: {
    fontSize: 12,
    color: "#666",
    fontWeight: "600",
  },
  lineItemDetails: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  lineItemTotal: {
    fontWeight: "600",
  },
  totalsCard: {
    padding: 16,
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
    marginTop: 16,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 4,
  },
  grandTotalRow: {
    borderTopWidth: 1,
    borderTopColor: "#ccc",
    marginTop: 8,
    paddingTop: 8,
  },
  statusContainer: {
    alignItems: "flex-end",
    marginBottom: 16,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 4,
    fontSize: 14,
    fontWeight: "600",
    color: "white",
    overflow: "hidden",
  },
  actionsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 16,
  },
  actionButton: {
    flex: 1,
    backgroundColor: "#0a7ea4",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginRight: 8,
  },
  estimateButton: {
    backgroundColor: "#4a90e2",
    marginRight: 0,
    marginLeft: 8,
  },
  actionButtonText: {
    color: "white",
    fontWeight: "600",
  },
  emptyText: {
    fontStyle: "italic",
    color: "#999999",
    marginTop: 8,
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
