# Content workflow

`catalog.json` is the source of truth, separate from the mobile UI. It contains extensible category definitions, complete factual metadata, editorial workflow and reviewer evidence notes. The public app and push sender use the same generated approved subset in `dist/content.mjs`.

## Editing

Open `editor.html` locally and load `catalog.json`. It never connects to an AI or publishes remotely. Create a draft, add concise Hebrew wording, citations, dates, explanations, uncertainty and freshness. Open the original source and independently check the exact claim; record the supporting section in `review.evidence`. Check plain language, neutrality, accessibility and examples. Mark approved only after this review. Corrections to an approved record require a reason and retain a dated correction entry. Download the catalog and replace the source file after reviewing its diff. The file editor is deliberately NOT copied to the public Pages app.

Run `npm run content:build`, `npm test`, browser tests and `npm run prepare:pages` before publication. The gate excludes drafts/rejections and rejects missing evidence, invalid sources, duplicate IDs/text and expired approved facts. `npm run content:report` lists category coverage and facts due for review within 30 days. `npm run content:links` checks source availability without approving or editing any record. Bot protection and timeouts need manual inspection; a 200 response is not proof of the claim.

Dates may be calendar dates or full ISO timestamps with an explicit offset. Use a precise timestamp when reviewing around midnight, so a local calendar day does not become a future UTC date. Source publication dates remain distinct from the app's verification date. Time-sensitive records MUST have `nextReviewAt`; the app, saved search, review and push selector all withhold them once it passes. Re-check and approve them again, or return them to draft. The report/check scripts are runnable on a future scheduler, but no automatic factual re-verification is claimed.

## Optional future AI assistance

Topic → research → authoritative-source retrieval → claim extraction with citations → independent cross-check when appropriate → plain-language draft → source/uncertainty/neutrality/duplicate checks → reviewer approval → generated public catalog. AI candidates start as `draft`; no LLM has a direct publish path. Do not turn a link check or another model's agreement into a verification badge. No paid model/API is required for the current app.

The current 250-card pack prioritizes reviewed sources over the proposed 300–500 expansion target. Twenty topics have content; the other thirteen category definitions remain extensible but are not offered as empty interests. Add quality content in those areas before making them selectable. Medical/political/current-market claims warrant extra review. No unreviewed records from the earlier native prototype were promoted to meet a count.

Each explanation/example is editorial wording, not a reproduced source passage. Source links and names provide attribution, not a claim that third-party text has a particular license or endorses this app. No source illustrations are bundled. Import/migration scripts record this release's one-time preparation; normal editorial changes should be made in the catalog, not by re-running historical imports over edited entries.

## Scaling

Stable category and fact IDs allow adding records without UI code changes. For tens of thousands of cards, replace the current bundled array with a paginated, versioned content repository, index category/tags/freshness/status, distribute a small offline cache, and keep editorial review separate from delivery. The present personal deployment is intentionally bounded; it does not claim hundred-thousand-card mobile performance or mass push throughput.
