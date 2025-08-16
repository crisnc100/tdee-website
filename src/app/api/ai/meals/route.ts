import { NextRequest, NextResponse } from 'next/server';
import { MealSuggestion } from '@/types/calculator';

// Comprehensive meal database organized by goal - based on nutrition research and recipe analysis
const mealDatabase: MealSuggestion[] = [
  // WEIGHT LOSS MEALS (250-400 calories) - High protein, high fiber, high volume, low calorie density
  {
    name: "Egg White Veggie Scramble",
    calories: 250,
    protein: 28,
    carbs: 12,
    fats: 8,
    ingredients: ["Egg whites (4 large)", "Spinach (100g)", "Bell peppers (80g)", "Mushrooms (80g)", "Olive oil spray", "Low-fat cheese (20g)"],
    instructions: ["Spray pan with olive oil", "Sauté vegetables until tender", "Add egg whites and scramble", "Top with cheese"],
    prepTime: 10,
    difficulty: "easy"
  },
  {
    name: "Zucchini Noodle Chicken Bowl",
    calories: 320,
    protein: 38,
    carbs: 14,
    fats: 12,
    ingredients: ["Chicken breast (120g)", "Zucchini (200g)", "Cherry tomatoes (100g)", "Basil pesto (1 tbsp)", "Parmesan (10g)"],
    instructions: ["Spiralize zucchini into noodles", "Grill seasoned chicken", "Lightly sauté zucchini noodles", "Combine with tomatoes, chicken, and pesto"],
    prepTime: 15,
    difficulty: "medium"
  },

  {
    name: "Greek Yogurt Protein Bowl",
    calories: 290,
    protein: 32,
    carbs: 28,
    fats: 6,
    ingredients: ["Greek yogurt 0% fat (200g)", "Berries (100g)", "Chia seeds (1 tbsp)", "Cucumber (50g)", "Mint leaves"],
    instructions: ["Layer yogurt in bowl", "Top with berries and cucumber", "Sprinkle chia seeds", "Garnish with mint"],
    prepTime: 5,
    difficulty: "easy"
  },
  {
    name: "Tuna Stuffed Avocado",
    calories: 350,
    protein: 30,
    carbs: 8,
    fats: 22,
    ingredients: ["Tuna in water (120g)", "Avocado (1 medium)", "Celery (30g)", "Red onion (20g)", "Lemon juice", "Mixed greens (50g)"],
    instructions: ["Halve and pit avocado", "Mix tuna with diced celery and onion", "Fill avocado halves with tuna mixture", "Serve on greens with lemon"],
    prepTime: 8,
    difficulty: "easy"
  },
  {
    name: "Turkey Lettuce Wrap Bowls",
    calories: 310,
    protein: 35,
    carbs: 10,
    fats: 15,
    ingredients: ["Ground turkey 93% lean (120g)", "Butter lettuce (100g)", "Carrots (60g)", "Water chestnuts (40g)", "Ginger", "Low-sodium soy sauce"],
    instructions: ["Brown turkey with ginger", "Add diced carrots and water chestnuts", "Season with soy sauce", "Serve in lettuce cups"],
    prepTime: 15,
    difficulty: "easy"
  },
  {
    name: "Cottage Cheese Power Salad",
    calories: 270,
    protein: 26,
    carbs: 18,
    fats: 12,
    ingredients: ["Low-fat cottage cheese (150g)", "Cherry tomatoes (100g)", "Cucumber (100g)", "Bell pepper (80g)", "Walnuts (15g)", "Fresh herbs"],
    instructions: ["Dice all vegetables", "Mix with cottage cheese", "Top with chopped walnuts", "Season with herbs and pepper"],
    prepTime: 7,
    difficulty: "easy"
  },
  {
    name: "Baked Cod with Roasted Vegetables",
    calories: 340,
    protein: 35,
    carbs: 20,
    fats: 14,
    ingredients: ["Cod fillet (150g)", "Brussels sprouts (150g)", "Carrots (100g)", "Olive oil (1 tbsp)", "Lemon", "Garlic"],
    instructions: ["Toss vegetables with half the oil", "Roast at 425°F for 20 min", "Season cod and bake 12-15 min", "Serve with lemon"],
    prepTime: 30,
    difficulty: "medium"
  },
  {
    name: "High-Protein French Toast",
    calories: 400,
    protein: 48,
    carbs: 46,
    fats: 3,
    ingredients: ["Sara Lee 45-cal bread (5 slices)", "Liquid egg whites (300g)", "Low-sugar milk (80ml)", "Vanilla extract", "Cinnamon", "Sugar-free syrup", "Berries (optional)"],
    instructions: ["Mix egg whites, milk, vanilla, and cinnamon", "Dip bread slices in mixture", "Cook on non-stick pan until golden", "Top with sugar-free syrup and berries"],
    prepTime: 15,
    difficulty: "easy"
  },
  {
    name: "Protein Pizza Toast (5 slices)",
    calories: 600,
    protein: 52,
    carbs: 55,
    fats: 25,
    ingredients: ["Sara Lee 45-cal bread (5 slices)", "2% mozzarella cheese (80g)", "Turkey pepperoni (30g)", "Low-sugar pizza sauce (60g)", "Parmesan cheese (sprinkle)", "Italian seasoning"],
    instructions: ["Preheat oven to 420°F", "Place bread on baking sheet", "Spread pizza sauce on each slice", "Add mozzarella, turkey pepperoni, and seasonings", "Sprinkle parmesan and bake 8-10 min until cheese melts"],
    prepTime: 12,
    difficulty: "easy"
  },
  {
    name: "High-Protein PB&J Sandwiches",
    calories: 410,
    protein: 43,
    carbs: 66,
    fats: 6,
    ingredients: ["Powdered peanut butter (27g)", "Protein powder vanilla/PB (15g)", "Non-fat Greek yogurt (60g)", "Sara Lee 45-cal bread (4 slices)", "Sugar-free jam (60g)"],
    instructions: ["Mix powdered PB, protein powder, and Greek yogurt until smooth", "Spread mixture on 2 bread slices", "Add sugar-free jam to other 2 slices", "Assemble sandwiches and cut in half"],
    prepTime: 8,
    difficulty: "easy"
  },
  {
    name: "High-Fiber Thin Crust Pizza",
    calories: 280,
    protein: 28,
    carbs: 25,
    fats: 8,
    ingredients: ["La Banderita Carb Counter wrap (1)", "Pizza sauce (40g)", "Reduced-fat mozzarella (40g)", "Turkey pepperoni (20g)", "Bell peppers (30g)", "Mushrooms (30g)", "Italian seasoning"],
    instructions: ["Preheat oven to 425°F", "Place wrap on baking sheet", "Spread pizza sauce evenly", "Add cheese, pepperoni, and vegetables", "Season and bake 8-10 min until crispy"],
    prepTime: 12,
    difficulty: "easy"
  },
  {
    name: "Loaded Protein Wrap",
    calories: 320,
    protein: 35,
    carbs: 22,
    fats: 12,
    ingredients: ["La Banderita Carb Counter wrap (1)", "Grilled chicken breast (100g)", "Mixed greens (50g)", "Tomatoes (40g)", "Cucumber (30g)", "Low-cal BBQ sauce (1 tbsp)", "Hot sauce"],
    instructions: ["Season and grill chicken breast", "Warm wrap slightly for flexibility", "Layer with greens and vegetables", "Add sliced chicken and sauces", "Roll tightly and cut in half"],
    prepTime: 15,
    difficulty: "easy"
  },
  {
    name: "High-Fiber Crunch Wrap",
    calories: 350,
    protein: 32,
    carbs: 28,
    fats: 14,
    ingredients: ["La Banderita Carb Counter wrap (1)", "93% lean ground beef (80g)", "Reduced-fat cheese (30g)", "Lettuce (40g)", "Tomatoes (30g)", "Taco Bell sauce", "Greek yogurt (2 tbsp)"],
    instructions: ["Brown seasoned ground beef", "Warm wrap to make pliable", "Add beef, cheese, and vegetables in center", "Fold edges to create enclosed wrap", "Cook seam-side down in pan 2-3 min per side"],
    prepTime: 18,
    difficulty: "medium"
  },
  {
    name: "Cauliflower Fried Rice Stir-Fry",
    calories: 630,
    protein: 62,
    carbs: 34,
    fats: 26,
    ingredients: ["Frozen cauliflower rice (2 packets)", "Chicken breast tenders (170g)", "Whole eggs (2 large)", "Mixed stir-fry vegetables (100g)", "Low-sodium soy sauce", "Beef tallow (1 tbsp)", "Garlic", "Ginger"],
    instructions: ["Cook chicken tenders in separate pan until done", "Heat large pan/wok on high heat", "Add cauliflower rice, cook until moisture evaporates and crispy", "Add cooked chicken and vegetables", "Create well, scramble eggs in center", "Add soy sauce and mix everything", "Finish with beef tallow for flavor"],
    prepTime: 20,
    difficulty: "medium"
  },

  // MAINTENANCE MEALS (400-600 calories) - Balanced macros and moderate portions
  {
    name: "Quinoa Power Bowl",
    calories: 480,
    protein: 22,
    carbs: 65,
    fats: 14,
    ingredients: ["Quinoa (80g dry)", "Black beans (100g)", "Avocado (1/2)", "Sweet potato (150g)", "Tahini (1 tbsp)"],
    instructions: ["Cook quinoa according to package", "Roast cubed sweet potato", "Warm black beans", "Assemble bowl and top with avocado and tahini"],
    prepTime: 25,
    difficulty: "medium"
  },
  {
    name: "Salmon with Sweet Potato",
    calories: 520,
    protein: 40,
    carbs: 35,
    fats: 22,
    ingredients: ["Salmon fillet (180g)", "Sweet potato (200g)", "Broccoli (150g)", "Olive oil (1 tbsp)"],
    instructions: ["Season and bake salmon at 400°F for 12-15 min", "Roast sweet potato cubes", "Steam broccoli", "Serve together"],
    prepTime: 30,
    difficulty: "medium"
  },
  {
    name: "Mediterranean Chicken Bowl",
    calories: 450,
    protein: 35,
    carbs: 40,
    fats: 18,
    ingredients: ["Chicken thigh (120g)", "Brown rice (60g dry)", "Cucumber (80g)", "Tomatoes (100g)", "Olives (20g)", "Feta (30g)", "Tzatziki (2 tbsp)"],
    instructions: ["Season and grill chicken", "Cook brown rice", "Dice vegetables", "Assemble bowl with tzatziki and feta"],
    prepTime: 25,
    difficulty: "medium"
  },
  {
    name: "Lentil Curry with Rice",
    calories: 420,
    protein: 18,
    carbs: 68,
    fats: 10,
    ingredients: ["Red lentils (80g dry)", "Basmati rice (50g dry)", "Coconut milk (100ml)", "Tomatoes (100g)", "Spinach (100g)", "Curry spices"],
    instructions: ["Cook lentils with curry spices", "Add coconut milk and tomatoes", "Stir in spinach until wilted", "Serve over rice"],
    prepTime: 30,
    difficulty: "medium"
  },
  {
    name: "Turkey and Veggie Wrap",
    calories: 380,
    protein: 28,
    carbs: 42,
    fats: 12,
    ingredients: ["Whole wheat tortilla (large)", "Turkey breast (100g)", "Hummus (2 tbsp)", "Bell peppers (60g)", "Spinach (50g)", "Carrots (40g)"],
    instructions: ["Spread hummus on tortilla", "Layer turkey and vegetables", "Roll tightly", "Cut in half to serve"],
    prepTime: 8,
    difficulty: "easy"
  },
  {
    name: "Veggie-Packed Omelet",
    calories: 420,
    protein: 28,
    carbs: 15,
    fats: 28,
    ingredients: ["Whole eggs (3 large)", "Spinach (100g)", "Mushrooms (80g)", "Bell peppers (60g)", "Cheese (40g)", "Olive oil (1 tbsp)"],
    instructions: ["Sauté vegetables in oil", "Beat eggs and pour over vegetables", "Add cheese and fold omelet", "Cook until set"],
    prepTime: 12,
    difficulty: "medium"
  },
  {
    name: "Oreo Protein Greek Yogurt Bowl",
    calories: 430,
    protein: 50,
    carbs: 41,
    fats: 8,
    ingredients: ["Plain Greek yogurt (250g)", "Vanilla unsweetened almond milk (20ml)", "Protein powder cookies & cream (30g)", "Oreo Thins (4 cookies)", "Oreo pudding mix (8g)"],
    instructions: ["Mix yogurt, almond milk, protein powder, and pudding mix", "Crush 2 Oreo Thins and fold into mixture", "Refrigerate 30 min to thicken", "Top with remaining 2 crushed Oreo Thins before serving"],
    prepTime: 35,
    difficulty: "easy"
  },
  {
    name: "High-Protein Burger",
    calories: 390,
    protein: 46,
    carbs: 23,
    fats: 12,
    ingredients: ["Martin's potato roll (1 bun)", "96% lean ground beef (96g)", "Reduced-fat pepper jack cheese (1 slice)", "Sugar-free ketchup", "Low-cal BBQ sauce", "Honey mustard", "Seasonings"],
    instructions: ["Season ground beef heavily with spices", "Heat pan very hot, cook beef patty 3-4 min per side", "Toast bun lightly", "Assemble burger with cheese and low-cal sauces", "Add sides like salad or berries if desired"],
    prepTime: 15,
    difficulty: "easy"
  },

  // WEIGHT GAIN MEALS (600-800 calories) - Calorie dense, easy to digest, moderate fiber
  {
    name: "Protein Pasta Bowl",
    calories: 720,
    protein: 45,
    carbs: 85,
    fats: 18,
    ingredients: ["Whole wheat pasta (100g dry)", "Ground turkey (150g)", "Marinara sauce (100g)", "Mozzarella (30g)", "Spinach (100g)"],
    instructions: ["Cook pasta al dente", "Brown ground turkey with herbs", "Wilt spinach", "Combine with sauce and pasta", "Top with cheese"],
    prepTime: 20,
    difficulty: "easy"
  },
  {
    name: "Muscle Gain Smoothie Bowl",
    calories: 680,
    protein: 38,
    carbs: 75,
    fats: 22,
    ingredients: ["Protein powder (30g)", "Banana (2 medium)", "Oats (50g)", "Peanut butter (25g)", "Whole milk (200ml)", "Granola (30g)"],
    instructions: ["Blend protein powder, 1 banana, oats, PB, and milk", "Pour into bowl", "Top with sliced banana and granola"],
    prepTime: 10,
    difficulty: "easy"
  },
  {
    name: "Beef and Rice Power Bowl",
    calories: 750,
    protein: 42,
    carbs: 78,
    fats: 24,
    ingredients: ["Ground beef 85% lean (120g)", "Jasmine rice (100g dry)", "Avocado (1 whole)", "Sour cream (2 tbsp)", "Cheese (30g)", "Salsa (3 tbsp)"],
    instructions: ["Cook rice until fluffy", "Brown seasoned ground beef", "Assemble bowl with rice and beef", "Top with avocado, cheese, and sour cream"],
    prepTime: 20,
    difficulty: "easy"
  },
  {
    name: "Salmon Avocado Toast Stack",
    calories: 650,
    protein: 35,
    carbs: 45,
    fats: 35,
    ingredients: ["Sourdough bread (2 thick slices)", "Smoked salmon (100g)", "Avocado (1 large)", "Cream cheese (30g)", "Olive oil (1 tbsp)", "Capers"],
    instructions: ["Toast bread until golden", "Mash avocado with olive oil", "Spread cream cheese on toast", "Layer with avocado and salmon", "Top with capers"],
    prepTime: 8,
    difficulty: "easy"
  },
  {
    name: "Chicken Alfredo with Broccoli",
    calories: 720,
    protein: 48,
    carbs: 65,
    fats: 28,
    ingredients: ["Fettuccine (100g dry)", "Chicken breast (150g)", "Heavy cream (100ml)", "Parmesan (40g)", "Butter (1 tbsp)", "Broccoli (100g)"],
    instructions: ["Cook pasta and steam broccoli", "Season and sauté chicken", "Make alfredo with cream, butter, and parmesan", "Combine all ingredients"],
    prepTime: 25,
    difficulty: "medium"
  },
  {
    name: "Nut Butter Protein Smoothie",
    calories: 620,
    protein: 35,
    carbs: 55,
    fats: 28,
    ingredients: ["Protein powder (30g)", "Almond butter (30g)", "Banana (1 large)", "Dates (3 pieces)", "Whole milk (250ml)", "Cocoa powder (1 tbsp)"],
    instructions: ["Blend all ingredients until smooth", "Add ice if desired", "Pour into large glass", "Enjoy immediately"],
    prepTime: 5,
    difficulty: "easy"
  },
  {
    name: "Loaded Sweet Potato",
    calories: 680,
    protein: 32,
    carbs: 85,
    fats: 22,
    ingredients: ["Large sweet potato (300g)", "Black beans (150g)", "Greek yogurt (100g)", "Avocado (1/2)", "Cheese (30g)", "Nuts (20g)"],
    instructions: ["Bake sweet potato at 425°F for 45 min", "Warm black beans with spices", "Cut open potato and fluff", "Top with beans, yogurt, avocado, cheese, and nuts"],
    prepTime: 50,
    difficulty: "easy"
  },
  {
    name: "Breakfast Burrito Bowl",
    calories: 740,
    protein: 40,
    carbs: 60,
    fats: 35,
    ingredients: ["Scrambled eggs (3 large)", "Hash browns (150g)", "Turkey sausage (80g)", "Cheese (40g)", "Avocado (1/2)", "Salsa (3 tbsp)"],
    instructions: ["Cook hash browns until crispy", "Scramble eggs with cheese", "Cook turkey sausage", "Assemble bowl with all components", "Top with avocado and salsa"],
    prepTime: 18,
    difficulty: "medium"
  },
  {
    name: "Protein Peanut Butter Cookies (8-12 cookies)",
    calories: 600,
    protein: 74,
    carbs: 59,
    fats: 13,
    ingredients: ["Sugar-free powdered PB (64g)", "Protein powder vanilla/chocolate (30g)", "Plain Greek yogurt (150g)", "Oat flour (15g)", "Honey (20g)", "Baking powder (optional)", "Water as needed"],
    instructions: ["Mix all dry ingredients in bowl", "Add Greek yogurt and honey", "Gradually add water until dough forms", "Shape into 8-12 cookies", "Bake at 350°F for 12-15 min until set"],
    prepTime: 25,
    difficulty: "medium"
  },
  {
    name: "Classic Bulking Plate",
    calories: 750,
    protein: 45,
    carbs: 65,
    fats: 28,
    ingredients: ["Chicken thighs bone-in (150g)", "White jasmine rice (100g dry)", "Butter (1 tbsp)", "Olive oil (1 tbsp)", "Green beans (80g)", "Salt", "Black pepper", "Garlic powder"],
    instructions: ["Season chicken thighs generously", "Heat oil and butter in pan", "Sear chicken skin-side down 6-8 min until crispy", "Flip and cook 12-15 min until done", "Cook rice until fluffy", "Steam green beans lightly", "Serve together for easy digestion"],
    prepTime: 30,
    difficulty: "easy"
  },
  {
    name: "Bulking Pasta with Ground Beef",
    calories: 820,
    protein: 48,
    carbs: 88,
    fats: 26,
    ingredients: ["Penne pasta (120g dry)", "90/10 ground beef (120g)", "2% mozzarella cheese (40g)", "Marinara sauce (150g)", "Olive oil (2 tbsp)", "Garlic", "Italian seasoning", "Onion (small)"],
    instructions: ["Cook pasta until al dente, reserve pasta water", "Heat olive oil, sauté diced onion and garlic", "Brown ground beef with seasonings", "Add marinara sauce and simmer", "Toss pasta with sauce", "Top with mozzarella cheese", "Add pasta water if needed for consistency"],
    prepTime: 25,
    difficulty: "easy"
  },
  {
    name: "Salmon and Roasted Potatoes",
    calories: 680,
    protein: 42,
    carbs: 55,
    fats: 28,
    ingredients: ["Salmon fillet (180g)", "Baby potatoes (300g)", "Olive oil (3 tbsp)", "Butter (1 tbsp)", "Lemon", "Rosemary", "Garlic (2 cloves)", "Salt", "Black pepper"],
    instructions: ["Preheat oven to 425°F", "Quarter potatoes, toss with 2 tbsp olive oil, salt, pepper", "Roast potatoes 25 min until golden", "Season salmon with salt, pepper, lemon", "Heat remaining oil and butter in oven-safe pan", "Sear salmon 3-4 min, flip, add garlic and rosemary", "Transfer to oven for 8-10 min", "Serve together"],
    prepTime: 35,
    difficulty: "medium"
  }
];

