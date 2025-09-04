import { relations } from 'drizzle-orm';
import { boolean, pgTable, primaryKey, text, timestamp, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').primaryKey(),
  email: text('email'),
});

export const profiles = pgTable('profiles', {
  id: uuid('id').primaryKey().references(() => users.id),
  email: text('email'),
  isAdmin: boolean('is_admin'),
  createdAt: timestamp('created_at', { withTimezone: true }),
});

export const workspaces = pgTable('workspaces', {
  id: uuid('id').primaryKey(),
  userId: uuid('user_id').references(() => users.id),
  domain: text('domain'),
  workspaceName: text('workspace_name'),
  isPrimary: boolean('is_primary'),
});

export const workspaceApiKeys = pgTable('workspace_api_keys', {
  id: uuid('id').primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  apiKey: text('api_key'),
  keyHash: text('key_hash'),
  name: text('name'),
});

export const crawlerVisits = pgTable('crawler_visits', {
  id: uuid('id').primaryKey(),
  workspaceId: uuid('workspace_id').references(() => workspaces.id),
  domain: text('domain'),
  path: text('path'),
  crawlerName: text('crawler_name'),
  timestamp: timestamp('timestamp', { withTimezone: true }),
});

export const usersRelations = relations(users, ({ one, many }) => ({
  profile: one(profiles, {
    fields: [users.id],
    references: [profiles.id],
  }),
  workspaces: many(workspaces),
}));

export const profilesRelations = relations(profiles, ({ one }) => ({
  user: one(users, {
    fields: [profiles.id],
    references: [users.id],
  }),
}));

export const workspacesRelations = relations(workspaces, ({ one, many }) => ({
  user: one(users, {
    fields: [workspaces.userId],
    references: [users.id],
  }),
  apiKeys: many(workspaceApiKeys),
  crawlerVisits: many(crawlerVisits),
}));

export const workspaceApiKeysRelations = relations(workspaceApiKeys, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [workspaceApiKeys.workspaceId],
    references: [workspaces.id],
  }),
}));

export const crawlerVisitsRelations = relations(crawlerVisits, ({ one }) => ({
  workspace: one(workspaces, {
    fields: [crawlerVisits.workspaceId],
    references: [workspaces.id],
  }),
}));
