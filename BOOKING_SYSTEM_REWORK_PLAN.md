# Booking System Rework Plan

## Overview

Transition from pre-created time slots to an on-demand, config-driven slot generation system.

---

## Current System Issues

- ❌ Time slots are pre-created in the database
- ❌ Slots exist independently before any booking
- ❌ Config stores slot templates but slots are materialized upfront
- ❌ Changes to config don't automatically reflect in existing slots

---

## New System Design

### Core Concept

**Virtual Slots + On-Demand Creation**

- Time slots only created when needed (booking or admin edit)
- All slot properties (price, availability) driven by config
- API returns virtual slots from config, merged with actual DB slots

### Key Principles

1. **Config owns the template** - All default slot configurations
2. **Weekly config stored** - In config table's `slots` JSONB field
3. **No pre-creation** - Slots generated on-the-fly for API responses
4. **DB only for overrides** - Physical time slots only when booked or manually edited

---

## Implementation Plan

### Phase 1: Core Utilities (New File)

**File:** `src/lib/slot-utils.ts`

**Functions to implement:**

```typescript
// Generate virtual slots from config for a date range
generateVirtualSlots(dates: string[], config: SlotsConfigType): VirtualSlot[]

// Filter slots based on avoidSlots configuration
filterAvoidSlots(slots: VirtualSlot[], avoidSlots: AvoidSlot[], date: string): VirtualSlot[]

// Merge DB slots with virtual slots (DB takes priority)
mergeWithActualSlots(virtualSlots: VirtualSlot[], dbSlots: TimeSlot[]): MergedSlot[]

// Check if a time is in the past for today's date
isPastTime(date: string, time: string): boolean

// Create slot from config template
createSlotFromConfig(date: string, from: string, to: string, config: SlotsConfigType): SlotData
```

---

### Phase 2: TimeSlot Router Modifications

**File:** `src/server/api/routers/timeSlot.ts`

#### `getAllByDate` Endpoint Redesign

**Current behavior:** Query DB for slots on a specific date
**New behavior:**

1. Fetch config from config table
2. Generate virtual slots from `config.slots.AvailableSlots`
3. Apply date-specific `avoidSlots` filters
4. Query DB for actual time slots that exist for that date
5. Merge virtual + actual (actual takes priority for booked/edited slots)
6. Filter out past times if querying current date
7. Return merged list with proper status

#### New Helper Endpoint: `getSlotConfig`

```typescript
getSlotConfig: publicProcedure.query(async () => {
  const config = await db.query.configTable.findFirst();
  return config?.slots;
});
```

---

### Phase 3: Booking Router Modifications

**File:** `src/server/api/routers/booking.ts`

#### `book` Mutation Changes

**Current logic:**

```typescript
1. Check if customer exists
2. Check if all time slots exist and are available
3. Create bookings
4. Update slots to booked
```

**New logic:**

```typescript
1. Check if customer exists
2. Fetch config
3. For each timeSlotId/time requested:
   a. Check if slot exists in DB
      - If exists → validate status is "available"
      - If not exists → create slot from config with amounts & set to "booked"
   b. Use amounts from slot (or config if newly created)
4. Generate verification code
5. Create bookings with proper amounts
6. Update existing slots OR insert new slots as "booked"
7. Send confirmation email
```

**Key changes:**

- Remove assumption that slots pre-exist
- Add slot creation logic: `createSlotFromConfig()`
- Validate against config's availability and avoidSlots
- Handle both existing and new slots seamlessly

#### Input Schema Update

**Decision:** Accept time ranges instead of slot IDs:

```typescript
book: publicProcedure.input(
  z.object({
    number: z.string().min(1, "Phone number is required"),
    timeSlots: z
      .array(
        z.object({
          date: z
            .string()
            .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be YYYY-MM-DD"),
          from: z
            .string()
            .regex(/^\d{2}:\d{2}:\d{2}$/, "Time must be HH:MM:SS"),
          to: z.string().regex(/^\d{2}:\d{2}:\d{2}$/, "Time must be HH:MM:SS"),
        }),
      )
      .min(1, "At least one time slot is required"),
    paymentType: z.enum(["full", "advance"]),
    bookingType: z
      .enum(["cricket", "football", "cricket&football"])
      .default("cricket"),
    couponId: z.string().uuid().optional(),
  }),
);
```

This allows booking non-existent slots and provides better validation.

---

### Phase 4: Admin Panel Enhancements

**File:** `src/server/api/routers/admin.ts`

#### New Endpoints for Slot Management

**1. Create Specific Slot Override**

