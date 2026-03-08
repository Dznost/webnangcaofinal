# SYSTEM DATA INDEX & SEARCH GUIDE
## Quick Lookup Reference for Restaurant Management Platform

---

## INDEX A-Z

### A - Authentication & Authorization
- **Authentication Flow**: `COMPREHENSIVE_SYSTEM_MAP.md` → System Overview → Technology Stack
- **Authorization/Roles**: `COMPREHENSIVE_SYSTEM_MAP.md` → User Roles & Permissions
- **Access Control**: See Role Matrix in User Roles section

### B - Branch Management
- **Branch Model**: `COMPREHENSIVE_SYSTEM_MAP.md` → Data Models → Branch Model
- **Multi-Branch Operations**: `COMPREHENSIVE_SYSTEM_MAP.md` → Business Logic → Multi-Branch Operations Logic
- **Branch Isolation**: `COMPREHENSIVE_SYSTEM_MAP.md` → Theoretical Framework

### C - Collections (MongoDB)
- **All Collections**: 
  - User, Branch, Dish, Order, Reservation
  - Payment, Notification, Blog, Event, Contact
- **See**: `COMPREHENSIVE_SYSTEM_MAP.md` → Data Models section for each

### D - Data Relationships
- **Relationship Map**: `COMPREHENSIVE_SYSTEM_MAP.md` → Integration Points
- **Cross-Model Relationships**: Visual diagram in Integration Points section

### E - Events & Triggers
- **Auto-Payment Creation**: `COMPREHENSIVE_SYSTEM_MAP.md` → Process Flows → Payment Flow Map
- **Notification Generation**: See Notification Model in Data Models
- **Business Triggers**: See Business Logic section

### F - Financial Tracking
- **Revenue System**: `COMPREHENSIVE_SYSTEM_MAP.md` → Business Logic → Revenue Tracking Logic
- **Payment Model**: `COMPREHENSIVE_SYSTEM_MAP.md` → Data Models → Payment Model
- **Payment States**: See Payment Flow Map in Process Flows

### G - General System Overview
- **Architecture**: `COMPREHENSIVE_SYSTEM_MAP.md` → System Overview & Architecture
- **Technology Stack**: See Core Platform Components

### H - How Reservations Work
- **Reservation Model**: `COMPREHENSIVE_SYSTEM_MAP.md` → Data Models → Reservation Model
- **Reservation Flow**: `COMPREHENSIVE_SYSTEM_MAP.md` → Process Flows → Reservation Flow Map
- **Reception Role**: See User Roles & Permissions

### I - Integration & Interconnections
- **Model Relationships**: `COMPREHENSIVE_SYSTEM_MAP.md` → Integration Points
- **Data Flow**: See Process Flows section
- **Interconnected Nodes**: See Theoretical Framework → Critical Relationships Summary

### J - Jobs & Roles
- **All Roles**: `COMPREHENSIVE_SYSTEM_MAP.md` → User Roles & Permissions
- **Role Matrix**: See Permission Mapping table
- **Role-Based Functions**: See Role Matrix table

### K - Key Business Rules
- **Business Rules**: `COMPREHENSIVE_SYSTEM_MAP.md` → Business Logic & Rules
- **Order Rules**: See Order Processing Logic
- **Revenue Rules**: See Revenue Tracking Logic
- **Data Consistency**: See Theoretical Framework → Data Consistency Guarantees

### L - Location Data
- **Branch Model**: Locations with operational data
- **Multi-Branch Operations**: How different branches interact
- **Data Isolation**: See Branch Isolation section

### M - Models & Schemas
- **All 10 Models**: `COMPREHENSIVE_SYSTEM_MAP.md` → Data Models & Relationships
- **Field Details**: Each model has Key Fields section
- **Relationships**: Each model has Relationships section

### N - Notifications
- **Notification Model**: `COMPREHENSIVE_SYSTEM_MAP.md` → Data Models → Notification Model
- **Auto-Notifications**: See Process Flows
- **Admin Alerts**: Mentioned in Business Rules

### O - Order Management
- **Order Model**: `COMPREHENSIVE_SYSTEM_MAP.md` → Data Models → Order Model
- **Order Flow**: `COMPREHENSIVE_SYSTEM_MAP.md` → Process Flows → Order Flow Map
- **Order Types**: Dine-in, Takeaway (prepaid, COD)

### P - Payments & Revenue
- **Payment Model**: `COMPREHENSIVE_SYSTEM_MAP.md` → Data Models → Payment Model
- **Payment Logic**: `COMPREHENSIVE_SYSTEM_MAP.md` → Business Logic → Revenue Tracking Logic
- **Auto-Creation**: See Payment Flow Map
- **Payment States**: See Financial Record fields

### Q - Queries & Data Access
- **Permission-Based Access**: See User Roles & Permissions
- **Branch Filters**: See Multi-Branch Operations Logic
- **Data Isolation**: See Branch Isolation section

