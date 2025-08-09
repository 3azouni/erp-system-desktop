# 📊 Analytics Events System

## 📋 **Overview**

A passive analytics system that tracks user actions without affecting main functionality. Events are stored in the `events` table for future analysis and reporting.

## 🎯 **Purpose**

- **Non-intrusive tracking**: Analytics events are captured passively without affecting user experience
- **Future analytics**: Enable barcode usage tracking, user behavior analysis, and feature adoption metrics
- **Audit trail**: Maintain records of important user actions for compliance and debugging

## 🗄️ **Database Schema**

### **Events Table**
```sql
CREATE TABLE events (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    type VARCHAR(50) NOT NULL,
    entity VARCHAR(50) NOT NULL,
    entity_id UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    metadata JSONB DEFAULT '{}'::jsonb,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### **Fields**
- **id**: Unique event identifier
- **user_id**: User who triggered the event
- **type**: Event type (e.g., `barcode_generated`, `sku_generated`)
- **entity**: Entity type (e.g., `product`, `order`, `inventory`)
- **entity_id**: ID of the related entity (optional)
- **created_at**: When the event occurred
- **metadata**: Additional event data as JSON
- **updated_at**: When the event was last updated

## 🔧 **Implementation**

### **Analytics Service** (`lib/analytics.ts`)

#### **Core Functions**
```typescript
// Track any analytics event
trackEvent(event: AnalyticsEvent): Promise<void>

// Track barcode generation
trackBarcodeGenerated(userId, productId, barcodeType, barcodeValue): Promise<void>

// Track SKU generation
trackSkuGenerated(userId, productId, sku, productName, category): Promise<void>
```

#### **Event Interface**
```typescript
interface AnalyticsEvent {
  user_id: string
  type: string
  entity: string
  entity_id?: string
  metadata?: Record<string, any>
}
```

### **Integration Points**

#### **Barcode Generation** (`/api/products/generate-barcode`)
```typescript
// After successful barcode generation
await trackBarcodeGenerated(
  user.id,
  productId,
  barcodeType,
  valueToEncode
)
```

#### **SKU Generation** (`/api/products/generate-sku`)
```typescript
// After successful SKU generation
await trackSkuGenerated(
  user.id,
  '', // No product ID yet
  sku,
  productName,
  category
)
```

## 📊 **Event Types**

### **Current Events**

#### **barcode_generated**
- **Type**: `barcode_generated`
- **Entity**: `product`
- **Metadata**:
  ```json
  {
    "barcode_type": "EAN13|CODE128|QR",
    "barcode_value": "string",
    "timestamp": "ISO string"
  }
  ```

#### **sku_generated**
- **Type**: `sku_generated`
- **Entity**: `product`
- **Metadata**:
  ```json
  {
    "sku": "string",
    "product_name": "string",
    "category": "string",
    "timestamp": "ISO string"
  }
  ```

### **Future Event Types**
- `product_created`
- `order_placed`
- `inventory_updated`
- `print_job_scheduled`
- `user_login`
- `search_performed`

## 🔒 **Security & Privacy**

### **RLS Policies**
- **Insert**: Users can only insert their own events
- **Read**: Only admins can read all events
- **Update**: Only admins can update events
- **Delete**: Only admins can delete events

### **Data Protection**
- Events are stored with user_id for attribution
- Metadata contains only non-sensitive operational data
- No personal information is stored in events
- Events are automatically cleaned up when users are deleted

## 🚀 **Usage Examples**

### **Querying Events**

#### **Barcode Generation Count**
```sql
SELECT 
  COUNT(*) as barcode_count,
  DATE(created_at) as date
FROM events 
WHERE type = 'barcode_generated' 
GROUP BY DATE(created_at)
ORDER BY date DESC;
```

#### **User Activity**
```sql
SELECT 
  u.full_name,
  COUNT(*) as event_count
FROM events e
JOIN users u ON e.user_id = u.id
WHERE e.created_at >= NOW() - INTERVAL '30 days'
GROUP BY u.id, u.full_name
ORDER BY event_count DESC;
```

#### **Barcode Type Distribution**
```sql
SELECT 
  metadata->>'barcode_type' as barcode_type,
  COUNT(*) as count
FROM events 
WHERE type = 'barcode_generated'
GROUP BY metadata->>'barcode_type';
```

### **Analytics Dashboard Queries**

#### **Daily Barcode Generation**
```sql
SELECT 
  DATE(created_at) as date,
  COUNT(*) as barcodes_generated
FROM events 
WHERE type = 'barcode_generated'
  AND created_at >= NOW() - INTERVAL '30 days'
GROUP BY DATE(created_at)
ORDER BY date;
```

#### **Top Users by Activity**
```sql
SELECT 
  u.full_name,
  u.role,
  COUNT(*) as total_events,
  COUNT(CASE WHEN e.type = 'barcode_generated' THEN 1 END) as barcodes_generated,
  COUNT(CASE WHEN e.type = 'sku_generated' THEN 1 END) as skus_generated
FROM events e
JOIN users u ON e.user_id = u.id
WHERE e.created_at >= NOW() - INTERVAL '7 days'
GROUP BY u.id, u.full_name, u.role
ORDER BY total_events DESC;
```

## 🔧 **Error Handling**

### **Graceful Degradation**
```typescript
try {
  await trackBarcodeGenerated(userId, productId, barcodeType, barcodeValue)
} catch (analyticsError) {
  // Analytics failure should not affect the main response
  console.error('Analytics tracking failed:', analyticsError)
}
```

### **Silent Failures**
- Analytics events are tracked asynchronously
- Failures are logged but don't affect main functionality
- No user-facing errors from analytics tracking

## 🔮 **Future Enhancements**

### **Analytics Dashboard**
- Real-time event visualization
- User activity heatmaps
- Feature adoption metrics
- Performance analytics

### **Advanced Tracking**
- Session tracking
- User journey mapping
- A/B testing support
- Custom event definitions

### **Data Export**
- CSV export functionality
- API endpoints for external analytics
- Automated reporting
- Data retention policies

### **Performance Optimizations**
- Event batching
- Background processing
- Data aggregation
- Index optimization

## 📈 **Benefits**

### **Business Intelligence**
- Track feature adoption rates
- Identify most active users
- Monitor system usage patterns
- Measure feature effectiveness

### **User Experience**
- Understand user workflows
- Identify pain points
- Optimize feature placement
- Personalize user experience

### **System Monitoring**
- Track system health
- Monitor error rates
- Identify performance bottlenecks
- Debug user issues

The Analytics Events System provides a foundation for data-driven decision making while maintaining user privacy and system performance.
