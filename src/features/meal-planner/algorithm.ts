import type { Food, IngredientPrice, MealPlan, Recipe } from '../../types/models';
import { recipes } from '../../constants/recipes';
import { id, nutrients } from '../../utils/calculations';
export function recipeTotals(recipe:Recipe,foods:Food[],prices:IngredientPrice[]){
  return recipe.ingredients.reduce((t,i)=>{const food=foods.find(f=>f.id===i.foodId);const price=prices.find(p=>p.id===i.foodId);if(!food||!price||price.servings<=0)throw new Error('Missing recipe food or ingredient price.');const n=nutrients(food,i.quantity);return{cost:t.cost+price.cost/price.servings*i.quantity,calories:t.calories+n.calories,protein:t.protein+n.protein,carbs:t.carbs+n.carbs,fat:t.fat+n.fat,sodium:t.sodium+(n.sodium??0),unknownSodium:t.unknownSodium+(n.sodium===null?1:0)};},{cost:0,calories:0,protein:0,carbs:0,fat:0,sodium:0,unknownSodium:0});
}
export function eligibleRecipes(plan:Pick<MealPlan,'diet'|'allergies'|'maxMinutes'|'equipment'>,foods:Food[]){
  const aliases:Record<string,string>={eggs:'egg',dairy:'milk',seafood:'fish',soybeans:'soy',gluten:'wheat',peanuts:'peanut'};
  const allergies=plan.allergies.toLowerCase().split(',').map(s=>aliases[s.trim()]??s.trim()).filter(Boolean);
  for(const a of allergies)if(!['egg','milk','fish','soy','wheat','peanut','nuts','shellfish','sesame'].includes(a)&&!foods.some(f=>f.name.toLowerCase().includes(a)))throw new Error(`The local recipe database cannot reliably interpret the allergy “${a}”. Use a recognized ingredient/allergen and verify product labels.`);
  return recipes.filter(r=>r.diets.includes(plan.diet)&&r.minutes<=plan.maxMinutes&&plan.equipment.includes(r.equipment)&&!allergies.some(a=>r.allergens.some(x=>x.includes(a)||a.includes(x))||r.ingredients.some(i=>foods.find(f=>f.id===i.foodId)?.name.toLowerCase().includes(a))));
}
export function groceries(plan:MealPlan,prices:IngredientPrice[]){
  const quantities=new Map<string,number>();
  for(const e of plan.entries){const recipe=recipes.find(r=>r.id===e.recipeId);if(!recipe)throw new Error('Unknown recipe.');for(const i of recipe.ingredients)quantities.set(i.foodId,(quantities.get(i.foodId)??0)+i.quantity);}
  return [...quantities].map(([foodId,required])=>{const price=prices.find(p=>p.id===foodId);if(!price||price.servings<=0)throw new Error('Missing ingredient price.');const quantity=plan.groceryOverrides[foodId]??Math.max(0,required-(plan.pantry[foodId]??0));const packages=Math.ceil(Math.max(0,quantity-1e-9)/price.servings);return{foodId,required,quantity,packages,cost:packages*price.cost,leftover:packages*price.servings-quantity};});
}
export function generatePlan(plan:Omit<MealPlan,'entries'>,foods:Food[],prices:IngredientPrice[]):MealPlan{
  const eligible=eligibleRecipes(plan,foods);if(!eligible.length)throw new Error('No recipes match your restrictions, cooking equipment and preparation time. Adjust the setup; no incompatible plan was generated.');
  const perMealBudget=plan.budget/(plan.days*plan.mealsPerDay);const usage=new Map<string,number>();const entries:MealPlan['entries']=[];
  for(let day=0;day<plan.days;day++){let protein=0;const usedToday=new Set<string>();for(let meal=0;meal<plan.mealsPerDay;meal++){
    const ranked=eligible.map(r=>{const n=recipeTotals(r,foods,prices);const needed=Math.max(0,plan.proteinGoal-protein)/(plan.mealsPerDay-meal);const score=Math.max(0,n.cost-perMealBudget)*10+n.cost/Math.max(1,n.protein)+Math.max(0,needed-n.protein)*0.7+(usage.get(r.id)??0)*0.15+(usedToday.has(r.id)?10:0);return{r,n,score};}).sort((a,b)=>a.score-b.score);
    const chosen=ranked[0];entries.push({id:id(),day,recipeId:chosen.r.id});protein+=chosen.n.protein;usage.set(chosen.r.id,(usage.get(chosen.r.id)??0)+1);usedToday.add(chosen.r.id);
  }}
  let result:MealPlan={...plan,entries};
  let cost=groceries(result,prices).reduce((s,g)=>s+g.cost,0);
  if(cost>plan.budget){
    // Check minimum-variety alternatives before declaring the budget insufficient.
    for(const recipe of eligible){const candidate={...result,entries:entries.map(e=>({...e,recipeId:recipe.id}))};const nextCost=groceries(candidate,prices).reduce((s,g)=>s+g.cost,0);if(nextCost<cost){result=candidate;cost=nextCost;}}
  }
  return result;
}
export function planTotals(plan:MealPlan,foods:Food[],prices:IngredientPrice[]){
  const totals=plan.entries.reduce((t,e)=>{const n=recipeTotals(recipes.find(r=>r.id===e.recipeId)!,foods,prices);return{cost:t.cost+n.cost,protein:t.protein+n.protein,calories:t.calories+n.calories,sodium:t.sodium+n.sodium};},{cost:0,protein:0,calories:0,sodium:0});
  const shoppingCost=groceries(plan,prices).reduce((s,g)=>s+g.cost,0);return{...totals,shoppingCost,remaining:plan.budget-shoppingCost,averageProtein:totals.protein/plan.days,costPerProtein:totals.protein?totals.cost/totals.protein:0};
}
