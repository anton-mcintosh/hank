import React, { useEffect, useState } from "react";
import { 
  StyleSheet, 
  FlatList, 
  View, 
  ActivityIndicator, 
  TouchableOpacity, 
  RefreshControl, 
  Platform,
  SafeAreaView,
  Dimensions
} from "react-native";
import { router } from "expo-router";

import ThemedText from "../components/ThemedText";
import ThemedView from "../components/ThemedView";
import api from "../api";
import { WorkOrder, Vehicle } from "../api/types";
import { styles } from "../constants/PageStyles";

export default function WorkordersScreen() {
  const [workorders, setWorkorders] = useState<WorkOrder[]>([]);
  const [customerName, setCustomerName] = useState<string>('');
  const [vehiclesMap, setVehiclesMap] = useState<Record<string, Vehicle>>({});
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load work orders when the component mounts
  useEffect(() => {
    loadWorkorders();
  }, []);

  // Function to load work orders from the API
  const loadWorkorders = async (isRefreshing = false) => {
    if (isRefreshing) {
      setRefreshing(true);
    } else {
      setLoading(true);
    }
    setError(null);
    
    try {
      const data = await api.workorders.getAll();
      setWorkorders(data);

      // Get customer's first name for car display
      const names = data.map(wo => wo.customer_id as string);
      try {
        const customer = await api.customers.getById(names[0]);
        setCustomerName(`${customer.first_name}`);
      } catch (err) {
        console.warn(`Failed to load customer ${names[0]}:`, err);
      }
      
      // Load vehicle data for each work order with a vehicle_id
      const vehicleIds = data
        .filter(wo => wo.vehicle_id)
        .map(wo => wo.vehicle_id as string);
      
      // If there are vehicle IDs to fetch
      if (vehicleIds.length > 0) {
        // Create a map to store vehicles by ID
        const vehicleData: Record<string, Vehicle> = {};
        
        // Fetch each vehicle sequentially
        // Note: You could optimize this with Promise.all if your API supports it
        for (const vehicleId of vehicleIds) {
          try {
            const vehicle = await api.vehicles.getById(vehicleId);
            vehicleData[vehicleId] = vehicle;
          } catch (err) {
            console.warn(`Failed to load vehicle ${vehicleId}:`, err);
          }
        }
        
        setVehiclesMap(vehicleData);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load work orders");
      console.error("Error loading work orders:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = () => {
    loadWorkorders(true);
  };

  // Render a work order card
  const renderWorkorder = ({ item }: { item: WorkOrder }) => {
    // Get vehicle if available
    const vehicle = item.vehicle_id ? vehiclesMap[item.vehicle_id] : undefined;
    let vehicleDisplay = "No vehicle information";
    
    if (vehicle) {
      vehicleDisplay = `${vehicle.year || ''} ${vehicle.make || ''} ${vehicle.model || ''}`.trim();
    } else if (item.vehicle_info && Object.keys(item.vehicle_info).length > 0) {
      const vi = item.vehicle_info;
      vehicleDisplay = `${vi.year || ''} ${vi.model || ''}`.trim();
    }
    
    // If vehicleDisplay is empty after trimming, show default message
    if (!vehicleDisplay) {
      vehicleDisplay = "No vehicle information";
    }
    
    return (
      <ThemedView
        style={styles.workorderCard}
        lightColor="#ffffff"
        darkColor="#333333"
        >
      <TouchableOpacity 
        onPress={() => router.push(`/workorders/${item.id}`)}
      >
        <ThemedText type="defaultSemiBold">
          Order #{item.id.slice(0, 8)}
        </ThemedText>
        <ThemedText type="defaultSemiBold">{customerName}'s </ThemedText>
        <ThemedText>{vehicleDisplay}</ThemedText>
        <ThemedView 
            style={styles.workOrderFooter}
            lightColor="#ffffff"
            darkColor="#333333"
          >
          <ThemedText style={[
            styles.statusBadge,
            { backgroundColor: getStatusColor(item.status) }
          ]}>
            {item.status.toUpperCase()}
          </ThemedText>
          <ThemedText style={styles.totalText}>
            ${item.total.toFixed(2)}
          </ThemedText>
        </ThemedView>
      </TouchableOpacity>
      </ThemedView>
    );
  };

  // Floating action button component
  const FloatingActionButton = () => (
    <View style={styles.fabContainer}>
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/workorders/new")}
        activeOpacity={0.8}
      >
        <ThemedText style={styles.fabText}>+</ThemedText>
      </TouchableOpacity>
    </View>
  );

  // Helper function for status colors
  const getStatusColor = (status: string): string => {
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
  };

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
        <TouchableOpacity style={styles.retryButton} onPress={() => loadWorkorders()}>
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
    <SafeAreaView style={styles.safeArea}>
      <ThemedView style={styles.container}>
        <FlatList
          data={workorders}
          renderItem={renderWorkorder}
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

// const styles = StyleSheet.create({
//   safeArea: {
//     flex: 1,
//     backgroundColor: '#fff',
//   },
//   container: {
//     flex: 1,
//     position: 'relative',
//   },
//   centerContainer: {
//     flex: 1,
//     justifyContent: "center",
//     alignItems: "center",
//     padding: 16,
//   },
//   listContent: {
//     padding: 16,
//     // Add bottom padding to ensure the last item isn't covered by the FAB
//     paddingBottom: 80,
//   },
//   workorderCard: {
//     padding: 16,
//     borderRadius: 8,
//     backgroundColor: "#f5f5f5",
//   },
//   workOrderFooter: {
//     marginTop: 8,
//     flexDirection: "row",
//     justifyContent: "space-between",
//     alignItems: "center",
//   },
//   statusBadge: {
//     paddingHorizontal: 8,
//     paddingVertical: 4,
//     borderRadius: 4,
//     fontSize: 12,
//     overflow: "hidden",
//     color: "white",
//   },
//   totalText: {
//     fontWeight: "600",
//   },
//   separator: {
//     height: 12,
//   },
//   loadingText: {
//     marginTop: 8,
//   },
//   errorText: {
//     color: "red",
//     marginBottom: 16,
//   },
//   retryButton: {
//     padding: 12,
//     backgroundColor: "#0a7ea4",
//     borderRadius: 4,
//   },
//   retryText: {
//     color: "white",
//   },
//   addButton: {
//     marginTop: 16,
//     padding: 12,
//     backgroundColor: "#0a7ea4",
//     borderRadius: 4,
//   },
//   addButtonText: {
//     color: "white",
//   },
//   // FAB container to enforce proper positioning
//   fabContainer: {
//     position: 'absolute',
//     bottom: Platform.OS === 'ios' ? 80 : 24, // Higher position on iOS for safe area
//     right: 24,
//     // Higher z-index for iOS to ensure visibility
//     zIndex: 9999,
//     elevation: Platform.OS === 'android' ? 8 : 0,
//     // Ensure it's rendered
//     width: 56,
//     height: 56,
//     ...Platform.select({
//       ios: {
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.3,
//         shadowRadius: 4,
//       }
//     })
//   },
//   // Actual FAB button
//   fab: {
//     width: 56,
//     height: 56,
//     borderRadius: 28,
//     backgroundColor: "#0a7ea4",
//     justifyContent: "center",
//     alignItems: "center",
//     // iOS shadow needs to be on the view that has the background
//     ...Platform.select({
//       ios: {
//         shadowColor: "#000",
//         shadowOffset: { width: 0, height: 4 },
//         shadowOpacity: 0.3,
//         shadowRadius: 4,
//       },
//       android: {
//         elevation: 8,
//       }
//     })
//   },
//   fabText: {
//     color: "white",
//     fontSize: 24,
//     fontWeight: '700',
//     textAlign: 'center',
//     // Fix alignment issues on iOS
//     marginTop: Platform.OS === 'ios' ? -2 : 0,
//   },
// });
