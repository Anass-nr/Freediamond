// api/freefire-lookup.js
export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body || {};
  const clean = (query || '').toString().trim();

  // Validate UID (8-12 digits)
  if (!/^[0-9]{8,12}$/.test(clean)) {
    return res.status(400).json({ error: 'Invalid UID (8-12 digits)' });
  }

  // Free trial API key for 1 month
  const API_KEY = 'PRINCE-1-M-FREE';
  const API_URL = `https://princeffinfoapi.vercel.app/get_player_data/${clean}?key=${API_KEY}`;

  try {
    const response = await fetch(API_URL);

    if (!response.ok) {
      // If API returns error, try to read message
      const errorData = await response.json().catch(() => ({}));
      console.error('API Error:', errorData);
      return res.status(response.status).json({ 
        error: errorData.message || 'Player not found or API error' 
      });
    }

    const data = await response.json();

    // Check if the response has the required data
    if (!data || !data['Account Name']) {
      return res.status(404).json({ error: 'Player not found or data incomplete' });
    }

    // Map the API response to the structure our frontend expects
    // The PRINCEXIT API returns a flat object with string keys
    return res.status(200).json({
      id: data['Account UID'] || clean,
      name: data['Account Name'],
      level: data['Account Level'] || 0,
      region: data['Account Region'] || 'SG',
      rank: data['BR Rank Points'] ? `BR: ${data['BR Rank Points']} pts` : 'Unranked',
      likes: data['Account Likes'] || 0,
      // The API sometimes returns images, but they may be "Not Found.png"
      // We'll use the outfit image service as a fallback
      avatarUrl: `https://discordbot.freefirecommunity.com/outfit_image_api?uid=${clean}&region=${(data['Account Region'] || 'sg').toLowerCase()}`,
      bannerUrl: `https://discordbot.freefirecommunity.com/banner_image_api?uid=${clean}&region=${(data['Account Region'] || 'sg').toLowerCase()}`,
    });

  } catch (error) {
    console.error('Proxy error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch player data' });
  }
}
