import React, { useState } from "react";
import { StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, View, ActivityIndicator } from "react-native";
import { router, Stack } from "expo-router";
import * as ImagePicker from 'expo-image-picker';
import { FontAwesome5 } from '@expo/vector-icons';

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
  const [customerImage, setCustomerImage] = useState<any>(null);
  const [extracting, setExtracting] = useState(false);

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

  // Function to take a photo
  const takePhoto = async () => {
    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        // Create a file object from the captured image URI
        const uri = result.assets[0].uri;
        const name = uri.split('/').pop() || 'image.jpg';
        const fileType = `image/${name.split('.').pop()}`;
        
        const file = {
          uri,
          name,
          type: fileType,
        };

        setCustomerImage(file);
        extractCustomerInfo(file);
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to capture image');
    }
  };

  // Function to pick image from library
  const pickImage = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });

      if (!result.canceled) {
        // Create a file object from the selected image URI
        const uri = result.assets[0].uri;
        const name = uri.split('/').pop() || 'image.jpg';
        const fileType = `image/${name.split('.').pop()}`;
        
        const file = {
          uri,
          name,
          type: fileType,
        };

        setCustomerImage(file);
        extractCustomerInfo(file);
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image');
    }
  };

  // Function to extract customer info from image
const extractCustomerInfo = async (imageFile) => {
  setExtracting(true);
  try {
    // Create form data with the image
    const formData = new FormData();
    formData.append('customer_image', imageFile);
    
    // Make API request to the extraction-only endpoint
    const response = await fetch('http://192.168.0.43:8000/api/v1/extract-customer-info', {
      method: 'POST',
      body: formData,
      headers: {
        'Accept': 'application/json',
      },
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || 'Failed to extract customer information');
    }
    
    // Get the response data
    const customerData = await response.json();
    
    // Update form with extracted data
    setCustomer({
      first_name: customerData.first_name,
      last_name: customerData.last_name,
      email: customerData.email,
      phone: customerData.phone,
      address: customerData.address,
    });
    
    Alert.alert('Success', 'Customer information extracted and populated in form. Review and click "Create Customer" to save.');
  } catch (error) {
    console.error('Error extracting customer info:', error);
    Alert.alert('Error', error.message || 'Failed to extract customer information');
  } finally {
    setExtracting(false);
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
        {/* Image Upload Section */}
        <ThemedView style={styles.imageSection}>
          <ThemedText style={styles.sectionTitle}>Scan Business Card or Form</ThemedText>
          <ThemedText style={styles.hint}>Take a photo of a business card or form to auto-fill customer details</ThemedText>
          
          <ThemedView style={styles.imageButtonsContainer}>
            <TouchableOpacity 
              style={styles.imageButton}
              onPress={takePhoto}
              disabled={extracting}
            >
              <FontAwesome5 name="camera" size={20} color="#fff" />
              <ThemedText style={styles.imageButtonText}>Take Photo</ThemedText>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.imageButton, styles.uploadButton]}
              onPress={pickImage}
              disabled={extracting}
            >
              <FontAwesome5 name="image" size={20} color="#fff" />
              <ThemedText style={styles.imageButtonText}>Upload Image</ThemedText>
            </TouchableOpacity>
          </ThemedView>
          
          {extracting && (
            <ThemedView style={styles.extractingContainer}>
              <ActivityIndicator size="large" color="#0a7ea4" />
              <ThemedText style={styles.extractingText}>Extracting customer information...</ThemedText>
            </ThemedView>
          )}

          {customerImage && !extracting && (
            <ThemedView style={styles.imagePreview}>
              <ThemedText style={styles.imagePreviewText}>Image selected</ThemedText>
              <FontAwesome5 name="check-circle" size={24} color="green" />
            </ThemedView>
          )}
        </ThemedView>

        {/* Customer Form */}
        <ThemedText style={styles.sectionTitle}>Customer Information</ThemedText>

        <ThemedText style={styles.label}>First Name *</ThemedText>
        <TextInput
          style={styles.input}
          value={customer.first_name}
          onChangeText={(value) => updateField("first_name", value)}
          placeholder="John"
          autoCapitalize="words"
          editable={!loading && !extracting}
        />

        <ThemedText style={styles.label}>Last Name *</ThemedText>
        <TextInput
          style={styles.input}
          value={customer.last_name}
          onChangeText={(value) => updateField("last_name", value)}
          placeholder="Doe"
          autoCapitalize="words"
          editable={!loading && !extracting}
        />

        <ThemedText style={styles.label}>Email *</ThemedText>
        <TextInput
          style={styles.input}
          value={customer.email}
          onChangeText={(value) => updateField("email", value)}
          placeholder="john.doe@example.com"
          keyboardType="email-address"
          autoCapitalize="none"
          editable={!loading && !extracting}
        />

        <ThemedText style={styles.label}>Phone</ThemedText>
        <TextInput
          style={styles.input}
          value={customer.phone}
          onChangeText={(value) => updateField("phone", value)}
          placeholder="(123) 456-7890"
          keyboardType="phone-pad"
          editable={!loading && !extracting}
        />

        <ThemedText style={styles.label}>Address</ThemedText>
        <TextInput
          style={[styles.input, styles.addressInput]}
          value={customer.address}
          onChangeText={(value) => updateField("address", value)}
          placeholder="123 Main St, Anytown, USA"
          multiline
          editable={!loading && !extracting}
        />

        <TouchableOpacity
          style={[
            styles.submitButton,
            (!isFormValid() || loading || extracting) && styles.disabledButton,
          ]}
          onPress={handleSubmit}
          disabled={!isFormValid() || loading || extracting}
        >
          <ThemedText style={styles.submitButtonText}>
            {loading ? "Creating..." : "Create Customer"}
          </ThemedText>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.cancelButton}
          onPress={() => router.back()}
          disabled={loading || extracting}
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
  imageSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
  },
  hint: {
    fontSize: 14,
    color: "#666",
    marginBottom: 16,
  },
  imageButtonsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  imageButton: {
    backgroundColor: "#0a7ea4",
    padding: 12,
    borderRadius: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
    marginRight: 8,
  },
  uploadButton: {
    backgroundColor: "#4a90e2",
    marginRight: 0,
    marginLeft: 8,
  },
  imageButtonText: {
    color: "white",
    marginLeft: 8,
    fontWeight: "600",
  },
  extractingContainer: {
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  extractingText: {
    marginTop: 8,
    color: "#0a7ea4",
  },
  imagePreview: {
    marginTop: 16,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
  },
  imagePreviewText: {
    fontSize: 16,
    color: "#333",
  },
});
