import React, { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert } from "react-native";
import { router, Stack } from "expo-router";

import ThemedText from "../components/ThemedText";
import ThemedView from "../components/ThemedView";
import api from "../api";
import { CustomerCreate } from "../../api/types";

export default function NewCustomerScreen() {
  const [customer, setCustomer] = useState<CustomerCreate>({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    address: "",
  });
  const [loading, setLoading] = useState(false);

  const updateField = (field: keyof CustomerCreate, value: string) => {
    setCustomer((prev) => ({ ...prev, [field]: value }));
  };

  const isFormValid = () => {
    // Basic validation
    return (
      customer.first_name.trim() !== "" &&
      customer.last_name.trim() !== "" &&
      customer.email.trim() !== ""
    );
  };

  const handleSubmit = async () => {
    if (!isFormValid()) {
      Alert.alert("Invalid Form", "Please fill out all required fields.");
      return;
    }

    setLoading(true);
    try {
      const newCustomer = await api.customers.create(customer);
      Alert.alert(
        "Success",
        `Customer ${newCustomer.first_name} ${newCustomer.last_name} was created successfully.`,
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert(
        "Error",
        error.message || "Failed to create customer. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <Stack.Screen options={{ 
        title: "New Customer",
        headerBackTitle: "Back",
        headerBackButtonDisplay: "minimal",
      }} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <ThemedText style={styles.label}>First Name *</ThemedText>
        <TextInput
          style={styles.input}
          value={customer.first_name}
          onChangeText={(value) => updateField("first_name", value)}
          placeholder="John"
          autoCapitalize="words"
          editable={!loading}
        />

        <ThemedText style={styles.label}>Last Name *</ThemedText>
        <TextInput
          style={styles.input}
          value={customer.last_name}
          onChangeText={(value) => updateField("last_name", value)}
          placeholder="Doe"
          autoCapitalize="words"
          editable={!loading}
        />

        <ThemedText style={styles.label}>Email *</ThemedText>
        <TextInput
          style={styles.input}
          value={customer.email}
          onChangeText={(value) => updateField("email", value)}
          placeholder="john.doe@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading}
        />

        <ThemedText style={styles.label}>Phone</ThemedText>
        <TextInput
          style={styles.input}
          value={customer.phone}
          onChangeText={(value) => updateField("phone", value)}
          placeholder="(123) 456-7890"
          keyboardType="phone-pad"
          editable={!loading}
        />

        <ThemedText style={styles.label}>Address</ThemedText>
        <TextInput
          style={[styles.input, styles.addressInput]}
          value={customer.address}
          onChangeText={(value) => updateField("address", value)}
          placeholder="123 Main St, Anytown, USA"
          multiline
          editable={!loading}
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isFormValid() || loading) && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid() || loading}
        >
          <ThemedText style={styles.submitButtonText}>
            {loading ? "Creating..." : "Create Customer"}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={loading}
        >
          <ThemedText style={styles.cancelButtonText}>Cancel</ThemedText>
        </TouchableOpacity>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  label: {
    marginBottom: 4,
    marginTop: 16,
  },
  input: {
    backgroundColor: "#f5f5f5",
    padding: 12,
    borderRadius: 8,
    fontSize: 16,
  },
  addressInput: {
    height: 80,
    textAlignVertical: "top",
  },
  submitButton: {
    backgroundColor: "#0a7ea4",
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 24,
  },
  disabledButton: {
    backgroundColor: "#cccccc",
  },
  submitButtonText: {
    color: "white",
    fontWeight: "600",
    fontSize: 16,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 12,
  },
  cancelButtonText: {
    color: "#0a7ea4",
    fontWeight: "600",
    fontSize: 16,
  },
});
