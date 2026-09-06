/**
 * Central, non-secret business configuration for the Bloom & Bean demo.
 *
 * Everything a café owner would realistically want to change lives here.
 * Values wrapped in [SQUARE BRACKETS] are placeholders that still need to be
 * confirmed by the café — they are intentionally visible in the UI.
 */

export const siteConfig = {
  cafeName: "Bloom & Bean",
  tagline: "Makati Neighborhood Café",
  timezone: "Asia/Manila",

  /** Deposit collected to hold a table, in Philippine pesos. */
  depositAmount: 100,
  depositCurrency: "₱",

  /** Length of a reservation, in minutes. Used for the Calendar event. */
  reservationDurationMinutes: 90,

  // --- REVIEW: confirm every placeholder below with the café owner ---
  address: "[ADD ADDRESS — Salcedo Village / Legazpi, Makati City, Metro Manila]",
  addressShort: "[ADD ADDRESS — Salcedo Village, Makati]",
  openingHours: "[CONFIRM: Tuesday – Sunday: 7:00 AM – 6:00 PM]",
  openingHoursNote: "[CONFIRM: Closed on Mondays for roasting & prep]",
  openToday: "[CONFIRM: 7:00 AM – 6:00 PM]",
  kitchenUntil: "[CONFIRM: 3:30 PM]",
  phone: "[ADD PHONE NUMBER — +63 2 8XXX XXXX]",
  publicEmail: "hello@bloomandbean.ph",
  instagramHandle: "@bloomandbean.ph",

  whatsappUrl: "https://wa.me/63REPLACE_WITH_NUMBER",
  mapsUrl: "https://maps.google.com/?q=REPLACE_WITH_ADDRESS",
  instagramUrl: "https://instagram.com/REPLACE_WITH_HANDLE",
} as const;

/** Arrival times offered by the form. Values are 24h HH:mm strings. */
export const arrivalTimes = [
  { value: "08:00", label: "08:00 AM — Morning Brew" },
  { value: "09:30", label: "09:30 AM — Breakfast" },
  { value: "11:30", label: "11:30 AM — Early Lunch" },
  { value: "13:00", label: "01:00 PM — Midday" },
  { value: "15:00", label: "03:00 PM — Afternoon Coffee" },
  { value: "16:30", label: "04:30 PM — Golden Hour" },
] as const;

export const arrivalTimeValues = arrivalTimes.map((t) => t.value);

export const guestOptions = [
  { value: 1, label: "1 person (Quiet nook)" },
  { value: 2, label: "2 people (Small table)" },
  { value: 3, label: "3 people" },
  { value: 4, label: "4 people (Standard table)" },
  { value: 5, label: "5 people (Communal table)" },
  { value: 6, label: "6 people (Communal table)" },
  { value: 7, label: "7 people (Communal table)" },
  { value: 8, label: "8 people (Communal table)" },
] as const;

export const MIN_GUESTS = 1;
export const MAX_GUESTS = 8;

export type MenuItem = { name: string; description: string; price: string };
export type MenuSection = { title: string; note: string; items: MenuItem[] };

/** Prices are placeholders — REVIEW with the café before launch. */
export const menu: MenuSection[] = [
  {
    title: "Coffee",
    note: "Single Origin & House Blend",
    items: [
      {
        name: "Long Black / Americano",
        description: "Double pulled shot over hot or iced filtered water",
        price: "[₱160]",
      },
      {
        name: "Flat White & Oat Latte",
        description: "Silky microfoam over espresso blend; dairy or oat milk",
        price: "[₱190]",
      },
      {
        name: "Slow Drip Pour-Over",
        description: "Rotating seasonal single origin, brewed through Kalita Wave",
        price: "[₱220]",
      },
      {
        name: "Cascara Tonic",
        description: "Brewed coffee cherry tea, sparkling water, calamansi peel",
        price: "[₱180]",
      },
    ],
  },
  {
    title: "Breakfast",
    note: "Until 12:00 PM",
    items: [
      {
        name: "Toasted Country Sourdough",
        description: "Cultured salted butter, wild mountain honey or calamansi curd",
        price: "[₱185]",
      },
      {
        name: "Avocado & Poached Egg Toast",
        description: "Crushed Hass avocado, local pasture egg, chili flakes, whipped ricotta",
        price: "[₱320]",
      },
      {
        name: "House Granola & Greek Yogurt",
        description: "Rolled oats, pumpkin seeds, toasted coconut, stewed seasonal fruit",
        price: "[₱260]",
      },
    ],
  },
  {
    title: "Kitchen & Bakery",
    note: "All Day",
    items: [
      {
        name: "Brown Butter Croissant",
        description: "Laminated dough baked fresh at daybreak",
        price: "[₱140]",
      },
      {
        name: "Roasted Tomato & Burrata Melt",
        description: "Confit heirloom tomatoes, fresh burrata, basil oil on sourdough",
        price: "[₱360]",
      },
      {
        name: "Warm Quinoa & Charred Greens Bowl",
        description: "Roasted squash, pumpkin seeds, tahini-lemon dressing, microgreens",
        price: "[₱340]",
      },
      {
        name: "Cardamom Bun",
        description: "Spiced Swedish style twisted pastry with pearl sugar",
        price: "[₱150]",
      },
    ],
  },
];

