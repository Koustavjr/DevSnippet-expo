import { relations } from "drizzle-orm"
import { int, integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core"



// one snippet can belong to multiple tags



//  one snippet + one tag together will belong to one particular snippet-tag relation only

export const snippets = sqliteTable("snippets", {
    id: int('id').primaryKey({ autoIncrement: true }),
    title: text('title').notNull(),
    content: text('content').notNull(),
    language: text('language').notNull(),
    is_favorite: integer('is_favorite', { mode: "boolean" }).notNull().default(false),
    created_at: integer('created_at', { mode: "timestamp_ms" }).notNull(),
    updated_at: integer('updated_at', { mode: "timestamp_ms" }).notNull(),
})

export const tags = sqliteTable('tags', {
    id: int('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull().unique(),
})

export const snippet_tags = sqliteTable("snippet_tags", {
    snippet_id: int("snippet_id").notNull().references(() => snippets.id, { onDelete: 'cascade' }),
    tag_id: int("tag_id").notNull().references(() => tags.id, { onDelete: 'cascade' }),
},
    (table) => ({
        pk: primaryKey({ columns: [table.snippet_id, table.tag_id] })
    }))

export const files = sqliteTable("files", {
    id: int('id').primaryKey({ autoIncrement: true }),
    name: text('name').notNull(),
    snippet_id: int('snippet_id').references(() => snippets.id, { onDelete: 'set null' }),
    path: text('path').notNull(),
    size: integer('size'),
    type: text('type'),
    created_at: integer('created_at', { mode: "timestamp_ms" }).notNull(),
})

export const snippetRelations = relations(snippets, ({ many }) => ({
    snippet_tags: many(snippet_tags),
    files: many(files),
}))

export const tagRelations = relations(tags, ({ many }) => ({
    snippet_tags: many(snippet_tags),
}))

export const snippetTagsRelations = relations(snippet_tags, ({ one }) => ({
    snippet: one(snippets, {
        fields: [snippet_tags.snippet_id],
        references: [snippets.id],
    }),
    tag: one(tags, {
        fields: [snippet_tags.tag_id],
        references: [tags.id],
    }),
}))

export const fileRelations = relations(files, ({ one }) => ({
    snippet: one(snippets, {
        fields: [files.snippet_id],
        references: [snippets.id],
    }),
}))



