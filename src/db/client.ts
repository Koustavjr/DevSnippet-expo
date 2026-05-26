import { drizzle } from 'drizzle-orm/expo-sqlite';
import * as SQLite from 'expo-sqlite';
import * as schema from "./Schema";

const expoDb = SQLite.openDatabaseSync("devsnippets.db")

export const db = drizzle(expoDb, { schema });