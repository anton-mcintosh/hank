# Auto Shop Invoice Editing Workflow Considerations

## Overview

This document outlines strategies for implementing an invoice editing workflow that allows users to adjust invoice data before finalizing and sending to customers. It focuses on a data-centric approach rather than editing the rendered documents directly.

## Data-First Editing Approach

Focusing on editing the underlying data rather than the rendered invoice offers several advantages:

1. **Structured Data Management**: Editing the underlying data (line items, prices, work descriptions) maintains data integrity and ensures consistency.

2. **Separation of Concerns**: Keeping data editing separate from presentation makes your system more maintainable.

3. **Multi-Format Support**: When users edit the data rather than the output, you can still generate both HTML and PDF formats without divergence.

## UI/UX Implementation Suggestions

### 1. Live Preview Panel

```
+-----------------------+------------------------+
|                       |                        |
|  DATA EDITING PANEL   |   INVOICE PREVIEW      |
|                       |                        |
|  [Customer Info]      |                        |
|  [Vehicle Info]       |   (Live HTML Preview   |
|  [Work Summary]       |    of the invoice      |
|  [Line Items]         |    updates as data     |
|                       |    is changed)         |
|                       |                        |
+-----------------------+------------------------+
|        [Save Draft]   [Generate Final Invoice] |
+----------------------------------------------+
```

- As users edit the work order data on the left, show a live HTML preview on the right
- This gives them the WYSIWYG experience while still editing structured data

### 2. Draft → Review → Finalize Workflow

Consider implementing a clear workflow:

1. **Draft Stage**: Work order is created and initial data is captured
2. **Review Stage**: User reviews and edits all data with invoice preview available
3. **Finalize Stage**: Invoice is generated and marked as final (with option to regenerate if needed)

### 3. Status-Based Permissions

```python
# Example status progression
STATUSES = [
    "draft",       # Initial creation, fully editable
    "reviewed",    # Technician has reviewed, editable
    "approved",    # Manager has approved, limited editing
    "invoiced",    # Invoice generated, very limited editing
    "paid"         # Payment received, read-only
]
```

Restrict which fields can be edited based on the work order status.

### 4. Batch Editing Controls for Line Items

For the line items section, which typically requires the most adjustment:

```
+-----------------------------------------------+
| Line Items                    [+ Add Item]    |
+-----------------------------------------------+
| Description | Type | Qty | Price | Total | 🗑️ |
+-----------------------------------------------+
| Oil Change  | Part | 1   | $25   | $25   | 🗑️ |
| Labor       | Labor| 0.5 | $100  | $50   | 🗑️ |
+-----------------------------------------------+
| [Apply Discount]  [Tax Options]  [Recalculate]|
+-----------------------------------------------+
```

- Allow inline editing of all fields
- Provide batch operations (apply discount, add tax)
- Auto-calculate totals

### 5. Custom Terms and Notes

```
+-----------------------------------------------+
| Terms & Conditions                            |
+-----------------------------------------------+
| [Select Template ▼]                           |
|                                               |
| Payment due within 30 days of invoice date.   |
| Late payments subject to 1.5% monthly fee.    |
|                                               |
+-----------------------------------------------+
```

- Allow users to select from pre-defined templates or add custom notes
- These can be stored separately from the core invoice data

## Technical Implementation Considerations

### 1. Real-time Preview

- **WebSocket Updates**: Use a WebSocket connection to update the preview as data changes
- **Client-side Templating**: Alternatively, use client-side templating with the same template structure as your server-side

### 2. Versioning

- Consider storing versions of the work order/invoice to allow reverting changes
- Example: `work_order_versions` table with `version_number`, `timestamp`, and JSON data

### 3. Audit Trail

- Track who made changes and when, especially important for business documents
- Example: `UPDATE work_orders SET editor=?, edited_at=NOW(), ...`

### 4. Database Design

- Your existing structure seems solid for this approach
- You may want to add fields like `last_edited_by`, `edit_notes`, or `version`

## Backend API Endpoints Needed

To support this workflow, you'd need the following API endpoints:

1. **GET /api/v1/work-orders/{id}/edit**
   - Load a work order in edit mode with all related data

