# Vercel KV Setup for User Counting

## Setup Instructions

### 1. Create a KV Store in Vercel Dashboard

1. Go to your Vercel project dashboard
2. Navigate to the "Storage" tab
3. Click "Create Database" → Select "KV"
4. Name it (e.g., "mycalorielog-kv")
5. Select your region (choose closest to your users)

### 2. Get Your Credentials

After creation, you'll see:
- `KV_REST_API_URL` - Your KV database URL
- `KV_REST_API_TOKEN` - Your authentication token

### 3. Add to Environment Variables

#### For Local Development:
Add to `.env.local`:
```env
KV_REST_API_URL=your-kv-url-here
KV_REST_API_TOKEN=your-kv-token-here
```

#### For Production (Vercel):
1. Go to Project Settings → Environment Variables
2. Add both `KV_REST_API_URL` and `KV_REST_API_TOKEN`
3. Make sure they're available for Production environment

### 4. How It Works

The app uses KV to store:
- Total calculation count: `tdee_calculations_total`
- Daily counts: `tdee_calculations_YYYY-MM-DD`
- User visit tracking (anonymous)

### 5. Fallback Behavior

If KV is not configured:
- The app will still work normally
- User counting will use localStorage as fallback
- You'll see warnings in console but no errors for users

### 6. Testing

To verify it's working:
1. Check the UserCounter component shows real numbers
2. Look for successful API calls to `/api/count`
3. In Vercel dashboard, check KV metrics

## Cost Considerations

- KV Free tier: 30,000 requests/month
- Each page load = 2 requests (read + increment)
- Supports ~15,000 monthly users on free tier
- Upgrade to Pro for unlimited requests

## Security Notes

- Never expose KV tokens in client-side code
- Keep tokens in environment variables only
- Use Vercel's automatic environment injection for production