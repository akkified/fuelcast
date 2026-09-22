// Teen-friendly recipes built from the food library, so macros are computed
// from the same USDA-based values the rest of the app uses.

export interface RecipeIngredient {
  foodId: string;
  /** Multiples of the food's listed serving. */
  servings: number;
  optional?: boolean;
}

export type MealType = 'Breakfast' | 'Lunch' | 'Dinner' | 'Snack';

export interface Recipe {
  id: string;
  name: string;
  emoji: string;
  minutes: number;
  meal: MealType;
  ingredients: RecipeIngredient[];
  steps: string[];
}

const ing = (foodId: string, servings = 1, optional = false): RecipeIngredient => ({ foodId, servings, ...(optional ? { optional } : {}) });

export const RECIPES: Recipe[] = [
  {
    id: 'overnight-oats', name: 'Berry Overnight Oats', emoji: '🥣', minutes: 5, meal: 'Breakfast',
    ingredients: [ing('oats'), ing('milk'), ing('berries', 0.5), ing('honey', 0.5), ing('cinnamon', 1, true)],
    steps: ['Stir oats, milk and cinnamon in a jar.', 'Top with berries and honey.', 'Refrigerate overnight. Grab it on the way out the door.'],
  },
  {
    id: 'apple-oatmeal', name: 'Cinnamon Apple Oatmeal', emoji: '🍎', minutes: 8, meal: 'Breakfast',
    ingredients: [ing('oats'), ing('milk'), ing('apple'), ing('cinnamon'), ing('honey', 0.5, true)],
    steps: ['Microwave oats and milk for 2 minutes, stirring halfway.', 'Dice the apple and stir it in with cinnamon.', 'Drizzle honey if you like.'],
  },
  {
    id: 'pb-banana-toast', name: 'PB Banana Toast', emoji: '🍌', minutes: 5, meal: 'Breakfast',
    ingredients: [ing('wwbread'), ing('pb', 0.5), ing('banana'), ing('honey', 0.5, true)],
    steps: ['Toast the bread.', 'Spread a thin layer of peanut butter.', 'Top with banana slices and a drizzle of honey.'],
  },
  {
    id: 'egg-burrito', name: 'Egg & Cheese Breakfast Burrito', emoji: '🌯', minutes: 10, meal: 'Breakfast',
    ingredients: [ing('tortilla'), ing('eggs'), ing('cheddar', 0.5), ing('salsa'), ing('bellpepper', 0.5, true)],
    steps: ['Scramble the eggs (with diced pepper if using).', 'Warm the tortilla and fill with eggs and cheese.', 'Add salsa, roll it up, and wrap in foil to go.'],
  },
  {
    id: 'rice-cakes-jam', name: 'Rice Cakes & Jam', emoji: '🍘', minutes: 2, meal: 'Snack',
    ingredients: [ing('ricecakes'), ing('jam')],
    steps: ['Spread jam on the rice cakes.', 'Eat 30–60 minutes before you play.'],
  },
  {
    id: 'light-pbj', name: 'Pre-Game PB&J', emoji: '🥪', minutes: 3, meal: 'Lunch',
    ingredients: [ing('whitebread'), ing('pb', 0.5), ing('jam', 2)],
    steps: ['Thin layer of peanut butter, generous jam.', 'White bread digests faster than whole wheat before a game.'],
  },
  {
    id: 'recovery-smoothie', name: 'Recovery Smoothie', emoji: '🥤', minutes: 5, meal: 'Snack',
    ingredients: [ing('banana'), ing('berries'), ing('greekyogurt'), ing('milk'), ing('honey', 0.5, true)],
    steps: ['Add everything to a blender.', 'Blend 45 seconds. Add ice for a thicker shake.', 'Drink within an hour after training.'],
  },
  {
    id: 'yogurt-parfait', name: 'Greek Yogurt Parfait', emoji: '🍓', minutes: 4, meal: 'Snack',
    ingredients: [ing('greekyogurt'), ing('berries'), ing('oats', 0.5), ing('honey', 0.5)],
    steps: ['Layer yogurt, berries and oats in a cup.', 'Drizzle honey on top.'],
  },
  {
    id: 'cottage-fruit', name: 'Cottage Cheese Fruit Bowl', emoji: '🍇', minutes: 3, meal: 'Snack',
    ingredients: [ing('cottage'), ing('grapes'), ing('honey', 0.5, true)],
    steps: ['Scoop cottage cheese into a bowl.', 'Top with grapes and a little honey.'],
  },
  {
    id: 'chicken-rice-bowl', name: 'Chicken Teriyaki Rice Bowl', emoji: '🍚', minutes: 15, meal: 'Lunch',
    ingredients: [ing('rice', 1.5), ing('chicken'), ing('frozenveg'), ing('soysauce'), ing('honey', 0.5, true)],
    steps: ['Heat rice and frozen veggies.', 'Slice the chicken and warm it in a pan with soy sauce and honey.', 'Pile it all in a bowl.'],
  },
  {
    id: 'chicken-wrap', name: 'Chicken Salsa Wrap', emoji: '🌯', minutes: 8, meal: 'Lunch',
    ingredients: [ing('tortilla'), ing('chicken'), ing('cheddar', 0.5), ing('spinach'), ing('salsa')],
    steps: ['Warm the tortilla.', 'Layer spinach, sliced chicken, cheese and salsa.', 'Roll tightly. Pack it for after practice.'],
  },
  {
    id: 'tuna-pasta', name: 'Tuna Pasta Salad', emoji: '🐟', minutes: 15, meal: 'Lunch',
    ingredients: [ing('pasta', 1.5), ing('tuna'), ing('bellpepper', 0.5), ing('spinach', 1, true)],
    steps: ['Cook pasta and rinse under cold water.', 'Mix with tuna, diced pepper and spinach.', 'Keeps 3 days in the fridge, so meal-prep it.'],
  },
  {
    id: 'bean-quesadilla', name: 'Bean & Cheese Quesadilla', emoji: '🧀', minutes: 10, meal: 'Lunch',
    ingredients: [ing('tortilla'), ing('beans'), ing('cheddar', 0.5), ing('salsa')],
    steps: ['Spread beans and cheese on half the tortilla and fold.', 'Cook 2–3 minutes per side until crisp.', 'Serve with salsa.'],
  },
  {
    id: 'pregame-pasta', name: 'Pre-Game Pasta', emoji: '🍝', minutes: 20, meal: 'Dinner',
    ingredients: [ing('pasta', 2), ing('marinara'), ing('chicken'), ing('spinach', 1, true)],
    steps: ['Boil pasta until just tender.', 'Warm marinara with sliced chicken (stir in spinach if using).', 'The classic night-before or 3–4 hours before a game.'],
  },
  {
    id: 'turkey-pasta', name: 'Turkey Meat-Sauce Pasta', emoji: '🍝', minutes: 20, meal: 'Dinner',
    ingredients: [ing('pasta', 2), ing('marinara'), ing('groundturkey')],
    steps: ['Brown the turkey in a pan.', 'Add marinara and simmer 5 minutes.', 'Toss with cooked pasta.'],
  },
  {
    id: 'turkey-tacos', name: 'Turkey Tacos', emoji: '🌮', minutes: 15, meal: 'Dinner',
    ingredients: [ing('tortilla'), ing('groundturkey'), ing('salsa'), ing('cheddar', 0.5), ing('avocado', 1, true)],
    steps: ['Brown the turkey and stir in half the salsa.', 'Fill warm tortillas with turkey and cheese.', 'Top with the rest of the salsa and avocado.'],
  },
  {
    id: 'fried-rice', name: 'Veggie Egg Fried Rice', emoji: '🍳', minutes: 15, meal: 'Dinner',
    ingredients: [ing('rice', 1.5), ing('eggs'), ing('frozenveg'), ing('soysauce')],
    steps: ['Scramble eggs in a hot pan, then set aside.', 'Stir-fry veggies and rice for 4 minutes.', 'Add eggs and soy sauce and toss.'],
  },
  {
    id: 'salmon-bowl', name: 'Salmon Rice Bowl', emoji: '🍣', minutes: 20, meal: 'Dinner',
    ingredients: [ing('rice'), ing('salmon'), ing('soysauce'), ing('avocado', 0.5), ing('broccoli', 1, true)],
    steps: ['Bake salmon at 400 °F for 12 minutes.', 'Serve over rice with sliced avocado and broccoli.', 'Splash with soy sauce.'],
  },
  {
    id: 'sweet-potato-chicken', name: 'Sweet Potato Chicken Plate', emoji: '🍠', minutes: 25, meal: 'Dinner',
    ingredients: [ing('sweetpotato'), ing('chicken'), ing('broccoli'), ing('rice', 1, true)],
    steps: ['Microwave the sweet potato 6–8 minutes until soft.', 'Warm the chicken and steam the broccoli.', 'Add rice on heavy training days.'],
  },
  {
    id: 'potato-bar', name: 'Loaded Baked Potato', emoji: '🥔', minutes: 12, meal: 'Dinner',
    ingredients: [ing('potato'), ing('beans'), ing('cheddar', 0.5), ing('salsa')],
    steps: ['Microwave the potato 5–7 minutes.', 'Split it and top with warm beans, cheese and salsa.'],
  },
];

export const RECIPE_BY_ID: Record<string, Recipe> = Object.fromEntries(RECIPES.map((r) => [r.id, r]));
