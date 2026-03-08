# CONCEPTUAL MAP SUMMARY
## Restaurant Management Platform - Quick Overview

---

## WHAT IS THE CONCEPTUAL MAP?

A comprehensive knowledge base that systematically organizes all data, theories, concepts, and relationships within the restaurant management system. It enables users to:

- **Locate specific data**: Find any model, field, or concept quickly
- **Understand relationships**: See how different components interconnect
- **Navigate workflows**: Follow complete business processes
- **Access by role**: Find relevant information for any user type
- **Resolve questions**: Answer common questions systematically

---

## STRUCTURE OF THE CONCEPTUAL MAP

### Main Document: COMPREHENSIVE_SYSTEM_MAP.md (702 lines)

**Sections**:
1. System Overview & Architecture
2. Data Models & Relationships (10 complete models)
3. Business Logic & Rules (order, reservation, revenue, multi-branch)
4. User Roles & Permissions
5. Process Flows (order, reservation, payment)
6. Integration Points
7. Theoretical Framework

**Best For**: Deep understanding, implementation details, business rules

### Reference Document: SYSTEM_DATA_INDEX.md (346 lines)

**Sections**:
1. A-Z Index (alphabetical lookup)
2. Search by Concept (common questions)
3. Search by Data Model
4. Search by Process/Workflow
5. Quick Lookup Tables
6. Troubleshooting & Common Questions

**Best For**: Quick searches, finding specific information, answering specific questions

---

## THE 10 DATA MODELS

### Core Models (Foundation)

1. **USER** - Authentication, authorization, role management
   - Connects to: Orders, Reservations, Payments, Branch
   - Roles: Admin, Manager, Reception, Staff, Shipper, User

2. **BRANCH** - Physical locations with operational data
   - Connects to: Users (staff), Orders, Reservations, Payments
   - Key Data: Address, capacity, tables, manager

### Transaction Models

3. **ORDER** - Customer purchases (dine-in or takeaway)
   - Types: Dine-in, Takeaway (prepaid/COD)
   - Auto-creates: Payment record on confirmation
   - Tracks: Items, prices, discounts, payment status

4. **RESERVATION** - Table bookings with optional pre-orders
   - Amount: Deposit + food items - discounts
   - Auto-creates: Payment record on confirmation
   - Tracked by: Reception staff per branch

### Financial Models

5. **PAYMENT** - Revenue tracking and financial records
   - Auto-created from: Orders and Reservations
   - Tracks: Amount, discount, finalAmount, payment method, status
   - Used for: Revenue reporting, branch aggregation, staff attribution

### Content Models

6. **DISH** - Menu items and products
   - Categories: Appetizer, Main, Dessert, Beverage
   - Used in: Orders and Reservations

7. **NOTIFICATION** - System events and admin alerts
   - Types: order_placed, order_cod_pending, reservation_confirmed
   - Recipients: Admin, users

8. **BLOG** - Marketing and informational content
   - Status: Draft, Published
   - Author: User reference

### Additional Models

9. **EVENT** - Promotions and special offers
   - Properties: Name, date, discount, applicable branches

10. **CONTACT** - Customer feedback and inquiries
    - Status: New, Responded, Resolved

---

## KEY BUSINESS RULES

### Order Processing
- **Dine-in**: Payment marked "paid" at table immediately
- **Takeaway prepaid**: Payment completed before pickup
- **Takeaway COD**: Payment marked "pending" (shipper collects)
- **Auto-Payment**: Created automatically on confirmation
- **Amount**: totalPrice = SUM(items), finalPrice = totalPrice - discount

### Reservation Confirmation
- **Branch scope**: Receptionists only see own branch reservations
- **Invoice amount**: deposit + foodTotal - foodDiscount
- **Auto-Payment**: Created automatically with exact amount
- **Table management**: Decreases availability on confirmation
- **Notification**: Admin alerted on confirmation

### Revenue Tracking
- **Single source of truth**: Payment collection
- **Auto-sync**: Orders and Reservations auto-create payments
- **Branch attribution**: All payments linked to branch
- **Staff attribution**: Tracked via collectedBy field
- **Payment states**: Pending (awaiting collection), Completed (collected)

### Multi-Branch Operations
- **Isolation**: Reception staff see only assigned branch data
- **Filtering**: All queries filtered by branchId
- **No cross-branch visibility**: Except for admin
- **Revenue aggregation**: By branch, by staff, by date
- **Shipper scope**: Global (all branches)

---

## HOW TO NAVIGATE

### For Specific Questions

1. **"Where is X data?"** → Go to SYSTEM_DATA_INDEX.md → Search by Concept
2. **"How does Y process work?"** → Go to COMPREHENSIVE_SYSTEM_MAP.md → Process Flows
3. **"What are Z business rules?"** → Go to COMPREHENSIVE_SYSTEM_MAP.md → Business Logic

### For Deep Understanding

1. Start with: System Overview & Architecture
2. Then read: Data Models & Relationships (your relevant models)
3. Understand: Business Logic & Rules
4. See in action: Process Flows

### For Implementation

1. Locate: Data Models & Relationships section
2. Find: Your specific model
3. Check: Key Fields, Relationships, Business Rules
4. Reference: Business Logic section for constraints
5. Review: Integration Points for connections

---

## CRITICAL RELATIONSHIPS AT A GLANCE

