# Fix: "Can't do CNAME because it has an A record"

## 🚨 The Problem
SiteGround is saying you can't add a CNAME for "projects" because there's already an A record for that subdomain.

## 🔧 Solution: Remove the A Record First

### Step 1: Check Existing Records
In SiteGround DNS Zone Editor, look for:
- Any A records with Name: "projects"
- Any CNAME records with Name: "projects"
- Any other records for "projects"

### Step 2: Delete Conflicting Records
1. Find the A record(s) for "projects"
2. **Delete** the A record(s)
3. Wait 2-3 minutes for DNS to update
4. **Then** add the CNAME record

### Step 3: Add CNAME Record
```
Name: projects
TTL: 5
Resolves to: YOUR_USERNAME.github.io
```

## 🔄 Alternative: Use A Records Instead

If you prefer to keep A records, use these GitHub Pages IPs:

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

**Note**: You need ALL 4 A records for load balancing.

## 🎯 Recommended Approach

### Option 1: CNAME (Easier)
1. Delete existing A record for "projects"
2. Add CNAME record
3. Wait 5-10 minutes

### Option 2: A Records (More Complex)
1. Delete existing A record for "projects"
2. Add all 4 A records above
3. Wait 5-10 minutes

## 🔍 How to Find the Conflicting Record

### In SiteGround DNS Zone Editor:
1. Look for any record with Name: "projects"
2. Check Type: A, CNAME, or other
3. Note the current value
4. Delete it before adding new record

### Common Conflicts:
- A record pointing to your main site IP
- Old CNAME pointing somewhere else
- Wildcard record (*) affecting subdomains

## ⏱️ Timeline After Fix

### After Removing Conflicting Record:
1. Wait 2-3 minutes for DNS to clear
2. Add new CNAME/A records
3. Wait 5-10 minutes for propagation
4. Check at: https://dnschecker.org

## 🆘 If Still Having Issues

### Try Different Subdomain:
- `manager.stephenjanus.com`
- `tasks.stephenjanus.com`
- `work.stephenjanus.com`

### Check for Wildcard Records:
- Look for Name: "*" or "*.stephenjanus.com"
- These might be interfering

### Contact SiteGround Support:
- They can help identify conflicting records
- Ask them to check for "projects" subdomain conflicts

## ✅ Success Indicators

You'll know it's working when:
- No DNS conflicts in SiteGround
- CNAME/A records are active
- DNS checker shows correct IPs
- GitHub Pages shows green checkmark
- Your app loads at projects.stephenjanus.com
