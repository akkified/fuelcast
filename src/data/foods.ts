// Starter food library. Macro values are rounded, per-serving approximations
// based on USDA FoodData Central entries (https://fdc.nal.usda.gov). Brand-name
// products vary; values are meant for fueling guidance, not precise tracking.

import type { Food } from '../engine/types';

export const FOODS: Food[] = [
  // Grains & starches
  { id: 'bagel', name: 'Plain bagel', serving: '1 medium', category: 'grain', emoji: '🥯', carbs: 55, protein: 10, fat: 1.5, fiber: 2.4 },
  { id: 'rice', name: 'White rice', serving: '1 cup cooked', category: 'grain', emoji: '🍚', carbs: 45, protein: 4, fat: 0.4, fiber: 0.6 },
  { id: 'pasta', name: 'Pasta', serving: '1 cup cooked', category: 'grain', emoji: '🍝', carbs: 43, protein: 8, fat: 1.3, fiber: 2.5 },
  { id: 'oatmeal', name: 'Oatmeal', serving: '1 cup cooked', category: 'grain', emoji: '🥣', carbs: 27, protein: 6, fat: 3.5, fiber: 4 },
  { id: 'wwbread', name: 'Whole-wheat toast', serving: '2 slices', category: 'grain', emoji: '🍞', carbs: 24, protein: 7, fat: 2, fiber: 4 },
  { id: 'cereal', name: 'Cereal (low sugar)', serving: '1 cup', category: 'grain', emoji: '🥣', carbs: 20, protein: 3.5, fat: 2, fiber: 3 },
  { id: 'pancakes', name: 'Pancakes', serving: '2 medium', category: 'grain', emoji: '🥞', carbs: 28, protein: 5, fat: 4, fiber: 1 },
  { id: 'potato', name: 'Baked potato', serving: '1 medium', category: 'grain', emoji: '🥔', carbs: 37, protein: 4, fat: 0.2, fiber: 3.8 },
  { id: 'sweetpotato', name: 'Sweet potato', serving: '1 medium', category: 'grain', emoji: '🍠', carbs: 24, protein: 2, fat: 0.2, fiber: 3.8 },
  { id: 'ricecakes', name: 'Rice cakes', serving: '2 cakes', category: 'grain', emoji: '🍘', carbs: 15, protein: 1.5, fat: 0.6, fiber: 0.8 },

  // Fruit
  { id: 'banana', name: 'Banana', serving: '1 medium', category: 'fruit', emoji: '🍌', carbs: 27, protein: 1.3, fat: 0.4, fiber: 3.1 },
  { id: 'apple', name: 'Apple', serving: '1 medium', category: 'fruit', emoji: '🍎', carbs: 25, protein: 0.5, fat: 0.3, fiber: 4.4 },
  { id: 'orange', name: 'Orange', serving: '1 medium', category: 'fruit', emoji: '🍊', carbs: 15, protein: 1.2, fat: 0.2, fiber: 3.1 },
  { id: 'grapes', name: 'Grapes', serving: '1 cup', category: 'fruit', emoji: '🍇', carbs: 27, protein: 1.1, fat: 0.3, fiber: 1.4 },
  { id: 'raisins', name: 'Raisins', serving: '1 small box', category: 'fruit', emoji: '🍇', carbs: 34, protein: 1.3, fat: 0.2, fiber: 1.6 },
  { id: 'applesauce', name: 'Applesauce cup', serving: '4 oz, unsweetened', category: 'fruit', emoji: '🍏', carbs: 13, protein: 0.2, fat: 0.1, fiber: 1.3 },
  { id: 'berries', name: 'Strawberries', serving: '1 cup', category: 'fruit', emoji: '🍓', carbs: 12, protein: 1, fat: 0.5, fiber: 3 },

  // Protein
  { id: 'chicken', name: 'Grilled chicken', serving: '3 oz', category: 'protein', emoji: '🍗', carbs: 0, protein: 26, fat: 3, fiber: 0 },
  { id: 'eggs', name: 'Eggs', serving: '2 large', category: 'protein', emoji: '🥚', carbs: 1, protein: 12.5, fat: 10, fiber: 0 },
  { id: 'tuna', name: 'Tuna pouch', serving: '2.5 oz', category: 'protein', emoji: '🐟', carbs: 0, protein: 17, fat: 1, fiber: 0 },
  { id: 'salmon', name: 'Salmon', serving: '3 oz', category: 'protein', emoji: '🐟', carbs: 0, protein: 22, fat: 7, fiber: 0 },
  { id: 'beans', name: 'Black beans', serving: '½ cup', category: 'protein', emoji: '🫘', carbs: 20, protein: 7.5, fat: 0.5, fiber: 7.5 },
  { id: 'tofu', name: 'Firm tofu', serving: '3 oz', category: 'protein', emoji: '🥢', carbs: 2, protein: 8.5, fat: 4.5, fiber: 1 },
  { id: 'jerky', name: 'Beef jerky', serving: '1 oz', category: 'protein', emoji: '🥩', carbs: 3, protein: 9, fat: 7, fiber: 0.5 },
  { id: 'pb', name: 'Peanut butter', serving: '2 tbsp', category: 'protein', emoji: '🥜', carbs: 7, protein: 7, fat: 16, fiber: 2 },
  { id: 'almonds', name: 'Almonds', serving: '1 oz (~23)', category: 'protein', emoji: '🌰', carbs: 6, protein: 6, fat: 14, fiber: 3.5 },

  // Dairy
  { id: 'chocmilk', name: 'Chocolate milk', serving: '1 cup, low-fat', category: 'dairy', emoji: '🥛', carbs: 26, protein: 8, fat: 2.5, fiber: 1 },
  { id: 'milk', name: 'Milk', serving: '1 cup, 1%', category: 'dairy', emoji: '🥛', carbs: 12, protein: 8, fat: 2.4, fiber: 0 },
  { id: 'greekyogurt', name: 'Greek yogurt', serving: '6 oz, plain nonfat', category: 'dairy', emoji: '🥄', carbs: 7, protein: 17, fat: 0.7, fiber: 0 },
  { id: 'stringcheese', name: 'String cheese', serving: '1 stick', category: 'dairy', emoji: '🧀', carbs: 1, protein: 7, fat: 6, fiber: 0 },
  { id: 'cottage', name: 'Cottage cheese', serving: '½ cup, low-fat', category: 'dairy', emoji: '🥣', carbs: 4, protein: 14, fat: 2, fiber: 0 },

  // Snacks
  { id: 'pretzels', name: 'Pretzels', serving: '1 oz', category: 'snack', emoji: '🥨', carbs: 23, protein: 3, fat: 1, fiber: 1 },
  { id: 'granolabar', name: 'Chewy granola bar', serving: '1 bar', category: 'snack', emoji: '🍫', carbs: 19, protein: 2, fat: 4.5, fiber: 1 },
  { id: 'figbars', name: 'Fig bars', serving: '2 bars', category: 'snack', emoji: '🍪', carbs: 22, protein: 1, fat: 2, fiber: 1.5 },
  { id: 'honey', name: 'Honey', serving: '1 tbsp', category: 'snack', emoji: '🍯', carbs: 17, protein: 0, fat: 0, fiber: 0 },
  { id: 'trailmix', name: 'Trail mix', serving: '¼ cup', category: 'snack', emoji: '🥜', carbs: 17, protein: 5, fat: 11, fiber: 2 },
  { id: 'chips', name: 'Potato chips', serving: '1 oz', category: 'snack', emoji: '🥔', carbs: 15, protein: 2, fat: 10, fiber: 1, fried: true },

  // Meals
  { id: 'pbj', name: 'PB&J sandwich', serving: '1 sandwich', category: 'meal', emoji: '🥪', carbs: 46, protein: 11, fat: 18, fiber: 3.5 },
  { id: 'turkeysandwich', name: 'Turkey sandwich', serving: '1 sandwich', category: 'meal', emoji: '🥪', carbs: 27, protein: 22, fat: 4, fiber: 4 },
  { id: 'pizza', name: 'Cheese pizza', serving: '1 slice', category: 'meal', emoji: '🍕', carbs: 36, protein: 12, fat: 10, fiber: 2.5 },
  { id: 'smoothie', name: 'Fruit + yogurt smoothie', serving: '16 oz', category: 'meal', emoji: '🥤', carbs: 45, protein: 12, fat: 2, fiber: 5 },
  { id: 'fries', name: 'French fries', serving: 'medium', category: 'meal', emoji: '🍟', carbs: 44, protein: 4, fat: 17, fiber: 4, fried: true },

  // Veg
  { id: 'broccoli', name: 'Broccoli', serving: '1 cup', category: 'veg', emoji: '🥦', carbs: 6, protein: 2.6, fat: 0.3, fiber: 2.4 },

  // Cooking staples (used by recipes; ingredientOnly items are never suggested as snacks)
  { id: 'tortilla', name: 'Flour tortilla', serving: '1 large', category: 'grain', emoji: '🌯', carbs: 36, protein: 6, fat: 7, fiber: 2 },
  { id: 'oats', name: 'Rolled oats (dry)', serving: '½ cup', category: 'grain', emoji: '🌾', carbs: 27, protein: 5, fat: 3, fiber: 4, ingredientOnly: true },
  { id: 'cheddar', name: 'Shredded cheese', serving: '¼ cup', category: 'dairy', emoji: '🧀', carbs: 1, protein: 7, fat: 9, fiber: 0, ingredientOnly: true },
  { id: 'marinara', name: 'Marinara sauce', serving: '½ cup', category: 'veg', emoji: '🍅', carbs: 10, protein: 2, fat: 2, fiber: 2, ingredientOnly: true },
  { id: 'spinach', name: 'Spinach', serving: '1 cup raw', category: 'veg', emoji: '🥬', carbs: 1, protein: 1, fat: 0, fiber: 0.7, ingredientOnly: true },
  { id: 'bellpepper', name: 'Bell pepper', serving: '1 medium', category: 'veg', emoji: '🫑', carbs: 7, protein: 1, fat: 0.3, fiber: 2.5, ingredientOnly: true },
  { id: 'salsa', name: 'Salsa', serving: '¼ cup', category: 'veg', emoji: '🌶️', carbs: 4, protein: 1, fat: 0, fiber: 1, ingredientOnly: true },
  { id: 'avocado', name: 'Avocado', serving: '½ fruit', category: 'fruit', emoji: '🥑', carbs: 6, protein: 1.5, fat: 11, fiber: 5, ingredientOnly: true },
  { id: 'groundturkey', name: 'Lean ground turkey', serving: '3 oz cooked', category: 'protein', emoji: '🦃', carbs: 0, protein: 22, fat: 8, fiber: 0, ingredientOnly: true },
  { id: 'frozenveg', name: 'Frozen stir-fry veggies', serving: '1 cup', category: 'veg', emoji: '🥕', carbs: 8, protein: 2, fat: 0, fiber: 3, ingredientOnly: true },
  { id: 'soysauce', name: 'Soy sauce', serving: '1 tbsp', category: 'veg', emoji: '🥢', carbs: 1, protein: 1, fat: 0, fiber: 0, ingredientOnly: true },
  { id: 'jam', name: 'Jam', serving: '1 tbsp', category: 'snack', emoji: '🍓', carbs: 13, protein: 0, fat: 0, fiber: 0, ingredientOnly: true },
  { id: 'whitebread', name: 'White bread', serving: '2 slices', category: 'grain', emoji: '🍞', carbs: 26, protein: 4, fat: 2, fiber: 1.4, ingredientOnly: true },
  { id: 'cinnamon', name: 'Cinnamon', serving: 'pinch', category: 'snack', emoji: '🟤', carbs: 0, protein: 0, fat: 0, fiber: 0, ingredientOnly: true },

  // Drinks
  { id: 'sportsdrink', name: 'Sports drink', serving: '20 oz', category: 'drink', emoji: '🧃', carbs: 34, protein: 0, fat: 0, fiber: 0 },
  {
    id: 'energydrink',
    name: 'Energy drink',
    serving: '16 oz',
    category: 'drink',
    emoji: '⚡️',
    carbs: 54,
    protein: 0,
    fat: 0,
    fiber: 0,
    caution: 'The American Academy of Pediatrics advises that energy drinks are not appropriate for kids and teens.',
  },
];

export const FOOD_BY_ID: Record<string, Food> = Object.fromEntries(FOODS.map((f) => [f.id, f]));

export const CATEGORY_LABEL: Record<Food['category'], string> = {
  grain: 'Grains',
  fruit: 'Fruit',
  protein: 'Protein',
  dairy: 'Dairy',
  snack: 'Snacks',
  meal: 'Meals',
  veg: 'Veggies',
  drink: 'Drinks',
};
