# Deployment Guide - DreamRoom AI Enterprise Edition

## Quick Deploy Checklist

### Pre-Deployment
- [ ] All products categorized (`/admin` → Auto-Categorize All)
- [ ] Test generation for all room types
- [ ] Verify Room Package displays correctly
- [ ] Check Buy Entire Room button functionality
- [ ] Test on mobile devices

### Platform Options

## Option 1: Vercel (Recommended) ⚡

**Why Vercel:**
- Built for Next.js
- Free tier available
- Automatic deployments
- Edge network (fast globally)

**Steps:**
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login to Vercel
vercel login

# 3. Deploy
vercel

# 4. Add environment variables in Vercel dashboard
NEXT_PUBLIC_SUPABASE_URL=your_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_key
```

**Production URL:** `https://dreamroom-ai.vercel.app`

---

## Option 2: Netlify

```bash
# 1. Install Netlify CLI
npm install -g netlify-cli

# 2. Build
npm run build

# 3. Deploy
netlify deploy --prod

# 4. Add env vars in Netlify dashboard
```

---

## Option 3: AWS / DigitalOcean (Custom Server)

```bash
# 1. Build production
npm run build

# 2. Install PM2
npm install -g pm2

# 3. Start with PM2
pm2 start npm --name "dreamroom" -- start

# 4. Enable on startup
pm2 startup
pm2 save
```

---

## Environment Variables

**Required:**
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
```

**Optional:**
```env
GEMINI_API_KEY=your_gemini_key  # For advanced categorization
NODE_ENV=production
```

---

## Post-Deployment Steps

### 1. Test Complete Flow
```
✓ Upload image → works
✓ Select style → works
✓ Select room → works
✓ Generate → completes in <30s
✓ Results page → shows correctly
✓ Room Package → displays total
✓ Buy button → triggers correctly
```

### 2. Performance Optimization

**Enable Caching:**
- Supabase: Enable cache for product queries
- Images: Use CDN for product images
- API: Cache room generation results

**Lighthouse Score Goals:**
- Performance: >90
- Accessibility: >95
- Best Practices: >95
- SEO: >90

### 3. Analytics Setup

**Google Analytics:**
```javascript
// Add to app/layout.tsx
<Script src="https://www.googletagmanager.com/gtag/js?id=GA_ID" />
<Script id="google-analytics">
  {`
    window.dataLayer = window.dataLayer || [];
    function gtag(){dataLayer.push(arguments);}
    gtag('js', new Date());
    gtag('config', 'GA_ID');
  `}
</Script>
```

**Track Events:**
- Image uploads
- Style selections
- Generations completed
- Buy button clicks
- Room package value

---

## Custom Domain Setup

### Vercel:
1. Go to Project Settings → Domains
2. Add your domain: `www.yourdomain.com`
3. Update DNS records as instructed
4. SSL automatically provisioned

### Example DNS:
```
Type: CNAME
Name: www
Value: cname.vercel-dns.com
```

---

## White-Label Customization

### For Furniture Companies:

**1. Update Branding (`app/page.tsx`):**
```typescript
<h1>YourCompany AI Designer</h1>
```

**2. Custom Colors (`tailwind.config.ts`):**
```javascript
colors: {
  primary: '#your-brand-color',
  secondary: '#your-secondary-color',
}
```

**3. Logo:**
- Replace in `public/logo.png`
- Update in header component

**4. Footer:**
```typescript
<p>© 2024 YourCompany. Powered by AI.</p>
```

---

## Monitoring & Maintenance

### Error Tracking (Sentry):
```bash
npm install @sentry/nextjs
npx @sentry/wizard -i nextjs
```

### Uptime Monitoring:
- UptimeRobot (free)
- Pingdom
- StatusCake

### Database Backups:
- Supabase: Auto-backups enabled
- Manual backup: Export from Supabase dashboard weekly

---

## Scaling Considerations

### For High Traffic:

**1. Database:**
- Upgrade Supabase plan
- Add indexes to products table
- Enable connection pooling

**2. Image Generation:**
- Implement queue system (Bull/Redis)
- Rate limit API calls
- Cache generated images (S3/R2)

**3. CDN:**
- Cloudflare for assets
- Image optimization service

---

## Security Checklist

- [ ] HTTPS enabled (automatic on Vercel)
- [ ] Environment variables secured
- [ ] Supabase RLS policies active
- [ ] Rate limiting on API routes
- [ ] File upload size limits (10MB)
- [ ] CORS configured correctly
- [ ] No API keys in client code

---

## Support & Updates

### Regular Maintenance:
- Weekly: Check error logs
- Monthly: Review analytics, optimize slow queries
- Quarterly: Update dependencies (`npm update`)

### Feature Updates:
```bash
git pull origin main
npm install
vercel --prod
```

---

## Production Costs Estimate

**Vercel:**
- Free tier: $0/month (hobby projects)
- Pro: $20/month (custom domains, analytics)

**Supabase:**
- Free tier: $0/month (500MB database, 2GB bandwidth)
- Pro: $25/month (8GB database, 50GB bandwidth)

**Total:** $0-45/month for small-medium traffic

**Enterprise Scale:** $200-500/month (100k+ users)

---

## Emergency Rollback

If issues occur after deployment:

```bash
# Vercel: Rollback to previous deployment
vercel rollback

# Or redeploy specific version
vercel --prod <deployment-url>
```

---

## Success Metrics

**Track These KPIs:**
1. **Conversion Rate**: Uploads → Room Package views
2. **AOV (Average Order Value)**: Room package totals
3. **Generation Success Rate**: % completing successfully
4. **Load Time**: <3 seconds target
5. **Mobile Traffic**: Should be >50%

---

**Deployment Status: READY** ✅

Your DreamRoom AI platform is production-ready and can be deployed in under 30 minutes!
