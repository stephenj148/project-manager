# GitHub Pages SSL Certificate Troubleshooting

## 🚨 SSL Certificate Error: "Something went wrong issuing a certificate"

This is a common issue with GitHub Pages custom domains. Here's how to fix it:

### Step 1: Check DNS Propagation First
1. Go to https://dnschecker.org
2. Enter: `projects.stephenjanus.com`
3. Verify it resolves to GitHub Pages IPs (185.199.108.x range)
4. Wait until ALL locations show the correct IPs

### Step 2: Remove and Re-add Custom Domain
1. Go to your GitHub repository
2. Settings → Pages
3. **Remove** the custom domain (clear the field)
4. Click "Save"
5. Wait 2-3 minutes
6. **Re-add** the custom domain: `projects.stephenjanus.com`
7. Click "Save"

### Step 3: Wait for Certificate Provisioning
- GitHub needs 5-15 minutes to provision SSL certificate
- Don't check "Enforce HTTPS" until certificate is ready
- You'll see a green checkmark when it's ready

### Step 4: Enable HTTPS
1. Once certificate is ready (green checkmark)
2. Check "Enforce HTTPS"
3. Click "Save"

## 🔧 Alternative Solutions

### Option A: Use A Records Instead of CNAME
If CNAME is causing issues, try A records:

```
Name: projects
TTL: 5
Resolves to: 185.199.108.153

Name: projects
TTL: 5
Resolves to: 185.199.109.153

Name: projects
TTL: 5
Resolves to: 185.199.110.153

Name: projects
TTL: 5
Resolves to: 185.199.111.153
```

### Option B: Check for Conflicting Records
In SiteGround, make sure you don't have:
- Multiple CNAME records for "projects"
- A records conflicting with CNAME
- Any other DNS records for "projects"

### Option C: Try Different Subdomain
If "projects" is problematic, try:
- `manager.stephenjanus.com`
- `tasks.stephenjanus.com`
- `work.stephenjanus.com`

Update CNAME file and DNS accordingly.

## ⏱️ Timeline Expectations

### Normal Process:
1. DNS propagation: 5-15 minutes
2. GitHub detects domain: 2-5 minutes
3. SSL certificate: 5-15 minutes
4. **Total**: 15-35 minutes

### If Still Having Issues:
- Wait up to 24 hours (rare)
- Contact GitHub Support if it persists
- Consider using GitHub's default domain temporarily

## 🆘 Quick Fixes

### Fix 1: Clear DNS Cache
```bash
# On Mac:
sudo dscacheutil -flushcache
sudo killall -HUP mDNSResponder

# On Windows:
ipconfig /flushdns
```

### Fix 2: Check Domain Status
- Visit: https://github.com/settings/pages
- Check if domain shows any errors
- Look for any warnings or issues

### Fix 3: Verify DNS Settings
Make sure in SiteGround:
- Only ONE CNAME record for "projects"
- TTL is 5 minutes or higher
- No conflicting A records

## 📞 If Nothing Works

### Contact GitHub Support:
1. Go to: https://support.github.com
2. Select "GitHub Pages"
3. Describe the SSL certificate issue
4. Include your domain: projects.stephenjanus.com

### Temporary Solution:
- Use GitHub's default domain: `YOUR_USERNAME.github.io/sj-design-project-manager`
- Set up custom domain later
- App will work perfectly on default domain

## ✅ Success Indicators

You'll know it's working when:
- GitHub Pages shows green checkmark for custom domain
- "Enforce HTTPS" checkbox is available and checked
- Visiting https://projects.stephenjanus.com shows your app
- No SSL warnings in browser
