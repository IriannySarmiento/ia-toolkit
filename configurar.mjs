#!/usr/bin/env node
// Pone la letra del equipo en todos los lugares donde hace falta. Uso: node configurar.mjs a
import { readFileSync, writeFileSync } from "node:fs";

const letra = (process.argv[2] ?? "").trim().toLowerCase();
if (!/^[a-z]$/.test(letra)) {
  console.error("Uso: node configurar.mjs <letra>   (la letra del equipo: a, b, c, d; p para la demo del profesor)");
  process.exit(1);
}

const cambios = [];
function reemplazar(ruta, pares) {
  let s = readFileSync(ruta, "utf8");
  for (const [re, nuevo] of pares) s = s.replace(re, nuevo);
  writeFileSync(ruta, s);
  cambios.push(ruta);
}

reemplazar("backend/wrangler.jsonc", [
  [/"name": "agente-ene-[a-z-]+"/, `"name": "agente-ene-${letra}"`],
  [/"NOMBRE_EQUIPO": "[^"]*"/, `"NOMBRE_EQUIPO": "Equipo ${letra.toUpperCase()}"`],
]);
reemplazar("frontend/lib/marca.ts", [[/equipo: "[^"]*"/, `equipo: "Equipo ${letra.toUpperCase()}"`]]);

const equipo = JSON.parse(readFileSync("equipo.json", "utf8"));
equipo.equipo = letra;
writeFileSync("equipo.json", JSON.stringify(equipo, null, 2) + "\n");
cambios.push("equipo.json");

console.log(`Equipo ${letra.toUpperCase()} configurado. Archivos cambiados:\n - ${cambios.join("\n - ")}`);
console.log(`\nEl Worker se llamará agente-ene-${letra} y el proyecto de Vercel agente-ene-${letra}.`);
