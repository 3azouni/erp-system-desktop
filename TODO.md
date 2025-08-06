# 🚀 3DP Commander - TODO List

## 🔩 **Component & Replacement Parts Management** (HIGH PRIORITY)

### Database Schema
- [x] Create `components` table
  - [x] Component ID, name, description, part number
  - [x] Category (nozzle, build plate, belt, fan, etc.)
  - [x] Cost, supplier, minimum stock level
  - [x] Serial number tracking
- [x] Create `component_orders` table
  - [x] Order ID, component ID, quantity, status
  - [x] Status pipeline: Ordered → Paid → Shipped → Arrived → Installed
  - [x] Shipment vendor tracking (DHL, FedEx, Aramex)
  - [x] Order date, expected delivery, actual delivery
- [x] Create `component_inventory` table
  - [x] Component ID, current stock, reserved stock
  - [x] Location tracking, last updated
  - [x] Cost tracking per component
- [x] Create `printer_components` table
  - [x] Printer ID, component ID, installation date
  - [x] Component status (active, failed, replaced)
  - [x] Usage tracking, maintenance history

### API Endpoints
- [x] `/api/components` - CRUD operations for components
- [x] `/api/components/[id]` - Individual component management
- [ ] `/api/component-orders` - Component order workflow
- [ ] `/api/component-inventory` - Stock management
- [ ] `/api/printer-components` - Printer-component relationships

### UI Components
- [x] Component management page (`/components`)
- [x] Component form modal (add/edit components)
- [ ] Component order modal (create component orders)
- [ ] Component inventory dashboard
- [ ] Printer component assignment interface
- [ ] Component order tracking interface

### Features
- [ ] **Per-Printer Components** - Assign components to specific printers
- [ ] **Stock Tracking & Costing** - Decrement inventory and log costs to Expenses
- [ ] **Order Workflow** - Status pipeline with automatic notifications
- [ ] **Low-Stock Alerts** - Automatic notifications when stock ≤ threshold
- [ ] **Shipment Vendor Tracking** - Capture and track shipping carriers
- [ ] **Expense Sync** - Auto-post component payments to Expense Tracking

---

## 📦 **Inventory Management Enhancements** (HIGH PRIORITY)

### Database Schema
- [ ] Add procurement workflow fields to `inventory` table
  - [ ] Order status (Ordered, Shipped, Arrived)
  - [ ] Shipping vendor field
  - [ ] Expected delivery date
  - [ ] Actual delivery date
- [ ] Create `supplier_orders` table
  - [ ] Order ID, supplier ID, total cost
  - [ ] Order date, expected delivery, status
  - [ ] Payment status, due date

### Features
- [ ] **Material Procurement Pipeline** - Ordered → Shipped → Arrived workflow
- [ ] **Supplier Shipping Vendor** - Track shipping companies with POs
- [ ] **Overdue Payables View** - Separate list of unpaid/overdue invoices
- [ ] **Auto-stock Update** - Automatically add to available stock on "Arrived"

---

## 👥 **User Role Management** (MEDIUM PRIORITY)

### Database Schema
- [ ] Update `users` table with new roles
  - [ ] Add `accountant`, `labor`, `sales`, `marketing` roles
  - [ ] Add department-specific permissions
- [ ] Enhance `user_permissions` table
  - [ ] Add department-specific permission sets
  - [ ] Create role templates for each department

### Features
- [ ] **Admin Role** - Full CRUD & settings access
- [ ] **Accounting Role** - Expenses, orders, invoices access
- [ ] **Production Role** - Printers, components, inventory access
- [ ] **Sales Role** - Orders, customers access
- [ ] **Marketing Role** - Products, analytics access
- [ ] **Role Management UI** - Interface for managing user roles and permissions

---

## 🚀 **Milestone 2: Smart Production & Barcode Integration** (FUTURE)

### Database Schema
- [ ] Create `barcodes` table
  - [ ] Entity type (product, component, order)
  - [ ] Entity ID, barcode type (EPC-QR, Code-128)
  - [ ] Barcode data, generated date
- [ ] Create `scan_logs` table
  - [ ] Scan timestamp, barcode data
  - [ ] Scanner device info, user ID
  - [ ] Entity found, action taken
