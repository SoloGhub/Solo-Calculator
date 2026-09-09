# RAMY mobile console — implementation record

## Source boundary

The supplied V11 Foundation ZIP contains five files: START_HERE.html, Client_Master_Template.html, Sample_Client_Record.html, DESIGN_BLUEPRINT.html and README_AR_EN.html. START_HERE and Client_Master_Template are byte-identical. The sample differs only in its embedded JSON record. The attached conversation text is the V12 delivery summary, not a full transcript and not the V12 application source. V12 source, its original audit files and RAMY_Logo_Header.svg have not been supplied. Do not label this implementation as a recovered V12. The supplied R-monogram JPEG is available as a design asset.

## Scope

1. Preserve the V11 data schema and independently test gold unit conversions, solving any two of spot/all-in/premium, weighted averages and portfolio aggregation.
2. Replace the long single-page interaction with focused client, gold, portfolio, result and report screens. Keep Advisor, Meeting, Client and Internal modes.
3. Add a collapsible tools drawer, accessible controls, explicit client context, entry validation, draft recovery and confirmed destructive actions.
4. Main theme: Elite Beige. Secondary theme: light Executive Blue. English UI follows the latest recorded interface-language decision. User-entered Arabic must display correctly. Use RAMY branding, not the V11 SOLO identity.
5. Preserve HTML/JSON import, editable master export, client/internal report snapshots and PDF print routes; add honest local-save status and a record selector. Client report output must not contain internal data in visible or hidden content.
6. Add a manifest and versioned offline shell. Do not cache customer data with the service worker. Do not add tracking, remote customer storage, market APIs, secrets or production hosting without configuration.
7. Test using browser engines and responsive viewports available in the environment. Clearly separate emulation from physical iPhone/Android acceptance.

## Initial code-review findings (not inherited V12 claims)

- Empty numeric strings are converted to zero by Number(''), affecting current prices, current values and premium solving.
- A new client ID is generated before attempting persistence recovery; the stored last-record key is never used on startup.
- Storage write failures are swallowed while the UI still reports success; localStorage fallback is not read.
- Holding and batch tables have delete but no edit actions. Individual deletes do not request confirmation.
- Data-entry drafts are not collected into persistent state.
- Gold market cost/premium appear in the client-facing interactive gold table.
- Table layouts have a 920px minimum width; mobile inputs and actions create a very long page.
- Logo upload is stored but not used in the report header.
- Theme controls are absent and report output is hard-coded dark/grey.
- Export IDs in the report header do not match the export log.
- EUR/GBP conversion defaults are silently assumed and cannot be edited in the UI.
- Matured holdings are omitted from dashboard aggregation but included in report holding rows.
- The target client amount field is stored but has no calculation effect.

## GitHub isolation

All work is confined to ramy-console/ on branch ramy/mobile-console-v13. The existing root finance calculator and main branch are not replaced. No real client records are to be committed.

## Release status

Implementation and verification in progress. Historical V12 PASS counts are not evidence for this release. Physical-device acceptance, authenticated production hosting and server-side access control remain separate release gates.
