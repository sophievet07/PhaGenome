# PhaGenome
### Integrated Phage Genome Analysis Platform
**ICAR–National Meat Research Institute, Hyderabad, India**

---

## What PhaGenome Does

Paste any raw bacteriophage FASTA sequence and get:
- ✅ NCBI BLAST identification + taxonomy
- ✅ Lytic/lysogenic lifestyle prediction (PHASTER)
- ✅ Full genome annotation (Pharokka via Galaxy Europe)
- ✅ tRNA detection + biological significance (tRNAscan-SE)
- ✅ AMR gene screening (CARD database)
- ✅ Toxin gene screening (VFDB database)
- ✅ Circular genome map (publication-ready SVG)
- ✅ Phylogenetic tree (IQ-TREE)
- ✅ Downloadable GenBank, PDF report, safety certificate

---

## Deployment — Step by Step

### Step 1 — Set up Supabase database

1. Go to https://supabase.com → open your project
2. Click **SQL Editor** in left sidebar
3. Click **New Query**
4. Copy the contents of `supabase_setup.sql`
5. Paste and click **Run**
6. You should see: "PhaGenome database setup complete!"

### Step 2 — Deploy to Vercel

1. Create a GitHub account if you don't have one: https://github.com
2. Create a new repository called `phagenome`
3. Upload all files from this folder to the repository
4. Go to https://vercel.com → Sign up with GitHub
5. Click **Add New Project** → Import your `phagenome` repository
6. Before clicking Deploy — click **Environment Variables**

### Step 3 — Add Environment Variables in Vercel

Add these one by one:

| Variable Name | Value |
|--------------|-------|
| `NEXT_PUBLIC_SUPABASE_URL` | https://azzxtlglfbxdxxfmijkk.supabase.co |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | sb_publishable_ZC2qTsC8Tv3yKlcUPzg-NQ_wyXUpXDZ |
| `NCBI_API_KEY` | [your NCBI key] |
| `GALAXY_API_KEY` | [your Galaxy Europe key] |
| `GALAXY_URL` | https://usegalaxy.eu |

⚠️ NEVER put these in any file that goes to GitHub — only in Vercel dashboard.

### Step 4 — Deploy

Click **Deploy** in Vercel. Wait 2–3 minutes.
Your site will be live at: `https://phagenome.vercel.app`

### Step 5 — Custom domain (optional)

To use phagenome.com or phagenome.org:
1. Buy domain from Namecheap (~$12/year)
2. In Vercel → Project → Domains → Add your domain
3. Follow DNS instructions

---

## API Architecture

```
Browser (React frontend)
    ↓
/api/blast.js      ← NCBI BLAST (key hidden)
/api/galaxy.js     ← Galaxy Europe (key hidden)
/api/phaster.js    ← PHASTER (no key needed)
/api/safety.js     ← CARD + VFDB via Galaxy
    ↓
Supabase Database  ← Job storage
```

---

## Citation

If you use PhaGenome in your research, please cite:

> [Author]. PhaGenome: An integrated web platform for bacteriophage genome
> analysis, annotation, and safety screening.
> ICAR–National Meat Research Institute, Hyderabad (2026).
> Available at: https://phagenome.org

---

## Contact

**ICAR–National Meat Research Institute**
Chengicherla, Hyderabad, Telangana, India
Department of Agricultural Research and Education (DARE)

---

*PhaGenome is free and open-access for the global phage research community.*
