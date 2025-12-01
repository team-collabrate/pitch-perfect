import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  pgTable,
  pgTableCreator,
  text,
  timestamp,
  pgEnum,
  uniqueIndex,
} from "drizzle-orm/pg-core";
/**
 * Multi-project schema creator
 */

export const createTable = pgTableCreator(
  (name) => `Aruppukottai_turf_${name}`
);

/* -------------------- TABLES -------------------- */

/* 1. Managers (needs roles enum) */
export const rolesEnum = pgEnum("roles", ["admin", "superAdmin", "staff"]);

export const managers = createTable("manager", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  authId: d.text().notNull().unique().references(() => user.id), // references auth user table
  role: rolesEnum().notNull().default("staff"),

  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

/* 2. Time Slots (references managers) */
export const timeSlotStatusEnum = pgEnum("time_slot_status", [
  "available",
  "booked",
  "unavailable",
  "bookingInProgress",
]);

export const timeSlots = createTable(
  "time_slot",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    from: d.time().notNull(),
    to: d.time().notNull(),
    date: d.date().notNull(),
    status: timeSlotStatusEnum().notNull().default("available"),

    createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
    updatedBy: d.integer().references(() => managers.id),
  }),
  (t) => [
    uniqueIndex("time_slot_from_to_date_unique_idx").on(t.from, t.to, t.date),
  ]
);

/* 3. customers */
export const languageEnum = pgEnum("language", ["en", "ta"]); // English, Tamil

export const customers = createTable(
  "customer",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),

    name: d.varchar({ length: 100 }),
    number: d.varchar({ length: 20 }).notNull().unique(),
    email: d.varchar({ length: 256 }),
    alternateContactName: d.varchar({ length: 100 }),
    alternateContactNumber: d.varchar({ length: 20 }),
    languagePreference: languageEnum().notNull().default("en"),

    createdAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
    updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  }),
  (t) => [index("user_number_idx").on(t.number)]
);

/* 4. Bookings (references customers & timeSlots) */
export const bookingStatusEnum = pgEnum("booking_status", [
  "advancePaid",
  "fullPaid",
  "fullPending",
  "advancePending",
  "wontCome",
  "paymentFailed",
]);

export const bookingTypeEnum = pgEnum("booking_type", ["cricket", "football"]);

export const bookings = createTable("booking", (d) => ({
  id: d.uuid().primaryKey().defaultRandom().notNull(),

  phoneNumber: d
    .varchar({ length: 20 })
    .notNull()
    .references(() => customers.number),
  timeSlotId: d
    .integer()
    .notNull()
    .references(() => timeSlots.id),
  paymentId: d.varchar({ length: 255 }), // from payment gateway in future
  finalPaymentId: d.varchar({ length: 255 }), // from payment gateway in future
  couponId: d.uuid().references(() => coupons.id), //optional

  amountPaid: d.integer().notNull().default(0), // in paise
  totalAmount: d.integer().notNull(), // in paise

  verificationCode: d.varchar({ length: 4 }).notNull(), // 4-digit code
  bookingType: bookingTypeEnum().notNull().default("cricket"),

  createdAt: d.timestamp({ withTimezone: true }).defaultNow().notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
  status: bookingStatusEnum().notNull().default("advancePending"),
}));

/* 5. Banners (references managers) */
export const bannerTypeEnum = pgEnum("banner_type", ["image", "video", "gif"]);

export const banners = createTable("banner", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),

  title: d.varchar({ length: 100 }).notNull(),
  description: d.text(),
  altText: d.varchar({ length: 256 }),
  type: d.varchar({ length: 10 }).notNull(),
  url: d.varchar({ length: 256 }).notNull(),
  bannerType: bannerTypeEnum().notNull().default("image"),
  language: languageEnum().notNull().default("en"),
  bannerIndex: d.integer().notNull().default(0),

  uploadedBy: d.integer().references(() => managers.id),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  expireAt: d.timestamp({ withTimezone: true }),
}));

export const actionsEnum = pgEnum("manager_actions", [
  // Time Slot Actions
  "create_time_slot",
  "update_time_slot",
  "delete_time_slot",

  // User Actions
  "create_user",
  "update_user",

  // Booking Actions
  "create_booking",
  "update_booking_status",
  "move_booking",
  "cancel_booking", // only in extreme cases

  // Manager Auth Actions
  "manager_login",
  "manager_logout",
  "failed_login_attempt",
  "password_change",

  // Admin Actions
  "assign_role",
  "change_role",
  "revoke_role",
  "delete_manager",
  "create_manager",

  // Config Actions
  "create_banner",
  "update_banner",
  "delete_banner",
  "change_configs",
  "other",
]);

export const managerLogsStatusEnum = pgEnum("manager_log_status", [
  "success",
  "failure",
  "pending",
  "waiting_for_approval",
]);

export const managerLogs = createTable("manager_log", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  managerId: d
    .integer()
    .notNull()
    .references(() => managers.id),
  action: actionsEnum().notNull().default("other"),
  details: d.jsonb(),
  status: managerLogsStatusEnum().notNull(),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const coupons = createTable("coupon", (d) => ({
  id: d.uuid().primaryKey().defaultRandom().notNull(),

  code: d.varchar({ length: 50 }).notNull().unique(),
  description: d.text(),

  discountPercentage: d.integer().notNull(),
  maxDiscountAmount: d.integer().notNull().default(0), // 0 means no limit
  minimumPurchaseAmount: d.integer().notNull().default(0), // 0 means no minimum

  validFrom: d.date().notNull(),
  validTo: d.date().notNull(),
  usageLimit: d.integer().notNull().default(0), // 0 means unlimited
  numberOfUses: d.integer().notNull().default(0),

  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),
}));

