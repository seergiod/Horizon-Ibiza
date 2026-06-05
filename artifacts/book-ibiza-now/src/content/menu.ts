export type Dish = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "starters" | "mains" | "drinks";
};

export const MENU: Dish[] = [
  {
    id: "red-prawn",
    name: "Ibiza Red Prawn Crudo",
    description: "Local red prawns, sea bass, citrus & olive oil",
    price: 28,
    category: "starters",
  },
  {
    id: "burrata",
    name: "Burrata & Heirloom Tomato",
    description: "Creamy burrata, Mediterranean tomatoes, basil oil",
    price: 18,
    category: "starters",
  },
  {
    id: "octopus",
    name: "Grilled Octopus",
    description: "Charred octopus, smoked paprika, confit potato",
    price: 26,
    category: "starters",
  },
  {
    id: "paella",
    name: "Seafood Paella (for 2)",
    description: "Bomba rice, prawns, mussels, saffron, lemon",
    price: 58,
    category: "mains",
  },
  {
    id: "seabass",
    name: "Whole Sea Bass à la Sal",
    description: "Salt-baked, lemon, olive oil emulsion",
    price: 42,
    category: "mains",
  },
  {
    id: "lamb",
    name: "Slow-Cooked Lamb Shoulder",
    description: "12-hour lamb, rosemary jus, market vegetables",
    price: 36,
    category: "mains",
  },
  {
    id: "horizon-spritz",
    name: "Horizon Spritz",
    description: "Signature sunset cocktail, citrus, prosecco",
    price: 14,
    category: "drinks",
  },
  {
    id: "rose-bottle",
    name: "Côtes de Provence Rosé",
    description: "Crisp Mediterranean rosé, bottle",
    price: 48,
    category: "drinks",
  },
];
