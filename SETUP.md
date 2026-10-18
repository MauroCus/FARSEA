# FARSEA Shopify theme: setup guide

This package contains:

- `farsea-theme.zip`: the theme (home page, shop, product page, bag, contact form, ENG/ITA).
- `farsea-products.csv`: the 7 products and the post-treatment kit, ready to import.
- `product-photos/`: the product photos to add to each product.
- `translations-it.md`: the Italian texts for products and the home page.

Follow the steps in order. Steps 1–4 take about 20 minutes.

---

## 1. Upload the theme

**Online Store → Themes → Add theme → Upload zip file** → choose `farsea-theme.zip`.
Then click **Customize** to see it, or **Publish** to make it live.

*Option with GitHub (recommended for future changes):* create an empty GitHub repository, unzip the theme into it, and in **Online Store → Themes → Add theme → Connect from GitHub** pick that repository. Every change pushed to GitHub then updates the theme automatically.

## 2. Create the product fields (before importing)

**Settings → Custom data → Products → Add definition**. Create these seven, all with namespace and key exactly as shown:

| Name | Namespace and key | Type |
|---|---|---|
| Subtitle | `custom.subtitle` | Single line text |
| Size | `custom.size` | Single line text |
| Benefits | `custom.benefits` | Multi-line text (one benefit per line) |
| How to use | `custom.how_to_use` | Multi-line text |
| Ingredients | `custom.ingredients` | Multi-line text |
| Pairs with | `custom.pairs_with` | Single line text |
| Kit items | `custom.kit_items` | Multi-line text (one item per line, `Name | size`) |

## 3. Import the products

**Products → Import** → choose `farsea-products.csv`.
Prices, SKUs, stock (50 units each, 20 kits), weights, tags and all the fields above come filled in.
**Prices are examples:** check them before going live.

Then open each product and drag its photo from `product-photos/`. Siero Luce gets both `siero-luce-1` and `siero-luce-2` (the second one appears on hover and in the gallery). The kit has no photo on purpose: it's shown as a dark text tile.

**Tags the theme uses**

- `line:daily`, `line:targeted`, `line:hair`, `concern:radiance`, `concern:lines`, `concern:blemish`, `concern:pigment`, `concern:after-treatment` → filter chips on the shop page.
- `bestseller`, `new` → badges on cards and product pages.

## 4. Check the shop page

The shop is the **All products** collection page (`/collections/all`). In **Customize → Products page (Collection)** you can edit:

- the hero text, image and featured product;
- the trust bar;
- the filter chips (label + tag);
- the kit product and its position;
- the three routine steps (each linked to a product);
- the FAQ.

The kit, the routine products and the featured product are preselected by product handle, so they work as soon as the CSV is imported.

## 5. Menus (optional)

Without menus the header and footer show Concerns, Treatments, Shop, About and Contact. To change them, create **Navigation → Main menu** (handle `main-menu`) and **Footer** (handle `footer`). Links to home sections use `/#esigenze`, `/#soluzioni`, `/#approccio`, `/#contatti`.

## 6. Italian (ENG / ITA switch)

1. **Settings → Languages → Add language → Italian**, then **Publish**. The ENG / ITA switch appears in the header automatically.
2. All buttons, the bag, the product page labels and the contact form are already translated in the theme.
3. Install the free **Translate & Adapt** app and paste the Italian texts from `translations-it.md` (products, home page sections, shop page sections).

## 7. Payments, shipping, taxes and customer emails

All of this is configured in Shopify, not in the theme:

- **Settings → Payments:** Shopify Payments (cards, Apple Pay, Google Pay) and PayPal.
- **Settings → Shipping and delivery:**
  - Italy rate, plus free shipping over €70. The free-shipping bar in the bag uses the threshold set in **Theme settings → Shop**, so keep both the same.
  - Enable **local pickup** for collecting orders at the clinic.
- **Settings → Taxes and duties:** prices include VAT (22% Italy). Ask the accountant about OSS if selling to other EU countries.
- **Settings → Notifications:** order confirmation, shipping and delivery emails. Add the logo and colours there.
- **Apps:** Sendcloud (labels and tracking with BRT, GLS, Poste Italiane, DHL) and Fatture in Cloud (Italian electronic invoices).
- **Settings → Policies:** refund, privacy and terms. They appear in the footer automatically.

## 8. Contact form

Messages from the contact section arrive at the store email (**Settings → Store details**). Address, phone and email shown on the site are in **Theme settings → Contact details**.

## 9. Before going live

- Replace placeholder contact details and the VAT number (**Footer → Legal line**).
- Real product prices and stock.
- EU cosmetics requirements (responsible person, safety report, CPNP notification, compliant labels).
- Legal pages: terms of sale, 14-day withdrawal right, privacy, cookie banner (Shopify's **Customer privacy** settings).
