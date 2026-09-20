# Nathan Fischer Photography — Site Guide

Sports + wildlife photography site with rates and a booking inquiry form.

---

## Adding Photos — the whole workflow

**This is the only thing you need to know for day-to-day use.**

1. Drop your JPGs into the right folder in Finder:
   - `photography/photos/sports/football/`
   - `photography/photos/sports/cross-country/`
   - `photography/photos/wildlife/`
2. Run one command from the repo root:
   ```bash
   python3 photography/scripts/sync_photos.py
   ```
3. Commit and push:
   ```bash
   git add photography/photos photography/photos-web photography/data/galleries.json
   git commit -m "Add photos"
   git push
   ```

That's it. The sync script finds every photo in those folders, generates a
compressed web-sized copy and a thumbnail for each one, and rewrites
`photography/data/galleries.json` — the site reads that file and displays
the photos automatically. **You never touch HTML, CSS, or JS to add a
photo.**

Your original full-resolution files are never modified, renamed, or
deleted — the script only reads them and writes optimized copies into
`photography/photos-web/`.

---

## Creating a New Sports Category (e.g. Basketball)

1. Create a folder: `photography/photos/sports/basketball/`
2. Drop photos into it.
3. Run `python3 photography/scripts/sync_photos.py`.

The Sports page automatically grows a new "Basketball" filter tab — no
code changes. (Common sports — football, basketball, cross country,
track, baseball, soccer, wrestling, volleyball, lacrosse, tennis, golf —
get a sensible display order automatically; anything else just appears
after them.)

---

## Optional: Featuring, Captions, Ordering, Hiding a Photo

Normal photos need **zero** metadata — they just show up. If you want to
fine-tune something, create (or edit) a `meta.json` file in that same
folder, keyed by filename:

```json
{
  "DSC06862.jpg": { "featured": true, "order": 1, "caption": "Friday night lights" },
  "DSC06900.jpg": { "hidden": true }
}
```

- `featured` — shows this photo first and makes it eligible for the
  homepage hero / featured sections. The football hero photo works this
  way (see `photography/photos/sports/football/meta.json`).
- `order` — a number; lower shows first. Photos without `order` keep
  their normal (filename) order, after any explicitly ordered ones.
- `caption` — overrides the auto-generated title (used as the lightbox
  caption and image `alt` text).
- `hidden` — set `true` to pull a photo out of the site without deleting
  the file.

Run the sync script again after editing `meta.json`.

### Changing the homepage hero photo

By default the hero is the first `featured: true` photo found (football
is checked first). To force a specific photo, add a `meta.json` directly
in `photography/photos/`:

```json
{ "hero": "sports/football/DSC06862.jpg" }
```

---

## Changing Prices or Package Details

Open `photography/pages/rates.html` and edit the text directly — each
package is a `.rate-card` block with a price and a bulleted list. No
other file needs to change. The "Book This Package" buttons link to
`book.html?package=<slug>`; if you rename a package, keep the `slug` in
that link matching the option value in `photography/pages/book.html`'s
`PACKAGE_LABELS` script block, or the pre-selection won't match.

---

## File Structure

```
photography/
├── index.html                  ← Home page
├── pages/
│   ├── sports.html             ← Sports gallery (all categories, filterable)
│   ├── wildlife.html           ← Wildlife portfolio gallery
│   ├── rates.html              ← Packages + booking policy
│   └── book.html               ← Booking inquiry form
├── css/style.css               ← All styles (theme vars at the top)
├── js/core.js                  ← Nav, lightbox, lazy load, galleries
├── data/galleries.json         ← Auto-generated — don't hand-edit
├── photos/                     ← Your full-quality ORIGINALS (drop files here)
│   ├── sports/
│   │   ├── football/
│   │   │   └── meta.json       ← optional: featured/caption/order/hidden
│   │   └── cross-country/
│   └── wildlife/
├── photos-web/                 ← Auto-generated optimized copies (served to visitors)
└── scripts/
    ├── sync_photos.py          ← Run this after adding photos
    └── copy_photos.sh          ← Optional CLI helper (Finder drag-and-drop works fine too)
```

---

## The Booking Form

`pages/book.html` submits to Formspree (the same form already wired up
on this site: `https://formspree.io/f/mojzozal`), so it works on GitHub
Pages with no backend and no exposed secrets. Submitting only sends an
inquiry — the page explicitly tells the visitor it is not a confirmed
booking.

Every submission includes a `form_type: Booking Inquiry` field so it's
easy to tell apart from anything else that hits the same inbox. If you'd
rather booking inquiries land in a separate Formspree form (own limits,
own inbox rules), create a second form at formspree.io and swap the
`action` URL in `book.html`.

**Formspree free tier is capped at 50 submissions/month** — keep an eye
on that once the site is getting real traffic.

Package pre-selection: linking to `book.html?package=individual` (or
`multi`, `full-team`, `full-team-plus`) pre-selects that package in the
form — this is how the "Book This Package" buttons on the Rates page
work.

---

## Performance

- Every photo gets two web-optimized derivatives (a ~2000px "full" for
  the lightbox, a ~900px thumbnail for grids), both compressed
  progressive JPEGs — originals are untouched.
- Images lazy-load as you scroll (`IntersectionObserver`), and each
  photo card reserves its real aspect ratio so nothing jumps around
  while loading.
- No build step, no framework, no dependencies — plain HTML/CSS/JS, so
  there's nothing to compile and nothing to break.

---

## Customizing the Theme

Colors, fonts, and spacing are in `css/style.css` under `:root {}`:

```css
:root {
  --amber:    #E8A020;   ← Accent color
  --black:    #0A0A0A;   ← Page background
  --surface:  #111113;   ← Card backgrounds
  --white:    #F0EDE8;   ← Main text color
}
```

---

## Deploying

This repo is already a GitHub Pages user site
(`freezingfirez.github.io`). Push to `main` and it's live in about a
minute:

```bash
git add -A
git commit -m "Update site"
git push
```
