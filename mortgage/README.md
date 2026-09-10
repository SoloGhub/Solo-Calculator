# Solo Finance — mobile mortgage workspace

Arabic, mobile-first mortgage workspace with a burgundy, ivory and charcoal palette. Native touch-friendly inputs; no build tools, analytics, backend or client-data transmission.

The public repository contains only a launcher, generic mortgage arithmetic, and offline application assets. No internal policy transcription, bank-specific rates, qualification rules, or bank documents are published here.

## Using the full workspace

Open `mortgage/` through GitHub Pages, select the separately delivered `Solo_Finance_Banks.html` once, and use the full locally loaded workspace. Its policy file stays in this browser's IndexedDB and opens automatically on later visits. Browser storage deletion or private browsing may remove it. Client input exists only within the current iframe session and is not persisted. An explicit button removes the saved workspace.

The private workspace is shown in a sandboxed iframe without same-origin permission. The supplied self-contained file has a restrictive Content Security Policy blocking network requests. Only open a workspace file from a source you trust. Adding bank policies means replacing the local workspace file, not committing that file to the public repository.

The public quick calculator takes property value, deposit, term and annual rate. It calculates a reducing-balance principal-and-interest installment only. No bank approval, eligibility, current-rate, fee, or insurance assumptions are made.

## Deployment

GitHub Pages serves this folder. All URLs are relative, with a folder-scoped service worker and web app manifest. The existing root calculator remains independent. Home-screen installation depends on the browser.

## Validation

Run `node --test mortgage/math.test.mjs`. Syntax checks are supported by `node --check mortgage/app.mjs`. Private policy logic was separately unit tested before packaging. No physical iPhone/Android browser test has been claimed.
