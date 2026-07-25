import supabase from "./supabaseClient";

// Shared scope key for one common weekly plan across all users.
const SHARED_WEEKLY_PLAN_SCOPE = "shared-weekly-plan";

export const WEEK_DAYS = [
  { value: 1, label: "Montag" },
  { value: 2, label: "Dienstag" },
  { value: 3, label: "Mittwoch" },
  { value: 4, label: "Donnerstag" },
  { value: 5, label: "Freitag" },
  { value: 6, label: "Samstag" },
  { value: 7, label: "Sonntag" },
];

export async function fetchRecipes() {
  const { data, error } = await supabase
    .from("recipes")
    .select(
      "id, title, description, created_at, recipe_ingredients(shopping_item_id, shopping_items(id, item_name, supermarket))",
    )
    .order("title", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchWeeklyPlan() {
  const { data, error } = await supabase
    .from("weekly_plan")
    .select("id, weekday, recipe_id, recipes(id, title, description)")
    .eq("user_id", SHARED_WEEKLY_PLAN_SCOPE)
    .order("weekday", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function fetchShoppingItemsForRecipe() {
  const { data, error } = await supabase
    .from("shopping_items")
    .select("id, item_name, supermarket, item_on_list")
    .order("item_name", { ascending: true });

  if (error) throw error;
  return data ?? [];
}

export async function createRecipe({
  userId,
  title,
  description,
  ingredientItemIds,
}) {
  const cleanTitle = (title ?? "").toString().trim();
  if (!cleanTitle) {
    throw new Error("Rezepttitel ist erforderlich");
  }

  const { data: recipe, error: recipeError } = await supabase
    .from("recipes")
    .insert({
      user_id: userId,
      title: cleanTitle,
      description: (description ?? "").toString().trim() || null,
    })
    .select("id, title, description")
    .single();

  if (recipeError) {
    if (recipeError.code === "23505") {
      throw new Error(
        "Ein Rezept mit diesem Titel existiert bereits. Bitte passe den Titel an oder bearbeite das bestehende Rezept.",
      );
    }
    throw recipeError;
  }

  await replaceRecipeIngredients({
    recipeId: recipe.id,
    ingredientItemIds,
  });

  return recipe;
}

export async function replaceRecipeIngredients({
  recipeId,
  ingredientItemIds,
}) {
  const { error: deleteIngredientsError } = await supabase
    .from("recipe_ingredients")
    .delete()
    .eq("recipe_id", recipeId);

  if (deleteIngredientsError) throw deleteIngredientsError;

  const uniqueIngredientIds = Array.from(
    new Set((ingredientItemIds ?? []).filter(Boolean)),
  );

  if (uniqueIngredientIds.length > 0) {
    const payload = uniqueIngredientIds.map((shoppingItemId) => ({
      recipe_id: recipeId,
      shopping_item_id: shoppingItemId,
    }));

    const { error: ingredientsError } = await supabase
      .from("recipe_ingredients")
      .insert(payload);

    if (ingredientsError) throw ingredientsError;
  }
}

export async function updateRecipe({
  recipeId,
  title,
  description,
  ingredientItemIds,
}) {
  const cleanTitle = (title ?? "").toString().trim();
  if (!cleanTitle) {
    throw new Error("Rezepttitel ist erforderlich");
  }

  const { error: updateError } = await supabase
    .from("recipes")
    .update({
      title: cleanTitle,
      description: (description ?? "").toString().trim() || null,
      updated_at: new Date().toISOString(),
    })
    .eq("id", recipeId);

  if (updateError) throw updateError;

  await replaceRecipeIngredients({
    recipeId,
    ingredientItemIds,
  });
}

export async function deleteRecipe(recipeId) {
  const { error } = await supabase.from("recipes").delete().eq("id", recipeId);

  if (error) throw error;
}

export async function assignRecipeToWeekday({ weekday, recipeId }) {
  const { error } = await supabase.from("weekly_plan").upsert(
    {
      user_id: SHARED_WEEKLY_PLAN_SCOPE,
      weekday,
      recipe_id: recipeId,
      updated_at: new Date().toISOString(),
    },
    {
      onConflict: "user_id,weekday",
    },
  );

  if (error) throw error;
}

export async function removeRecipeFromWeekday({ weekday }) {
  const { error } = await supabase
    .from("weekly_plan")
    .delete()
    .eq("user_id", SHARED_WEEKLY_PLAN_SCOPE)
    .eq("weekday", weekday);

  if (error) throw error;
}

export async function addRecipeIngredientsToShoppingList({
  recipeId,
  userName,
}) {
  const { data: ingredients, error: ingredientsError } = await supabase
    .from("recipe_ingredients")
    .select("shopping_item_id")
    .eq("recipe_id", recipeId);

  if (ingredientsError) throw ingredientsError;

  const itemIds = Array.from(
    new Set(
      (ingredients ?? []).map((row) => row.shopping_item_id).filter(Boolean),
    ),
  );

  if (itemIds.length === 0) return 0;

  const { error: updateError } = await supabase
    .from("shopping_items")
    .update({
      item_on_list: true,
      added_at: new Date().toISOString(),
      item_creator: userName ?? null,
    })
    .in("id", itemIds);

  if (updateError) throw updateError;

  return itemIds.length;
}