2. **POST /api/v1/work-orders/{id}/preview**
   - Accept work order data and return HTML preview without saving

3. **PUT /api/v1/work-orders/{id}**
   - Update work order data

4. **POST /api/v1/work-orders/{id}/finalize**
   - Finalize the work order and generate the invoice

5. **POST /api/v1/work-orders/{id}/revert**
   - Revert to a previous version if versioning is implemented

## Example Frontend Code

Here's a simple React component example for a live-updating invoice editor:

```jsx
function WorkOrderEditor({ workOrderId }) {
  const [workOrder, setWorkOrder] = useState(null);
  const [previewHtml, setPreviewHtml] = useState('');
  
  // Load work order data
  useEffect(() => {
    async function loadData() {
      const data = await fetchWorkOrder(workOrderId);
      setWorkOrder(data);
      // Generate initial preview
      updatePreview(data);
    }
    loadData();
  }, [workOrderId]);
  
  // Update preview when data changes
  async function updatePreview(data) {
    const response = await fetch('/api/v1/preview-invoice', {
      method: 'POST',
      body: JSON.stringify(data)
    });
    const html = await response.text();
    setPreviewHtml(html);
  }
  
  // Handle data changes
  function handleDataChange(field, value) {
    const updatedData = {...workOrder, [field]: value};
    setWorkOrder(updatedData);
    updatePreview(updatedData);
  }
  
  // Handle line item changes
  function updateLineItem(index, field, value) {
    const newItems = [...workOrder.line_items];
    newItems[index][field] = value;
    
    // Recalculate totals if quantity or price changes
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total = newItems[index].quantity * newItems[index].unit_price;
    }
    
    const updatedData = {
      ...workOrder, 
      line_items: newItems,
      // Recalculate overall totals
      total_parts: calculatePartTotal(newItems),
      total_labor: calculateLaborTotal(newItems),
      total: calculateGrandTotal(newItems)
    };
    
    setWorkOrder(updatedData);
    updatePreview(updatedData);
  }
  
  return (
    <div className="work-order-editor">
      <div className="edit-panel">
        {/* Customer info editing fields */}
        {/* Vehicle info editing fields */}
        {/* Line items table with inline editing */}
        {/* ... */}
      </div>
      
      <div className="preview-panel">
        <iframe 
          srcDoc={previewHtml} 
          title="Invoice Preview" 
          width="100%" 
          height="600px"
        />
      </div>
      
      <div className="actions">
        <button onClick={() => saveWorkOrder(workOrder)}>Save Draft</button>
        <button onClick={() => generateFinalInvoice(workOrder)}>Generate Invoice</button>
      </div>
    </div>
  );
}
```

## Additional Features to Consider

### 1. User Roles and Permissions

Different staff members might need different access levels:

- **Technicians**: Can create and edit work details
- **Service Advisors**: Can modify pricing and customer-facing information
- **Managers**: Can approve discounts or special terms
- **Admin Staff**: Can finalize and send invoices

### 2. Templating System

Create multiple invoice templates for different purposes:

- Standard invoice
- Detailed invoice with parts breakdown
- Estimate template with disclaimers
- Receipt template for paid invoices

### 3. Integration Points

Consider how the invoice system integrates with:

- Inventory management (for parts)
- Customer management (for history and preferences)
- Accounting systems (for payment processing)
- Email systems (for delivery)

### 4. Mobile Considerations

If technicians will be entering data on mobile devices:

- Simplified mobile-first UI for data entry
- Defer preview to desktop/larger screens
- Consider offline capabilities for shops with poor connectivity

## Implementation Roadmap

1. **Phase 1**: Implement basic data editing with preview
2. **Phase 2**: Add workflow states and permissions
3. **Phase 3**: Implement versioning and audit trails
4. **Phase 4**: Add advanced features (templates, integrations)

## Conclusion

By focusing on a data-first approach with a clear workflow and intuitive UI, you can provide users with the flexibility to adjust invoices before finalizing while maintaining data integrity and generating consistent outputs across formats.

The live preview capability bridges the gap between structured data editing and visual document creation, giving users confidence in the final output while keeping your system maintainable and extensible.