### R - Reservations
- **Reservation Model**: `COMPREHENSIVE_SYSTEM_MAP.md` → Data Models → Reservation Model
- **Reservation Flow**: `COMPREHENSIVE_SYSTEM_MAP.md` → Process Flows → Reservation Flow Map
- **Reception Confirmation**: See Reservation Processing Logic

### S - Staff & Shipper
- **Staff Role**: See User Roles & Permissions → Role Matrix
- **Shipper Role**: See User Roles & Permissions → Role Matrix
- **Branch Assignment**: See Multi-Branch Operations Logic

### T - Tables & Dine-In
- **Table Management**: See Order Model → Business Rules
- **Dine-In Orders**: See Order Flow Map
- **Capacity Management**: See Branch Model fields

### U - User Model & Access
- **User Model**: `COMPREHENSIVE_SYSTEM_MAP.md` → Data Models → User Model
- **User Roles**: See User Roles & Permissions
- **Branch Assignment**: See Multi-Branch Operations Logic

### V - Validation & Constraints
- **Data Validation**: See Theoretical Framework → Data Consistency Guarantees
- **Business Rules**: See Business Logic & Rules section
- **Invariants**: See Theoretical Framework

### W - Workflow & Processes
- **Order Workflow**: See Process Flows → Order Flow Map
- **Reservation Workflow**: See Process Flows → Reservation Flow Map
- **Payment Workflow**: See Process Flows → Payment Flow Map

### X - Cross-Reference Index
- **Model Interconnections**: See Integration Points
- **Relationship Matrix**: See Critical Relationships Summary
- **Data Dependencies**: See each Model's Relationships section

### Y - Your Data Location
- Use this index to find where specific data/concepts are documented
- Cross-reference with main map for detailed information

### Z - Zone/Branch-Specific Data
- **Branch Scoping**: See Multi-Branch Operations Logic
- **User Assignment**: See Role-Based Access Control
- **Data Access**: See Permission Mapping

---

## SEARCH BY CONCEPT

### "I need to find information about..."

#### Dine-In Orders
→ Data Models → Order Model → Business Rules
→ Process Flows → Order Flow Map (Dine-In section)

#### Delivery with Payment at Delivery (COD)
→ Business Logic → Revenue Tracking Logic
→ Process Flows → Order Flow Map (Takeaway COD section)
→ Payment Model → Status field

#### Table Management
→ Data Models → Branch Model (availableTables, totalTables)
→ Order Model → Business Rules
→ Process Flows → Dine-In Order section

#### Receptionist Workflow
→ User Roles & Permissions → Reception role
→ Process Flows → Reservation Flow Map
→ Multi-Branch Operations Logic → Data Access

#### Revenue by Branch
→ Business Logic → Revenue Tracking Logic
→ Data Models → Payment Model
→ Integration Points → Payment ← Branch (Aggregation)

#### Branch Isolation & Security
→ Multi-Branch Operations Logic → User Assignment
→ Multi-Branch Operations Logic → Data Access
→ Theoretical Framework → Role-Based Access Control

#### Auto-Payment Creation
→ Process Flows → Payment Flow Map
→ Order Model → Relationships (Order ←→ Payment)
→ Reservation Model → Relationships (Reservation ←→ Payment)

#### Customer Data Access
→ User Roles & Permissions → User role
→ Data Models → User Model
→ Integration Points → User Model (Hub)

#### Shipper Assignments
→ User Roles & Permissions → Shipper role
→ Order Flow Map → Takeaway COD section
→ Multi-Branch Operations Logic → Data Access

#### Historical Data & Audit Trail
→ Theoretical Framework → Audit Trail section
→ Each Model → createdAt, updatedAt, confirmedAt, paidAt fields

---

## SEARCH BY DATA MODEL

### User
**Find in**: `COMPREHENSIVE_SYSTEM_MAP.md` → Data Models & Relationships → User Model
**Key Relations**: Orders, Reservations, Payments, Branch
**Roles**: Admin, Manager, Reception, Staff, Shipper, User

### Branch
**Find in**: `COMPREHENSIVE_SYSTEM_MAP.md` → Data Models & Relationships → Branch Model
**Key Relations**: Users (staff), Orders, Reservations, Payments
**Operations**: Multi-branch operations documented in Business Logic

### Dish
**Find in**: `COMPREHENSIVE_SYSTEM_MAP.md` → Data Models & Relationships → Dish Model
**Key Relations**: Orders (items), Reservations (orderItems)
**Categories**: Appetizer, Main, Dessert, Beverage

### Order
**Find in**: `COMPREHENSIVE_SYSTEM_MAP.md` → Data Models & Relationships → Order Model
**Key Relations**: User, Branch, Dish, Payment
**Types**: Dine-in, Takeaway (prepaid, COD)
**Flow**: Process Flows → Order Flow Map

