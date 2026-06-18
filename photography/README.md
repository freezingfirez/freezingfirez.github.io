# Nathan Fischer Photography — Site Guide

Everything you need to add photos, create galleries, and deploy to GitHub Pages.

---

## File Structure

```
nathan-photography/
├── index.html                    ← Home page
├── pages/
│   ├── portfolio.html            ← Portfolio (Automotive / Astronomy / Real Estate)
│   ├── car-meets.html            ← Car meet gallery index + detail view
│   ├── about.html                ← About page
│   ├── contact.html              ← Contact form
│   └── clients.html              ← Private client galleries
├── css/
│   └── style.css                 ← All styles (edit theme vars at the top)
├── js/
│   └── core.js                   ← Lightbox, lazy load, filters, nav
├── data/
│   └── galleries.json            ← ★ THE ONLY FILE YOU EDIT TO ADD PHOTOS ★
└── images/
    ├── automotive/               ← Your automotive portfolio shots
    ├── astronomy/                ← Your astronomy portfolio shots
    ├── real-estate/              ← Your real estate portfolio shots
    ├── car-meets/
    │   ├── meet-001/             ← One folder per meet
    │   │   ├── cover.jpg
    │   │   ├── 01.jpg
    │   │   └── ...
    │   └── meet-002/
    └── clients/
        └── smith-wedding/        ← One folder per client
            ├── cover.jpg
            └── 01.jpg
```

---

## Adding Photos to the Portfolio

1. Drop your photos into the right folder:
   - Automotive → `images/automotive/`
   - Astronomy → `images/astronomy/`
   - Real Estate → `images/real-estate/`

2. Open `data/galleries.json` and add an entry to the right array:

```json
{
  "id": "auto-007",
  "title": "Blue Ridge Roll",
  "description": "Rolling shot on Highway 11 at golden hour.",
  "file": "images/automotive/blue-ridge-roll.jpg",
  "thumb": "images/automotive/blue-ridge-roll.jpg",
  "tags": ["automotive", "rolling", "golden-hour"],
  "camera": "Nikon D7100",
  "settings": "f/8 · 1/500s · ISO 100",
  "date": "2024-05-20"
}
```

That's it. The photo will appear in the portfolio with the filter, lightbox, and download button automatically.

**Tip:** Use the same file for `file` and `thumb` unless you make a separate lower-res thumbnail version.

---

## Adding a New Car Meet Gallery

1. Create a folder: `images/car-meets/meet-004/`
2. Add a `cover.jpg` and numbered photos: `01.jpg`, `02.jpg`, etc.
3. Add to `data/galleries.json` under `"carMeets"`:

```json
{
  "id": "meet-004",
  "name": "Greenville Cars & Coffee",
  "date": "May 2024",
  "location": "Greenville, SC",
  "description": "May sunrise meet — heavy turnout of European iron.",
  "coverImage": "images/car-meets/meet-004/cover.jpg",
  "tag": "Monthly",
  "photos": [
    {
      "id": "m4-001",
      "title": "Morning Fog",
      "file": "images/car-meets/meet-004/01.jpg",
      "settings": "f/4 · 1/400s · ISO 200"
    },
    {
      "id": "m4-002",
      "title": "Detail",
      "file": "images/car-meets/meet-004/02.jpg",
      "settings": "f/5.6 · 1/800s · ISO 100"
    }
  ]
}
```

Available `tag` values (used for filtering): `Monthly`, `Import`, `Classic`
Add your own — just add a matching filter button in `car-meets.html`.

---

## Adding a Client Gallery

Client galleries are password-protected. The password system is frontend-only (stored in JSON) — fine for early work, but don't use for highly sensitive images.

1. Create a folder: `images/clients/your-client-name/`
2. Add their photos as `01.jpg`, `02.jpg`, etc.
3. Add to `data/galleries.json` under `"clients"`:

```json
{
  "id": "client-jones-car",
  "name": "Jones – Mustang GT",
  "password": "jones2024",
  "coverImage": "images/clients/jones-car/cover.jpg",
  "description": "Private gallery — Jones family Mustang shoot.",
  "expires": null,
  "photos": [
    {
      "id": "jc-001",
      "title": "Front Three-Quarter",
      "file": "images/clients/jones-car/01.jpg"
    },
    {
      "id": "jc-002",
      "title": "Detail",
      "file": "images/clients/jones-car/02.jpg"
    }
  ]
}
```

