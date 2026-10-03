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

  if (!query || typeof query !== 'string') {
    return res.status(400).json({ error: 'UID or Account Name is required' });
  }

  try {
    const api = new FreeFireAPI();
    let uid, profile;

    if (/^[0-9]+$/.test(query)) {
      // بحث بواسطة UID
      uid = query;
      profile = await api.getPlayerProfile(uid);
    } else {
      // بحث بواسطة اسم الحساب
      const results = await api.searchAccount(query);
      if (!results || results.length === 0) {
        return res.status(404).json({ error: 'Player not found' });
      }
      uid = results[0].accountid;
      profile = await api.getPlayerProfile(uid);
    }

    if (!profile || !profile.basicinfo) {
      return res.status(404).json({ error: 'Player not found' });
    }

    // جلب إحصائيات الرانك الحقيقية
    let rankData = null;
    try {
      rankData = await api.getPlayerStats(uid, 'br', 'ranked');
    } catch (e) {
      console.warn('Could not fetch rank stats:', e.message);
    }

    return res.status(200).json({
      id: uid,
      name: profile.basicinfo.nickname,
      level: profile.basicinfo.level,
      region: profile.basicinfo.region,
      created: profile.basicinfo.createat,
      lastLogin: profile.basicinfo.lastloginat,
      rank: rankData ? rankData.rank : 'Unranked',
      rankingPoints: rankData ? rankData.rankingPoints : 0,
      clan: profile.claninfo ? profile.claninfo.clanname : null,
      // لا توجد صورة أفاتار مباشرة في المكتبة
      avatar: null,
    });

  } catch (error) {
    console.error('Free Fire API error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch player data' });
  }
}
