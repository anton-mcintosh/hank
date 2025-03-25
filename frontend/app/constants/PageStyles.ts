import { StyleSheet, Platform } from 'react-native';

export const styles = StyleSheet.create({
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

  },
  workorderCard: {
    padding: 16,
    borderRadius: 8,
  },
  workOrderFooter: {
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    fontSize: 12,
    overflow: "hidden",
    color: "white",
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
