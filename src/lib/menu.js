/**
 * Menu data access.
 *
 * src/data/menu.json is generated once from the restaurant's own published
 * menu page by tools/parse-legacy-menu.py, and from then on is the single
 * source of truth. Every page reads dishes, descriptions and prices from here,
 * so the homepage can never disagree with the menu page.
 *
 * Nothing in this module invents data. A dish with no price stays `null` and
 * the UI renders "Ask us" rather than a guessed number.
 */

import menu from '../data/menu.json';

export const currency = menu.currency ?? 'USD';
export const categories = menu.categories;
export const menuMeta = menu._meta;

/** Human label for a category slug, taken from the restaurant's own heading. */
const LABELS = {
  appetizers: 'Appetizers',
  breads: 'Breads & Naan',
  paneer: 'Paneer',
  vegetables: 'Vegetable Curries',
  chicken: 'Chicken Specialties',
  'lamb-goat': 'Lamb & Goat',
  seafood: 'Fish Specialties',
  tandoor: 'From the Tandoor',
  'rice-biryani': 'Rice & Biryani',
  lentils: 'Daal & Lentils',
  sides: 'Sides',
  desserts: 'Desserts',
  drinks: 'Drinks',
};

/**
 * One-line summaries written for scannability.
 *
 * These are OUR words describing the category, not the restaurant's, and they
 * make no claim about ingredients, dietary status or quality. Short labels are
 * used rather than invented marketing copy.
 */
const SUMMARIES = {
  appetizers: 'Fried and griddled starters to share.',
  breads: 'Naan, roti and paratha from the tandoor.',
  paneer: 'Indian cheese in tomato, spinach and cream gravies.',
  vegetables: 'Vegetable curries and house specialities.',
  chicken: 'Chicken curries, cooked to order.',
  'lamb-goat': 'Lamb and goat curries, including Laal Maas.',
  seafood: 'Fish and shrimp preparations.',
  tandoor: 'Skewers and tikkas cooked in the clay oven.',
  'rice-biryani': 'Biryani, pulao and steamed rice.',
  lentils: 'Daal and lentil preparations.',
  sides: 'Extras to round out a meal.',
  desserts: 'Traditional Indian sweets.',
  drinks: 'Lassi, chai and soft drinks.',
};

export function categoryLabel(slug) {
  return LABELS[slug] ?? slug;
}

export function categorySummary(slug) {
  return SUMMARIES[slug] ?? null;
}

/** Priced items only — used for honest counts in the UI. */
export function itemCount(slug) {
  const category = getCategory(slug);
  return category ? category.items.length : 0;
}

export function getCategory(slug) {
  return categories.find((category) => category.slug === slug) ?? null;
}

export function totalItems() {
  return categories.reduce((sum, category) => sum + category.items.length, 0);
}

/**
 * Find a dish by name, optionally scoped to a category.
 *
 * Some names legitimately appear in more than one category on the restaurant's
 * menu (Chilli Paneer is both an appetiser and a curry, at different prices),
 * so callers should pass a category when they mean a specific one.
 */
export function findDish(name, categorySlug) {
  const target = name.trim().toLowerCase();
  const pools = categorySlug
    ? categories.filter((category) => category.slug === categorySlug)
    : categories;

  for (const category of pools) {
    const dish = category.items.find((item) => item.name.trim().toLowerCase() === target);
    if (dish) {
      return { ...dish, category: category.slug, categoryLabel: categoryLabel(category.slug) };
    }
  }
  return null;
}

export function formatPrice(value) {
  if (value === null || value === undefined) return null;
  return `$${Number(value).toFixed(2)}`;
}

/** Stable in-page anchor for a category section. */
export function categoryHref(slug) {
  return `/menu/#${slug}`;
}

export function slugify(value) {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

/**
 * Duplicate dish names across categories, surfaced by the parser. Rendered on
 * the menu page as owner questions rather than silently resolved, because
 * deciding which price is current is the restaurant's call, not ours.
 */
export function duplicateNames() {
  return menuMeta?.stats?.namesAppearingInMultipleCategories ?? {};
}

/** Rows the parser could not interpret. Expected to be empty. */
export function parserWarnings() {
  return menuMeta?.warnings ?? { itemsWithoutPrice: [], unmatchedPriceRows: [] };
}
