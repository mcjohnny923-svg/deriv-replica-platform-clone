import {
  pgTable,
  text,
  serial,
  integer,
  numeric,
  timestamp,
  boolean,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

// ---------- Enums ----------
export const accountTypeEnum = pgEnum("account_type", ["demo", "real"]);
export const tradeStatusEnum = pgEnum("trade_status", ["open", "won", "lost"]);
export const transactionTypeEnum = pgEnum("transaction_type", [
  "deposit",
  "withdrawal",
]);
export const transactionStatusEnum = pgEnum("transaction_status", [
  "pending",
  "completed",
  "failed",
]);

// ---------- Users ----------
export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  fullName: text("full_name"),
  referralCode: text("referral_code").unique(),
  referredByUserId: integer("referred_by_user_id"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(usersTable).omit({
  id: true,
  createdAt: true,
});
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof usersTable.$inferSelect;

// ---------- Accounts (demo + real per user) ----------
export const accountsTable = pgTable("accounts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id")
    .references(() => usersTable.id)
    .notNull(),
  type: accountTypeEnum("type").notNull(),
  currency: text("currency").notNull().default("USD"),
  balance: numeric("balance", { precision: 15, scale: 2 })
    .notNull()
    .default("0"),
  isActive: boolean("is_active").notNull().default(true),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertAccountSchema = createInsertSchema(accountsTable).omit({
  id: true,
  createdAt: true,
});
export type InsertAccount = z.infer<typeof insertAccountSchema>;
export type Account = typeof accountsTable.$inferSelect;

// ---------- Markets ----------
export const marketsTable = pgTable("markets", {
  id: serial("id").primaryKey(),
  symbol: text("symbol").notNull().unique(),
  displayName: text("display_name").notNull(),
  category: text("category").notNull(),
  isActive: boolean("is_active").notNull().default(true),
});

export const insertMarketSchema = createInsertSchema(marketsTable).omit({
  id: true,
});
export type InsertMarket = z.infer<typeof insertMarketSchema>;
export type Market = typeof marketsTable.$inferSelect;

// ---------- Trades ----------
export const tradesTable = pgTable("trades", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .references(() => accountsTable.id)
    .notNull(),
  marketId: integer("market_id")
    .references(() => marketsTable.id)
    .notNull(),
  tradeType: text("trade_type").notNull(),
  direction: text("direction").notNull(),
  digit: integer("digit"),
  stake: numeric("stake", { precision: 15, scale: 2 }).notNull(),
  payoutMultiplier: numeric("payout_multiplier", { precision: 6, scale: 3 }).notNull(),
  entryPrice: numeric("entry_price", { precision: 15, scale: 5 }).notNull(),
  exitPrice: numeric("exit_price", { precision: 15, scale: 5 }),
  payout: numeric("payout", { precision: 15, scale: 2 }),
  status: tradeStatusEnum("status").notNull().default("open"),
  openedAt: timestamp("opened_at").defaultNow().notNull(),
  settlesAt: timestamp("settles_at").notNull(),
  closedAt: timestamp("closed_at"),
});

export const insertTradeSchema = createInsertSchema(tradesTable).omit({
  id: true,
  openedAt: true,
});
export type InsertTrade = z.infer<typeof insertTradeSchema>;
export type Trade = typeof tradesTable.$inferSelect;

// ---------- Transactions (deposits/withdrawals) ----------
export const transactionsTable = pgTable("transactions", {
  id: serial("id").primaryKey(),
  accountId: integer("account_id")
    .references(() => accountsTable.id)
    .notNull(),
  type: transactionTypeEnum("type").notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  status: transactionStatusEnum("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertTransactionSchema = createInsertSchema(
  transactionsTable,
).omit({
  id: true,
  createdAt: true,
});
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Transaction = typeof transactionsTable.$inferSelect;

// ---------- Referral earnings ledger ----------
export const referralEarningsTable = pgTable("referral_earnings", {
  id: serial("id").primaryKey(),
  referrerUserId: integer("referrer_user_id")
    .references(() => usersTable.id)
    .notNull(),
  referredUserId: integer("referred_user_id")
    .references(() => usersTable.id)
    .notNull(),
  tradeId: integer("trade_id")
    .references(() => tradesTable.id)
    .notNull(),
  amount: numeric("amount", { precision: 15, scale: 2 }).notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertReferralEarningSchema = createInsertSchema(
  referralEarningsTable,
).omit({
  id: true,
  createdAt: true,
});
export type InsertReferralEarning = z.infer<typeof insertReferralEarningSchema>;
export type ReferralEarning = typeof referralEarningsTable.$inferSelect;

// ---------- Relations ----------
export const usersRelations = relations(usersTable, ({ many }) => ({
  accounts: many(accountsTable),
}));

export const accountsRelations = relations(accountsTable, ({ one, many }) => ({
  user: one(usersTable, {
    fields: [accountsTable.userId],
    references: [usersTable.id],
  }),
  trades: many(tradesTable),
  transactions: many(transactionsTable),
}));

export const tradesRelations = relations(tradesTable, ({ one }) => ({
  account: one(accountsTable, {
    fields: [tradesTable.accountId],
    references: [accountsTable.id],
  }),
  market: one(marketsTable, {
    fields: [tradesTable.marketId],
    references: [marketsTable.id],
  }),
}));

export const transactionsRelations = relations(
  transactionsTable,
  ({ one }) => ({
    account: one(accountsTable, {
      fields: [transactionsTable.accountId],
      references: [accountsTable.id],
    }),
  }),
);

export const referralEarningsRelations = relations(
  referralEarningsTable,
  ({ one }) => ({
    referrer: one(usersTable, {
      fields: [referralEarningsTable.referrerUserId],
      references: [usersTable.id],
    }),
    referred: one(usersTable, {
      fields: [referralEarningsTable.referredUserId],
      references: [usersTable.id],
    }),
    trade: one(tradesTable, {
      fields: [referralEarningsTable.tradeId],
      references: [tradesTable.id],
    }),
  }),
);
