// api/freefire-lookup.js
const FreeFireAPI = require('@pure0cd/freefire-api');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { query } = req.body || {};
  const clean = (query || '').toString().trim();

  if (!clean) {
    return res.status(400).json({ error: 'UID or Account Name is required' });
  }

  try {
    const api = new FreeFireAPI();
    let uid, profile;

    if (/^[0-9]{8,12}$/.test(clean)) {
      // بحث بواسطة UID
      uid = clean;
      profile = await api.getPlayerProfile(uid);
    } else {
      // بحث بواسطة اسم الحساب
      const results = await api.searchAccount(clean);
      if (!results || results.length === 0) {
        return res.status(404).json({ error: 'Player not found' });
      }
      uid = results[0].accountid || results[0].uid;
      profile = await api.getPlayerProfile(uid);
    }

    if (!profile || !profile.basicinfo) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // جلب الرانك الحقيقي
    let rankData = null;
    try {
      rankData = await api.getPlayerStats(uid, 'br', 'ranked');
    } catch (e) {
      console.warn('Rank unavailable:', e.message);
    }

    // توليد روابط الصور من freefirecommunity.com
    const region = profile.basicinfo.region || 'sg';
    const regionLower = region.toLowerCase();
    const bannerUrl = `https://discordbot.freefirecommunity.com/banner_image_api?uid=${uid}&region=${regionLower}`;
    const outfitUrl = `https://discordbot.freefirecommunity.com/outfit_image_api?uid=${uid}&region=${regionLower}`;

    return res.status(200).json({
      id: uid,
      name: profile.basicinfo.nickname,
      level: profile.basicinfo.level,
      region: region,
      rank: rankData ? rankData.rank : null,
      rankingPoints: rankData ? rankData.rankingPoints : 0,
      clan: profile.claninfo ? profile.claninfo.clanname : null,
      pet: profile.petinfo ? profile.petinfo.name : null,
      // روابط الصور
      avatarUrl: outfitUrl,
      bannerUrl: bannerUrl,
    });

  } catch (error) {
    console.error('Free Fire API error:', error.message);
    if (error.message && (error.message.includes('not found') || error.message.includes('404'))) {
      return res.status(404).json({ error: 'Player not found' });
    }
    return res.status(500).json({ error: 'Failed to fetch player data' });
  }
}
