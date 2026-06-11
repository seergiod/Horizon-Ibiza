/* ─────────────────────────────────────────────────────────────────────────
   Carta completa — Horizon Ibiza
   ───────────────────────────────────────────────────────────────────────── */

export type Dish = {
  id: string;
  name: string;
  description: string;
  price: number;
  category: "starters" | "mains" | "drinks";
};

/** Used on the Home page signature-dishes section */
export const MENU: Dish[] = [
  {
    id: "paella-bogavante",
    name: "Paella de Bogavante",
    description: "Arroz, bogavante, sepia y gambas — Horizon Specialty",
    price: 33,
    category: "mains",
  },
  {
    id: "espaguettis-gambas",
    name: "Espaguetis con Gambas",
    description: "Pasta fresca con gambas salteadas en aceite de oliva y ajo",
    price: 19,
    category: "mains",
  },
  {
    id: "horizon-salad",
    name: "Horizon Salad",
    description: "Aguacate, mango, fresas, lechuga variada, nueces, vinagreta de manzana y lima",
    price: 16,
    category: "starters",
  },
];

/* ─────────────────────────────────────────────────────────────────────────
   Full carta data types
   ───────────────────────────────────────────────────────────────────────── */
export type Badge = "chef" | "traveller" | "specialty" | "ibicencan";

export type CartaItem = {
  id: string;
  nameEs: string;
  nameEn?: string;
  descEs?: string;
  descEn?: string;
  price?: number;
  priceLabel?: string; // for variable pricing
  badge?: Badge;
  note?: string;
};

export type Subcategory = {
  id: string;
  titleEs: string;
  titleEn?: string;
  note?: string;
  items: CartaItem[];
};

export type MenuTab = {
  id: string;
  labelEs: string;
  hours?: string;
  subcategories: Subcategory[];
};

/* ─────────────────────────────────────────────────────────────────────────
   CARTA DATA
   ───────────────────────────────────────────────────────────────────────── */
