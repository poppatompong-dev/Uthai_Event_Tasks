---
description: Build and deploy the application to Vercel via GitHub
---

# Build and Deploy Workflow

This workflow builds the Next.js application and deploys it to Vercel.

## Steps

// turbo-all

1. **Build the application**
```bash
npm run build
```

2. **Stage all changes**
```bash
git add .
```

3. **Commit changes** (customize message as needed)
```bash
git commit -m "chore: update application"
```

4. **Push to GitHub (triggers Vercel deploy)**
```bash
git push origin master
```

## Notes
- Vercel will automatically deploy when changes are pushed to the `master` branch
- Check deployment status at: https://vercel.com/dashboard
- All commands in this workflow run automatically (turbo-all enabled)
