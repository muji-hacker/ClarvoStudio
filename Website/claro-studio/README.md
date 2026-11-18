# Claro Studio

A single-page marketing site for Claro Studio. It is plain HTML, CSS, and JavaScript. Open `index.html` in a browser, or use VS Code Live Server. There is no build step and no framework.

## Files

```
claro-studio/
├── index.html
├── css/style.css
├── js/script.js
├── assets/
│   ├── logo.svg          ← supplied vector, used on the page
│   ├── logo.png          ← supplied transparent PNG (white wordmark)
│   ├── logo-white.png    ← same transparent PNG
│   ├── favicon.png       ← supplied wordmark centered on navy
│   └── images/           ← sample project art, safe to replace
└── README.md
```

The wordmark is white. It sits on navy in the header, footer, and about panel. Do not recolor, stretch, or redraw it. The page uses `assets/logo.svg` so the mark stays sharp. `logo.png` and `logo-white.png` are the supplied transparent PNG of the same artwork.

## Still needs real business details

Phone, street address, WhatsApp, and social profile URLs are not on the page. They were not supplied, so they were removed instead of shown as stand-in details. The contact email is `clarvostudio@gmail.com`, and the form opens the visitor’s email app addressed there.

Photographs are stock images of the kind of work each service describes. They are not client case studies. Do not add testimonials, client names, or performance figures until they are real and you have permission to publish them.

Service pages live in `service.html`. Each Learn more button opens one service with the hash, for example `service.html#branding`.

Colors live in `:root` inside `css/style.css`.

## Contact form

The form checks name, email, phone, service, and message in the browser.

With `data-endpoint=""` (the default), a valid form opens the visitor’s email app with the message filled in. **Nothing is delivered until they send that email.** The page says so.

To submit in the background, set `data-endpoint` on the form to a service that accepts `FormData` and returns a non-2xx status on failure (Formspree works this way). Only a successful response is described as sent. From a `file://` page, that request can be blocked; use Live Server or a hosted URL when you test the endpoint.

A draft of the form is saved in `localStorage` on this browser (`claro-contact-draft`) and restored on the next visit. It is cleared after a successful endpoint submission.

## Saved preferences

| Key | What it stores |
| --- | --- |
| `claro-motion` | `reduce` or `allow`, from the footer control |
| `claro-portfolio-filter` | Last portfolio filter |
| `claro-slider-paused` | Whether the testimonial autoplay is paused |
| `claro-contact-draft` | Unsent form draft |

The testimonial slider also follows the system reduced-motion setting. Autoplay stays off when motion is reduced.

## Browser check

Layout is intended for 360px, 768px, 1024px, and 1440px. The navigation collapses into a menu below 900px.