```typescript
createSlot: managerProcedure
  .input(
    z.object({
      date: z.string(),
      from: z.string(),
      to: z.string(),
      fullAmount: z.number().optional(),
      advanceAmount: z.number().optional(),
      status: z.enum(["available", "unavailable"]),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    // Create slot in DB with custom amounts/status
    // This overrides config for this specific slot
  });
```

**2. Update Existing Slot**

```typescript
updateSlot: managerProcedure
  .input(
    z.object({
      slotId: z.number(),
      fullAmount: z.number().optional(),
      advanceAmount: z.number().optional(),
      status: timeSlotStatusEnum().optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    // Update slot properties
  });
```

**3. Delete Slot (Revert to Config)**

```typescript
deleteSlot: managerProcedure
  .input(z.object({ slotId: z.number() }))
  .mutation(async ({ input, ctx }) => {
    // Delete slot from DB
    // Virtual slot from config will take its place
  });
```

**4. Bulk Create Slots**

```typescript
bulkCreateSlots: managerProcedure
  .input(
    z.object({
      dates: z.array(z.string()),
      useConfigTemplate: z.boolean().default(true),
      customAmounts: z
        .object({
          fullAmount: z.number(),
          advanceAmount: z.number(),
        })
        .optional(),
    }),
  )
  .mutation(async ({ input, ctx }) => {
    // Create slots for multiple dates
    // Useful for special events or advance booking setup
  });
```

**5. Enhanced Config Update**

```typescript
configUpdate: managerProcedure
  .input(
    z.object({
      slots: z
        .object({
          AvailableSlots: z.array(
            z.object({
              from: z.string(),
              to: z.string(),
              status: z.enum(["available", "unavailable"]),
              fullAmount: z.number(),
              advanceAmount: z.number(),
            }),
          ),
          avoidSlots: z.array(
            z.object({
              from: z.string(),
              to: z.string(),
              date: z.string(),
            }),
          ),
          daysInAdvanceToCreateSlots: z.number(),
        })
        .optional(),
      // ... other config fields
    }),
  )
  .mutation(async ({ input, ctx }) => {
    // Update config
    // Changes immediately reflect in virtual slots
  });
```

---

### Phase 5: Schema Enhancements

**Current schema already supports the new system:**

- ✅ `timeSlots` table with flexible amounts
- ✅ `configTable` with JSONB slots configuration
- ✅ Proper relations and indexes
- ✅ Status enum includes all needed states
- ✅ Unique index on `(from, to, date)` already exists (from schema)

**Required Enhancement:** Add composite index for better query performance:

```sql
CREATE INDEX time_slot_date_status_idx ON "Aruppukottai_turf_time_slot"("date", "status");
```

**Verification:** Check existing unique constraint:

```sql
-- Already exists in schema:
-- uniqueIndex("time_slot_from_to_date_unique_idx").on(t.from, t.to, t.date)
```

This constraint prevents race conditions when creating slots on-demand.

---

## Data Flow Examples

### Example 1: Customer Books a Slot (Slot Doesn't Exist)

```
1. Customer requests: 2025-12-20, 14:00-15:00
2. System checks DB → slot not found
3. System fetches config → AvailableSlots has 14:00-15:00 template
4. System checks avoidSlots → no restriction for 2025-12-20
5. System creates new time slot from config:
   - date: 2025-12-20
   - from: 14:00
   - to: 15:00
   - fullAmount: 800_00 (from config)
   - advanceAmount: 100_00 (from config)
   - status: "booked"
6. System creates booking record
7. Customer receives confirmation
```

### Example 2: Customer Books a Slot (Slot Exists)

```
1. Customer requests: 2025-12-21, 16:00-17:00
2. System checks DB → slot found with status "available"
3. System uses existing slot amounts (may differ from config if edited)
4. System updates slot status to "booked"
5. System creates booking record
6. Customer receives confirmation
```

### Example 3: API Returns Available Slots

```
1. Customer requests: Available slots for 2025-12-22
2. System fetches config → gets AvailableSlots template (24 slots)
3. System filters by avoidSlots → removes 10:00-12:00 (maintenance)
4. System queries DB → finds 3 actual slots (2 booked, 1 available)
5. System merges:
   - Replace virtual 09:00-10:00 with DB slot (booked)
   - Replace virtual 14:00-15:00 with DB slot (booked)
   - Replace virtual 16:00-17:00 with DB slot (available, but with custom price)
   - Keep remaining virtual slots from config
6. System filters out booked slots
7. Returns 21 available slots to customer
```

### Example 4: Admin Edits Specific Slot

