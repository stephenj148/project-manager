# Custom Domain Setup for stephenjanus.com

## 🌐 Setting Up projects.stephenjanus.com

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

### Step 3: Configure DNS in GoDaddy
1. Log into your GoDaddy account
2. Go to "My Products" → "DNS" → "Manage"
3. Find your `stephenjanus.com` domain
4. Add these DNS records:

#### A Records (IPv4):
```
Type: A
Name: projects
Value: 185.199.108.153
TTL: 600

Type: A  
Name: projects
Value: 185.199.109.153
TTL: 600

Type: A
Name: projects  
Value: 185.199.110.153
TTL: 600

Type: A
Name: projects
Value: 185.199.111.153
TTL: 600
```

#### CNAME Record (Alternative - easier):
```
Type: CNAME
Name: projects
Value: YOUR_USERNAME.github.io
TTL: 600
```

### Step 4: Verify Setup
1. Wait 5-15 minutes for DNS propagation
2. Visit `https://projects.stephenjanus.com`
3. Your SJ Design Project Manager should load!

## 🔧 Alternative Subdomains

You can use any of these instead of "projects":
- `manager.stephenjanus.com`
- `tasks.stephenjanus.com` 
- `work.stephenjanus.com`
- `pm.stephenjanus.com`

Just update the CNAME file and DNS records accordingly.

## 🚀 Benefits of Custom Domain

- **Professional URL**: `projects.stephenjanus.com`
- **Branded**: Matches your domain
- **HTTPS**: Automatic SSL certificate
- **Easy to remember**: Clients can bookmark it
- **SEO friendly**: Search engines can index it

## 🔄 Updating Your App

After initial setup, updates are simple:
```bash
git add .
git commit -m "Update: description"
git push origin main
```
Your custom domain will automatically show the latest version.

## 🆘 Troubleshooting

### Domain not working?
- Check DNS propagation: https://dnschecker.org
- Verify CNAME/A records in GoDaddy
- Wait up to 24 hours for full propagation

### HTTPS not working?
- GitHub Pages needs time to provision SSL certificate
- Check "Enforce HTTPS" is enabled in GitHub Pages settings
- Wait 5-10 minutes after domain setup

### Need to change subdomain?
- Update CNAME file in your repository
- Update DNS records in GoDaddy
- Update custom domain in GitHub Pages settings
