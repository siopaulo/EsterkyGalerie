import { version } from "../package.json";

/**
 * Single source-of-truth verze aplikace.
 *
 * Hodnota se čte z `package.json` při buildu (ESM JSON import s povoleným
 * `resolveJsonModule`) – Next.js / Turbopack ji inlinuje jako string konstantu.
 * Záměrně se nečte z env, aby verzování fungovalo offline a aby na Netlify
 * nebylo potřeba ručně synchronizovat proměnnou s `package.json`.
 *
 * Pro bump verze použij `pnpm release:patch | :minor | :major` – po commitu a
 * pushi nasadí Netlify novou verzi automaticky.
 */
export const APP_VERSION: string = version;

/** Verze ve formátu vhodném pro UI (např. patička): `v1.1.2`. */
export const APP_VERSION_LABEL = `v${version}`;