export const couponUses = createTable(
  "coupon_use",
  (d) => ({
    id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
    couponId: d
      .uuid()
      .notNull()
      .references(() => coupons.id),
    phoneNumber: d
      .varchar({ length: 20 })
      .notNull()
      .references(() => customers.number),
    bookingId: d
      .uuid()
      .notNull()
      .references(() => bookings.id),
    usedAt: d
      .timestamp({ withTimezone: true })
      .$defaultFn(() => new Date())
      .notNull(),
  }),
  (t) => [
    uniqueIndex("coupon_use_couponid_phonenumber_unique_idx").on(
      t.couponId,
      t.phoneNumber,
      t.bookingId
    ),
  ]
);

/* -------------------- RELATIONS -------------------- */

// Managers Relations
export const managersRelations = relations(managers, ({ many, one }) => ({
  authUser: one(user, {
    fields: [managers.authId],
    references: [user.id],
  }),
  timeSlots: many(timeSlots),
  banners: many(banners),
  logs: many(managerLogs),
}));

// TimeSlots Relations
export const timeSlotsRelations = relations(timeSlots, ({ one, many }) => ({
  manager: one(managers, {
    fields: [timeSlots.updatedBy],
    references: [managers.id],
  }),
  bookings: many(bookings),
}));

// customers Relations
export const customersRelations = relations(customers, ({ many }) => ({
  bookings: many(bookings),
  couponUses: many(couponUses),
}));

// Bookings Relations
export const bookingsRelations = relations(bookings, ({ one, many }) => ({
  timeSlot: one(timeSlots, {
    fields: [bookings.timeSlotId],
    references: [timeSlots.id],
  }),
  user: one(customers, {
    fields: [bookings.phoneNumber],
    references: [customers.number],
  }),
  coupon: one(coupons, {
    fields: [bookings.couponId],
    references: [coupons.id],
  }),
  couponUses: many(couponUses),
}));

// Banners Relations
export const bannersRelations = relations(banners, ({ one }) => ({
  manager: one(managers, {
    fields: [banners.uploadedBy],
    references: [managers.id],
  }),
}));

// ManagerLogs Relations
export const managerLogsRelations = relations(managerLogs, ({ one }) => ({
  manager: one(managers, {
    fields: [managerLogs.managerId],
    references: [managers.id],
  }),
}));

// Coupons Relations
export const couponsRelations = relations(coupons, ({ many }) => ({
  bookings: many(bookings),
  couponUses: many(couponUses),
}));

// CouponUses Relations
export const couponUsesRelations = relations(couponUses, ({ one }) => ({
  coupon: one(coupons, {
    fields: [couponUses.couponId],
    references: [coupons.id],
  }),
  user: one(customers, {
    fields: [couponUses.phoneNumber],
    references: [customers.number],
  }),
  booking: one(bookings, {
    fields: [couponUses.bookingId],
    references: [bookings.id],
  }),
}));

//config table
export const configTable = createTable("config", (d) => ({
  id: d.integer().primaryKey().generatedByDefaultAsIdentity(),
  updatedBy: d.integer().references(() => managers.id),
  createdAt: d
    .timestamp({ withTimezone: true })
    .$defaultFn(() => new Date())
    .notNull(),
  updatedAt: d.timestamp({ withTimezone: true }).$onUpdate(() => new Date()),

  maintenanceMode: d.boolean().notNull().default(false),
  maintenanceMessage: d.text().notNull().default(""),

  fullPaymentMode: d.boolean().notNull().default(false),

  slotIntervalMinutes: d.integer().notNull().default(60),
  numberOfSlotsPerDay: d.integer().notNull().default(24),

  bookingBufferMinutes: d.integer().notNull().default(3),// minutes before payment deadline to open slot again

  slotsVisibleDaysInAdvance: d.integer().notNull().default(4), // number of days in advance slots are visible to customers
}));




/* -------------------- AUTH TABLES -------------------- */
// auth tables - auto generated by better-auth's drizzle adapter

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified")
    .$defaultFn(() => false)
    .notNull(),
  image: text("image"),
  createdAt: timestamp("created_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
  updatedAt: timestamp("updated_at")
    .$defaultFn(() => /* @__PURE__ */ new Date())
    .notNull(),
});

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
});

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => user.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull(),
  updatedAt: timestamp("updated_at").notNull(),
});

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
  updatedAt: timestamp("updated_at").$defaultFn(
    () => /* @__PURE__ */ new Date(),
  ),
});

export const userRelations = relations(user, ({ many, one }) => ({
  account: many(account),
  session: many(session),
  manager: one(managers, {
    fields: [user.id],
    references: [managers.authId],
  }),
}));

export const accountRelations = relations(account, ({ one }) => ({
  user: one(user, { fields: [account.userId], references: [user.id] }),
}));

export const sessionRelations = relations(session, ({ one }) => ({
  user: one(user, { fields: [session.userId], references: [user.id] }),
}));
