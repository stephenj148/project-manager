# Fix GitHub Pages 404 Error

## 🚨 Common 404 Causes & Solutions

### 1. Files Not Pushed to GitHub
**Problem**: Files exist locally but not on GitHub
**Solution**: 
```bash
git add .
git commit -m "Add all files"
git push origin main
```

### 2. Wrong Branch
**Problem**: GitHub Pages is looking at wrong branch
**Solution**: 
- Go to repository Settings → Pages
- Source: "Deploy from a branch"
- Branch: "main" (not master)
- Folder: "/ (root)"

### 3. Wrong File Name
**Problem**: GitHub Pages needs `index.html` in root
**Solution**: 
- Make sure `index.html` is in root directory
- Not in a subfolder

### 4. Repository Not Public
**Problem**: Private repositories can't use free GitHub Pages
**Solution**: 
- Make repository public
- Or upgrade to GitHub Pro for private repos

### 5. Custom Domain Issues
**Problem**: Custom domain not configured properly
**Solution**: 
- Remove custom domain temporarily
- Test with default GitHub URL first
- Add custom domain after it works

## 🔧 Step-by-Step Fix

### Step 1: Verify Files Are Pushed
```bash
git status
git add .
git commit -m "Fix GitHub Pages"
git push origin main
```

### Step 2: Check GitHub Pages Settings
1. Go to repository on GitHub
2. Click "Settings" tab
3. Scroll to "Pages" section
4. Source: "Deploy from a branch"
5. Branch: "main"
6. Folder: "/ (root)"
7. Click "Save"

### Step 3: Wait for Deployment
- GitHub Pages takes 1-5 minutes to deploy
- Check the "Actions" tab for deployment status
- Look for green checkmarks

### Step 4: Test Default URL
- Try: `https://YOUR_USERNAME.github.io/sj-design-project-manager/`
- If this works, then custom domain is the issue
- If this doesn't work, it's a GitHub Pages setup issue

## 🆘 Still Getting 404?

### Check These:
1. **Repository name**: Must match URL exactly
2. **Branch name**: Must be "main" not "master"
3. **File location**: `index.html` in root, not subfolder
4. **Repository visibility**: Must be public for free GitHub Pages
5. **Deployment status**: Check Actions tab for errors

### Common Mistakes:
- Repository name has spaces or special characters
- Files are in wrong branch
- `index.html` is in subfolder
- Repository is private
- Custom domain conflicts

## ✅ Success Indicators

You'll know it's working when:
- Default GitHub URL loads your app
- No 404 error
- All files load correctly
- Custom domain works (if configured)

## 🔄 After Fixing

### Test Both URLs:
1. Default: `https://YOUR_USERNAME.github.io/sj-design-project-manager/`
2. Custom: `https://projects.stephenjanus.com`

### If Default Works but Custom Doesn't:
- DNS issue with custom domain
- Check DNS propagation
- Verify CNAME/A records

### If Neither Works:
- GitHub Pages configuration issue
- Check repository settings
- Verify file structure