- [ ] Create `printer_control` table
  - [ ] Printer ID, connection type (WebSocket, OctoPrint)
  - [ ] Connection status, last heartbeat
  - [ ] Current job, printer state

### API Endpoints
- [ ] `/api/scan` - Barcode scanner endpoint
- [ ] `/api/barcodes` - Barcode generation and management
- [ ] `/api/printer-control/[id]` - Online printer control
- [ ] `/api/printer-control/[id]/status` - Real-time printer status
- [ ] `/api/printer-control/[id]/job` - Job control (start/pause/finish)

### Features
- [ ] **Barcode/QR Generation** - Auto-generate for Products, Components, Orders
- [ ] **Scanner Hardware Hook** - USB/serial scanner integration
- [ ] **Online Printer Linking**
  - [ ] Creality K-series via WebSocket API
  - [ ] Resin printers via OctoPrint plugin
  - [ ] Printer selection logic (idle, type, volume, material)
- [ ] **Real-time Production Tracking** - Job events update print_jobs
- [ ] **Extended Notifications** - Job finished, component installed alerts
- [ ] **Analytics Upgrade** - MTBF, cost per gram, lead time metrics

---

## 🔍 **Search & Export Features** (MEDIUM PRIORITY)

### API Endpoints
- [ ] `/api/search` - Global search across all modules
- [ ] `/api/export/all` - Comprehensive data export
- [ ] `/api/export/components` - Component data export
- [ ] `/api/export/analytics` - Analytics data export

### Features
- [ ] **Global Search** - Cross-module search functionality
- [ ] **Advanced Export** - Complete data export with all tables
- [ ] **Search Filters** - Filter by module, date range, status
- [ ] **Export Formats** - CSV, JSON, Excel formats

---

## 📊 **Analytics Enhancements** (MEDIUM PRIORITY)

### Features
- [ ] **Component Analytics**
  - [ ] MTBF (Mean Time Between Failures) per component
  - [ ] Component cost analysis
  - [ ] Component usage patterns
- [ ] **Production Analytics**
  - [ ] Cost per printed gram
  - [ ] Purchase-to-install lead time
  - [ ] Printer utilization by component
- [ ] **Advanced Metrics**
  - [ ] Component failure prediction
  - [ ] Optimal reorder timing
  - [ ] Cost optimization suggestions

---

## 🔔 **Enhanced Notifications** (MEDIUM PRIORITY)

### Features
- [ ] **Component Notifications**
  - [ ] Low stock alerts for components
  - [ ] Component order status updates
  - [ ] Component installation reminders
- [ ] **Production Notifications**
  - [ ] Job finished notifications
  - [ ] Component installed alerts
  - [ ] Printer maintenance reminders
- [ ] **Financial Notifications**
  - [ ] Overdue payables alerts
  - [ ] Payment due reminders
  - [ ] Budget threshold alerts

---

## 🛠️ **Technical Improvements** (LOW PRIORITY)

### Performance
- [ ] Implement database indexing for new tables
- [ ] Add caching for frequently accessed data
- [ ] Optimize API response times
- [ ] Add pagination for large datasets

### Security
- [ ] Implement role-based API access control
- [ ] Add input validation for new endpoints
- [ ] Implement rate limiting for API calls
- [ ] Add audit logging for sensitive operations

### UI/UX
- [ ] Add loading states for new components
- [ ] Implement error handling for new features
- [ ] Add tooltips and help text
- [ ] Improve mobile responsiveness

---

## 📋 **Implementation Priority**

### Phase 1 (Immediate)
1. Component & Replacement Parts Management
2. Inventory Management Enhancements
3. Enhanced Notifications

### Phase 2 (Short-term)
1. User Role Management
2. Search & Export Features
3. Analytics Enhancements

### Phase 3 (Long-term)
1. Barcode Integration
2. Smart Production Features
3. Technical Improvements

---

## 📝 **Notes**

- **Database Changes**: Always backup before implementing schema changes
- **Testing**: Test all new features locally before deployment
- **Documentation**: Update API documentation for new endpoints
- **Migration**: Create database migration scripts for schema changes
- **Rollback**: Ensure rollback procedures for all changes

---

*Last Updated: 2025-01-04*
*Status: Planning Phase* 