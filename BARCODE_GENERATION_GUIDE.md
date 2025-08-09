# 🏷️ Barcode Generation Guide

## 📋 **Overview**

The Barcode Generation system creates barcode images server-side and stores them in Supabase Storage. It supports EAN-13, Code 128, and QR codes with automatic validation and storage management.

## 🎯 **Supported Barcode Types**

### **1. EAN-13**
- **Format**: 13-digit retail barcode
- **Validation**: Automatic check digit calculation
- **Use Case**: Retail products, inventory tracking
- **Example**: `1234567890123`

### **2. Code 128**
- **Format**: Flexible alphanumeric barcode
- **Validation**: Supports letters, numbers, and symbols
- **Use Case**: Internal tracking, flexible encoding
- **Example**: `ABC123-DEF`

### **3. QR Code**
- **Format**: 2D matrix barcode
- **Validation**: Supports any text or URL
- **Use Case**: Product URLs, detailed information
- **Example**: `https://app.com/p/MNT-CUP-PL-001`

## 🔧 **Technical Implementation**

### **Server-Side Generation**
- **Library**: `canvas` + `qrcode` (no client dependencies)
- **Format**: PNG images with white background
- **Size**: Optimized for printing and display
- **Storage**: Supabase Storage with public URLs

### **Storage Structure**
```
product-assets/
├── barcodes/
│   ├── {product_id}.png
│   └── ...
└── other-assets/
```

## 🚀 **Usage Flow**

### **1. Manual Generation**
1. Open product form (edit existing product)
2. Select barcode type (EAN13, CODE128, QR)
3. Optionally enter custom barcode value
4. Click "Generate Barcode" button
5. Barcode image is created and uploaded
6. Preview appears in form

### **2. Value Determination**
- **EAN-13**: Uses SKU (padded to 12 digits + check digit)
- **CODE128**: Uses SKU or custom value
- **QR**: Uses product URL (`/p/{sku}`) or custom value

### **3. Storage Management**
- **Automatic Upload**: Images uploaded to Supabase Storage
- **Public URLs**: Generated for easy access
- **Cleanup**: Orphaned files removed automatically
- **RLS**: Secure access policies

## 🔍 **Barcode Generation Logic**

### **EAN-13 Processing**
```typescript
// 1. Extract digits from input
let eanValue = value.replace(/\D/g, '').slice(0, 13)

// 2. Pad to 12 digits if needed
if (eanValue.length < 12) {
  eanValue = eanValue.padStart(12, '0')
}

// 3. Calculate check digit
const checkDigit = calculateEAN13CheckDigit(eanValue)

// 4. Generate barcode pattern
const pattern = generateEAN13Pattern(eanValue + checkDigit)
```

### **Code 128 Processing**
```typescript
// 1. Validate input
if (!value || value.length === 0) {
  throw new Error('CODE128 requires a non-empty value')
}

// 2. Encode characters
const pattern = generateCode128Pattern(value.toUpperCase())

// 3. Add start/stop characters and checksum
```

### **QR Code Processing**
```typescript
// 1. Determine content
const qrValue = productUrl || value

// 2. Generate QR code
const qrBuffer = await QRCode.toBuffer(qrValue, {
  width: 180,
  margin: 1,
  color: { dark: '#000000', light: '#FFFFFF' }
})
```

## 🎨 **UI Integration**

### **Form Components**
- **Barcode Type Selector**: Dropdown with 3 options
- **Barcode Value Input**: Optional custom value
- **Generate Button**: Server action trigger
- **Preview Section**: Shows generated barcode
- **URL Field**: Displays storage URL

### **Button States**
- **Disabled**: No barcode type selected
- **Disabled**: No SKU or custom value
- **Disabled**: New product (needs ID first)
- **Enabled**: All requirements met

### **Preview Display**
- **Conditional**: Only shows when barcode exists
- **Responsive**: Max height 128px, auto width
- **Accessible**: Alt text with product name
- **Styling**: Border with muted background

## 🔒 **Security & Validation**

### **Input Validation**
- **EAN-13**: 12-13 digits, valid check digit
- **CODE128**: Non-empty, max 50 characters
- **QR**: Non-empty, max 2000 characters
- **File Size**: 1MB limit for barcode images

