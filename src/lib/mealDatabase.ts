import { MealSuggestion } from '@/types/calculator';

// Function to get image path based on meal name and goal
export function getMealImagePath(mealName: string, goal: 'lose' | 'maintain' | 'gain'): string {
  // Manual mapping of meal names to actual image file names
  const imageMap: { [key: string]: string } = {
    // Weight Loss Recipes
    "Egg White Veggie Scramble": "weightLossRecipes/eggWhiteScramble.jpg",
    "Zucchini Noodle Chicken Bowl": "weightLossRecipes/zucchiniNoodleChickenBowl.jpg",
    "Greek Yogurt Protein Bowl": "weightLossRecipes/greekYogurtBowl.png",
    "Tuna Stuffed Avocado": "weightLossRecipes/tunaStuffedAvocado.jpg",
    "Turkey Lettuce Wrap Bowls": "weightLossRecipes/turkeyLettuceWrapBowls.jpg",
    "Cottage Cheese Power Salad": "weightLossRecipes/cottageCheesePowerSalad.jpg",
    "Baked Cod with Roasted Vegetables": "weightLossRecipes/codRoastedVeggies.jpg",
    "High-Protein French Toast": "weightLossRecipes/frenchToast.png",
    "Protein Pizza Toast (5 slices)": "weightLossRecipes/pizzaToast.png",
    "High-Protein PB&J Sandwiches": "weightLossRecipes/highProteinPB.jpg",
    "High-Fiber Thin Crust Pizza": "weightLossRecipes/thinCrustPizzas.png",
    "Loaded Protein Wrap": "weightLossRecipes/loadedProtein.png",
    "High-Fiber Crunch Wrap": "weightLossRecipes/crunchWrap.png",
    "Cauliflower Fried Rice Stir-Fry": "weightLossRecipes/cauliflower_friedRice.png",
    
    // Balanced/Maintenance Recipes
    "Quinoa Power Bowl": "balancedRecipes/quinoaPowerBowl.jpg",
    "Salmon with Sweet Potato": "balancedRecipes/salmonSweetPotato.jpg",
    "Mediterranean Chicken Bowl": "balancedRecipes/chickenBowl.jpg",
    "Lentil Curry with Rice": "balancedRecipes/lentilCurryRice.jpg",
    "Veggie-Packed Omelet": "balancedRecipes/veggieOmelet.png",
    "Oreo Protein Greek Yogurt Bowl": "balancedRecipes/oreoProteinYogurt.jpg",
    "High-Protein Burger": "balancedRecipes/proteinBurger.jpg",
    "Power Oatmeal Bowl": "balancedRecipes/powerOatmeal.png",
    "Overnight Protein Oats": "balancedRecipes/overnightOats.png",
    "Quick Protein Oats (Microwave)": "balancedRecipes/quickOats.jpg",
    "Protein Oatmeal Dessert": "balancedRecipes/oatmealDessert.jpg",
    
    // Bulking/Weight Gain Recipes
    "Protein Pasta Bowl": "bulkingRecipes/proteinPasta.jpg",
    "Muscle Gain Smoothie Bowl": "bulkingRecipes/smoothieBowl.jpg",
    "Beef and Rice Power Bowl": "bulkingRecipes/beefRicePowerBowl.jpg",
    "Salmon Avocado Toast Stack": "bulkingRecipes/salmonToast.jpg",
    "Loaded Sweet Potato": "bulkingRecipes/loadedSweetPotato.jpg",
    "Chicken Alfredo with Broccoli": "bulkingRecipes/alfredoPasta.jpg",
    "Classic Bulking Plate": "bulkingRecipes/classicProteinPlate.jpg",
    "Protein Peanut Butter Cookies (8-12 cookies)": "bulkingRecipes/proteinCookies.jpg",
    "Breakfast Burrito Bowl": "bulkingRecipes/breakfastBurritoBowl.jpg",
    "Salmon and Roasted Potatoes": "bulkingRecipes/salmonPotatoes.jpg",
    "Nut Butter Protein Smoothie": "bulkingRecipes/nutButterSmoothie.jpg",
    
    // Snacks
    "High-Protein Bar": "snacks/proteinBar.jpg",
    "Smart Popcorn Mini Bag": "snacks/smartPopcorn.jpg",
    "Fresh Strawberry Bowl": "snacks/freshStrawberries.jpg",
    "Fresh Blueberry Bowl": "snacks/freshBlueberries.jpg",
    "Apple with Nut Butter": "snacks/applesPeanutButter.jpg",
    "Protein Shake with Banana": "snacks/proteinShakeBanana.jpg",
    "Raw Almonds Portion": "snacks/almonds.jpg",
    "Greek Yogurt Cup": "snacks/greekYogurtSnack.jpg",
    "Sugar-Free Jello Cup": "snacks/jelloSnack.jpg",
    "Zero Calorie Sparkling Drink": "snacks/sparklingDrink.jpg",
    "Protein Coffee": "snacks/protienCoffee.jpg",
    "Celery Sticks and Baby Carrots": "snacks/celeryBabyCarrots.jpg",
    "Greek Yogurt Protein Ranch Dip": "snacks/proteinDipRanch.jpg",
    
    // Oatmeal variations
    "Power Oatmeal Bowl": "balancedRecipes/powerOatmeal.png",
    "Overnight Protein Oats": "balancedRecipes/overnightOats.png",
    "Quick Protein Oats (Microwave)": "balancedRecipes/quickOats.jpg",
    "Protein Oatmeal Dessert": "balancedRecipes/oatmealDessert.jpg",
  };
  
  // Check if we have a specific image for this meal
  if (imageMap[mealName]) {
    return `/assets/images/${imageMap[mealName]}`;
  }
  
  // For snacks and meals without images, return empty string
  return '';
}

