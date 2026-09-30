import { env } from "cloudflare:workers";
// Bootstrap only the initial additive schema; future schema changes use migrations.
const schema = [
 "CREATE TABLE IF NOT EXISTS chats (id text PRIMARY KEY NOT NULL,user_id text NOT NULL,tutor text NOT NULL,role text NOT NULL,content text NOT NULL,created_at text NOT NULL)",
 "CREATE INDEX IF NOT EXISTS chats_user_tutor_time ON chats(user_id,tutor,created_at)",
 "CREATE TABLE IF NOT EXISTS profiles (user_id text PRIMARY KEY NOT NULL,goal text DEFAULT 'Работа и жизнь в США или Канаде' NOT NULL,level text DEFAULT 'A2' NOT NULL)",
 "CREATE TABLE IF NOT EXISTS progress (user_id text NOT NULL,lesson_id text NOT NULL,score integer NOT NULL,total integer NOT NULL,answers text NOT NULL,updated_at text NOT NULL,PRIMARY KEY(user_id,lesson_id))",
 "CREATE TABLE IF NOT EXISTS quotas (user_id text NOT NULL,day text NOT NULL,count integer DEFAULT 0 NOT NULL,PRIMARY KEY(user_id,day))"
];
let initialization: Promise<unknown> | undefined;
export async function initializeDatabase() {
 if (!env.DB) return;
 initialization ??= env.DB.batch(schema.map(sql => env.DB!.prepare(sql))).catch(error => {initialization = undefined; throw error;});
 await initialization;
}
