import { sqliteTable,text,integer,index } from "drizzle-orm/sqlite-core";
export const designs = sqliteTable("designs",{
 id:text("id").primaryKey(),ownerId:text("owner_id").notNull(),name:text("name").notNull().default(""),products:text("products").notNull().default("[]"),createdAt:integer("created_at").notNull(),updatedAt:integer("updated_at").notNull(),expiresAt:integer("expires_at"),revokedAt:integer("revoked_at"),token:text("token").unique(),version:integer("version").notNull().default(1)
}, t=>[index("designs_owner_created").on(t.ownerId,t.createdAt)]);
export const assets = sqliteTable("assets",{id:text("id").primaryKey(),designId:text("design_id").notNull().references(()=>designs.id),ownerId:text("owner_id").notNull(),objectKey:text("object_key").notNull(),name:text("name").notNull(),type:text("type").notNull(),size:integer("size").notNull(),createdAt:integer("created_at").notNull()},t=>[index("assets_design").on(t.designId)]);

