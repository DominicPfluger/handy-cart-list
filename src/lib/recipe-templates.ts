/**
 * Basis-Rezept-Vorlagen für den Rezept-Kreator.
 * Zutaten werden über den deutschen Katalognamen (baseName) referenziert;
 * Namen, die im Katalog (noch) fehlen, werden einfach ausgeblendet.
 * Die Zutatenlisten sind Platzhalter und werden später manuell gepflegt.
 */
export type RecipeStep = {
  key: string;
  label: string; // deutscher Schritt-Titel
  min: number;
  max: number;
  ingredients: string[];
};

export type RecipeTemplate = {
  id: "muesli" | "smoothie" | "salat" | "pizza" | "pfanne" | "menu" | "dessert" | "sandwich";
  emoji: string;
  color: string;
  steps: RecipeStep[];
};

/** Beliebte Kombinationen je Vorlage (stepKey -> deutsche baseNames). */
export const POPULAR_RECIPES: Record<RecipeTemplate["id"], Record<string, string[]>[]> = {
  muesli: [
    { base: ["Haferflocken"], liquid: ["Milch"], fruit: ["Bananen", "Heidelbeeren"], topping: ["Honig"] },
    { base: ["Granola"], liquid: ["Joghurt"], fruit: ["Erdbeeren", "Himbeeren"], topping: ["Mandeln"] },
    { base: ["Dinkelflocken"], liquid: ["Hafermilch"], fruit: ["Äpfel"], topping: ["Walnüsse", "Rosinen"] },
  ],
  smoothie: [
    { liquid: ["Milch"], fruit: ["Bananen", "Erdbeeren"] },
    { liquid: ["Orangensaft"], fruit: ["Mango", "Ananas"] },
    { liquid: ["Mandelmilch"], fruit: ["Bananen"], green: ["Babyspinat", "Avocado"], extra: ["Datteln"] },
  ],
  salat: [
    { base: ["Kopfsalat"], veg: ["Tomaten", "Salatgurke"], protein: ["Feta"], dressing: ["Olivenöl", "Balsamico"] },
    { base: ["Rucola"], veg: ["Cherrytomaten"], protein: ["Mozzarella"], herb: ["Basilikum"], dressing: ["Olivenöl"] },
    { base: ["Eisbergsalat"], veg: ["Zuckermais", "Paprika"], protein: ["Thunfisch", "Eier"], dressing: ["Zitronen"] },
  ],
  pizza: [
    { dough: ["Pizzateig"], sauce: ["Passierte Tomaten"], cheese: ["Mozzarella"], topping: ["Salami"], finish: ["Basilikum"] },
    { dough: ["Pizzateig"], sauce: ["Passierte Tomaten"], cheese: ["Mozzarella"], topping: ["Schinken", "Champignons"], finish: ["Oregano"] },
    { dough: ["Pizzateig"], sauce: ["Tomaten"], cheese: ["Mozzarella"], topping: ["Paprika", "Zucchini", "Schwarze Oliven"] },
  ],
  pfanne: [
    { base: ["Reis"], protein: ["Hähnchenbrust"], veg: ["Paprika", "Zuckererbsen"], sauce: ["Sojasauce"], aroma: ["Ingwer"] },
    { base: ["Nudeln"], protein: ["Tofu"], veg: ["Pak Choi", "Babymais"], sauce: ["Teriyaki-Sauce"], aroma: ["Knoblauch", "Chilischoten"] },
    { base: ["Kartoffeln"], protein: ["Eier"], veg: ["Zucchini"], sauce: ["Crème fraîche"], aroma: ["Zwiebeln"] },
  ],
  menu: [
    { protein: ["Lachs"], starch: ["Kartoffeln"], veg: ["Grüne Bohnen"], sauce: ["Crème fraîche"] },
    { protein: ["Hähnchenbrust"], starch: ["Reis"], veg: ["Karotten"], sauce: ["Passierte Tomaten"] },
  ],
  dessert: [
    { base: ["Mascarpone"], fruit: ["Erdbeeren"], sweet: ["Vanillezucker"], crunch: ["Kekse"] },
    { base: ["Joghurt"], fruit: ["Mango", "Maracuja / Passionsfrucht"], sweet: ["Honig"], crunch: ["Granola"] },
  ],
  sandwich: [
    { bread: ["Vollkornbrot"], spread: ["Doppelrahmfrischkäse"], protein: ["Schinken"], cheese: ["Emmentaler"], veg: ["Tomaten", "Eisbergsalat"] },
    { bread: ["Ciabatta"], spread: ["Mayonnaise"], protein: ["Hähnchenbrust"], veg: ["Rucola", "Tomaten"], extra: ["Avocado"] },
    { bread: ["Baguette"], spread: ["Senf"], protein: ["Salami"], cheese: ["Gouda"], veg: ["Salatgurke", "Rote Zwiebeln"] },
  ],
};

