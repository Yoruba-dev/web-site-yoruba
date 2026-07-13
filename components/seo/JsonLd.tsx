// Renders a schema.org JSON-LD <script> tag safely, without raw-HTML injection.
// Every HTML-special character (& < >) is converted to its JSON \uXXXX escape,
// so the string contains no characters React would entity-escape and no way to
// break out of the <script> tag — JSON parsers decode the escapes back
// transparently. Safe even when values come from the Shopify catalogue.
export default function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data)
    .replace(/&/g, "\\u0026")
    .replace(/</g, "\\u003c")
    .replace(/>/g, "\\u003e");
  return <script type="application/ld+json">{json}</script>;
}