export async function POST(request: NextRequest) {
  try {
    const { targetCalories, goal, dietaryPreferences } = await request.json();

    if (!targetCalories || targetCalories < 100 || targetCalories > 1500) {
      return NextResponse.json(
        { error: 'Invalid calorie target for a single meal' },
        { status: 400 }
      );
    }

    // Enhanced goal-based filtering with smart calorie ranges
    let filteredMeals: MealSuggestion[] = [];
    let calorieRange = 150; // More flexible range
    
    // First, filter by goal-appropriate calorie ranges
    if (goal === 'lose') {
      // Weight loss: prefer 250-400 cal meals, high protein density
      filteredMeals = mealDatabase.filter(meal => 
        meal.calories <= 400 && 
        meal.calories >= Math.max(250, targetCalories - calorieRange) &&
        meal.calories <= targetCalories + calorieRange
      );
      // Sort by protein density (protein per calorie) for weight loss
      filteredMeals.sort((a, b) => (b.protein / b.calories) - (a.protein / a.calories));
    } else if (goal === 'gain') {
      // Weight gain: prefer 600-800 cal meals, calorie dense
      filteredMeals = mealDatabase.filter(meal => 
        meal.calories >= 600 && 
        meal.calories >= targetCalories - calorieRange &&
        meal.calories <= targetCalories + calorieRange
      );
      // Sort by calorie density for weight gain
      filteredMeals.sort((a, b) => b.calories - a.calories);
    } else {
      // Maintenance: prefer 400-600 cal meals, balanced
      filteredMeals = mealDatabase.filter(meal => 
        meal.calories >= 350 && meal.calories <= 650 &&
        meal.calories >= targetCalories - calorieRange &&
        meal.calories <= targetCalories + calorieRange
      );
      // Sort by how close to target calories for maintenance
      filteredMeals.sort((a, b) => Math.abs(a.calories - targetCalories) - Math.abs(b.calories - targetCalories));
    }

    // If no goal-specific meals in range, fallback to all meals with wider range
    if (filteredMeals.length === 0) {
      filteredMeals = mealDatabase.filter(meal => 
        meal.calories >= targetCalories - (calorieRange * 1.5) && 
        meal.calories <= targetCalories + (calorieRange * 1.5)
      );
      
      // Apply goal-based sorting to fallback results
      if (goal === 'lose') {
        filteredMeals.sort((a, b) => (b.protein / b.calories) - (a.protein / a.calories));
      } else if (goal === 'gain') {
        filteredMeals.sort((a, b) => b.calories - a.calories);
      } else {
        filteredMeals.sort((a, b) => Math.abs(a.calories - targetCalories) - Math.abs(b.calories - targetCalories));
      }
    }

    // Final fallback: if still no meals, get closest matches regardless of goal
    if (filteredMeals.length === 0) {
      filteredMeals = mealDatabase
        .sort((a, b) => Math.abs(a.calories - targetCalories) - Math.abs(b.calories - targetCalories))
        .slice(0, 5);
    }

    // Return top 4 suggestions for better variety
    const suggestions = filteredMeals.slice(0, 4);

    return NextResponse.json({
      suggestions,
      message: `Found ${suggestions.length} meal suggestions for ${targetCalories} calories`,
      targetCalories
    });

  } catch (error) {
    console.error('Error getting meal suggestions:', error);
    return NextResponse.json(
      { error: 'Failed to get meal suggestions' },
      { status: 500 }
    );
  }
}