export const RECIPE_TEMPLATES: RecipeTemplate[] = [
  { id: "muesli", emoji: "🥣", color: "oklch(0.93 0.05 80)", steps: [
    { key: "base", label: "Basis", min: 1, max: 2, ingredients: ["Haferflocken", "Dinkelflocken", "Cornflakes", "Granola"] },
    { key: "liquid", label: "Flüssigkeit", min: 1, max: 1, ingredients: ["Milch", "Joghurt", "Hafermilch", "Mandelmilch"] },
    { key: "fruit", label: "Früchte", min: 1, max: 3, ingredients: ["Bananen", "Äpfel", "Heidelbeeren", "Himbeeren", "Erdbeeren", "Mango"] },
    { key: "topping", label: "Topping", min: 0, max: 3, ingredients: ["Rosinen", "Gojibeeren", "Honig", "Walnüsse", "Mandeln"] },
  ] },
  { id: "smoothie", emoji: "🥤", color: "oklch(0.92 0.07 150)", steps: [
    { key: "liquid", label: "Flüssigkeit", min: 1, max: 1, ingredients: ["Milch", "Hafermilch", "Mandelmilch", "Orangensaft", "Joghurt"] },
    { key: "fruit", label: "Früchte", min: 1, max: 3, ingredients: ["Bananen", "Mango", "Ananas", "Erdbeeren", "Heidelbeeren", "Himbeeren", "Kiwis"] },
    { key: "green", label: "Grünes", min: 0, max: 2, ingredients: ["Babyspinat", "Spinat", "Minze", "Avocado"] },
    { key: "extra", label: "Extra", min: 0, max: 2, ingredients: ["Honig", "Datteln", "Haferflocken"] },
  ] },
  { id: "salat", emoji: "🥗", color: "oklch(0.92 0.06 135)", steps: [
    { key: "base", label: "Salatbasis", min: 1, max: 2, ingredients: ["Babyspinat", "Portulak", "Rucola", "Kopfsalat", "Eisbergsalat"] },
    { key: "veg", label: "Gemüse", min: 1, max: 4, ingredients: ["Tomaten", "Cherrytomaten", "Salatgurke", "Paprika", "Avocado", "Zuckermais"] },
    { key: "protein", label: "Proteinquelle", min: 0, max: 2, ingredients: ["Eier", "Feta", "Mozzarella", "Thunfisch", "Hähnchenbrust"] },
    { key: "herb", label: "Kräuter", min: 0, max: 2, ingredients: ["Petersilie", "Basilikum", "Schnittlauch", "Dill"] },
    { key: "dressing", label: "Dressing", min: 1, max: 2, ingredients: ["Olivenöl", "Balsamico", "Zitronen", "Senf"] },
  ] },
  { id: "pizza", emoji: "🍕", color: "oklch(0.92 0.07 40)", steps: [
    { key: "dough", label: "Teig", min: 1, max: 1, ingredients: ["Pizzateig", "Mehl", "Hefe"] },
    { key: "sauce", label: "Sauce", min: 1, max: 1, ingredients: ["Tomaten", "Passierte Tomaten", "Crème fraîche"] },
    { key: "cheese", label: "Käse", min: 1, max: 2, ingredients: ["Mozzarella", "Parmigiano Reggiano", "Grana Padano", "Provolone"] },
    { key: "topping", label: "Belag", min: 1, max: 4, ingredients: ["Salami", "Schinken", "Paprika", "Champignons", "Schwarze Oliven", "Zucchini", "Ananas"] },
    { key: "finish", label: "Kräuter & Gewürze", min: 0, max: 4, ingredients: ["Basilikum", "Oregano", "Olivenöl", "Petersilie", "Rosmarin", "Thymian", "Chilischoten", "Knoblauch"] },
  ] },
  { id: "pfanne", emoji: "🍳", color: "oklch(0.92 0.06 60)", steps: [
    { key: "base", label: "Stärkebeilage", min: 1, max: 1, ingredients: ["Reis", "Nudeln", "Kartoffeln", "Kochbanane"] },
    { key: "protein", label: "Proteinquelle", min: 0, max: 2, ingredients: ["Hähnchenbrust", "Tofu", "Eier", "Rinderhackfleisch"] },
    { key: "veg", label: "Gemüse", min: 1, max: 4, ingredients: ["Paprika", "Zucchini", "Pak Choi", "Zuckererbsen", "Babymais", "Auberginen", "Grüne Bohnen"] },
    { key: "fruit", label: "Früchte", min: 0, max: 2, ingredients: ["Ananas", "Mango", "Äpfel", "Zitronen"] },
    { key: "sauce", label: "Saucen", min: 0, max: 99, ingredients: ["Sojasauce", "Teriyaki-Sauce", "Sweet-Chili-Sauce", "Kokosmilch", "Crème fraîche"] },
    { key: "aroma", label: "Würze", min: 1, max: 3, ingredients: ["Knoblauch", "Zwiebeln", "Ingwer", "Chilischoten", "Sojasauce"] },
  ] },
  { id: "menu", emoji: "🍽️", color: "oklch(0.92 0.04 250)", steps: [
    { key: "protein", label: "Proteinquelle", min: 1, max: 2, ingredients: ["Hähnchenbrust", "Lachs", "Rinderhackfleisch", "Tofu", "Eier"] },
    { key: "starch", label: "Stärkebeilage", min: 1, max: 1, ingredients: ["Nudeln", "Reis", "Kartoffeln"] },
    { key: "veg", label: "Gemüsebeilage", min: 0, max: 2, ingredients: ["Grüne Bohnen", "Zucchini", "Babyspinat", "Karotten"] },
    { key: "sauce", label: "Sauce", min: 0, max: 1, ingredients: ["Passierte Tomaten", "Crème fraîche", "Sojasauce"] },
  ] },
  { id: "dessert", emoji: "🍮", color: "oklch(0.93 0.05 10)", steps: [
    { key: "base", label: "Basis", min: 1, max: 1, ingredients: ["Mascarpone", "Ricotta", "Joghurt", "Milchreis", "Griesscreme"] },
    { key: "fruit", label: "Früchte", min: 0, max: 2, ingredients: ["Erdbeeren", "Himbeeren", "Mango", "Maracuja / Passionsfrucht", "Feigen"] },
    { key: "sweet", label: "Süsse", min: 0, max: 2, ingredients: ["Honig", "Zucker", "Vanillezucker", "Schokolade"] },
    { key: "crunch", label: "Crunch", min: 0, max: 1, ingredients: ["Kekse", "Mandeln", "Granola"] },
  ] },
  { id: "sandwich", emoji: "🥪", color: "oklch(0.93 0.06 95)", steps: [
    { key: "bread", label: "Brot", min: 1, max: 1, ingredients: ["Vollkornbrot", "Ciabatta", "Baguette"] },
    { key: "spread", label: "Aufstrich", min: 0, max: 2, ingredients: ["Doppelrahmfrischkäse", "Mayonnaise", "Senf"] },
    { key: "protein", label: "Belag", min: 0, max: 2, ingredients: ["Schinken", "Salami", "Hähnchenbrust", "Putenbrust", "Thunfisch"] },
    { key: "cheese", label: "Käse", min: 0, max: 2, ingredients: ["Gouda", "Emmentaler", "Butterkäse"] },
    { key: "veg", label: "Gemüse", min: 0, max: 4, ingredients: ["Tomaten", "Salatgurke", "Eisbergsalat", "Rucola", "Paprika", "Rote Zwiebeln"] },
    { key: "extra", label: "Extra", min: 0, max: 2, ingredients: ["Freilandeier", "Avocado", "Zwiebeln"] },
  ] },
];
