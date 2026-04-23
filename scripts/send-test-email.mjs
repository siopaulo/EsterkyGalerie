// Jednorázový script pro ověření, že Resend API key funguje.
// Spuštění:
//   pnpm email:test
//   pnpm email:test muj@email.cz           # pošli na konkrétní adresu
//
// Node >= 20.6 načte .env.local automaticky díky --env-file flagu v package.json.
//
// POZOR: adresa ve `from` musí být buď:
//   - onboarding@resend.dev (jen na adresu registrovanou u Resend),
//   - nebo na doméně ověřené v Resend (Domains → Add domain + DNS záznamy).

import { Resend } from "resend";

const apiKey = process.env.RESEND_API_KEY;
if (!apiKey) {
  console.error("✖  RESEND_API_KEY není nastaven. Zkontroluj .env.local.");
  process.exit(1);
}

const from = process.env.RESEND_FROM || "onboarding@resend.dev";
const to = process.argv[2] || process.env.CONTACT_DELIVERY_EMAIL || "esterka.koznarova@seznam.cz";

const resend = new Resend(apiKey);

console.log(`→ Odesílám test e-mail:`);
console.log(`   from: ${from}`);
console.log(`   to:   ${to}`);

const { data, error } = await resend.emails.send({
  from,
  to,
  subject: "Hello World z Esterky Fotky",
  html: `
    <div style="font-family:Georgia,serif;max-width:520px;margin:0 auto;color:#2a2520;">
      <h2 style="border-bottom:1px solid #eee;padding-bottom:8px;">Gratulujeme!</h2>
      <p>Právě jsi odeslala svůj <strong>první e-mail</strong> přes Resend.</p>
      <p>API key funguje, integrace s webem je připravená.</p>
      <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
      <p style="font-size:12px;color:#888;">
        Testovací zpráva ze scriptu <code>scripts/send-test-email.mjs</code>.
      </p>
    </div>
  `,
  text: "Gratulujeme – první e-mail přes Resend byl odeslán. API key funguje.",
});

if (error) {
  console.error("✖  Resend vrátil chybu:");
  console.error(error);
  process.exit(1);
}

console.log("✓  Odesláno.");
console.log(data);