Give the client their password verbally or via DM — never in email if you can help it.

**To change a password:** Edit the `"password"` value in `galleries.json` and push.

---

## Setting Up the Contact Form

The form uses [Formspree](https://formspree.io) (free tier: 50 submissions/month).

1. Go to https://formspree.io and sign up with your email
2. Create a new form — you'll get an endpoint like `https://formspree.io/f/abcdefgh`
3. In `pages/contact.html`, find this line:
   ```html
   <form id="contact-form" action="https://formspree.io/f/YOUR_FORM_ID" method="POST">
   ```
4. Replace `YOUR_FORM_ID` with your actual form ID

Submissions will go to your email automatically.

---

## Replacing Placeholder Images

The site uses Unsplash placeholder images right now. Replace them by:

1. Adding your real photos to the `images/` folders
2. Updating the paths in `data/galleries.json`

For the hero image, find this line in `index.html`:
```html
<img class="hero-image" src="https://images.unsplash.com/..." alt="Hero">
```
Replace the `src` with your own best shot.

For the about page portrait, find in `pages/about.html`:
```html
<img class="about-img" src="https://images.unsplash.com/..." alt="Nathan Fischer">
```

---

## Customizing Your Info

- **Email**: Search for `nathan@nathanfischer.photography` in `pages/contact.html` and replace
- **Instagram/social links**: Find the `<a href="https://instagram.com"` links in `contact.html` and `about.html`
- **Gear list**: Edit the `.gear-item` blocks in `pages/about.html`
- **Bio text**: The `<div class="about-body">` section in `pages/about.html`

---

## Deploying to GitHub Pages

### First time

1. Create a new repo on GitHub (e.g. `nathanfischer-photography` or just `photography`)
2. Push your files:
   ```bash
   cd nathan-photography
   git init
   git add .
   git commit -m "Initial site"
   git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO.git
   git push -u origin main
   ```
3. On GitHub: **Settings → Pages → Source → Deploy from branch → main / root**
4. Your site will be at: `https://YOUR_USERNAME.github.io/YOUR_REPO/`

### Updating the site

```bash
git add .
git commit -m "Add March car meet photos"
git push
```

GitHub Pages rebuilds in about 60 seconds.

### Custom domain (optional)

1. In your domain registrar, add a CNAME record pointing to `YOUR_USERNAME.github.io`
2. In repo Settings → Pages → Custom domain, enter your domain
3. Check "Enforce HTTPS"

---

## Customizing the Theme

All colors, fonts, and spacing are in `css/style.css` at the top under `:root {}`.

```css
:root {
  --amber:    #E8A020;   ← Main accent color — change this to change the whole vibe
  --black:    #0A0A0A;   ← Page background
  --surface:  #111113;   ← Card backgrounds
  --white:    #F0EDE8;   ← Main text color
}
```

---

## Performance Tips

- **Resize photos before uploading.** Aim for 1600px wide max for portfolio shots, 800px for thumbnails. Use Lightroom export or [Squoosh](https://squoosh.app).
- The site uses **lazy loading** — photos only load as you scroll, so large galleries stay fast.
- For car meets with 100+ photos, consider splitting into multiple meet entries.

---

## Adding New Filter Categories

In `pages/portfolio.html`, find the filter bar and add a button:
```html
<button class="filter-btn" data-category="wildlife">Wildlife</button>
```

In `data/galleries.json`, add your photos with the matching tag:
```json
{ "id": "wild-001", "title": "Red-Tailed Hawk", ..., "tags": ["wildlife"] }
```

The portfolio page assigns `data-filter` from the category — it'll just work.

---

## Questions / Future Ideas

- **Add a wildlife category**: Copy the astronomy pattern in `galleries.json`, add a filter button
- **Print store**: Link to [Printful](https://printful.com) or [Darkroom](https://darkroom.tech) from individual photos
- **SEO**: Add `<meta>` descriptions to each page (already started — just fill in your real content)
- **Analytics**: Add Plausible or GoatCounter (privacy-friendly) with one script tag

Built with pure HTML, CSS, and JavaScript — no build tools, no dependencies, no complexity.
