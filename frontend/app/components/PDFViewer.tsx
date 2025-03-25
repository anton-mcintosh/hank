import React, { useState } from 'react';
import { 
  Modal, 
  View, 
  StyleSheet, 
  TouchableOpacity, 
  ActivityIndicator,
  Platform,
  Alert,
  Linking,
  SafeAreaView
} from 'react-native';
import { WebView } from 'react-native-webview';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import { FontAwesome, MaterialIcons } from '@expo/vector-icons';

import ThemedText from './ThemedText';
import ThemedView from './ThemedView';

interface PDFViewerProps {
  visible: boolean;
  onClose: () => void;
  pdfUrl: string;
  title?: string;
  baseApiUrl: string;
}

export default function PDFViewer({ 
  visible, 
  onClose, 
  pdfUrl, 
  title = 'Document',
  baseApiUrl
}: PDFViewerProps) {
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Function to download the PDF
  const downloadPDF = async () => {
    if (!pdfUrl) return;
    
    setDownloading(true);
    setError(null);
    
    try {
      // The pdfUrl might be a relative path, so we need to construct the full URL
      const fullUrl = pdfUrl.startsWith('http') 
        ? pdfUrl 
        : `${baseApiUrl}${pdfUrl.startsWith('/') ? '' : '/'}${pdfUrl}`;

      // Get filename from URL
      const filename = pdfUrl.split('/').pop() || 'invoice.pdf';
      
      if (Platform.OS === 'web') {
        // On web, simply open the PDF in a new tab
        window.open(fullUrl, '_blank');
        setDownloading(false);
        return;
      }

      // Check if the directory exists, create if not
      const downloadDirectory = FileSystem.documentDirectory + 'downloads/';
      const dirInfo = await FileSystem.getInfoAsync(downloadDirectory);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(downloadDirectory, { intermediates: true });
      }

      // Download the file
      const downloadPath = downloadDirectory + filename;
      const downloadResult = await FileSystem.downloadAsync(fullUrl, downloadPath);

      if (downloadResult.status === 200) {
        // Share the file
        if (await Sharing.isAvailableAsync()) {
          await Sharing.shareAsync(downloadPath, {
            mimeType: 'application/pdf',
            dialogTitle: 'Save or share PDF',
            UTI: 'com.adobe.pdf' // iOS only
          });
        } else {
          Alert.alert('Error', 'Sharing is not available on this device');
        }
      } else {
        setError('Failed to download the PDF');
      }
    } catch (err) {
      console.error('Error downloading PDF:', err);
      setError('Error downloading the PDF. Please try again.');
    } finally {
      setDownloading(false);
    }
  };

  // Determine the source URL for the WebView
  const getSourceUrl = () => {
    if (!pdfUrl) return '';
    
    const constructedUrl = !pdfUrl ? '' :
      pdfUrl.startsWith('http') ? pdfUrl :
        `${baseApiUrl}${pdfUrl.startsWith('/') ? '' : '/'}${pdfUrl}`;
    console.log("PDF Viewer Url:", {
      baseApiUrl,
      pdfUrl,
      constructedUrl
    });
    // If it's already a full URL, use it
    if (pdfUrl.startsWith('http')) {
      return pdfUrl;
    }

    if (pdfUrl.startsWith('/')) {
      return `${baseApiUrl}${pdfUrl}`;
    
    // Otherwise, construct a full URL
    return `${baseApiUrl}${pdfUrl.startsWith('/') ? '' : '/'}${pdfUrl}`;
  }};

  return (
    <Modal
      visible={visible}
      animationType="slide"
      onRequestClose={onClose}
      presentationStyle="pageSheet"
    >
      <SafeAreaView style={styles.container}>
        <ThemedView style={styles.header}>
          <View style={styles.titleContainer}>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialIcons name="close" size={24} color="#0a7ea4" />
            </TouchableOpacity>
            <ThemedText type="defaultSemiBold" style={styles.title}>
              {title}
            </ThemedText>
          </View>
          
          <TouchableOpacity 
            onPress={downloadPDF} 
            style={styles.downloadButton}
            disabled={downloading || !pdfUrl}
          >
            {downloading ? (
              <ActivityIndicator size="small" color="white" />
            ) : (
              <>
                <FontAwesome name="download" size={16} color="white" />
                <ThemedText style={styles.downloadText}>Download</ThemedText>
              </>
            )}
          </TouchableOpacity>
        </ThemedView>

        {error ? (
          <ThemedView style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={48} color="red" />
            <ThemedText style={styles.errorText}>{error}</ThemedText>
            <TouchableOpacity 
              style={styles.retryButton}
              onPress={() => {
                setError(null);
                setLoading(true);
              }}
            >
              <ThemedText style={styles.retryText}>Retry</ThemedText>
            </TouchableOpacity>
          </ThemedView>
        ) : (
          <View style={styles.webViewContainer}>
            {loading && (
              <View style={styles.loadingContainer}>
                <ActivityIndicator size="large" color="#0a7ea4" />
                <ThemedText style={styles.loadingText}>Loading PDF...</ThemedText>
              </View>
            )}
            
            <WebView
              source={{ uri: getSourceUrl() }}
              style={styles.webView}
              onLoadEnd={() => setLoading(false)}
              onError={() => {
                setLoading(false);
                setError('Failed to load the PDF');
              }}
              originWhitelist={['*']}
            />
          </View>
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'white',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  closeButton: {
    padding: 8,
  },
  title: {
    fontSize: 18,
    marginLeft: 8,
  },
  downloadButton: {
    backgroundColor: '#0a7ea4',
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 4,
  },
  downloadText: {
    color: 'white',
    marginLeft: 8,
    fontWeight: '600',
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: 12,
    color: '#0a7ea4',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  errorText: {
    marginTop: 16,
    textAlign: 'center',
    color: 'red',
    marginBottom: 24,
  },
  retryButton: {
    backgroundColor: '#0a7ea4',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 4,
  },
  retryText: {
    color: 'white',
    fontWeight: '600',
  },
});