export const CARTA: MenuTab[] = [
  /* ══════════════════════════════════════════════════════════
     TAB 1 — DESAYUNOS
     ══════════════════════════════════════════════════════════ */
  {
    id: "desayunos",
    labelEs: "Desayunos",
    hours: "Opening – 12:30",
    subcategories: [
      {
        id: "combos",
        titleEs: "Combos",
        items: [
          {
            id: "combo-1-mar",
            nameEs: "Combo 1 Mar",
            nameEn: "Combo 1 Sea",
            descEs: "Media tostada con tomate rayado o croissant, café o té y zumo natural de naranja 20cl",
            descEn: "Half a toast with scratched tomato or croissant, coffee or tea and fresh orange juice 20cl",
            price: 6.20,
          },
          {
            id: "combo-2-playa",
            nameEs: "Combo 2 Playa",
            nameEn: "Combo 2 Beach",
            descEs: "Media tostada con aguacate, queso fresco, tomate rayado, café o té y zumo natural de naranja 20cl",
            descEn: "Half toast with avocado, fresh cheese, shredded tomato, coffee or tea and fresh orange juice 20cl",
            price: 8.20,
          },
          {
            id: "combo-3-sol",
            nameEs: "Combo 3 Sol",
            nameEn: "Combo 3 Sun",
            descEs: "Huevos revueltos con beicon y tostada de pan de molde, café o té y zumo natural de naranja 20cl",
            descEn: "Scrambled eggs with bacon and sliced bread toast, coffee or tea and natural orange juice 20cl",
            price: 11.50,
          },
        ],
      },
      {
        id: "saludables",
        titleEs: "Desayunos Saludables",
        titleEn: "Healthy Breakfast",
        items: [
          {
            id: "acai-bowl",
            nameEs: "Açai Bowl Sunshine",
            descEs: "Açai con yogurt de soja, frutos del bosque, plátano, kiwi, muesli y miel",
            descEn: "Açai with soy yogurt, berries, banana, kiwi, muesli and honey",
            price: 8.20,
          },
          {
            id: "smoothie-mix",
            nameEs: "Smoothie Mix",
            descEs: "Smoothie de plátano, naranja y fresa",
            descEn: "Banana, orange and strawberry smoothie",
            price: 5.40,
          },
          {
            id: "summer-muesli",
            nameEs: "Summer Muesli",
            descEs: "Yogurt, muesli con mango y fresa",
            descEn: "Yogurt, muesli with mango and strawberry",
            price: 5.40,
          },
          {
            id: "fruty-mix",
            nameEs: "Fruty Mix",
            nameEn: "Fruit Plate",
            descEs: "Plato de fruta de temporada",
            descEn: "Seasonal fruit plate",
            price: 10.50,
          },
        ],
      },
      {
        id: "huevos",
        titleEs: "Huevos",
        titleEn: "Eggs",
        items: [
          {
            id: "full-english",
            nameEs: "Desayuno Inglés",
            nameEn: "Full English Breakfast",
            descEs: "Huevos con beicon, salchichas y judías con tomate",
            descEn: "Eggs with bacon, sausage and beans with tomato",
            price: 9.90,
          },
          {
            id: "huevos-fritos",
            nameEs: "Huevos Fritos",
            nameEn: "Fried Eggs",
            descEs: "Huevos fritos con tostadas de pan de molde",
            descEn: "Fried eggs with sliced bread toast",
            price: 6.90,
          },
          {
            id: "a-la-francesa",
            nameEs: "A la Francesa",
            nameEn: "French Style",
            descEs: "Huevos a la francesa con tostadas de pan de molde",
            descEn: "French eggs with sliced bread toast",
            price: 6.90,
          },
          {
            id: "huevos-revueltos",
            nameEs: "Huevos Revueltos",
            nameEn: "Scrambled Eggs",
            descEs: "Huevos revueltos con tostadas de pan de molde",
            descEn: "Scrambled eggs with sliced bread toast",
            price: 6.90,
          },
          {
            id: "extras-huevos",
            nameEs: "Extras",
            nameEn: "Extras",
            priceLabel: "€1.00 c/u",
            note: "Beicon · Jamón York · Queso",
          },
        ],
      },
      {
        id: "tostadas",
        titleEs: "Tostadas",
        titleEn: "Toasts",
        note: "Pan tradicional o pan de semillas",
        items: [
          {
            id: "toast-mantequilla",
            nameEs: "Mantequilla y Mermelada",
            nameEn: "Butter and Jam",
            descEs: "Media tostada con mantequilla y mermelada",
            descEn: "Half toast with butter and jam",
            price: 3.50,
          },
          {
            id: "toast-tomate",
            nameEs: "Tomate",
            nameEn: "Tomato",
            descEs: "Media tostada con tomate restregado",
            descEn: "Half toast with scrubbed tomato",
            price: 3.00,
          },
          {
            id: "toast-queso",
            nameEs: "Queso",
            nameEn: "Cheese",
            descEs: "Media tostada con tomate restregado y queso fundido",
            descEn: "Half toast with scrubbed tomato and melted cheese",
            price: 3.40,
          },
          {
            id: "toast-jamon-queso",
            nameEs: "Jamón York y Queso",
            nameEn: "Ham and Cheese",
            descEs: "Media tostada con tomate restregado, jamón york y queso",
            descEn: "Half toast with scrubbed tomato, ham and cheese",
            price: 4.00,
          },
          {
            id: "toast-serrano",
            nameEs: "Jamón Serrano",
            nameEn: "Serrano Ham",
            descEs: "Media tostada con tomate restregado y jamón serrano",
            descEn: "Half toast with scrubbed tomato and serrano ham",
            price: 4.50,
          },
          {
            id: "toast-serrano-manchego",
            nameEs: "Serrano y Manchego",
            nameEn: "Serrano Ham and Manchego Cheese",
            descEs: "Media tostada con tomate restregado, jamón serrano y queso manchego",
            descEn: "Half toast with scrubbed tomato, serrano ham and manchego cheese",
            price: 5.60,
          },
          {
            id: "toast-aguacate",
            nameEs: "Aguacate y Queso Fresco",
            nameEn: "Avocado and Fresh Cheese",
            descEs: "Media tostada con tomate restregado, aguacate y queso fresco",
            descEn: "Half toast with scrubbed tomato, avocado and fresh cheese",
            price: 6.00,
          },
          {
            id: "toast-salmon",
            nameEs: "Salmón",
            nameEn: "Salmon",
            descEs: "Media tostada con tomate restregado y salmón",
            descEn: "Half toast with scrubbed tomato and salmon",
            price: 6.70,
          },
          {
            id: "toast-salmon-aguacate",
            nameEs: "Salmón y Aguacate",
            nameEn: "Salmon and Avocado",
            descEs: "Media tostada con tomate restregado, salmón y aguacate",
            descEn: "Half toast with scrubbed tomato, salmon and avocado",
            price: 7.80,
          },
        ],
      },
      {
        id: "bolleria",
        titleEs: "Bollería",
        titleEn: "Pastry",
        items: [
          { id: "croissant-clasico", nameEs: "Croissant Clásico", nameEn: "Classic Croissant", price: 2.50 },
          { id: "croissant-nutella", nameEs: "Croissant Nutella", price: 3.00 },
          {
            id: "croissant-mantequilla",
            nameEs: "Croissant Mantequilla y Mermelada",
            nameEn: "Croissant Butter and Jam",
            descEs: "Croissant con mantequilla y mermelada",
            descEn: "Croissant with butter and jam",
            price: 3.00,
          },
          {
            id: "croissant-jamon-queso",
            nameEs: "Croissant Jamón y Queso",
            nameEn: "Ham and Cheese Croissant",
            descEs: "Croissant de jamón y queso",
            descEn: "Ham and cheese croissant",
            price: 3.50,
          },
          {
            id: "muffin-yogurt",
            nameEs: "Muffin Yogurt y Frutos del Bosque",
            nameEn: "Muffin Yogurt and Forest Fruits",
            descEs: "Muffin con yogurt y frutos del bosque",
            descEn: "Muffin with yogurt and berries",
            price: 3.00,
          },
          { id: "muffin-chocolate", nameEs: "Muffin Chocolate", price: 3.00 },
        ],
      },
      {
        id: "bocadillos",
        titleEs: "Bocadillos",
        titleEn: "Sandwich & Bocatas",
        note: "Pan tradicional/rústico o pan de semillas",
        items: [
          {
            id: "sandwich-mixto",
            nameEs: "Mixto",
            nameEn: "Mixed",
            descEs: "Sandwich con jamón york y queso",
            descEn: "Sandwich with ham and cheese",
            price: 5.00,
          },
          {
            id: "bocata-beicon-queso",
            nameEs: "Beicon y Queso",
            nameEn: "Bacon and Cheese",
            descEs: "Bocadillo con tomate restregado, beicon y queso",
            descEn: "Sandwich with scrubbed tomato, bacon and cheese",
            price: 8.20,
          },
          {
            id: "bocata-jamon-queso",
            nameEs: "Jamón York y Queso",
            nameEn: "Ham and Cheese",
            descEs: "Bocadillo con tomate restregado, jamón york y queso",
            descEn: "Sandwich with scrubbed tomato, ham and cheese",
            price: 8.20,
          },
          {
            id: "bocata-serrano-manchego",
            nameEs: "Serrano y Manchego",
            nameEn: "Serrano and Manchego",
            descEs: "Bocadillo con tomate restregado, jamón serrano y queso manchego",
            descEn: "Sandwich with scrubbed tomato, serrano ham and manchego cheese",
            price: 9.80,
          },
          {
            id: "bocata-pollo-primavera",
            nameEs: "Pollo Primavera",
            nameEn: "Spring Chicken",
            descEs: "Bocadillo con tomate restregado, pollo, lechuga y un toque de mayonesa",
            descEn: "Sandwich with scrubbed tomato, chicken, lettuce and a touch of mayonnaise",
            price: 10.20,
          },
          {
            id: "bocata-atun",
            nameEs: "Atún",
            nameEn: "Tuna",
            descEs: "Bocadillo con tomate restregado, atún, cebolla, lechuga, olivas y pimiento del piquillo",
            descEn: "Sandwich with scrubbed tomato, tuna, onion, lettuce, olives and piquillo peppers",
            price: 10.20,
          },
          {
            id: "bocata-salmon",
            nameEs: "Salmón",
            nameEn: "Salmon",
            descEs: "Bocadillo con tomate restregado, salmón ahumado, lechuga y cebolla tierna",
            descEn: "Sandwich with scrubbed tomato, smoked salmon, lettuce and light onions",
            price: 11.40,
          },
        ],
      },
      {
        id: "zumos",
        titleEs: "Zumos Naturales",
        titleEn: "Natural Juices",
        items: [
          { id: "zumo-naranja", nameEs: "Naranja", nameEn: "Orange", descEs: "Zumo exprimido de naranja", descEn: "Squeezed orange juice", price: 4.80 },
          { id: "zumo-naranja-zanahoria", nameEs: "Naranja y Zanahoria", nameEn: "Orange and Carrot", descEs: "Zumo natural de naranja y zanahoria", descEn: "Natural orange and carrot juice", price: 5.50 },
          { id: "zumo-pina", nameEs: "Piña", nameEn: "Pineapple", descEs: "Zumo natural de piña", descEn: "Natural pineapple juice", price: 4.80 },
          { id: "zumo-manzana", nameEs: "Manzana", nameEn: "Apple", descEs: "Zumo natural de manzana", descEn: "Natural apple juice", price: 4.80 },
          { id: "zumo-personalizado", nameEs: "Zumo Personalizado", nameEn: "Custom Juice", descEs: "2 sabores a elegir entre naranja, piña y manzana", descEn: "2 flavours of your choice: orange, pineapple, apple", price: 5.50 },
        ],
      },
      {
        id: "cafes",
        titleEs: "Cafés e Infusiones",
        titleEn: "Coffee and Infusions",
        items: [
          { id: "cafe-espresso", nameEs: "Café Espresso", price: 2.10 },
          { id: "cafe-americano", nameEs: "Café Americano", price: 2.20 },
          { id: "doble-espresso", nameEs: "Doble Espresso", price: 2.60 },
          { id: "cafe-con-leche", nameEs: "Café con Leche", price: 2.70 },
          { id: "latte-macchiato", nameEs: "Latte Macchiato", price: 3.00 },
          { id: "matcha", nameEs: "Matcha", price: 4.00 },
          { id: "cafe-bombon", nameEs: "Café Bombón", price: 2.40 },
          { id: "cappuccino", nameEs: "Cappuccino", price: 3.00 },
          { id: "cafe-irlandes", nameEs: "Café Irlandés", nameEn: "Irish Coffee", price: 8.20 },
          { id: "carajillo", nameEs: "Carajillo", price: 3.20 },
          { id: "vaso-leche", nameEs: "Vaso de Leche", nameEn: "Glass of Milk", price: 2.10 },
          { id: "te", nameEs: "Té", nameEn: "Tea", descEs: "Negro o Verde", descEn: "Black or Green", price: 2.50 },
          { id: "infusiones", nameEs: "Otras Infusiones", nameEn: "Other Infusions", descEs: "Poleo Menta · Manzanilla", price: 2.50 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════
     TAB 2 — PISCINA
     ══════════════════════════════════════════════════════════ */
  {
    id: "piscina",
    labelEs: "Piscina",
    hours: "12:30 – 19:00",
    subcategories: [
      {
        id: "raciones",
        titleEs: "Raciones",
        titleEn: "Appetizers",
        items: [
          { id: "patatas-fritas", nameEs: "Patatas Fritas", nameEn: "French Fries", descEs: "Ración de patatas fritas caseras", descEn: "Portion of homemade french fries", price: 6.50 },
          { id: "patatas-bravas", nameEs: "Patatas Bravas", descEs: "Ración de patatas bravas con salsa brava (picante suave)", descEn: "Portion of patatas bravas with salsa brava (mild spicy)", price: 8.00 },
          { id: "alitas-bbq", nameEs: "Alitas de Pollo BBQ", nameEn: "BBQ Chicken Wings", descEs: "Alitas de pollo en salsa barbacoa y semillas de sésamo", descEn: "Chicken wings covered in barbecue sauce and sesame seeds", price: 11.00 },
          { id: "nachos", nameEs: "Nachos Clásicos", nameEn: "Nachos with Guacamole", descEs: "Ración de nachos con queso fundido, jalapeños, guacamole y salsa mexicana", descEn: "Nachos served with melted cheese, jalapeños, guacamole and mexican sauce", price: 11.20 },
          { id: "wrap-pollo", nameEs: "Wrap de Pollo", nameEn: "Mexican Chicken Wrap", descEs: "Wrap de pollo, aguacate, lechuga, tomate, mayonesa de sriracha", descEn: "Chicken wrap, avocado, lettuce, tomato, sriracha mayonnaise", price: 12.00 },
          { id: "croquetas-jamon", nameEs: "Croquetas de Jamón", nameEn: "Iberian Ham Croquettes", descEs: "Croquetas típicas de jamón ibérico", descEn: "Typical iberian ham croquettes", price: 10.50 },
          { id: "chicken-fingers", nameEs: "Chicken Fingers", descEs: "Pollo rebozado con salsa agridulce", descEn: "Battered chicken with sweet and sour sauce", price: 12.50 },
          { id: "pan-ali-oli", nameEs: "Pan con Ali Oli y Olivas", descEs: "Pan con ali oli ibicenco y olivas (2 piezas por persona)", descEn: "Bread with ibicencan ali oli and olives (2 pieces per person)", price: 3.00 },
        ],
      },
      {
        id: "burgers-piscina",
        titleEs: "Hamburguesas y Bocadillos",
        titleEn: "Burgers & Sandwich",
        note: "100% Premium Veal — Rubia Gallega. Servidas con patatas fritas caseras.",
        items: [
          { id: "classic-burger", nameEs: "Classic Tasty Burger", descEs: "Hamburguesa con lechuga, tomate y cebolla caramelizada, con patatas fritas caseras", descEn: "Hamburger with lettuce, tomato and caramelized onion with homemade french fries", price: 16.00 },
          { id: "american-burger", nameEs: "American Burger", descEs: "Hamburguesa con beicon, huevo frito, pepinillos y queso cheddar, con patatas fritas caseras", descEn: "Burger with bacon, fried egg, pickles and cheddar cheese served with homemade french fries", price: 17.00 },
          { id: "royal-cheese-piscina", nameEs: "Royal Cheese Burger", descEs: "Hamburguesa con lechuga, cebolla, doble cheddar, salsa especial, pepinillos, con patatas fritas caseras", descEn: "Burger with lettuce, onion, double cheddar, special sauce, pickles, served with homemade french fries", price: 16.50, badge: "chef" },
          { id: "club-sandwich", nameEs: "Club Sandwich", descEs: "Sandwich con pollo, beicon, lechuga, tomate, parmesano y huevo frito, con patatas fritas caseras", descEn: "Sandwich with chicken, bacon, lettuce, tomato, parmesan and fried egg, served with homemade french fries", price: 16.50, badge: "chef" },
        ],
      },
      {
        id: "kids-piscina",
        titleEs: "Menú Infantil",
        titleEn: "Kids Menu",
        items: [
          { id: "kids-fingers", nameEs: "Fingers con Patatas", descEs: "Fingers de pollo con patatas fritas caseras", descEn: "Chicken fingers with homemade french fries", price: 12.50 },
          { id: "kids-pollo", nameEs: "Pollo con Patatas", descEs: "Pechuga de pollo con patatas fritas caseras", descEn: "Chicken breast with homemade french fries", price: 12.50 },
          { id: "kids-espaguetis", nameEs: "Espaguetis con Salsa", descEs: "Espaguetis con salsa de tomate y queso rallado", descEn: "Spaghetti with tomato sauce and shredded cheese", price: 12.50 },
        ],
      },
      {
        id: "postres-piscina",
        titleEs: "Postres",
        titleEn: "Desserts",
        items: [
          { id: "flao-horizon", nameEs: "Flaò Horizon", nameEn: "Traditional Ibicencan Cake", descEs: "Tarta ibicenca de queso con toques de menta, servida con helado", descEn: "Ibicencan cheesecake with hints of mint, served with ice cream", price: 8.50, badge: "ibicencan" },
          { id: "tarta-queso", nameEs: "Tarta de Queso", nameEn: "Homemade Cheesecake", descEs: "Tarta de queso con salsa de açai, crumble de almendra y helado de yogur maracuyá", descEn: "Cheesecake with açai sauce, almond crumble and passion fruit yoghurt ice cream", price: 8.50 },
          { id: "coulant", nameEs: "Chocolate Coulant", descEs: "Volcán de chocolate con helado de vainilla", descEn: "Chocolate volcano with vanilla ice cream", price: 8.50 },
          { id: "helado-artesanal", nameEs: "Helado Artesanal", nameEn: "Italian Artisan Ice Cream", descEs: "Surtido de helados artesanales", descEn: "Assortment of artisan ice cream", price: 8.50 },
          { id: "tiramisu", nameEs: "Tiramisú", descEs: "Postre clásico a base de café, cacao y queso mascarpone", descEn: "Classic dessert made with coffee, cocoa and mascarpone cheese", price: 8.50 },
          { id: "cafe-caleta", nameEs: "Café Caleta", nameEn: "Old Classic Infusion", descEs: "Infusión dulce de brandy, ron, café, canela, con piel de limón y naranja. Mínimo 2 personas.", descEn: "Sweet infusion of brandy, rum, coffee, cinnamon, lemon and orange peel. Minimum 2 people.", priceLabel: "€5.00 / persona" },
          { id: "haagen-dazs", nameEs: "Helados Häagen-Dazs", nameEn: "100ml Mini Cup", descEs: "Belgian Chocolate · Cookies & Cream · Dulce de Leche · Macadamia Nuts · Strawberry Cheesecake", price: 4.80 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════
     TAB 3 — RESTAURANTE
     ══════════════════════════════════════════════════════════ */
  {
    id: "restaurante",
    labelEs: "Restaurante",
    hours: "12:30 – Cierre",
    subcategories: [
      {
        id: "ensaladas",
        titleEs: "Ensaladas",
        titleEn: "Salads",
        items: [
          { id: "horizon-salad-rest", nameEs: "Horizon Salad", nameEn: "Chef's Selection", descEs: "Ensalada de aguacate, mango, fresas, lechuga variada, nueces, eneldo, con vinagreta de manzana y lima", descEn: "Salad with avocado, mango, strawberries, mixed lettuce, walnuts, dill, with apple and lime vinaigrette", price: 16.00, badge: "chef" },
          { id: "caesar-salad", nameEs: "Caesar Salad", descEs: "Lechuga romana, cubos de pollo, lascas de parmesano y crutones servido con salsa caesar", descEn: "Romaine lettuce, chicken cubes, parmesan flakes and croutons served with caesar sauce", price: 16.50 },
          { id: "ensalada-crostes", nameEs: "Ensalada de Crostes", nameEn: "Old Recipe from Formentera", descEs: "Crostas de pan tostado, anchoa, tomate, tomate seco, cebolla, pimientos, ajo y aceitunas", descEn: "Toasted bread crostas, anchovy, tomato, sundried tomatoes, onion, peppers, garlic and olives", price: 14.00, badge: "specialty" },
          { id: "burrata-med", nameEs: "Mediterranean Burrata", descEs: "Burrata con pesto y carpaccio de tomate especial", descEn: "Burrata with pesto and a special tomato carpaccio", price: 17.00 },
          { id: "ensalada-salmon-gambas", nameEs: "Ensalada de Salmón y Gambas", descEs: "Salmón ahumado, gambas salteadas en ajo y perejil, lechuga variada, tomate, zanahoria, pepinillos encurtidos, cebolla morada y huevo duro", descEn: "Smoked salmon, prawns sautéed with garlic and parsley, mixed lettuce, tomato, carrot, pickled cucumbers, red onion and hard-boiled egg", price: 17.00 },
        ],
      },
      {
        id: "entrantes-tierra",
        titleEs: "Entrantes de la Tierra",
        titleEn: "Starters from the Earth",
        items: [
          { id: "croquetas-casa", nameEs: "Croquetas de la Casa", nameEn: "Chef Homemade", descEs: "Ración variada de 6 croquetas caseras", descEn: "Mixed portion of 6 homemade croquettes", price: 12.00, badge: "chef" },
          { id: "foie-mi-cuit", nameEs: "Foie Mi Cuit", nameEn: "Elaboration by the Chef", descEs: "Foie de pato casero, con pan crujiente, sal maldon, pimienta y mermelada de pera", descEn: "Homemade duck foie with crispy bread, maldon salt, pepper and pear jam", price: 18.00, badge: "chef" },
          { id: "huevos-rotos", nameEs: "Huevos Rotos", nameEn: "Spanish Speciality", descEs: "Con Sobrasada Ibicenca · Con Foie Mi Cuit · Con Jamón Ibérico", descEn: "With Ibicencan Sobrasada · With Foie Mi Cuit · With Iberian Ham", priceLabel: "€17 – €18", badge: "specialty" },
          { id: "alcachofas", nameEs: "Alcachofas Rústicas", nameEn: "Rustic Artichokes", descEs: "Alcachofas a la plancha con escamas de parmesano y jamón ibérico con salsa romescu", descEn: "Grilled artichokes with parmesan flakes and iberian ham with romescu sauce", price: 17.50 },
          { id: "queso-manchego", nameEs: "Queso Manchego", descEs: "Ración de queso semicurado de la mancha con pan con tomate", descEn: "Portion of semi-cured manchego cheese with pan con tomate", price: 17.00 },
          { id: "jamon-iberico", nameEs: "Jamón Ibérico", nameEn: "Special Suggestion", descEs: "100 gramos de jamón ibérico acompañado de pan con tomate", descEn: "100 grams of iberian ham served with pan con tomate", price: 25.00, badge: "chef" },
        ],
      },
      {
        id: "entrantes-mar",
        titleEs: "Entrantes del Mar",
        titleEn: "Starters from the Sea",
        items: [
          { id: "mejillones-vapor", nameEs: "Mejillones al Vapor", nameEn: "Steamed Mussels", descEs: "Con vino blanco, ajo y perejil", descEn: "With white wine, garlic and parsley", price: 15.00 },
          { id: "mejillones-marinera", nameEs: "Mejillones a la Marinera", nameEn: "Mussels Marinera Style", descEs: "Con salsa tradicional", descEn: "With traditional sauce", price: 16.00 },
          { id: "calamares-andaluza", nameEs: "Calamares a la Andaluza", descEs: "Calamar nacional a la andaluza y salsa romesco", descEn: "Spanish squid andalusian style and romesco sauce", price: 17.00 },
          { id: "gambas-ajillo", nameEs: "Gambas al Ajillo", nameEn: "Prawns with Garlic", descEs: "Gambas peladas, salteadas con ajo, guindilla, pimentón y aceite de oliva", descEn: "Peeled prawns sautéed with garlic, chilli, paprika and olive oil", price: 17.50 },
          { id: "calamares-sobrasada", nameEs: "Calamares con Sobrasada", nameEn: "Ibicencan Style", descEs: "Calamar salteado con sobrasada y cebolla caramelizada", descEn: "Squid sautéed with sobrasada and caramelized onion", price: 18.00, badge: "ibicencan" },
          { id: "pulpo-grillado", nameEs: "Pulpo Grillado", nameEn: "Grilled Octopus", descEs: "Pulpo asado a la parrilla con patata estilo gallego", descEn: "Grilled octopus with Galician-style potato", price: 26.00, badge: "chef" },
        ],
      },
      {
        id: "paellas",
        titleEs: "Arroces y Paellas",
        titleEn: "Paellas & Rice",
        note: "Precio por persona. Mínimo 2 personas.",
        items: [
          { id: "paella-ciega", nameEs: "Paella Ciega", descEs: "Arroz y piezas peladas de gamba, sepia, mejillones y rape", descEn: "Rice with peeled prawns, cuttlefish, mussels and monkfish", price: 26.00, badge: "traveller" },
          { id: "paella-mixta", nameEs: "Paella Mixta", descEs: "Arroz, gamba, cangrejo, sepia, mejillones, pollo y magro de cerdo", descEn: "Rice, prawn, crab, cuttlefish, mussels, chicken and pork", price: 25.00 },
          { id: "paella-pescado-marisco", nameEs: "Paella de Pescado y Marisco", descEs: "Arroz, gamba, cangrejo, sepia, mejillones y rape", descEn: "Rice, prawn, crab, cuttlefish, mussels and monkfish", price: 28.00 },
          { id: "paella-bogavante", nameEs: "Paella de Bogavante", nameEn: "Horizon Specialty", descEs: "Arroz, bogavante, sepia y gambas", descEn: "Rice, lobster, cuttlefish and prawns", price: 33.00, badge: "specialty" },
          { id: "fideua-senyoret", nameEs: "Fideuá del Senyoret", descEs: "Fideos con piezas peladas de gamba, sepia, mejillones y rape", descEn: "Noodles with peeled prawns, cuttlefish, mussels and monkfish", price: 26.00, badge: "traveller" },
          { id: "arroz-banda", nameEs: "Arroz a Banda", nameEn: "Traditional from Ibiza", descEs: "Arroz y sepia pelada en reducción de caldo de bullit de peix", descEn: "Rice and peeled cuttlefish in reduced bullit de peix broth", price: 24.00, badge: "ibicencan" },
          { id: "arroz-huerta", nameEs: "Arroz de la Huerta", descEs: "Selección de vegetales de temporada y caldo de verduras", descEn: "Selection of seasonal vegetables and vegetable broth", price: 24.00 },
          { id: "arroz-negro", nameEs: "Arroz Negro", descEs: "Arroz, sepia, gamba y tinta de calamar", descEn: "Rice, cuttlefish, prawn and squid ink", price: 25.00 },
          { id: "paella-mar-campo", nameEs: "Paella Mar y Campo", nameEn: "Horizon Specialty", descEs: "Piezas peladas de gamba, sepia, mejillones, pollo y magro de cerdo", descEn: "Peeled prawns, cuttlefish, mussels, chicken and pork", price: 26.00, badge: "specialty" },
        ],
      },
      {
        id: "ibicenca",
        titleEs: "Especialidad Ibicenca",
        titleEn: "Ibizencan Specialities",
        items: [
          {
            id: "bullit-de-peix",
            nameEs: "Bullit de Peix",
            nameEn: "Traditional Fish Stew with Rice",
            descEs: "Mínimo 2 personas. Precio por persona. Primer plato: Pescado de roca con patatas ibicencas y ali-oli. Segundo plato: Arroz del Bullit elaborado con la reducción del caldo.",
            descEn: "Minimum 2 people. Price per person. First: Rock fish with Ibicencan potatoes and ali-oli. Second: Bullit rice made with the reduced broth.",
            price: 43.00,
            badge: "ibicencan",
          },
        ],
      },
      {
        id: "pescados",
        titleEs: "Pescados y Mariscos",
        titleEn: "Fish and Seafood",
        items: [
          { id: "sardinas-grilladas", nameEs: "Sardinas Grilladas", nameEn: "Grilled Sardines", descEs: "A la parrilla con patata asada", descEn: "Grilled with baked potato", price: 19.50 },
          { id: "calamares-grillados", nameEs: "Calamares Grillados", nameEn: "Grilled Squid", descEs: "A la plancha con patatas estilo ibicenco", descEn: "Grilled with Ibicencan-style potatoes", price: 24.00 },
          { id: "lubina-parrilla", nameEs: "Filete de Lubina a la Parrilla", nameEn: "Grilled Seabass Fillet", descEs: "Con patatas ibicencas", descEn: "With Ibicencan potatoes", price: 27.00 },
          { id: "bogavante-tradicional", nameEs: "Bogavante Estilo Tradicional", nameEn: "Traditional Lobster", descEs: "Medio bogavante con huevos fritos payeses y patatas fritas ibicencas", descEn: "Half lobster with fried eggs and Ibicencan fried potatoes", price: 29.00, badge: "traveller" },
        ],
      },
      {
        id: "carnes",
        titleEs: "Carnes",
        titleEn: "Meats",
        note: "Incluyen guarnición a elegir: ensalada, verduras asadas, patatas fritas o estilo ibicenco",
        items: [
          { id: "jarrete-cordero", nameEs: "Jarrete de Cordero Asado", nameEn: "Roasted Lamb in Its Juices", price: 29.00 },
          { id: "entrana-ternera", nameEs: "Entraña de Ternera", nameEn: "Skirt Steak — Special Galician Beef", price: 23.50 },
          { id: "solomillo", nameEs: "Solomillo de Ternera", nameEn: "Beef Tenderloin", price: 29.00, badge: "chef" },
          { id: "entrecote", nameEs: "Entrecôte de Ternera", nameEn: "Rib Eye Steak", price: 33.50, badge: "chef" },
          { id: "pechuga-pollo", nameEs: "Pechuga de Pollo a la Plancha", nameEn: "Grilled Chicken Breast", price: 17.70 },
        ],
      },
      {
        id: "pasta-risottos",
        titleEs: "Pasta & Risottos",
        items: [
          { id: "espaguettis-gambas-rest", nameEs: "Espaguetis con Gambas", nameEn: "Spaghetti with Prawns", price: 19.00 },
          { id: "marco-polo", nameEs: "Marco Polo", nameEn: "Udon Noodle Wok", descEs: "Wok mixto de fideos udon con verduras y salsa de soja", descEn: "Mixed wok of udon noodles with vegetables and soy sauce", priceLabel: "Pollo €17 · Gambas €19 · Vegetal €16" },
          { id: "risotto-horizon", nameEs: "Risotto Horizon", descEs: "Pollo con parmesano y setas silvestres", descEn: "Chicken with parmesan and wild mushrooms", price: 19.00, badge: "chef" },
        ],
      },
      {
        id: "burger-rest",
        titleEs: "Burger",
        items: [
          { id: "royal-cheese-rest", nameEs: "Royal Cheese Burger", descEs: "Servida con patatas fritas caseras", descEn: "Served with homemade french fries", price: 18.00, badge: "chef" },
        ],
      },
      {
        id: "postres-rest",
        titleEs: "Postres",
        titleEn: "Desserts",
        items: [
          { id: "flao-rest", nameEs: "Flaò Horizon", nameEn: "Traditional Ibicencan Cake", descEs: "Tarta ibicenca de queso con toques de menta, servida con helado", descEn: "Ibicencan cheesecake with hints of mint, served with ice cream", price: 8.50, badge: "ibicencan" },
          { id: "tarta-queso-rest", nameEs: "Tarta de Queso", nameEn: "Homemade Cheesecake", descEs: "Tarta de queso con salsa de açai, crumble de almendra y helado de yogur maracuyá", price: 8.50 },
          { id: "coulant-rest", nameEs: "Chocolate Coulant", descEs: "Volcán de chocolate con helado de vainilla", descEn: "Chocolate volcano with vanilla ice cream", price: 8.50 },
          { id: "helado-rest", nameEs: "Helado Artesanal", nameEn: "Italian Artisan Ice Cream", descEs: "Surtido de helados artesanales", price: 8.50 },
          { id: "tiramisu-rest", nameEs: "Tiramisú casero", descEs: "Postre clásico a base de café, cacao y queso mascarpone", price: 8.50 },
          { id: "cafe-caleta-rest", nameEs: "Café Caleta", nameEn: "Old Classic Infusion", descEs: "Infusión dulce de brandy, ron, café, canela, con piel de limón y naranja. Mínimo 2 personas.", priceLabel: "€5.00 / persona" },
          { id: "haagen-dazs-rest", nameEs: "Copas Häagen-Dazs", nameEn: "100ml Mini Cup", descEs: "Belgian Chocolate · Cookies & Cream · Dulce de Leche · Macadamia Nuts · Strawberry Cheesecake", price: 4.80 },
        ],
      },
      {
        id: "complementos",
        titleEs: "Complementos",
        titleEn: "Complements",
        items: [
          { id: "pan-masa-madre", nameEs: "Pan de Masa Madre", price: 2.00 },
          { id: "pan-tomate", nameEs: "Pan con Tomate", price: 3.00 },
          { id: "pan-ali-oli-rest", nameEs: "Pan con Ali Oli y Olivas", price: 3.00 },
          { id: "patatas-fritas-comp", nameEs: "Patatas Fritas", nameEn: "French Fries", price: 6.50 },
          { id: "patatas-bravas-comp", nameEs: "Patatas Bravas", price: 8.00 },
        ],
      },
      {
        id: "kids-rest",
        titleEs: "Menú Infantil",
        titleEn: "Kids Menu",
        items: [
          { id: "kids-fingers-rest", nameEs: "Fingers con Patatas", descEs: "Fingers de pollo con patatas fritas caseras", price: 13.00 },
          { id: "kids-pollo-rest", nameEs: "Pollo con Patatas", descEs: "Pechuga de pollo con patatas fritas caseras", price: 13.00 },
          { id: "kids-esp-rest", nameEs: "Espaguetis con Salsa de Tomate", price: 13.00 },
        ],
      },
    ],
  },

  /* ══════════════════════════════════════════════════════════
     TAB 4 — BEBIDAS Y CÓCTELES
     ══════════════════════════════════════════════════════════ */
  {
    id: "bebidas",
    labelEs: "Bebidas & Cócteles",
    subcategories: [
      {
        id: "vinos-blancos",
        titleEs: "Vinos Blancos",
        titleEn: "White Wines",
        items: [
          { id: "albarino-poseidon", nameEs: "Albariño Poseidon", descEs: "MMXXIII — Limited Edition for Horizon", priceLabel: "Copa €4.80 · Botella €24" },
          { id: "quinta-couselo", nameEs: "Quinta de Couselo", priceLabel: "Botella €27" },
          { id: "mar-de-frades", nameEs: "Mar de Frades", priceLabel: "Botella €31" },
          { id: "verdejo-hombre-pez", nameEs: "Verdejo Hombre Pez", priceLabel: "Copa €4.80 · Botella €24" },
          { id: "mocen", nameEs: "Mocen", descEs: "Special Selection", priceLabel: "Botella €26" },
          { id: "flor-de-vetus", nameEs: "Flor de Vetus", priceLabel: "Botella €28" },
          { id: "vina-zorzal", nameEs: "Viña Zorzal", descEs: "Chardonnay", priceLabel: "Copa €4.80 · Botella €24" },
          { id: "casilla-guapo", nameEs: "Casilla del Guapo", descEs: "Sauvignon Blanc", priceLabel: "Copa €4.80 · Botella €24" },
          { id: "godello-luar", nameEs: "Godello O Luar do Sil", priceLabel: "Botella €29" },
          { id: "malvasia-can-rich", nameEs: "Malvasía Can Rich", descEs: "IGP Ibiza", priceLabel: "Botella €25" },
          { id: "ibizkus-white", nameEs: "Ibizkus White", priceLabel: "Botella €30" },
          { id: "pinot-grigio", nameEs: "Pinot Grigio Montelliana", descEs: "Italia", priceLabel: "Botella €25" },
        ],
      },
      {
        id: "vinos-rosados",
        titleEs: "Vinos Rosados",
        titleEn: "Rosé Wines",
        items: [
          { id: "ramon-bilbao-rose", nameEs: "Ramón Bilbao", descEs: "Garnacha", priceLabel: "Copa €4.90 · Botella €25" },
          { id: "can-rich-bes", nameEs: "Can Rich Bes", descEs: "Monastrell — Ibiza", priceLabel: "Botella €28" },
          { id: "ibizkus-rose", nameEs: "Ibizkus Rosé", descEs: "Ibiza", priceLabel: "Botella €31" },
          { id: "aix-rose", nameEs: "Aix Rosé", descEs: "Francia — Grenache · Cinsaut · Syrah", priceLabel: "Botella €33" },
        ],
      },
      {
        id: "vinos-tintos",
        titleEs: "Vinos Tintos",
        titleEn: "Red Wines",
        items: [
          { id: "orube-crianza", nameEs: "Orube Crianza", descEs: "Rioja — Tempranillo · Garnacha · Graciano", priceLabel: "Copa €4.80 · Botella €24" },
          { id: "marques-riscal", nameEs: "Marqués de Riscal Reserva", descEs: "Rioja", priceLabel: "Botella €29" },
          { id: "muga-crianza", nameEs: "Muga Crianza", descEs: "Rioja", priceLabel: "Botella €31" },
          { id: "contino-reserva", nameEs: "Contino Reserva", descEs: "Rioja", priceLabel: "Botella €53.50" },
          { id: "cruz-de-alba", nameEs: "Cruz de Alba Roble", descEs: "Ribera del Duero", priceLabel: "Copa €4.90 · Botella €25" },
          { id: "conde-san-cristobal", nameEs: "Conde San Cristóbal Crianza", descEs: "Ribera del Duero", priceLabel: "Botella €29" },
          { id: "pago-capellanes", nameEs: "Pago de Capellanes Crianza", descEs: "Ribera del Duero", priceLabel: "Botella €44" },
          { id: "can-basso", nameEs: "Can Bassó Monastrell", descEs: "IGP Ibiza", priceLabel: "Botella €26" },
        ],
      },
      {
        id: "cavas-champagne",
        titleEs: "Cavas & Champagne",
        items: [
          { id: "lacrimas-baccus", nameEs: "Lacrimas Baccus Brut Cava", priceLabel: "Copa €5.30 · Botella €29" },
          { id: "privat-laieta", nameEs: "Privat Laietà Cava", priceLabel: "Botella €37" },
          { id: "prosecco-asolo", nameEs: "Prosecco Asolo Superiore Extra Dry", priceLabel: "Copa €5.30 · Botella €29" },
          { id: "torresella-rose", nameEs: "Torresella Rosé Glera", priceLabel: "Botella €28" },
          { id: "moet-brut", nameEs: "Moët & Chandon Impérial Brut", priceLabel: "Botella €95" },
          { id: "moet-ice", nameEs: "Moët & Chandon Ice Impérial Demi-Sec", priceLabel: "Botella €125" },
          { id: "moet-ice-rose", nameEs: "Moët & Chandon Ice Impérial Rosé Demi-Sec", priceLabel: "Botella €125" },
        ],
      },
      {
        id: "sangrias",
        titleEs: "Sangrías",
        items: [
          { id: "sangria-vino", nameEs: "Sangría de Vino", nameEn: "Wine Sangria", priceLabel: "Copa €6 · Jarra €24" },
          { id: "sangria-cava", nameEs: "Sangría de Cava", nameEn: "Cava Sangria", priceLabel: "Copa €11.50 · Jarra €36.50" },
        ],
      },
      {
        id: "cocktails",
        titleEs: "Cócteles",
        titleEn: "Cocktails",
        note: "Precio único €11.50 (excepto Aperol Spritz)",
        items: [
          { id: "aperol-spritz", nameEs: "Aperol Spritz", descEs: "Aperol, cava, soda", price: 9.50 },
          { id: "moscow-mule", nameEs: "Moscow Mule", descEs: "Vodka, gingerbeer, lima, angostura", price: 11.50 },
          { id: "bloody-mary", nameEs: "Bloody Mary", descEs: "Vodka, zumo de tomate, especias", price: 11.50 },
          { id: "pina-colada", nameEs: "Piña Colada", descEs: "Ron, malibú, coco, zumo de piña", price: 11.50 },
          { id: "mojito", nameEs: "Mojito", descEs: "Ron, lima, hierbabuena, soda", price: 11.50 },
          { id: "caipirinha", nameEs: "Caipirinha", descEs: "Cachaça, lima, azúcar moreno, hielo picado", price: 11.50 },
          { id: "strawberry-daiquiri", nameEs: "Strawberry Daiquiri", descEs: "Ron, fresas", price: 11.50 },
          { id: "coco-loco", nameEs: "Coco Loco", descEs: "Ron, malibú, coco", price: 11.50 },
          { id: "margarita", nameEs: "Margarita", descEs: "Tequila, cointreau, lima", price: 11.50 },
          { id: "espresso-martini", nameEs: "Espresso Martini", descEs: "Vodka, tia maria, café espresso", price: 11.50 },
          { id: "sex-on-beach", nameEs: "Sex on the Beach", descEs: "Vodka, licor de melocotón, zumo de naranja", price: 11.50 },
        ],
      },
    ],
  },
];
