// Lightweight content needed on every page (header, footer, home, order dialog).
// Kept separate from data.js so the large cake/menu catalogues stay out of the
// initial bundle and only load with the pages that use them.
import layout from '../data/layout.json';
import home from '../data/home.json';
import pages from '../data/pages.json';

export { layout, home, pages };
export const cakeNav = layout.cakeNav;
export const outlets = pages.stores.outlets;