// Comprehensive meal database - ALL 50 MEALS!
export const mealDatabase: MealSuggestion[] = [
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
    ingredients: ["Sara Lee 45-cal bread (5 slices)", "Liquid egg whites (300g)", "Low-sugar milk (80ml)", "Vanilla extract", "Cinnamon", "Sugar-free syrup"],
    instructions: ["Mix egg whites, milk, vanilla, and cinnamon", "Dip bread slices in mixture", "Cook on non-stick pan until golden", "Top with sugar-free syrup"],
    prepTime: 15,
    difficulty: "easy"
  },
  {
    name: "Protein Pizza Toast (5 slices)",
    calories: 600,
    protein: 52,
    carbs: 55,
    fats: 25,
    ingredients: ["Sara Lee 45-cal bread (5 slices)", "2% mozzarella cheese (80g)", "Turkey pepperoni (30g)", "Low-sugar pizza sauce (60g)", "Italian seasoning"],
    instructions: ["Preheat oven to 420°F", "Place bread on baking sheet", "Spread pizza sauce on each slice", "Add mozzarella and turkey pepperoni", "Bake 8-10 min until cheese melts"],
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
    instructions: ["Mix powdered PB, protein powder, and Greek yogurt", "Spread mixture on 2 bread slices", "Add sugar-free jam to other slices", "Assemble sandwiches"],
    prepTime: 8,
    difficulty: "easy"
  },
  {
    name: "High-Fiber Thin Crust Pizza",
    calories: 280,
    protein: 28,
    carbs: 25,
    fats: 8,
    ingredients: ["La Banderita Carb Counter wrap (1)", "Pizza sauce (40g)", "Reduced-fat mozzarella (40g)", "Turkey pepperoni (20g)", "Bell peppers (30g)", "Mushrooms (30g)"],
    instructions: ["Preheat oven to 425°F", "Place wrap on baking sheet", "Spread pizza sauce evenly", "Add cheese, pepperoni, and vegetables", "Bake 8-10 min until crispy"],
    prepTime: 12,
    difficulty: "easy"
  },
  {
    name: "Loaded Protein Wrap",
    calories: 320,
    protein: 35,
    carbs: 22,
    fats: 12,
    ingredients: ["La Banderita Carb Counter wrap (1)", "Grilled chicken breast (100g)", "Mixed greens (50g)", "Tomatoes (40g)", "Cucumber (30g)", "Low-cal BBQ sauce (1 tbsp)"],
    instructions: ["Season and grill chicken breast", "Warm wrap slightly", "Layer with greens and vegetables", "Add sliced chicken and sauce", "Roll tightly"],
    prepTime: 15,
    difficulty: "easy"
  },
  {
    name: "High-Fiber Crunch Wrap",
    calories: 350,
    protein: 32,
    carbs: 28,
    fats: 14,
    ingredients: ["La Banderita Carb Counter wrap (1)", "93% lean ground beef (80g)", "Reduced-fat cheese (30g)", "Lettuce (40g)", "Tomatoes (30g)", "Greek yogurt (2 tbsp)"],
    instructions: ["Brown seasoned ground beef", "Warm wrap to make pliable", "Add beef, cheese, and vegetables", "Fold edges to create enclosed wrap", "Cook seam-side down in pan"],
    prepTime: 18,
    difficulty: "medium"
  },
  {
    name: "Cauliflower Fried Rice Stir-Fry",
    calories: 630,
    protein: 62,
    carbs: 34,
    fats: 26,
    ingredients: ["Frozen cauliflower rice (2 packets)", "Chicken breast tenders (170g)", "Whole eggs (2 large)", "Mixed stir-fry vegetables (100g)", "Low-sodium soy sauce", "Beef tallow (1 tbsp)"],
    instructions: ["Cook chicken tenders separately", "Heat large pan on high", "Cook cauliflower rice until crispy", "Add chicken and vegetables", "Create well, scramble eggs", "Mix and add soy sauce"],
    prepTime: 20,
    difficulty: "medium"
  },
  
  // MAINTENANCE MEALS (400-600 calories)
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
    instructions: ["Season and bake salmon at 400°F", "Roast sweet potato cubes", "Steam broccoli", "Serve together"],
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
    ingredients: ["Plain Greek yogurt (250g)", "Vanilla almond milk (20ml)", "Protein powder cookies & cream (30g)", "Oreo Thins (4 cookies)", "Oreo pudding mix (8g)"],
    instructions: ["Mix yogurt, almond milk, protein powder, and pudding mix", "Crush 2 Oreos and fold in", "Refrigerate 10 min", "Top with remaining crushed Oreos"],
    prepTime: 15,
    difficulty: "easy"
  },
  {
    name: "High-Protein Burger",
    calories: 390,
    protein: 46,
    carbs: 23,
    fats: 12,
    ingredients: ["Martin's potato roll (1 bun)", "96% lean ground beef (96g)", "Reduced-fat pepper jack cheese (1 slice)", "Sugar-free ketchup", "Low-cal BBQ sauce"],
    instructions: ["Season ground beef heavily", "Cook patty 3-4 min per side", "Toast bun lightly", "Assemble with cheese and sauces"],
    prepTime: 15,
    difficulty: "easy"
  },
  {
    name: "Power Oatmeal Bowl",
    calories: 450,
    protein: 25,
    carbs: 62,
    fats: 10,
    ingredients: ["Oats (80g)", "Protein powder (25g)", "Banana (1 medium)", "Almond butter (1 tbsp)", "Chia seeds (1 tbsp)"],
    instructions: ["Cook oats with water or milk", "Stir in protein powder", "Top with sliced banana", "Add almond butter and chia seeds"],
    prepTime: 10,
    difficulty: "easy"
  },
  {
    name: "Overnight Protein Oats",
    calories: 420,
    protein: 28,
    carbs: 58,
    fats: 8,
    ingredients: ["Oats (60g)", "Greek yogurt (150g)", "Protein powder (20g)", "Almond milk (100ml)", "Berries (80g)", "Honey (1 tbsp)"],
    instructions: ["Mix oats, yogurt, protein powder, and milk", "Add honey and stir", "Refrigerate overnight", "Top with berries before eating"],
    prepTime: 5,
    difficulty: "easy"
  },
  {
    name: "Quick Protein Oats (Microwave)",
    calories: 380,
    protein: 26,
    carbs: 52,
    fats: 7,
    ingredients: ["Quick oats (60g)", "Protein powder (25g)", "Water or milk (200ml)", "Cinnamon", "Apple (1 small, diced)"],
    instructions: ["Mix oats with liquid in microwave-safe bowl", "Microwave 2-3 minutes", "Stir in protein powder", "Top with diced apple and cinnamon"],
    prepTime: 5,
    difficulty: "easy"
  },
  {
    name: "Protein Oatmeal Dessert",
    calories: 400,
    protein: 24,
    carbs: 55,
    fats: 9,
    ingredients: ["Oats (50g)", "Protein powder chocolate (25g)", "Greek yogurt (100g)", "Cocoa powder (1 tbsp)", "Stevia", "Dark chocolate chips (10g)"],
    instructions: ["Cook oats until creamy", "Mix in protein powder and cocoa", "Fold in Greek yogurt", "Sweeten with stevia", "Top with chocolate chips"],
    prepTime: 10,
    difficulty: "easy"
  },
  
  // WEIGHT GAIN MEALS (600-800 calories)
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
    instructions: ["Blend all ingredients until smooth", "Add ice if desired", "Pour into large glass"],
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
    ingredients: ["Sugar-free powdered PB (64g)", "Protein powder vanilla (30g)", "Plain Greek yogurt (150g)", "Oat flour (15g)", "Honey (20g)", "Baking powder"],
    instructions: ["Mix all dry ingredients", "Add Greek yogurt and honey", "Add water until dough forms", "Shape into cookies", "Bake at 350°F for 12-15 min"],
    prepTime: 25,
    difficulty: "medium"
  },
  {
    name: "Classic Bulking Plate",
    calories: 750,
    protein: 45,
    carbs: 65,
    fats: 28,
    ingredients: ["Chicken thighs (150g)", "White jasmine rice (100g dry)", "Butter (1 tbsp)", "Olive oil (1 tbsp)", "Green beans (80g)"],
    instructions: ["Season chicken thighs generously", "Sear chicken skin-side down", "Flip and cook until done", "Cook rice until fluffy", "Steam green beans lightly"],
    prepTime: 30,
    difficulty: "easy"
  },
  {
    name: "Salmon and Roasted Potatoes",
    calories: 680,
    protein: 42,
    carbs: 55,
    fats: 28,
    ingredients: ["Salmon fillet (180g)", "Baby potatoes (300g)", "Olive oil (3 tbsp)", "Butter (1 tbsp)", "Lemon", "Rosemary", "Garlic"],
    instructions: ["Roast potatoes at 425°F until golden", "Season salmon with salt, pepper, lemon", "Sear salmon 3-4 min per side", "Transfer to oven for 8-10 min"],
    prepTime: 35,
    difficulty: "medium"
  },
  
  // SNACK OPTIONS (0-400 calories)
  {
    name: "High-Protein Bar",
    calories: 220,
    protein: 20,
    carbs: 18,
    fats: 6,
    ingredients: ["Quest Bar or similar protein bar"],
    instructions: ["Unwrap and enjoy", "Great for on-the-go protein"],
    prepTime: 1,
    difficulty: "easy"
  },
  {
    name: "Smart Popcorn Mini Bag",
    calories: 100,
    protein: 3,
    carbs: 20,
    fats: 2,
    ingredients: ["Smart popcorn mini bag (100 cal)"],
    instructions: ["Open bag and enjoy", "High volume, satisfying crunch"],
    prepTime: 1,
    difficulty: "easy"
  },
  {
    name: "Fresh Strawberry Bowl",
    calories: 100,
    protein: 1,
    carbs: 24,
    fats: 0,
    ingredients: ["Fresh strawberries (300g)", "Optional: stevia"],
    instructions: ["Wash and hull strawberries", "Cut into halves if desired", "Add sweetener if needed"],
    prepTime: 5,
    difficulty: "easy"
  },
  {
    name: "Fresh Blueberry Bowl",
    calories: 170,
    protein: 1,
    carbs: 44,
    fats: 0,
    ingredients: ["Fresh blueberries (300g)"],
    instructions: ["Wash blueberries thoroughly", "Enjoy this antioxidant-rich snack"],
    prepTime: 2,
    difficulty: "easy"
  },
  {
    name: "Apple with Nut Butter",
    calories: 250,
    protein: 6,
    carbs: 32,
    fats: 12,
    ingredients: ["Medium apple (150g)", "Natural almond or peanut butter (1 tbsp)"],
    instructions: ["Wash and slice apple", "Measure out 1 tbsp nut butter for dipping"],
    prepTime: 3,
    difficulty: "easy"
  },
  {
    name: "Protein Shake with Banana",
    calories: 280,
    protein: 26,
    carbs: 35,
    fats: 3,
    ingredients: ["Protein powder (1 scoop)", "Medium banana", "Unsweetened almond milk (200ml)", "Ice cubes"],
    instructions: ["Add all ingredients to blender", "Blend until smooth"],
    prepTime: 3,
    difficulty: "easy"
  },
  {
    name: "Raw Almonds Portion",
    calories: 160,
    protein: 7,
    carbs: 6,
    fats: 14,
    ingredients: ["Raw almonds (23 pieces / 28g)"],
    instructions: ["Measure out 23 almonds", "Eat slowly to maximize satiety"],
    prepTime: 1,
    difficulty: "easy"
  },
  {
    name: "Greek Yogurt Cup",
    calories: 150,
    protein: 20,
    carbs: 9,
    fats: 4,
    ingredients: ["Plain Greek yogurt 0% fat (150g)", "Optional: berries or stevia"],
    instructions: ["Measure yogurt into bowl", "Add berries or sweetener if desired"],
    prepTime: 2,
    difficulty: "easy"
  },
  {
    name: "Sugar-Free Jello Cup",
    calories: 10,
    protein: 1,
    carbs: 1,
    fats: 0,
    ingredients: ["Sugar-free jello cup"],
    instructions: ["Chill until set if homemade", "Perfect for sweet cravings"],
    prepTime: 1,
    difficulty: "easy"
  },
  {
    name: "Zero Calorie Sparkling Drink",
    calories: 0,
    protein: 0,
    carbs: 0,
    fats: 0,
    ingredients: ["LaCroix, Bubly, or similar"],
    instructions: ["Chill if desired", "Great for hydration"],
    prepTime: 1,
    difficulty: "easy"
  },
  {
    name: "Protein Coffee",
    calories: 120,
    protein: 15,
    carbs: 8,
    fats: 2,
    ingredients: ["Hot coffee (240ml)", "Protein powder (half scoop)", "2% milk (60ml)"],
    instructions: ["Brew coffee", "Mix protein powder with cold milk first", "Add to hot coffee and stir well"],
    prepTime: 5,
    difficulty: "easy"
  },
  {
    name: "Celery Sticks and Baby Carrots",
    calories: 50,
    protein: 1,
    carbs: 4,
    fats: 0,
    ingredients: ["Fresh celery stalks (100g)", "Baby Carrots (100g)"],
    instructions: ["Wash and cut celery into sticks", "Wash baby carrots", "Serve fresh"],
    prepTime: 3,
    difficulty: "easy"
  },
  {
    name: "Greek Yogurt Protein Ranch Dip",
    calories: 220,
    protein: 32,
    carbs: 12,
    fats: 4,
    ingredients: ["Plain Greek yogurt (200g)", "Ranch seasoning mix (1 tbsp)", "Baby carrots (100g)", "Celery sticks (100g)"],
    instructions: ["Mix yogurt with ranch seasoning", "Let sit 5 minutes to develop flavor", "Serve with fresh vegetables"],
    prepTime: 6,
    difficulty: "easy"
  }
];