```
USER (Central Hub)
  ├─ Creates Orders → Auto-creates Payment
  ├─ Creates Reservations → Auto-creates Payment
  ├─ Assigned to Branch (staff/reception only)
  ├─ Receives Notifications
  └─ Can collect Payments (collectedBy field)

ORDER
  ├─ Contains Items (Dishes)
  ├─ Belongs to User
  ├─ Belongs to Branch
  └─ Auto-creates Payment

RESERVATION
  ├─ Contains Optional Pre-order Items (Dishes)
  ├─ Belongs to User
  ├─ Belongs to Branch
  ├─ Managed by Reception staff (own branch)
  └─ Auto-creates Payment

PAYMENT (Single Source of Truth for Revenue)
  ├─ Links to Order OR Reservation
  ├─ Belongs to User (customer)
  ├─ Belongs to Branch (location)
  ├─ Collected by User (staff)
  └─ Tracks status (pending/completed)

BRANCH
  ├─ Contains Users (assigned staff)
  ├─ Contains Orders (location)
  ├─ Contains Reservations (location)
  ├─ Contains Payments (revenue)
  └─ Manages table availability
```

---

## DOCUMENT USAGE GUIDE

### COMPREHENSIVE_SYSTEM_MAP.md (Main Reference)
- **Size**: 702 lines, complete coverage
- **Contains**: All models, rules, flows, relationships
- **Use When**: You need complete information, implementing features, understanding system
- **Navigation**: Use table of contents at top

### SYSTEM_DATA_INDEX.md (Quick Lookup)
- **Size**: 346 lines, indexed reference
- **Contains**: A-Z index, search guides, troubleshooting
- **Use When**: You have a specific question, looking for something quickly
- **Navigation**: Find your topic in alphabetical index or search by concept

---

## QUICK FACTS

- **Total Models**: 10 collections in MongoDB
- **Total Roles**: 6 user types with different permissions
- **Auto-Creations**: Order/Reservation automatically create Payment
- **Branch Isolation**: Staff see only assigned branch data
- **Revenue Source**: Payment collection (single source of truth)
- **Payment States**: Pending (awaiting), Completed (collected), Failed
- **Order Types**: Dine-in (immediate payment), Takeaway (prepaid/COD)
- **Staff Attribution**: All payments tracked to responsible staff member
- **Audit Trail**: All actions timestamped and attributed

---

## COMMON WORKFLOWS

### "I need to understand order processing"
→ Read: Order Model in Data Models
→ Then: Order Processing Logic in Business Logic
→ Then: Order Flow Map in Process Flows

### "I need to track revenue by branch"
→ Read: Payment Model in Data Models
→ Then: Revenue Tracking Logic in Business Logic
→ Then: Integration Points → Payment ← Branch (Aggregation)

### "I need to understand receptionist work"
→ Read: User Roles & Permissions → Reception role
→ Then: Reservation Processing Logic in Business Logic
→ Then: Reservation Flow Map in Process Flows

### "I need to check data isolation/security"
→ Read: Multi-Branch Operations Logic in Business Logic
→ Then: Permission Mapping in User Roles & Permissions
→ Then: Role-Based Access Control in Theoretical Framework

---

## KEY TERMS & DEFINITIONS

- **branchId**: Links data to specific location
- **collectedBy**: Staff member who collected payment
- **finalAmount**: Amount - Discount (actual payment received)
- **paymentTiming**: prepaid (payment before) or cod (collect on delivery)
- **paymentStatus**: unpaid (not received), pending (awaiting), paid (received)
- **revenueType**: Category of revenue (reception, delivery, event)
- **totalAmount**: Final invoice amount for reservation
- **Invariant**: Data value that must always be true

---

## GETTING STARTED

### For Developers
1. Read: System Overview & Architecture
2. Study: Your relevant Data Model
3. Understand: Related Business Rules
4. Check: Integration Points
5. Implement: Following patterns documented

### For Business Users
1. Read: User Roles & Permissions (find your role)
2. Study: Your relevant Process Flow
3. Understand: Business Rules affecting your work
4. Reference: Troubleshooting & Common Questions section

### For Managers/Analysts
1. Read: Revenue Tracking Logic
2. Study: Multi-Branch Operations Logic
3. Review: Process Flows
4. Analyze: Relationship Maps

---

## DOCUMENT MAP

```
CONCEPTUAL MAP SYSTEM
│
├── COMPREHENSIVE_SYSTEM_MAP.md (Main Reference)
│   ├── System architecture overview
│   ├── 10 complete data models
│   ├── Business logic rules
│   ├── User roles & permissions
│   ├── Process flows (order, reservation, payment)
│   ├── Integration points
│   └── Theoretical framework
│
├── SYSTEM_DATA_INDEX.md (Quick Lookup)
│   ├── A-Z alphabetical index
│   ├── Search by concept
│   ├── Search by data model
│   ��── Search by process
│   ├── Quick lookup tables
│   └── Troubleshooting guide
│
└── CONCEPTUAL_MAP_SUMMARY.md (This Document)
    ├── Overview of system
    ├── Quick reference
    ├── Navigation guide
    └── Getting started
```

---

## SUPPORT & REFERENCES

**Question not covered?**
- Check: SYSTEM_DATA_INDEX.md → Troubleshooting & Common Questions
- Search: Both documents using Ctrl+F
- Reference: The specific data model in COMPREHENSIVE_SYSTEM_MAP.md

**Need to update the map?**
- Follow: Same structure and format
- Maintain: Cross-references between documents
- Update: Both main reference and index documents

**Lost or confused?**
1. Start with this summary document
2. Use SYSTEM_DATA_INDEX.md to find your topic
3. Go to COMPREHENSIVE_SYSTEM_MAP.md for complete details

---

## CONCLUSION

The Conceptual Map provides a complete, interconnected knowledge base of your restaurant management system. All theories, concepts, data sources, and relationships are documented and cross-referenced for easy navigation and information retrieval.

Use COMPREHENSIVE_SYSTEM_MAP.md for deep understanding and SYSTEM_DATA_INDEX.md for quick lookups. Together, they form a comprehensive reference system that supports all stakeholders.