### **Storage Security**
- **Public Read**: Barcodes are publicly accessible
- **Authenticated Upload**: Only logged-in users
- **RLS Policies**: Role-based access control
- **Automatic Cleanup**: Orphaned file removal

### **Error Handling**
- **Validation Errors**: Clear error messages
- **Generation Failures**: Graceful fallbacks
- **Storage Errors**: Retry mechanisms
- **Network Issues**: User feedback

## 📊 **API Endpoint**

### **POST /api/products/generate-barcode**
```typescript
Request:
{
  "productId": "uuid",
  "barcodeType": "EAN13" | "CODE128" | "QR",
  "barcodeValue": "optional-custom-value",
  "sku": "product-sku"
}

Response:
{
  "success": true,
  "barcodeImageUrl": "https://storage.supabase.co/...",
  "barcodeType": "EAN13",
  "barcodeValue": "1234567890123",
  "product": { ... }
}
```

### **Error Responses**
```typescript
{
  "error": "Product ID and barcode type are required"
}

{
  "error": "Invalid value for EAN13 barcode"
}

{
  "error": "Failed to upload barcode image"
}
```

## 🛠️ **Setup Requirements**

### **Dependencies**
```json
{
  "canvas": "^2.11.0",
  "qrcode": "^1.5.3"
}
```

### **Supabase Storage**
```sql
-- Create product-assets bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('product-assets', 'product-assets', true, 5242880, 
        ARRAY['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp']);

-- Set up RLS policies
CREATE POLICY "Public read access for product assets" ON storage.objects
  FOR SELECT USING (bucket_id = 'product-assets');
```

### **Environment Variables**
```env
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
```

## 📝 **Examples**

### **Example 1: EAN-13 Barcode**
- **Product**: Coffee Cup (SKU: MNT-CUP-PL-001)
- **Barcode Type**: EAN-13
- **Generated Value**: `1234567890123` (padded SKU)
- **Image**: 13-digit barcode with check digit

### **Example 2: Code 128 Barcode**
- **Product**: Tool Holder (SKU: TLS-HLD-PE-001)
- **Barcode Type**: CODE128
- **Generated Value**: `TLS-HLD-PE-001`
- **Image**: Alphanumeric barcode

### **Example 3: QR Code**
- **Product**: Prototype Model (SKU: PRT-MDL-CF-001)
- **Barcode Type**: QR
- **Generated Value**: `https://app.com/p/PRT-MDL-CF-001`
- **Image**: QR code linking to product page

## 🔮 **Future Enhancements**

### **Potential Features**
- **Bulk Generation**: Generate barcodes for multiple products
- **Custom Templates**: Different barcode styles and sizes
- **Barcode Scanning**: Mobile app integration
- **Print Integration**: Direct printing from UI
- **Analytics**: Track barcode usage and scans

### **Integration Opportunities**
- **Inventory System**: Scan barcodes for stock updates
- **Order Processing**: Barcode-based order fulfillment
- **Mobile App**: Barcode scanning for field operations
- **POS System**: Barcode-based product lookup
- **Shipping**: Barcode labels for packages

## 📊 **Best Practices**

### **1. Barcode Type Selection**
- **EAN-13**: Use for retail products with numeric SKUs
- **CODE128**: Use for internal tracking with alphanumeric SKUs
- **QR**: Use for detailed product information and URLs

### **2. Value Management**
- **SKU Priority**: Use SKU as default value when possible
- **Custom Values**: Allow manual override for special cases
- **Validation**: Always validate before generation
- **Consistency**: Use same value across all systems

### **3. Storage Management**
- **Naming Convention**: Use product ID for unique filenames
- **Cleanup**: Regular cleanup of orphaned files
- **Backup**: Include barcode images in data backups
- **Monitoring**: Track storage usage and costs

### **4. Performance**
- **Caching**: Cache generated barcodes when possible
- **Optimization**: Use appropriate image sizes
- **CDN**: Consider CDN for global access
- **Compression**: Optimize image file sizes

The Barcode Generation system provides a robust, server-side solution for creating and managing product barcodes with automatic storage and cleanup.
