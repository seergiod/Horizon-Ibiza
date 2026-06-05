export const SITE = {
  name: "Horizon Ibiza",
  tagline: "Horizon",
  whatsappNumber: "34666923809",
  phoneDisplay: "+34 666 92 38 09",
  email: "sergio15032005@gmail.com",
  address: {
    street: "Passeig Ses Pitiüses s/n, bajo, Apartamentos Mar y Playa",
    area: "Figueretas",
    city: "Ibiza",
    region: "Illes Balears",
    postal: "07800",
    country: "ES",
    lat: 38.9035,
    lng: 1.4366,
  },
  hours: {
    daily: { open: "08:00", close: "23:30" },
  },
  priceRange: "€€€",
  cuisine: ["Mediterranean", "Seafood", "Spanish"],
} as const;

export const RESERVE_DEFAULTS = {
  defaultPartySize: 2,
  partySizes: [2, 3, 4, 5, 6, 7, 8] as const,
  defaultHour: 21,
};