// Categorize meals by type for filtering
export const mealCategories = {
  breakfast: [
    "High-Protein French Toast", "Egg White Veggie Scramble", "Greek Yogurt Protein Bowl",
    "Oreo Protein Greek Yogurt Bowl", "Muscle Gain Smoothie Bowl", "Breakfast Burrito Bowl",
    "Greek Yogurt Cup", "Protein Coffee", "Nut Butter Protein Smoothie",
    "Power Oatmeal Bowl", "Overnight Protein Oats", "Quick Protein Oats (Microwave)", 
    "Protein Oatmeal Dessert", "Veggie-Packed Omelet"
  ],
  lunch: [
    "Quinoa Power Bowl", "Mediterranean Chicken Bowl", "Lentil Curry with Rice",
    "Turkey Lettuce Wrap Bowls", "Cottage Cheese Power Salad", "Zucchini Noodle Chicken Bowl",
    "High-Fiber Thin Crust Pizza", "Loaded Protein Wrap", "High-Fiber Crunch Wrap",
    "High-Protein Burger", "Tuna Stuffed Avocado", "Protein Pasta Bowl"
  ],
  dinner: [
    "Salmon with Sweet Potato", "Baked Cod with Roasted Vegetables", "Chicken Alfredo with Broccoli",
    "Beef and Rice Power Bowl", "Loaded Sweet Potato", "Cauliflower Fried Rice Stir-Fry",
    "Classic Bulking Plate", "Salmon and Roasted Potatoes", "Protein Pasta Bowl"
  ],
  snack: [
    "High-Protein Bar", "Smart Popcorn Mini Bag", "Fresh Strawberry Bowl", "Fresh Blueberry Bowl",
    "Apple with Nut Butter", "Protein Shake with Banana", "Raw Almonds Portion",
    "Sugar-Free Jello Cup", "Zero Calorie Sparkling Drink", "Celery Sticks and Baby Carrots",
    "Greek Yogurt Protein Ranch Dip", "High-Protein PB&J Sandwiches", "Protein Pizza Toast (5 slices)",
    "Protein Peanut Butter Cookies (8-12 cookies)", "Salmon Avocado Toast Stack", "Protein Coffee"
  ]
};

