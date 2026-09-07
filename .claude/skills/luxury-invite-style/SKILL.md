---
name: luxury-invite-style
description: How to build (or extend) a wedding-invitation look at the "night wedding photo, metallic gold Hebrew title, icon-row details" reference quality level used across kala-invites/VIVA - both the coded template gallery and the AI Designer's generated-image prompt. Use whenever asked to add/tweak an invitation template's visual design, add a new template, or steer what the AI Designer generates.
---

# Luxury invite style (kala-invites / VIVA)

The client showed a ChatGPT/DALL-E-made wedding invitation as the quality bar: a
dark night photo of a floral aisle, interlocking gold rings under a heart,
a bold **metallic gold Hebrew title**, an italic "מתחתנים" line, then
**stacked detail rows** - a small line icon + short text, separated by thin
gold dividers (📅 date / 📍 venue / 💍 חופה time). This skill is how to
reproduce that level of finish inside this codebase, on either of the two
places that actually render an invitation's design.

## Which of the two design paths applies

This app draws an invitation two different ways - figure out which one the
request is actually about before touching code:

1. **Coded template gallery** (`src/lib/templates.tsx` + `src/app/globals.css`)
   - a fixed set of hand-built CSS looks the user picks from (`/create/templates`),
   each one laid text over an optional user-uploaded photo. This is where you
   add a new *template*.
2. **AI Designer** (`src/app/api/ai-designer/chat/route.ts` +
   `src/app/api/ai-invite/route.ts`) - a conversational flow that hands
   Gemini/Imagen an English prompt and gets back one fully-designed image,
   Hebrew text baked in by the model itself. This is where you steer what
   the *model* draws, via `CATEGORY_STYLE_GUIDE["חתונה"]` in that file's
   `buildSystemInstruction`.

A worked example of path 1 already exists: template id **`gold-night`**
(search `tpl-gold-night` / `tpl-gn-` in both files) is this exact reference
look, built to full production quality - copy its shape for the next one
rather than starting from scratch.

## Coded template checklist (path 1)

A new template id must be added in **all six** of these places in
`templates.tsx`, or it silently falls back to `cream-script` defaults for
whichever piece was missed:

1. `TEMPLATES` - id, Hebrew `label`, gallery-thumbnail `swatch` gradient, `photoStyle`, `categories`.
2. `TEMPLATE_CTA_COLORS` - bg/color for the RSVP pull-tab bar *outside* the card, picked to contrast against this template's own background.
3. `CARD_CLASS` - maps the id to its root CSS class (`tpl-<name>`).
4. `LATIN_TITLE_FONT` - font for a non-Hebrew (Latin) couple's name.
5. `HEBREW_TITLE_FONT` - font for a Hebrew name (the common case - don't skip this one).
6. `renderContent()`'s `switch` - the actual JSX/markup for the template.

Then the matching CSS block goes in `globals.css`, following the existing
`/* --- <name> --- */` section convention (search for `.tpl-dg-` or
`.tpl-go-` for two similar dark/gold examples to pattern-match against).

## Reusable visual recipes

**Metallic gold title text** - a flat gold color reads flat; a gradient
clipped to the glyphs reads metallic, and is the single biggest lever for
the reference's "shiny gold lettering":
```css
.tpl-gn-title {
  background: linear-gradient(180deg, #f8e7ad 0%, #d9b969 55%, #b8933f 100%);
  -webkit-background-clip: text; background-clip: text; color: transparent;
  filter: drop-shadow(0 2px 3px rgba(0,0,0,0.5)); /* keeps it legible over a busy photo */
}
```

**Hebrew "elegant script" gotcha** - `globals.css`'s `@import` loads Dancing
Script, Petit Formal Script, Italiana, Cormorant Garamond, Playfair Display:
all Latin-only, all **silently fall back to the plain system font on Hebrew
text** (no real Hebrew cursive/handwriting webfont is loaded anywhere in
this app). For a Hebrew subtitle like "מתחתנים", don't reach for one of
those - use `'Frank Ruhl Libre', serif` (the one real Hebrew serif already
loaded) with `font-style: italic` and a lighter weight (500) for the same
"softer, written" feeling without a broken fallback. Frank Ruhl Libre at
weight 900 is also the go-to for the bold Hebrew title itself (see
`HEBREW_TITLE_FONT` in `templates.tsx` - nearly every serif template uses it).

**Icon + divider detail rows** - `PinIcon`/`ClockIcon`/`CalendarIcon`
(and now `RingsIcon`, added for `gold-night`'s חופה row) in `templates.tsx`
are small real-vector SVGs (`stroke="currentColor"`), not emoji - emoji
render inconsistently across platforms. They already carry class
`tpl-balloons-icon` (`color: #c9a24b` in `globals.css`) for a gold tint that
suits most dark/luxury templates as-is; reuse them directly rather than
building new icons unless the row needs something these four don't cover.
Build rows as `{icon, text}` pairs filtered to only the fields the user
actually filled in (`gold-night`'s `detailRows` array in `renderContent` is
the pattern - skips a row instead of rendering an empty one with a
dangling divider), then interleave a `.tpl-*-divider` between them:
```css
.tpl-gn-divider { height: 1px; background: linear-gradient(90deg, transparent, rgba(217,185,105,0.75), transparent); }
```

**Full-bleed photo background + dark scrim** - `photoStyle: "background"`
renders via the shared `.tpl-layout-bg` / `.tpl-photo-bg` / `.tpl-bg-overlay`
/ `.tpl-bg-content` classes. `.tpl-bg-overlay` itself is a plain **light**
wash (`rgba(255,255,255,0.68)`) tuned for bright pastel photos like
botanical-green's - a dark night photo needs its own scrim instead, scoped
under the template's root class so it only overrides for that one template:
```css
.tpl-gold-night .tpl-bg-overlay {
  background: linear-gradient(180deg, rgba(8,8,10,0.6) 0%, rgba(8,8,10,0.22) 32%, rgba(8,8,10,0.32) 68%, rgba(8,8,10,0.78) 100%);
}
```
Darker at top and bottom, lighter through the middle, keeps the title and
footer readable without flattening the photo the user chose.

## Steering the AI Designer instead (path 2)

If the ask is "make the AI-generated image look like this" rather than "add
a template", the lever is `CATEGORY_STYLE_GUIDE["חתונה"]` in
`ai-designer/chat/route.ts` - the professional-convention paragraph the
model is grounded on before the user's own answers narrow it further.
Describing this same reference (night/dusk photo backgrounds, interlocking
gold rings motif, metallic gold Hebrew typography, small-icon detail rows
with thin gold dividers) there makes it an available default the model can
offer through the conversational flow, the same way it already offers
"הינומה מתנופפת, ים/שקיעה, פרחים לבנים, טקסטורת שיש". Keep any addition
short and in the same register as the existing entries - it's one sentence
per category, not a full brief.
