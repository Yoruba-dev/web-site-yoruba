// Loads the original template stylesheets verbatim from /public/assets/css,
// in the exact order index.html used. React 19 hoists these <link> tags to
// <head>; `precedence` guarantees vendor CSS loads before the main style.css
// so the cascade matches the original site pixel-for-pixel.

const VENDOR_CSS = [
  "bootstrap.min.css",
  "font-awesome.min.css",
  "fontawesome-stars.css",
  "ionicons.min.css",
  "slick.min.css",
  "animate.min.css",
  "jquery-ui.min.css",
  "nice-select.min.css",
  "timecircles.min.css",
];

export default function Stylesheets() {
  return (
    <>
      {VENDOR_CSS.map((file) => (
        <link
          key={file}
          rel="stylesheet"
          href={`/assets/css/${file}`}
          precedence="lib"
        />
      ))}
      <link rel="stylesheet" href="/assets/css/style.css" precedence="app" />
    </>
  );
}
