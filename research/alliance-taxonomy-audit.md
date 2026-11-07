# Alliance and tag audit · 2026-11-07

The refactor reduces 227 active definitions to 174 and changes membership for 255 characters. The [machine-readable audit](alliance-taxonomy-audit.json) lists every old ID, replacement ID, and affected character. Counts below are sourced roster assignments before the game excludes presiding officers and other ineligible cards.

| Generic profession | Roster assignments |
| --- | ---: |
| `legal` · Law and justice | 75 |
| `local_administration` · Local executive administration | 8 |
| `business_management` · Business and management | 27 |
| `finance_economics` · Economics and finance | 25 |
| `education` · Education | 7 |
| `healthcare` · Clinical and health professions | 6 |
| `public_safety` · Public safety and military service | 5 |
| `stem` · Science and engineering | 13 |
| `agriculture` · Agricultural professions | 5 |
| `social_science` · Social sciences | 20 |
| `public_administration` · Public administration | 6 |

| Old labels | New alliance |
| --- | --- |
| Diplomatic Negotiations | Foreign Policy |
| Justice, Law, Lawyer, Qualified lawyer, Lawyer, tax-law specialist, Business lawyer, Judge, Law graduate, Qualified Lawyer and Attorney, Bachelor of Laws (LLB), Law studies (first state examination, LLM) | Law and justice |
| Budgetary Policy | Budget |
| Business administration graduate, Management Consultant, Organisational Consultant, Industrial Business Administrator, Business Administrator | Business and management |
| Healthcare | Health |
| Parliamentary Group Management | Parliamentary Organisation |
| Journalist; theology and political science, Sociology graduate, Political Scientist, Master’s Degree in Political Science, Political scientist (Diplom), Political Science / community renewable energy, Social and Cultural Anthropology / Political Science (BA), Political scientist (PhD on UN reform), Political Science and Public Administration (MA); former radio journalist, Studies in Political Science, Political Science, Romance Studies and Education (MA), Political scientist (PhD) | Social sciences |
| Economics graduate, Bank Clerk, Economist (Diplom) | Economics and finance |
| Lawyer and former mayor | Law and justice + Local executive administration |
| Bank clerk, political scientist | Economics and finance + Social sciences |
| Secondary-school teacher of maths and politics, Teacher, Education Professional, Secondary School Teacher and Foreign Trade Clerk | Education |
| Criminal Police Officer, Police Officer, Historian, Soldier | Public safety and military service |
| Research Administrator, Historian, Psychologist, Political and Administrative Sciences, Eastern Germany, Social worker (Diplom), Veterinarian (Dr med vet), Former self-employed consultant; university studies without degree, Queer Policy | Source metadata only |
| Physician, Physician specialising in trauma surgery and emergency medicine, Radiologist, Medical doctor (final state medical examination) | Clinical and health professions |
| Geoscientist and Public Administration Specialist | Science and engineering + Public administration |
| Public Administration Graduate and Former Mayor | Local executive administration + Public administration |
| Finance business administrator (IWW) | Business and management + Economics and finance |
| Studies in Political Science and Public Law | Law and justice + Social sciences |
| Biologist (PhD), Environmental scientist (PhD on energy efficiency) | Science and engineering |
| Police officer / Criminology (MA, doctorate in law) | Law and justice + Public safety and military service |

The legacy `legal` ID survives as Law and justice. Its membership now includes explicit legal qualifications and the sourced Law and Justice duty tags. The original Legislative Workshop milestones and action credits remain valid. The separate `local` liaison network includes agriculture, petitions, and other documented links, so those memberships stay with `local`. The new `local_administration` requires explicit municipal executive service. Public administration training is a separate profession.

The generator keeps raw CSV qualifications and policy topics with their original IDs, labels and evidence. It also uses explicit profession lines already present in the sourced roster assessment. A title, broad portfolio, ordinary local mandate or place of birth is insufficient for professional membership. The review did not independently reverify the supplied snapshots.

The institutional routes retain all 71 scoped working groups, 16 represented-state routes and 7 party social groups. Existing office and committee data, the 23 earlier Union groups, regional networks and named hidden combinations remain distinct. The 39 exact legacy-to-current organizational matches use the current route first. A genuine legacy member missing from the current route can still receive their share of the fallback. Other policy topics stay separate where the subjects differ, such as climate protection and environmental regulation.

New professional thresholds are two and three members. A single identity contributes once per route, even with several qualifying sources. The effective sum of generic profession and policy bonuses is capped at +0.32 power per action. The CPU evaluates the same capped action and economy effects. Passive generic routes carry no layers and cannot enlarge alliance-count cash or trigger hidden-route rewards. The base hidden tiers, official-group rewards and named combinations retain their existing definitions.

Browser saves are normalized on resume. The migration preserves legal layers, cash, points, and historical settlements and clears obsolete passive layers when no round is in progress. A pending tactical round uses its frozen membership snapshot. The export remains schema 9 with a new rules version and adds original qualification metadata. The downloaded JSON report format is distinct from the browser resume format.

Remaining gaps include nine CSV identities absent from the roster, thin membership in agriculture and public safety, and asymmetrical source coverage across parties. Journalism has only one deployable sourced member, so it stays as a biographical fact. Unclear profile lines and metadata-only labels are listed in the audit for follow-up. The existing `backgrounds.json` entries still supply their separate issue expertise and do not silently create an organizational membership.

| Area | Modified files |
| --- | --- |
| Import and provenance | `tools/import_alliance_tags.py`, `tools/alliance_taxonomy.py`, `data/alliance-definitions.json`, `data/alliance-tags.json`, generated import and taxonomy audits |
| Activation, shared AI valuation and settlement | `alliances.js`, `simulation.js`, `combination-groups.js`, `personal-links.js`, `news-effects.js`, `hidden-relations.js` |
| UI, biographies and saves | `deployment-preview.js`, `deployment-view.js`, `card-facts.js`, `profiles.js`, `save-migration.js`, `app.js`, `web/style.css` |
| Verification and delivery | `alliance-taxonomy.test.mjs`, `imported-alliances.test.mjs`, `experience.test.mjs`, rebuilt `index.html` |

`build.py` regenerated the standalone HTML. All 234 automated tests passed, and Chrome checks passed for desktop and mobile deployment, three languages, and tactical pause/resume. A second import produced identical hashes for the definitions, tags, roster and machine-readable audit. Legacy-ledger and pending-round fixtures covered migration. No original player save was available for replay.
