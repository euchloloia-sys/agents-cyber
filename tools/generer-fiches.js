/* Génère les fiches élèves modifiables (Arial 16) :
   node tools/generer-fiches.js
   cd fiches && soffice --headless --infilter="HTML (StarWriter)" --convert-to odt:writer8 *.html && rm *.html */
const fs = require("fs"), path = require("path");
global.window = {};
require(path.join(__dirname, "..", "js", "missions.js"));
const D = window.CYBER;
const A = "font-family:Arial;";
/* Bandeau de l'établissement (logo + photo en fondu), intégré dans le fichier */
const bandeau = "data:image/png;base64," + fs.readFileSync(path.join(__dirname, "..", "img", "bandeau-fiche.png")).toString("base64");
const esc = t => String(t).replace(/&/g, "&amp;").replace(/</g, "&lt;");
const P = (html, extra = "") => `<p style="${A}font-size:16pt;${extra}">${html}</p>`;
const cases = n => `<span style="${A}font-size:24pt">${Array(n).fill("☐").join(" ")}</span>`;
for (const niv of ["5", "4", "3"]) {
  const nom = D.niveaux[niv].nom;
  let h = `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><title>Ma fiche d'agent ${nom}</title></head><body>`;
  h += `<p><img src="${bandeau}" alt="EREA Ignace Pleyel — Technologie, M. Loquet" style="width:17cm;height:2.83cm"></p>`;
  h += `<h1 style="${A}font-size:20pt">Agents Cyber — Ma fiche d'agent (${nom})</h1>`;
  h += P("Prénom(s) : ______________________________");
  h += P("Classe et date : _________________________");
  h += P(`<b>Mon numéro d'agent :</b> ${cases(4)}`);
  h += P("<i>Pendant chaque mission, complète les phrases. À la fin de la mission, recopie ton code dans les cases.</i>");
  D.missions.forEach((m, i) => {
    h += `<h2 style="${A}font-size:17pt">Mission ${i + 1} — ${esc(m.titre)}      ☐ réussie</h2>`;
    m.fiche.filter(it => !it.niv || it.niv.includes(niv)).forEach(it => {
      if (it.coche) {
        h += P(esc(it.coche));
        h += P(it.options.map(o => "☐ " + esc(o)).join("<br>"));
      } else {
        h += P(esc(it.t).replace(/\[[^\]]*\]/g, "______________"));
      }
    });
    h += m.id === "m4" ? P("<b>Code (le mot déchiffré) :</b> ____________________")
                       : P(`<b>Code obtenu :</b> ${cases(4)}`);
  });
  h += `<h2 style="${A}font-size:17pt">Le coffre-fort</h2>`;
  h += P("Coffre ouvert : ☐ oui     ☐ pas encore");
  h += P("Pour moi, ce jeu était : ☐ facile     ☐ moyen     ☐ difficile");
  h += P("Ce que j'ai appris de plus important :<br>__________________________________________<br>__________________________________________");
  h += "</body></html>";
  fs.writeFileSync(path.join(__dirname, "..", "fiches", `fiche-eleve-${nom}.html`), h);
}
console.log("ok");
