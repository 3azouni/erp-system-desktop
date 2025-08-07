# Finished Goods Inventory System

## Overview

The ERP system now includes a comprehensive finished goods inventory management system that tracks products ready for sale. This system ensures that:

1. **When a production schedule is completed**, the produced quantity is automatically added to the available inventory
2. **When a new order is placed**, the system checks available inventory and only allows orders if sufficient stock is available
3. **Real-time inventory tracking** with reserved quantities to prevent overselling

## Database Schema

### New Table: `finished_goods_inventory`

```sql
CREATE TABLE finished_goods_inventory (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER NOT NULL,
  quantity_available INTEGER NOT NULL DEFAULT 0,
  reserved_quantity INTEGER NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);
```

**Fields:**
- `quantity_available`: Total quantity of finished goods in stock
- `reserved_quantity`: Quantity reserved for pending orders
- `available_for_sale`: Calculated as `quantity_available - reserved_quantity`

## Key Functions

### 1. Adding Finished Goods (Production Completion)

**Location:** `lib/local-db.ts` - `addFinishedGoodsToInventory()`

When a print job is marked as "Completed", the system automatically adds the produced quantity to the finished goods inventory.

**Trigger:** Print job status update to "Completed"
**API:** `PUT /api/print-jobs/[id]`

### 2. Checking Inventory Availability

**Location:** `lib/availability-service.ts` - `getAvailableStock()`

The availability service now queries the finished goods inventory table instead of returning 0.

**Used by:** Order form modal, product availability checks

### 3. Reserving Inventory for Orders

**Location:** `lib/local-db.ts` - `reserveFinishedGoods()`

When creating an order, the system first reserves the required quantity to prevent overselling.

**API:** `POST /api/orders`

### 4. Deducting Inventory from Orders

**Location:** `lib/local-db.ts` - `deductFinishedGoodsFromInventory()`

After order creation, the reserved quantity is deducted from available inventory.

**API:** `POST /api/orders`

## Workflow

### Production → Inventory Flow

1. **Schedule Production**: User creates a print job in the scheduler
2. **Start Printing**: Job status changes to "Printing"
3. **Complete Job**: User marks job as "Completed"
4. **Auto-Add to Inventory**: System automatically adds produced quantity to `finished_goods_inventory`
5. **Update Availability**: Availability service cache is cleared to reflect new stock

### Order → Inventory Flow

1. **Check Availability**: User adds products to order
2. **Real-time Validation**: System checks `available_for_sale` quantity
3. **Reserve Stock**: When order is submitted, system reserves required quantity
4. **Validate Stock**: If insufficient stock, order is rejected with error message
5. **Deduct Stock**: If sufficient stock, order is created and inventory is deducted

## User Interface Updates

### Order Form Modal

- **Real-time availability checking**: Shows actual stock levels instead of just production status
- **Stock validation**: Prevents order creation if insufficient stock
- **Clear error messages**: Shows available vs requested quantities

### Scheduler Page

- **Completed jobs**: Shows "Added to stock" for completed jobs
- **Inventory impact**: Users can see how completed jobs affect available inventory

## Error Handling

### Insufficient Stock

When a user tries to order more than available stock:

```
Error: Insufficient stock for product Cup Holder. Available: 5, Requested: 10
```

### Production Completion Errors

If adding finished goods fails during job completion:
- Error is logged but job completion continues
- User is notified via console logs
- System remains functional

## Testing

Run the test script to verify functionality:

```bash
node scripts/test-finished-goods.js
```

This script tests:
- Table creation
- Adding finished goods
- Reserving inventory
- Deducting inventory
- Final inventory calculations

## Benefits

1. **Prevents Overselling**: Orders are only created if sufficient stock exists
2. **Real-time Tracking**: Always know exactly how much inventory is available
3. **Automatic Updates**: Production completion automatically updates inventory
4. **Reservation System**: Prevents race conditions when multiple users order simultaneously
5. **Clear Feedback**: Users get immediate feedback on stock availability

## Integration Points

- **Print Job Management**: Automatic inventory updates on completion
- **Order Management**: Stock validation and reservation
- **Product Availability**: Real-time stock checking
- **Scheduler**: Visual feedback on inventory impact

## Future Enhancements

1. **Low Stock Alerts**: Notifications when inventory falls below threshold
2. **Inventory Reports**: Detailed reports on stock levels and movements
3. **Batch Operations**: Bulk inventory updates for multiple products
4. **Inventory History**: Track all inventory changes with timestamps
5. **Supplier Integration**: Automatic reorder points and supplier notifications
