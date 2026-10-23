// Permite importar archivos .md como texto (ver "rules" en wrangler.jsonc).
declare module "*.md" {
  const contenido: string;
  export default contenido;
}
