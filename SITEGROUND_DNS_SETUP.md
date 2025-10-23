# SiteGround DNS Setup for stephenjanus.com

## 🌐 Setting Up projects.stephenjanus.com with SiteGround

### Step 1: Deploy to GitHub Pages First
1. Create GitHub repository: `sj-design-project-manager`
2. Push your code to GitHub
3. Enable GitHub Pages in repository settings
4. Your app will be available at: `https://YOUR_USERNAME.github.io/sj-design-project-manager/`

### Step 2: Configure Custom Domain in GitHub
1. Go to your repository on GitHub
2. Click "Settings" tab
3. Scroll to "Pages" section
4. In "Custom domain" field, enter: `projects.stephenjanus.com`
5. Check "Enforce HTTPS" (recommended)
6. Click "Save"

### Step 3: Configure DNS in SiteGround
1. Log into your SiteGround account
2. Go to "Websites" → Select your domain
3. Click "DNS Zone Editor" or "DNS Management"
4. Add this CNAME record:

#### CNAME Record (Recommended):
```
Type: CNAME
Name: projects
Value: YOUR_USERNAME.github.io
TTL: 5 minutes (fastest updates)
```

#### Alternative A Records (if CNAME doesn't work):
```
Type: A
Name: projects
Value: 185.199.108.153
TTL: 5 minutes

Type: A  
Name: projects
Value: 185.199.109.153
TTL: 5 minutes

Type: A
Name: projects  
Value: 185.199.110.153
TTL: 5 minutes

Type: A
Name: projects
Value: 185.199.111.153
TTL: 5 minutes
```

### Step 4: TTL Recommendations

#### For Initial Setup:
- **TTL: 5 minutes** - Fastest propagation, easier troubleshooting
- **Why**: If something goes wrong, changes take effect quickly

#### After Everything Works:
- **TTL: 15-30 minutes** - Good balance of speed and efficiency
- **Why**: Reduces DNS queries, better performance

#### For Production (after testing):
- **TTL: 1 hour or more** - Maximum efficiency
- **Why**: Minimal DNS lookups, fastest loading

### Step 5: Verify Setup
1. Wait 5-10 minutes for DNS propagation (with 5min TTL)
2. Check DNS propagation: https://dnschecker.org
3. Visit `https://projects.stephenjanus.com`
4. Your SJ Design Project Manager should load!

## 🔧 SiteGround-Specific Tips

### DNS Zone Editor Location:
- SiteGround → Websites → Your Domain → DNS Zone Editor
- Or: SiteGround → My Account → DNS Zone Editor

### If CNAME Doesn't Work:
- Some SiteGround setups prefer A records
- Use the 4 A records listed above
- All point to GitHub Pages IP addresses

### SSL Certificate:
- GitHub Pages automatically provides SSL
- May take 5-10 minutes after DNS is live
- Check "Enforce HTTPS" in GitHub Pages settings

## 🚀 Benefits of SiteGround + GitHub Pages

- **Fast DNS**: SiteGround's DNS is very reliable
- **Quick Updates**: 5-minute TTL means fast changes
- **Professional**: Custom domain with your branding
- **Free**: No additional costs
- **Secure**: Automatic HTTPS

## 🔄 Updating Your App

After initial setup, updates are simple:
```bash
git add .
git commit -m "Update: description"
git push origin main
```
Your custom domain will automatically show the latest version.

## 🆘 Troubleshooting

### Domain not working after 15 minutes?
- Check DNS propagation: https://dnschecker.org
- Verify CNAME/A records in SiteGround
- Try changing TTL to 5 minutes temporarily

### HTTPS not working?
- GitHub Pages needs time to provision SSL certificate
- Check "Enforce HTTPS" is enabled in GitHub Pages settings
- Wait 10-15 minutes after domain setup

### Need to change subdomain?
- Update CNAME file in your repository
- Update DNS records in SiteGround
- Update custom domain in GitHub Pages settings
- Consider 5-minute TTL for faster changes

## 📱 Final Result

Your project manager will be available at:
- **Primary URL**: `https://projects.stephenjanus.com`
- **Mobile Ready**: Responsive design
- **Your Branding**: SJ Design logo and colors
- **Secure**: HTTPS with automatic SSL
- **Private**: All data stays in user's browser