```
1. Admin wants to make 2025-12-25, 18:00-19:00 cost ₹1200 (holiday pricing)
2. Admin calls createSlot/updateSlot endpoint
3. System creates/updates DB entry:
   - date: 2025-12-25
   - from: 18:00
   - to: 19:00
   - fullAmount: 1200_00
   - advanceAmount: 200_00
   - status: "available"
4. When customers query slots for 2025-12-25, this DB slot overrides config
```

---

## Migration Strategy

### Step 1: Add New Code (Backward Compatible)

- Implement `slot-utils.ts` helpers
- Update timeSlot router with new logic
- Keep existing DB slots working
- No breaking changes

### Step 2: Update Booking Flow

- Modify booking mutation to create slots on-demand
- Test with both existing slots and new bookings
- Monitor for issues

### Step 3: Deploy Admin Tools

- Add new admin endpoints
- Create UI for slot management
- Enable config editing

### Step 4: Data Cleanup (Optional)

- Archive old unused pre-created slots
- Add cron job to cleanup slots older than X days
- Keep only booked slots and manual overrides

---

## Benefits of New System

### Efficiency

✅ No pre-population needed
✅ Reduced database bloat (only store what's needed)
✅ Faster queries (less data to scan)

### Flexibility

✅ Config changes apply instantly to virtual slots
✅ Easy to add special pricing/availability
✅ Fine-grained control over specific dates
✅ Weekly templates + date-specific overrides

### Maintainability

✅ Single source of truth (config)
✅ Cleaner data model
✅ Less cron jobs needed
✅ Easier to reason about system state

### Business Value

✅ Dynamic pricing capabilities
✅ Event-based slot management
✅ Seasonal adjustments without DB churn
✅ Better admin UX

---

## File Summary

### Files to Create

1. `src/lib/slot-utils.ts` - Utility functions for slot generation and merging

### Files to Modify

1. `src/server/api/routers/timeSlot.ts` - Virtual slot generation logic
2. `src/server/api/routers/booking.ts` - On-demand slot creation
3. `src/server/api/routers/admin.ts` - Slot management endpoints

### Files Not Changed

- `src/server/db/schema.ts` - Schema already supports this
- Database migrations - No schema changes needed

---

## Questions Resolved ✅

1. **Booking API Input:** Accept time ranges `{date, from, to}` instead of slot IDs since slots may not exist yet. Uniqueness enforced by `(date, from, to)` combination.

2. **Slot Retention:** Keep all booked slots indefinitely for historical records and analytics.

3. **Recurring Patterns:** Weekly config is sufficient. No special recurring pattern support needed - weekly template automatically handles "every Monday" scenarios.

4. **Price History:** Not needed. Current slot amounts are sufficient.

5. **Virtual Slot Status:** Virtual slots reflect actual availability - if a slot is booked in DB, it won't appear as available in the virtual merge.

---

## Additional Considerations

### Race Condition Handling

**Scenario:** Two customers book the same non-existent slot simultaneously

**Solution:**

- Use database unique constraint on `(date, from, to)`
- Implement transaction with `INSERT ... ON CONFLICT` handling
- Return proper error to second customer
- Frontend should handle retry logic

```typescript
// In booking mutation
try {
  const slot = await db.insert(timeSlots)
    .values({ date, from, to, status: 'booked', ... })
    .onConflictDoUpdate({
      target: [timeSlots.date, timeSlots.from, timeSlots.to],
      set: { status: 'booked' },
      where: eq(timeSlots.status, 'available')
    })
    .returning();

  if (slot.status !== 'booked') {
    throw new Error('Slot no longer available');
  }
} catch (error) {
  // Handle concurrent booking attempt
}
```

### Timezone Considerations

- All times stored in server timezone (IST assumed)
- Client should send times in server timezone
- Display can be adjusted on client side if needed
- Use PostgreSQL `timestamp with timezone` for accurate time handling

### Slot Validation Rules

- Slot duration must match config template durations
- Cannot book slots in the past
- Cannot book beyond `daysInAdvanceToCreateSlots` limit
- Cannot book slots in `avoidSlots` date ranges

### Performance Optimizations

- Cache config in memory with TTL (e.g., 5 minutes)
- Use database indexes on `(date, from, to)` and `status`
- Batch DB queries when fetching multiple dates
- Consider Redis for high-traffic scenarios

### Monitoring & Logging

- Log all on-demand slot creations
- Track merge performance (virtual + DB)
- Alert on unusual booking patterns
- Monitor race condition occurrences

---

_Document created: December 17, 2025_
