import type { IngredientPrice, Recipe } from '../types/models';
const v=['No restriction','Vegetarian','Vegan','Pescatarian'];const veg=['No restriction','Vegetarian','Pescatarian'];const fish=['No restriction','Pescatarian'];
const entries: [string,[number,number][],number,string,string[],string[],string][] = [
  ['Eggs and Rice',[[1,2],[2,1],[21,1]],15,'Stove',veg,['egg'],'Cook eggs in a little oil until set. Serve with cooked rice.'],
  ['Tuna Sandwich',[[4,1],[19,1],[18,0.5]],10,'No cooking',fish,['fish','wheat'],'Drain tuna. Layer tuna and washed vegetables between bread slices.'],
  ['Chicken Adobo',[[3,1.5],[2,1],[20,0.5],[22,1],[21,1]],30,'Stove',['No restriction'],['soy','wheat'],'Simmer chicken in soy sauce, vinegar and water until thoroughly cooked. Serve with rice.'],
  ['Ginisang Monggo',[[9,2],[18,1],[21,1],[2,1]],25,'Stove',v,[],'Warm cooked mung beans with vegetables and water. Simmer until vegetables are tender and serve with rice.'],
  ['Sardines and Rice',[[5,1],[2,1],[18,1]],10,'Stove',fish,['fish'],'Heat canned sardines with vegetables. Serve with rice.'],
  ['Tofu Stir Fry',[[8,2],[18,1],[20,0.5],[21,1],[2,1]],20,'Stove',v,['soy','wheat'],'Cook tofu and vegetables in oil. Add soy sauce and serve with rice.'],
  ['Tinolang Manok',[[3,1.5],[18,1.5],[2,1]],30,'Stove',['No restriction'],[],'Simmer chicken and vegetables in water until chicken is thoroughly cooked. Season to taste and serve with rice; added seasoning changes sodium.'],
  ['Oatmeal with Milk',[[10,1],[11,1],[12,1]],8,'Stove',veg,['milk'],'Cook oats with milk, stirring until soft. Add sliced banana.'],
  ['Tortang Talong',[[23,1.5],[1,2],[21,1],[2,1]],25,'Stove',veg,['egg'],'Cook eggplant until soft. Flatten, coat with beaten eggs, and pan-cook until eggs are set. Serve with rice.'],
  ['Chicken and Vegetables',[[3,1.5],[18,2],[21,1],[2,1]],25,'Stove',['No restriction'],[],'Cook chicken in oil until thoroughly cooked. Add vegetables, cook until tender and serve with rice.'],
  ['Egg Sandwich',[[1,2],[19,1],[18,0.5]],15,'Stove',veg,['egg','wheat'],'Hard-boil eggs until set. Slice and layer with vegetables between bread slices.'],
  ['Tuna Rice Bowl',[[4,1.5],[2,1],[18,1]],10,'No cooking',fish,['fish'],'Drain tuna and combine with cooked rice and washed vegetables.'],
];
export const recipes:Recipe[]=entries.map(([name,ingredients,minutes,equipment,diets,allergens,instructions],i)=>({id:`recipe-${i+1}`,name,ingredients:ingredients.map(([n,quantity])=>({foodId:`food-${n}`,quantity})),minutes,equipment,diets,allergens,instructions}));
const defaults:[number,number,number][]=[[1,90,10],[2,40,10],[3,150,5],[4,45,1.5],[5,28,1.5],[8,30,2],[9,35,4],[10,100,10],[11,95,4],[12,60,6],[18,60,5],[19,65,10],[20,30,10],[21,60,50],[22,25,20],[23,45,5]];
export const defaultPrices:IngredientPrice[]=defaults.map(([n,cost,servings])=>({id:`food-${n}`,cost,servings}));