### Reservation
**Find in**: `COMPREHENSIVE_SYSTEM_MAP.md` → Data Models & Relationships → Reservation Model
**Key Relations**: User, Branch, Dish, Payment
**Flow**: Process Flows → Reservation Flow Map
**Amount Calculation**: deposit + foodTotal - foodDiscount

### Payment
**Find in**: `COMPREHENSIVE_SYSTEM_MAP.md` → Data Models & Relationships → Payment Model
**Key Relations**: Order, Reservation, User, Branch
**States**: Pending, Completed, Failed
**Auto-Creation**: See Process Flows → Payment Flow Map

### Notification
**Find in**: `COMPREHENSIVE_SYSTEM_MAP.md` → Data Models & Relationships → Notification Model
**Types**: order_placed, order_cod_pending, reservation_confirmed
**Recipients**: Admin, Users (event notifications)

### Blog
**Find in**: `COMPREHENSIVE_SYSTEM_MAP.md` → Data Models & Relationships → Blog Model
**Status**: Draft, Published
**Author**: User reference

### Event
**Find in**: `COMPREHENSIVE_SYSTEM_MAP.md` → Data Models & Relationships → Event Model
**Purpose**: Promotions and special events
**Scope**: Applicable branches

### Contact
**Find in**: `COMPREHENSIVE_SYSTEM_MAP.md` → Data Models & Relationships → Contact Model
**Status**: New, Responded, Resolved
**Use**: Customer feedback collection

---

## SEARCH BY PROCESS/WORKFLOW

### Complete Order Processing
1. **Creation**: See Order Model → Key Fields
2. **Confirmation**: See Business Logic → Order Processing Logic
3. **Payment**: See Process Flows → Order Flow Map
4. **Revenue**: See Business Logic → Revenue Tracking Logic

### Complete Reservation Handling
1. **Booking**: See Reservation Model → Key Fields
2. **Confirmation**: See Business Logic → Reservation Processing Logic
3. **Payment**: See Process Flows → Reservation Flow Map
4. **Completion**: See Reservation Flow Map → Completion section

### Revenue Management
1. **Tracking**: See Business Logic → Revenue Tracking Logic
2. **Auto-Creation**: See Process Flows → Payment Flow Map
3. **Aggregation**: See Integration Points → Payment ← Branch
4. **Reporting**: See Theoretical Framework → Audit Trail

### Multi-Branch Operations
1. **Setup**: See Data Models → Branch Model
2. **User Assignment**: See Business Logic → Multi-Branch Operations Logic
3. **Data Access**: See User Roles & Permissions → Permission Mapping
4. **Revenue Tracking**: See Business Logic → Branch Aggregation

---

## QUICK LOOKUP TABLES

### Status Values by Collection

**Order.status**: pending, processing, completed, cancelled
**Order.paymentStatus**: unpaid, pending, paid
**Reservation.status**: pending, confirmed, completed, cancelled
**Reservation.paymentStatus**: unpaid, paid
**Payment.status**: pending, completed, failed
**Blog.status**: draft, published
**Contact.status**: new, responded, resolved

### Enum Fields Reference

**Order.orderType**: dine-in, takeaway
**Order.paymentTiming**: prepaid, cod
**Order.paymentMethod**: cash, bank, online
**User.role**: admin, user, staff, shipper, reception, manager
**Dish.category**: appetizer, main, dessert, beverage
**Payment.revenueType**: reception, delivery, event

### Relationship Types

**1:1** (One-to-One): Order ←→ Payment, Reservation ←→ Payment
**1:Many** (One-to-Many): User ←→ Orders, Branch ←→ Orders, User ←→ Reservations
**Many:Many** (Indirect): Orders ←→ Dishes (via items array)

---

## TROUBLESHOOTING & COMMON QUESTIONS

**"Where do I find all customer orders?"**
→ Order collection, filtered by userId

**"How do I track revenue by branch?"**
→ Payment collection, aggregated by branchId
→ See: Business Logic → Revenue Tracking Logic

**"What happens when a order is confirmed?"**
→ See: Process Flows → Order Flow Map
→ See: Business Logic → Order Processing Logic

**"Can receptionist see other branches' reservations?"**
→ No, see: User Roles & Permissions → Permission Mapping
→ Data filtered by branchId match

**"How is reservation total amount calculated?"**
→ totalAmount = depositAmount + (foodTotal - foodDiscount)
→ See: Data Models → Reservation Model → Business Rules

**"When is payment created?"**
→ Automatically on Order confirmation (dine-in/prepaid)
→ Automatically on Reservation confirmation
→ See: Process Flows → Payment Flow Map

**"How do I find a specific staff member's revenue?"**
→ Payment collection, filter by collectedBy (staff userId)
→ See: Business Logic → Branch Aggregation

**"What's the difference between pending and completed payment?"**
→ Pending: Awaiting collection (COD, shipper)
→ Completed: Already collected
→ See: Business Logic → Payment States

---

This index provides systematic access to all system concepts and data relationships. Use it to quickly locate specific information or navigate to detailed sections in the Comprehensive System Map.
