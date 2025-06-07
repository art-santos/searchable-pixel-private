# 🧪 Local Testing Guide for Split Analytics Plugin

This guide will help you test the Split Analytics WordPress plugin locally without needing a real API key from Split.dev.

## 🚀 Quick Start (Docker Method)

### Step 1: Start WordPress with Docker

```bash
cd wp-plugin/
docker-compose up -d
```

This will start:
- WordPress at `http://localhost:8080`
- MySQL database for persistence

### Step 2: Complete WordPress Setup

1. Open `http://localhost:8080` in your browser
2. Complete the WordPress installation:
   - **Site Title**: "Split Analytics Test Site"
   - **Username**: admin
   - **Password**: Choose a strong password
   - **Email**: your-email@example.com

### Step 3: Activate the Plugin

1. Go to `http://localhost:8080/wp-admin`
2. Navigate to **Plugins > Installed Plugins**
3. Find "Split Analytics" and click **Activate**

### Step 4: Configure for Local Testing

1. Go to **Split Analytics > Settings**
2. **Leave API Key blank** (this is fine for local testing)
3. **Enable tracking**: ✅ Checked
4. **Debug mode**: ✅ Checked (to see logs)
5. Click **Save Settings**

## 🔧 Testing Without API Key

The plugin will work locally even without an API key. Here's what happens:

### ✅ What WILL Work:
- ✅ AI crawler detection
- ✅ Local database logging 
- ✅ Admin dashboard analytics
- ✅ Debug logging
- ✅ All core functionality

### ❌ What WON'T Work:
- ❌ Data sync to Split.dev cloud
- ❌ API connection tests
- ❌ Remote analytics dashboard

## 🤖 Test AI Crawler Detection

### Method 1: Using the Test Script

Make the script executable and run it:

```bash
chmod +x test-local.sh
./test-local.sh
```

### Method 2: Manual Testing with curl

Test different AI crawlers:

```bash
# Test OpenAI GPTBot
curl -H "User-Agent: Mozilla/5.0 (compatible; GPTBot/1.0; +https://openai.com/gptbot)" \
     http://localhost:8080

# Test Claude
curl -H "User-Agent: Claude-Web/1.0" \
     http://localhost:8080

# Test Perplexity
curl -H "User-Agent: Mozilla/5.0 (compatible; PerplexityBot/1.0; +https://perplexity.ai/bot)" \
     http://localhost:8080

# Test regular browser (should NOT be detected)
curl -H "User-Agent: Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36" \
     http://localhost:8080
```

## 📊 View Results

### 1. WordPress Admin Dashboard
- Go to `http://localhost:8080/wp-admin`
- Navigate to **Split Analytics > Dashboard**
- You'll see detected crawler visits

### 2. Database Direct Access
```bash
# Connect to database
docker-compose exec db mysql -u wordpress -pwordpress wordpress

# View recorded visits
SELECT * FROM wp_split_analytics_visits ORDER BY visit_time DESC LIMIT 10;

# View by crawler type
SELECT crawler_name, COUNT(*) as visits 
FROM wp_split_analytics_visits 
GROUP BY crawler_name;
```

### 3. Debug Logs
```bash
# View WordPress logs
docker-compose logs wordpress | grep "Split Analytics"

# Or check WordPress debug.log if enabled
docker-compose exec wordpress cat /var/www/html/wp-content/debug.log | grep "Split Analytics"
```

## 🔄 Local Development Workflow

### Making Changes to the Plugin

1. **Edit files directly** in `wp-plugin/split-analytics/`
2. **Changes are live immediately** (volume mounted)
3. **Clear any caches** if needed:
   ```bash
   docker-compose restart wordpress
   ```

### Testing Different Scenarios

1. **Test path exclusions**:
   - Add `/wp-admin/.*` to exclude paths
   - Test: `curl -H "User-Agent: GPTBot/1.0" http://localhost:8080/wp-admin/`
   - Should NOT be recorded

2. **Test include-only paths**:
   - Add `/blog/.*` to include paths only
   - Test: `curl -H "User-Agent: GPTBot/1.0" http://localhost:8080/blog/test`
   - Should be recorded

3. **Test data retention**:
   - Set retention to 1 day
   - Insert old test data
   - Run cleanup: `wp split-analytics cleanup` (via WP-CLI)

## 🐛 Troubleshooting

### Plugin Not Appearing
```bash
# Check if files are properly mounted
docker-compose exec wordpress ls -la /var/www/html/wp-content/plugins/

# Restart containers
docker-compose restart
```

### No Crawler Detection
```bash
# Check debug logs
docker-compose logs wordpress | grep -i "split\|error"

# Verify database table exists
docker-compose exec db mysql -u wordpress -pwordpress wordpress -e "SHOW TABLES LIKE 'wp_split_analytics%';"
```

### API Key Errors (Expected)
The error message you saw:
```json
{"message":"No API key found in request","hint":"No `apikey` request header or url param was found."}
```

This is **normal** for local testing. The plugin tries to sync data to Split.dev but fails gracefully when no API key is configured. All local functionality continues to work.

## 🧹 Cleanup

When done testing:

```bash
# Stop containers
docker-compose down

# Remove all data (optional)
docker-compose down -v
```

## 🔑 Testing with Real API Key (Optional)

If you want to test the full API integration:

1. Sign up at [Split.dev](https://split.dev)
2. Get your API key from the dashboard
3. Add it to **Split Analytics > Settings**
4. The plugin will then sync data to the cloud

## 🎯 Key Testing Points

- ✅ Different AI crawler user agents are detected
- ✅ Regular browsers are NOT detected
- ✅ Path exclusions work correctly
- ✅ Data is stored locally in WordPress database
- ✅ Admin dashboard shows analytics
- ✅ Debug logging provides detailed information
- ✅ Plugin works without API key for local development 