export const images = {
  emblem:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuC4HBWyP7oYTW5sPdEPn0s3AUSqDwCJb5u38Eg_Hx532p1CAd7KwAY6mHh5z-g27c-LlgGUVQ_SJDCsusyxGkdwY1GrmRwnRRgjhj9i-VLpmAcJD0_frTkhF2hhrIsIOMxbZyVDgbm63Fkvc02Ga_k4d8V2CJCJFAch7KxDGEP4mYzoSyF8KRtjDSaWlDtKJXg-Y_ohXgm1ScUVkIKzf0-iHzJQoqpu1ZwY5o2PViJ99qaYImMM3_Nq",
  interior:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuADcjMTkHvte5xXqeO8lJl0fhlinqyYciqk1ppW09dgJYhOr-wMWlo49UZN3lPBFBeFvgc95ls3kfrbLJlTJvanooS_ZuUrVIVPCihbtBRrPIW--IHNKl7KSHfPu49Fox5NYSC0BXaEWbKhAORJ-KXH5B7f2oLBOikPlil4USEg3pKNJFBtKLXCQj9NsZ1pO3KV6ETWJqFHVzqcZe__Czkd6xFJBbrWBDrfHV8TXJb9u4kdXSupS1Lx",
  latte:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuBFhQQkaHgT4zt8ch_Jp9L2xk-zJuWQuflhoQ-CcdvPuKqfMlTP7mKODdfbKp9zIbRRFD-3c32bdvbQRpu6B_V8l5TJLVYlkB_nO6NzSYbbS4yhGL7tAEweJKoCUZZlzVIOMyVfnSh_KXt5ZZrat_prFq9y21DpqBeXl91tpS0HKXl_HwOFcdIQhvg2qFpt6K39tarxVbz5CqbhnbtkiUT3gWf5zVMGXYG4tRjCkiPCMInDG33X9zoZ",
  bakery:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCao1PTo9o_QHoE3yJFkixXLqqeMRS9hTHfEiAJWVhiHmYoHTCzCIm1TcA9eALoZT1hPQXsBj9FdTKEi7mQg0C2fKP7xzjl3TA3u2ljWwKPq5ccD5ADikkRtbXo4Dt-TBCn5gUhrEYVfWueNAJ_V3-N932sBgkE5KdK3LGCCKnUnXa9FHp0p2ntitisgWim0wk7HFUpJbpPKL_dveJiKkS0yYaEz3QHvcxsb2kjBQKKrPHrSmPP2O5_",
  food:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuCwd7s2tGpVXFXxvgHJ6byW1cGLmAI76WxJGkvqvR7eN6UM8vUL4B3uJgNZZ2EJHqn5BAn-KskJjqcHr2ltSks1rl5JflAtW9PTaMoPdMDMLVxLM0vwgCv-cPtdIdmAGbOkn7x6USV_Mykb4-CRctqn923kibdIMiJLouQlsp6VvPRD_FMhakKDHakfoZc4sEAvZHstppbnYQBWSQQ1IQggLlMTqcYz5Ha1oJtwh-DZJQeCFienpXaM",
  storefront:
    "https://lh3.googleusercontent.com/aida-public/AB6AXuAM2MGKhjN6GfIl4EIQCVssMQQouTUSSCWhEtmt0DwB1aiRXktM6LN1ANyBpCiimAIXHwBLBAuCcBZEi0FYKZ4Y_hIlBlFRlrTTiwypPznxi9X1WfZm6xmjFu5TJ6nyAbogXAtr_t3gOdFoZhUptktGNkiJcWGzbE7U0UER8m57ASftadEk7U_jd1FNJou2DnpTRaFn14z9rq3VJY8ckGBgbYEEW4xm34mGHuNZa8JvRLZoQ-5IlvvX",
} as const;
