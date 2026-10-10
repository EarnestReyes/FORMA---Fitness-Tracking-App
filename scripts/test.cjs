const { mkdirSync, rmSync } = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const Module = require('node:module');
const root = path.resolve(__dirname, '..');
const output = path.join(root, '.test-build');
mkdirSync(output, { recursive: true });
const calc = require(path.join(output, 'utils/calculations.js'));
const planner = require(path.join(output, 'features/meal-planner/algorithm.js'));
const { parseBackup } = require(path.join(output, 'features/backup/validation.js'));
const { foodCatalog, exerciseCatalog, templateCatalog } = require(path.join(output, 'constants/catalog.js'));
const { defaultPrices, recipes } = require(path.join(output, 'constants/recipes.js'));
let passed = 0;
async function test(name, run) { await run(); passed++; console.log(`PASS ${name}`); }
const databaseFile = path.join(output, 'repository-test.db');
rmSync(databaseFile, { force: true });
let native;
const originalLoad = Module._load;
Module._load = function (name, parent, main) {
  if (name === 'expo-sqlite') return { openDatabaseAsync: async () => {
    native = new DatabaseSync(databaseFile);
    return {
      execAsync: async sql => { native.exec(sql); },
      runAsync: async (sql, ...args) => native.prepare(sql).run(...args),
      getFirstAsync: async (sql, ...args) => native.prepare(sql).get(...args),
      getAllAsync: async (sql, ...args) => native.prepare(sql).all(...args),
      withTransactionAsync: async callback => { native.exec('BEGIN'); try { await callback(); native.exec('COMMIT'); } catch (e) { native.exec('ROLLBACK'); throw e; } },
    };
  } };
  return originalLoad.call(this, name, parent, main);
};
const repoPath = path.join(output, 'repositories/local.js');
let repo = require(repoPath);
const profile = { name:'Test Athlete', age:28, height:173, weight:61, goal:'General Fitness', experience:'Beginner', equipment:['Bodyweight'], dumbbellWeight:0, runningExperience:'Beginner', timeAway:'New to training', proteinGoal:100, diet:'No restriction', allergies:'', mealsPerDay:3, budget:2000, budgetPeriod:'Weekly', cookingEquipment:'Stove', cookingMinutes:30, workoutDays:['Mon','Wed'], runningDays:['Sat'], workoutMinutes:30, reminders:false, waterGoal:2000, sodiumGoal:2000 };
const setup = { id:'plan', name:'Test plan', start:'2026-10-10', days:7, budget:2000, proteinGoal:100, mealsPerDay:3, diet:'No restriction', allergies:'', maxMinutes:30, equipment:['Stove','No cooking'], pantry:{}, purchased:[], groceryOverrides:{} };
(async () => {
  await test('running pace rounds seconds and rejects empty distances', () => { assert.equal(calc.pace(32.5,5),'6:30'); assert.equal(calc.pace(5.999,1),'6:00'); assert.equal(calc.pace(30,0),'—'); });
  await test('only completed sets contribute training volume', () => assert.equal(calc.volume([{completed:true,reps:10,weight:12},{completed:false,reps:20,weight:20}]),120));
  await test('nutrition scales confirmed portions', () => { const n=calc.nutrients(foodCatalog[0],1.5); assert.equal(n.calories,108); assert.ok(Math.abs(n.protein-9.45)<1e-8); });
  await test('unknown sodium remains unknown and corrections are respected', () => { const meals=[{foodId:'food-1',quantity:1,sodium:null},{foodId:'food-2',quantity:2,sodium:200}];const n=calc.mealTotals(meals,foodCatalog);assert.equal(n.sodium,200);assert.equal(n.unknownSodium,1); });
  await test('hydration totals add individual logs', () => assert.equal(calc.waterTotal([{amount:150},{amount:250},{amount:500}]),900));
  await test('date validation rejects rollover dates', () => { assert.equal(calc.validDate('2026-02-30'),false);assert.equal(calc.validDate('2024-02-29'),true);assert.throws(()=>calc.numberIn('', 'Amount', 0, 100)); });
  await test('reference catalog contains 40+ exercises and eight templates', () => { assert.ok(exerciseCatalog.length>=40);assert.equal(templateCatalog.length,8); });
  await test('7- and 30-day plans have the requested meal count', () => { for(const days of [7,30]){const p=planner.generatePlan({...setup,days},foodCatalog,defaultPrices);assert.equal(p.entries.length,days*3);assert.equal(new Set(p.entries.map(e=>e.day)).size,days);} });
  await test('diet and allergy constraints exclude incompatible recipes', () => { const eligible=planner.eligibleRecipes({...setup,diet:'Vegan',allergies:'soy, wheat'},foodCatalog);assert.ok(eligible.length>0);assert.ok(eligible.every(r=>r.diets.includes('Vegan')&&!r.allergens.includes('soy')&&!r.allergens.includes('wheat')));assert.throws(()=>planner.eligibleRecipes({...setup,allergies:'unknown allergen'},foodCatalog)); });
  await test('impossible preparation setup fails explicitly', () => assert.throws(()=>planner.generatePlan({...setup,maxMinutes:1},foodCatalog,defaultPrices),/No recipes/));
  await test('grocery consolidation, packages, pantry and leftovers recalculate', () => { const plan={...setup,entries:[{id:'a',day:0,recipeId:'recipe-1'},{id:'b',day:0,recipeId:'recipe-1'}],pantry:{'food-1':1}};const eggs=planner.groceries(plan,defaultPrices).find(g=>g.foodId==='food-1');assert.equal(eggs.required,4);assert.equal(eggs.quantity,3);assert.equal(eggs.packages,1);assert.equal(eggs.cost,90);assert.equal(eggs.leftover,7);const edited=planner.groceries({...plan,groceryOverrides:{'food-1':12}},defaultPrices).find(g=>g.foodId==='food-1');assert.equal(edited.cost,180); });
  await test('budget overrun is reported instead of claimed feasible', () => { const p=planner.generatePlan({...setup,budget:1},foodCatalog,defaultPrices);const n=planner.planTotals(p,foodCatalog,defaultPrices);assert.ok(n.remaining<0);assert.equal(n.remaining,1-n.shoppingCost); });
  await test('recovery recommendations explain high fatigue', () => { const summary=calc.recoverySummary({sleep:8,quality:4,soreness:2,energy:2,fatigue:5,readiness:3});assert.equal(summary.label,'Consider Rest');assert.match(summary.reason,/fatigue/);assert.equal(calc.recoverySummary().label,'Check in with yourself'); });

  const photo = require(path.join(output,'features/profile-photo/persistence.js'));
  const {validatePhotoSize}=require(path.join(output,'features/profile-photo/types.js'));
  await test('profile photo persists across reload and can be replaced and removed',async()=>{
    const values=new Map([['fitness-record','keep']]);const deleted=[];let next='file:///owned/first.jpg';
    const storage={getItem:async k=>values.get(k)??null,setItem:async(k,v)=>{values.set(k,v);},removeItem:async k=>{values.delete(k);}};
    const files={persist:async()=>next,discard:async uri=>{deleted.push(uri);}};
    await photo.replacePhoto({uri:'file:///cache/temporary.jpg'},null,storage,files);assert.equal(await photo.readPhoto(storage),next);
    const previous=next;next='file:///owned/replacement.jpg';await photo.replacePhoto({uri:'file:///cache/new.jpg'},previous,storage,files);assert.deepEqual(deleted,[previous]);assert.equal(await photo.readPhoto(storage),next);
    await photo.clearPhoto(next,storage,files);assert.equal(await photo.readPhoto(storage),null);assert.equal(values.get('fitness-record'),'keep');
  });
  await test('failed photo metadata save preserves previous photo and cleans uncommitted copy',async()=>{
    let saved='file:///owned/old.jpg';const deleted=[];const storage={getItem:async()=>saved,setItem:async()=>{throw Error('storage full');},removeItem:async()=>{saved=null;}};const files={persist:async()=> 'file:///owned/new.jpg',discard:async uri=>{deleted.push(uri);}};
    await assert.rejects(photo.replacePhoto({uri:'file:///cache/new.jpg'},saved,storage,files),/storage full/);assert.equal(await photo.readPhoto(storage),'file:///owned/old.jpg');assert.deepEqual(deleted,['file:///owned/new.jpg']);
  });
  await test('profile photo rejects temporary URLs and enforces size limits',async()=>{
    assert.throws(()=>validatePhotoSize(0));assert.throws(()=>validatePhotoSize(8*1024*1024+1));validatePhotoSize(8*1024*1024);
    await assert.rejects(photo.readPhoto({getItem:async()=> 'blob:temporary'}),/permanently/);
    const storage={getItem:async()=>null,setItem:async()=>{},removeItem:async()=>{}};const uri='data:image/jpeg;base64,encoded';assert.equal(await photo.replacePhoto({uri},null,storage,{persist:async()=>uri,discard:async()=>{}}),uri);
  });
  let data;
  await test('SQLite migrations seed reference data without fake history', async () => { data=await repo.initialize();assert.equal(data.profile,null);assert.equal(data.sessions.length,0);assert.equal(data.runs.length,0);assert.equal(data.meals.length,0);assert.equal(data.exercises.length,43);assert.equal(data.prices.length,defaultPrices.length);assert.equal(native.prepare('PRAGMA foreign_keys').get().foreign_keys,1); });
  await test('SQLite saves related session/set, meal and hydration records', async () => { data=await repo.writeData({...data,profile,water:[{id:'water',date:'2026-10-10',amount:250}],sessions:[{id:'session',name:'Workout',date:'2026-10-10',duration:60000,notes:'',status:'finished',startedAt:null,accumulated:60000,sets:[{id:'set',exerciseId:'exercise-1',reps:10,weight:5,completed:true,notes:''}]}],meals:[{id:'meal',date:'2026-10-10',category:'Lunch',foodId:'food-1',quantity:2,sodium:142}],mealPlans:[planner.generatePlan(setup,foodCatalog,defaultPrices)]});assert.equal(data.sessions[0].sets[0].reps,10);assert.equal(data.water[0].amount,250);assert.equal(data.meals[0].sodium,142); });
  await test('failed multi-record write rolls back all changes', async () => { const before=JSON.stringify(await repo.readData());await assert.rejects(repo.writeData({...data,water:[],sessions:[{...data.sessions[0],sets:[...data.sessions[0].sets,{...data.sessions[0].sets[0]}]}]}));assert.equal(JSON.stringify(await repo.readData()),before); });
  await test('database reopens with persisted history and idempotent migrations', async () => { native.close();delete require.cache[repoPath];repo=require(repoPath);const reopened=await repo.initialize();assert.equal(reopened.profile.name,profile.name);assert.equal(reopened.water.length,1);assert.equal(reopened.sessions[0].sets.length,1);assert.equal(reopened.templates.length,8);data=reopened; });
  await test('backup roundtrip and validation reject corrupt references and versions', () => { const make=d=>JSON.stringify({schemaVersion:1,data:d});assert.deepEqual(parseBackup(make(data)),data);assert.throws(()=>parseBackup(JSON.stringify({schemaVersion:99,data})));assert.throws(()=>parseBackup(make({...data,meals:[{...data.meals[0],foodId:'missing'}]})));assert.throws(()=>parseBackup(make({...data,water:[{id:'bad',date:'2026-10-10',amount:-1}]}))); });
  native.close();Module._load=originalLoad;console.log(`\n${passed} tests passed. SQLite tests use Node SQLite with an Expo API adapter, not a native simulator.`);
})().catch(error=>{console.error(error);try{native?.close();}catch{}process.exitCode=1;});
