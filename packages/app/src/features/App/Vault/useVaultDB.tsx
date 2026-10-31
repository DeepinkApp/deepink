import { ManagedDatabase } from '@core/database/ManagedDatabase';
import { SQLiteDB } from '@core/database/sqlite';

import { useVaultControls } from './useVaultControls';

export function useVaultDB(managed: true): ManagedDatabase<SQLiteDB>;
export function useVaultDB(managed: false): SQLiteDB;
export function useVaultDB(): SQLiteDB;
export function useVaultDB(managed = false): SQLiteDB | ManagedDatabase<SQLiteDB> {
	const db = useVaultControls().vault.db;
	return managed ? db : db.get();
}
