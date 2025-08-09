# 🏷️ Auto-SKU Generator Guide

## 📋 **Overview**

The Auto-SKU Generator creates deterministic, unique SKUs based on product name, category, and materials. It runs server-side to ensure uniqueness and follows a consistent format.

## 🎯 **SKU Format**

### **Pattern**: `CAT-PRO-MC-###`

| Component | Description | Example |
|-----------|-------------|---------|
| **CAT** | Category prefix (3 consonants) | `MNT` (Miniatures) |
| **PRO** | Product name prefix (3 consonants) | `CUP` (Coffee Cup) |
| **MC** | Material code (2 letters) | `PL` (PLA) |
| **###** | Sequence number (001-999) | `007` |

### **Example SKUs**
- `MNT-CUP-PL-001` - Miniature Coffee Cup in PLA
- `FNC-BRK-AB-002` - Functional Bracket in ABS
- `TLS-HLD-PE-001` - Tool Holder in PETG

## 🔧 **Category Prefixes**

| Category | Prefix | Description |
|----------|--------|-------------|
| Miniatures | `MNT` | Miniature models |
| Functional Parts | `FNC` | Functional components |
| Prototypes | `PRT` | Prototype items |
| Decorative Items | `DCR` | Decorative pieces |
| Tools & Accessories | `TLS` | Tools and accessories |
| Educational Models | `EDC` | Educational items |
| Custom Parts | `CST` | Custom components |

## 🧱 **Material Codes**

| Material | Code | Notes |
|----------|------|-------|
| PLA | `PL` | Standard PLA |
| PLA+ | `PP` | Enhanced PLA |
| ABS | `AB` | Standard ABS |
| PETG | `PE` | Standard PETG |
| TPU | `TP` | Flexible TPU |
| ASA | `AS` | UV-resistant ABS |
| PC | `PC` | Polycarbonate |
| Nylon | `NY` | Standard Nylon |
| Wood Fill | `WF` | Wood-filled filament |
| Metal Fill | `MF` | Metal-filled filament |
| Carbon Fiber | `CF` | Carbon fiber reinforced |
| Resin | `RE` | UV-cure resin |

### **Composite Materials**
| Material | Code | Description |
|----------|------|-------------|
| PETG-CF | `PF` | PETG with Carbon Fiber |
| PLA-CF | `PC` | PLA with Carbon Fiber |
| ABS-CF | `AC` | ABS with Carbon Fiber |
| Nylon-CF | `NC` | Nylon with Carbon Fiber |
| TPU-CF | `TC` | TPU with Carbon Fiber |
| ASA-CF | `SC` | ASA with Carbon Fiber |
| PC-CF | `CC` | PC with Carbon Fiber |

## 🚀 **Usage**

### **1. Manual Generation**
1. Open product form (create or edit)
2. Enter product name and select category
3. Add materials (optional)
4. Click "Generate SKU" button
5. SKU is automatically filled in

### **2. Automatic Generation**
- SKU is auto-generated when saving if field is empty
- Uses same logic as manual generation
- Ensures uniqueness with collision detection

### **3. API Endpoint**
```typescript
POST /api/products/generate-sku
{
  "productName": "Coffee Cup",
  "category": "Miniatures",
  "materials": ["PLA", "PLA+"],
  "preview": false
}

Response: { "sku": "MNT-CUP-PL-001" }
```

## 🔍 **SKU Generation Logic**

### **1. Category Prefix**
- Uses predefined mapping for known categories
- Falls back to first 3 consonants for unknown categories
- Pads with 'X' if insufficient consonants

### **2. Product Name Prefix**
- Extracts first 3 consonants from product name
- Converts to uppercase
- Pads with 'X' if insufficient consonants

### **3. Material Code**
- Uses primary material (first in array)
- Prioritizes PLA over other materials
- Falls back to first 2 letters if no match
- Uses 'XX' if no materials specified

### **4. Sequence Number**
- Starts from 001
- Increments until unique SKU found
- Maximum 999 per prefix combination
- Falls back to timestamp suffix if all taken

## 🛡️ **Collision Detection**

### **Database Check**
- Checks existing SKUs in database
- Ensures uniqueness across all products
- Handles concurrent generation safely

### **Fallback Strategy**
1. Try sequence 001-999
2. If all taken, use timestamp suffix
3. If generation fails, use legacy format

## 📝 **Examples**

### **Example 1: Coffee Cup**
- **Product**: "Coffee Cup"
- **Category**: "Miniatures"
- **Materials**: ["PLA"]
- **Generated SKU**: `MNT-CUP-PL-001`

### **Example 2: Bracket**
- **Product**: "Support Bracket"
- **Category**: "Functional Parts"
- **Materials**: ["ABS", "Carbon Fiber"]
- **Generated SKU**: `FNC-SPR-AB-001`

### **Example 3: Tool Holder**
- **Product**: "Tool Holder"
- **Category**: "Tools & Accessories"
- **Materials**: ["PETG"]
- **Generated SKU**: `TLS-TLH-PE-001`

## 🔧 **Technical Implementation**

### **Server-Side Functions**
```typescript
// Generate unique SKU with collision detection
generateUniqueSku(productName, category, materials)

// Generate preview SKU (no database check)
generateSkuPreview(productName, category, materials)

// Validate SKU format
validateSkuFormat(sku)

// Parse SKU components
parseSku(sku)
```

### **API Endpoint**
- **Route**: `/api/products/generate-sku`
- **Method**: POST
- **Authentication**: Not required (public endpoint)
- **Rate Limiting**: Consider implementing for production

## 🎨 **UI Integration**

### **Form Button**
- Located next to SKU input field
- Disabled until product name and category are set
- Shows loading state during generation
- Displays success/error toasts

### **Auto-Generation**
- Triggers on form submission if SKU is empty
- Uses same generation logic
- Graceful fallback to legacy format

## 🔒 **Safety Features**

### **Validation**
- Requires product name and category
- Validates SKU format
- Handles edge cases gracefully

### **Error Handling**
- Database connection failures
- Invalid input data
- Generation failures
- Graceful fallbacks

### **Performance**
- Efficient database queries
- Minimal API calls
- Cached material mappings

## 🔮 **Future Enhancements**

### **Potential Features**
- **Bulk SKU Generation**: Generate SKUs for multiple products
- **SKU Templates**: Custom SKU formats per category
- **SKU History**: Track SKU generation history
- **SKU Analytics**: Usage statistics and patterns

### **Integration Opportunities**
- **Barcode Integration**: Link SKUs to barcode generation
- **Inventory System**: SKU-based inventory tracking
- **Order Management**: SKU-based order processing
- **Reporting**: SKU-based analytics and reports

## 📊 **Best Practices**

### **1. Naming Conventions**
- Use descriptive product names
- Be consistent with category selection
- Specify materials accurately

### **2. SKU Management**
- Don't manually edit generated SKUs
- Use "Generate SKU" button for consistency
- Keep SKUs for reference and tracking

### **3. Database Maintenance**
- Regular SKU uniqueness checks
- Monitor sequence number usage
- Clean up unused SKUs

The Auto-SKU Generator provides a robust, deterministic system for creating unique product identifiers while maintaining consistency and avoiding collisions.
