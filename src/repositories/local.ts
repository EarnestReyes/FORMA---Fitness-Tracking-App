import { openDatabaseAsync, type SQLiteDatabase } from 'expo-sqlite';
import { schema } from '../database/schema';
import { exerciseCatalog, foodCatalog, templateCatalog } from '../constants/catalog';
import { defaultPrices, recipes } from '../constants/recipes';
import type { AppData, PlannedExercise, WorkoutSet } from '../types/models';

let connection: Promise<SQLiteDatabase> | undefined;
const tables = { exercises: 'exercises', templates: 'workout_templates', sessions: 'workout_sessions', runs: 'running_sessions', water: 'hydration_logs', weights: 'body_measurements', foods: 'foods', meals: 'meals', recovery: 'recovery_logs', activities: 'planned_activities', prices: 'ingredient_prices', mealPlans: 'meal_plans' } as const;
type Row = { id: string; payload: string };
async function database() {
  if (!connection) connection = openDatabaseAsync('forma.db').catch(error => { connection = undefined; throw error; });
  return connection;
}
async function upsert(db: SQLiteDatabase, table: string, value: { id: string }, foodId?: string) {
  const now = new Date().toISOString();
  if (foodId) {
    await db.runAsync(`INSERT INTO ${table}(id, food_id, payload, created_at, updated_at) VALUES (?, ?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET food_id=excluded.food_id, payload=excluded.payload, updated_at=excluded.updated_at`, value.id, foodId, JSON.stringify(value), now, now);
  } else {
    await db.runAsync(`INSERT INTO ${table}(id, payload, created_at, updated_at) VALUES (?, ?, ?, ?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload, updated_at=excluded.updated_at`, value.id, JSON.stringify(value), now, now);
  }
}
export async function initialize() {
  const db = await database();
  await db.execAsync(schema);
  const migration = await db.getFirstAsync<{ version: number }>('SELECT MAX(version) AS version FROM schema_migrations');
  if (!migration?.version) {
    await db.withTransactionAsync(async () => {
      for (const exercise of exerciseCatalog) await upsert(db, 'exercises', exercise);
      for (const food of foodCatalog) await upsert(db, 'foods', food);
      for (const template of templateCatalog) {
        const { exercises, ...header } = template;
        await upsert(db, 'workout_templates', header);
        for (const [position, ex] of exercises.entries()) await db.runAsync('INSERT INTO workout_template_exercises(id, template_id, exercise_id, position, payload) VALUES (?, ?, ?, ?, ?)', ex.id, template.id, ex.exerciseId, position, JSON.stringify(ex));
      }
      await db.runAsync('INSERT INTO schema_migrations(version, applied_at) VALUES (1, ?)', new Date().toISOString());
    });
  }
  if ((migration?.version ?? 0) < 2) await db.withTransactionAsync(async () => {
    for (const food of foodCatalog) if (!await db.getFirstAsync('SELECT id FROM foods WHERE id=?',food.id)) await upsert(db,'foods',food);
    for (const price of defaultPrices) await upsert(db,'ingredient_prices',price);
    for (const recipe of recipes) await upsert(db,'recipes',recipe);
    await db.runAsync('INSERT INTO schema_migrations(version,applied_at) VALUES (2,?)',new Date().toISOString());
  });
  return readData();
}
export async function readData(): Promise<AppData> {
  const db = await database();
  const profileRow = await db.getFirstAsync<Row>("SELECT * FROM user_profile WHERE id='profile'");
  const result = { profile: profileRow ? JSON.parse(profileRow.payload) : null, favorites: (await db.getAllAsync<{ exercise_id: string }>('SELECT exercise_id FROM favorite_exercises')).map(row => row.exercise_id) } as AppData;
  for (const key of Object.keys(tables) as (keyof typeof tables)[]) {
    const rows = await db.getAllAsync<Row>(`SELECT id, payload FROM ${tables[key]} ORDER BY created_at DESC, id`);
    Object.assign(result, { [key]: rows.map(row => JSON.parse(row.payload)) });
  }
  for (const template of result.templates) template.exercises = (await db.getAllAsync<Row>('SELECT id, payload FROM workout_template_exercises WHERE template_id=? ORDER BY position', template.id)).map(row => JSON.parse(row.payload) as PlannedExercise);
  for (const session of result.sessions) session.sets = (await db.getAllAsync<Row>('SELECT id, payload FROM workout_sets WHERE session_id=? ORDER BY position', session.id)).map(row => JSON.parse(row.payload) as WorkoutSet);
  return result;
}
export async function writeData(data: AppData) {
  const db = await database();
  await db.withTransactionAsync(async () => {
    if (data.profile) {
      const now = new Date().toISOString();
      await db.runAsync("INSERT INTO user_profile(id,payload,created_at,updated_at) VALUES ('profile',?,?,?) ON CONFLICT(id) DO UPDATE SET payload=excluded.payload,updated_at=excluded.updated_at", JSON.stringify(data.profile), now, now);
    } else await db.runAsync('DELETE FROM user_profile');
    // Child rows are replaced atomically; parent timestamps are retained by UPSERT.
    await db.runAsync('DELETE FROM favorite_exercises');
    await db.runAsync('DELETE FROM workout_sets');
    await db.runAsync('DELETE FROM workout_template_exercises');
    await db.runAsync('DELETE FROM meals');
    await db.runAsync('DELETE FROM ingredient_prices');
    for (const key of Object.keys(tables) as (keyof typeof tables)[]) {
      const values = data[key];
      const ids = values.map(value => value.id);
      if (ids.length) await db.runAsync(`DELETE FROM ${tables[key]} WHERE id NOT IN (${ids.map(() => '?').join(',')})`, ...ids);
      else await db.runAsync(`DELETE FROM ${tables[key]}`);
      for (const value of values) {
        if (key === 'templates') { const { exercises: _, ...header } = value as AppData['templates'][number]; await upsert(db, tables[key], header); }
        else if (key === 'sessions') { const { sets: _, ...header } = value as AppData['sessions'][number]; await upsert(db, tables[key], header); }
        else await upsert(db, tables[key], value, key === 'meals' ? (value as AppData['meals'][number]).foodId : undefined);
      }
    }
    for (const template of data.templates) for (const [position, ex] of template.exercises.entries()) await db.runAsync('INSERT INTO workout_template_exercises(id,template_id,exercise_id,position,payload) VALUES (?,?,?,?,?)', ex.id, template.id, ex.exerciseId, position, JSON.stringify(ex));
    for (const session of data.sessions) for (const [position, set] of session.sets.entries()) await db.runAsync('INSERT INTO workout_sets(id,session_id,exercise_id,position,payload) VALUES (?,?,?,?,?)', set.id, session.id, set.exerciseId, position, JSON.stringify(set));
    for (const exerciseId of data.favorites) await db.runAsync('INSERT INTO favorite_exercises(exercise_id) VALUES (?)', exerciseId);
  });
  return readData();
}
