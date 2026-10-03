// api/freefire-lookup.js
export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { query } = req.body || {};
  const clean = (query || '').toString().trim();

  if (!clean) {
    return res.status(400).json({ error: 'UID or Account Name is required' });
  }

  try {
    let uid = clean;
    let playerData = null;

    // 1. إذا كان الإدخال أرقاماً (UID)، نستخدم واجهة بيانات اللاعب مباشرة
    if (/^[0-9]{8,12}$/.test(clean)) {
      const url = `https://freefire-api-six.vercel.app/get_player_personal_show?server=sg&uid=${uid}`;
      const response = await fetch(url);
      playerData = await response.json();
    } 
    // 2. إذا كان الإدخال نصاً (اسم حساب)، نبحث أولاً عن الـ UID
    else {
      const searchUrl = `https://freefire-api-six.vercel.app/get_search_account_by_keyword?server=sg&keyword=${encodeURIComponent(clean)}`;
      const searchResponse = await fetch(searchUrl);
      const searchResult = await searchResponse.json();

      if (!searchResult || !searchResult.data || searchResult.data.length === 0) {
        return res.status(404).json({ error: 'Player not found' });
      }
      
      // نأخذ أول نتيجة (الاسم والـ UID)
      uid = searchResult.data[0].uid;
      const playerUrl = `https://freefire-api-six.vercel.app/get_player_personal_show?server=sg&uid=${uid}`;
      const playerResponse = await fetch(playerUrl);
      playerData = await playerResponse.json();
    }

    // التحقق من وجود البيانات
    if (!playerData || !playerData.basicInfo || !playerData.basicInfo.nickname) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const basic = playerData.basicInfo;
    const region = basic.region || 'SG';
    const regionLower = region.toLowerCase();

    // إرجاع البيانات بالهيكل المطلوب لصفحتك
    return res.status(200).json({
      id: uid,
      name: basic.nickname,
      level: basic.level || 0,
      region: region,
      rank: playerData.rankInfo ? (playerData.rankInfo.brRankName || 'Unranked') : 'Unranked',
      avatarUrl: `https://discordbot.freefirecommunity.com/outfit_image_api?uid=${uid}&region=${regionLower}`,
      bannerUrl: `https://discordbot.freefirecommunity.com/banner_image_api?uid=${uid}&region=${regionLower}`,
    });

  } catch (error) {
    console.error('Free Fire API error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch player data' });
  }
}