// Function to filter meals - SUPER FLEXIBLE!
export function filterMeals(
  targetCalories: number, 
  goal: 'lose' | 'maintain' | 'gain' | undefined,
  mealType?: string
): MealSuggestion[] {
  // Start with ALL meals
  let candidateMeals = [...mealDatabase];
  
  // Filter by meal type if provided
  if (mealType && mealCategories[mealType as keyof typeof mealCategories]) {
    const mealTypeNames = mealCategories[mealType as keyof typeof mealCategories];
    candidateMeals = mealDatabase.filter(meal => mealTypeNames.includes(meal.name));
  }
  
  // Use a VERY WIDE calorie range - we want to show LOTS of options!
  const calorieRange = 300; // Super flexible
  
  // Filter by calorie range
  let filteredMeals = candidateMeals.filter(meal => 
    meal.calories >= targetCalories - calorieRange && 
    meal.calories <= targetCalories + calorieRange
  );
  
  // If still not enough meals, just show ALL meals from that category
  if (filteredMeals.length < 10) {
    filteredMeals = candidateMeals;
  }
  
  // Sort by closest to target calories and protein content
  filteredMeals.sort((a, b) => {
    const aDiff = Math.abs(a.calories - targetCalories);
    const bDiff = Math.abs(b.calories - targetCalories);
    
    // Prioritize protein-rich meals
    const aProteinRatio = a.protein / a.calories;
    const bProteinRatio = b.protein / b.calories;
    
    // Combine calorie closeness with protein content
    return (aDiff - bDiff) - ((bProteinRatio - aProteinRatio) * 100);
  });
  
  // Return AT LEAST 10 suggestions for maximum variety!
  return filteredMeals.slice(0, Math.min(12, filteredMeals.length)).map(meal => ({
    ...meal,
    image: getMealImagePath(meal.name, goal || 'maintain')
  }));
}