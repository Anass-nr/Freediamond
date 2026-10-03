// api/freefire-lookup.js
import { AuthService, PlayerService } from '@samir.oe70/freefire-api';

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

  if (!/^[0-9]{8,12}$/.test(clean)) {
    return res.status(400).json({ error: 'Invalid UID (8-12 digits)' });
  }

  try {
    // 1. إنشاء جلسة (Session) للمنطقة الافتراضية (مثلاً: SG - سنغافورة)
    const session = await AuthService.loginForRegion('SG');

    // 2. جلب ملف تعريف اللاعب باستخدام الجلسة والـ UID
    const profile = await PlayerService.getProfile(session.serverUrl, session.token, clean);

    if (!profile || !profile.basicinfo) {
      return res.status(404).json({ error: 'Player not found' });
    }

    const region = profile.basicinfo.region || 'sg';
    const regionLower = region.toLowerCase();

    // 3. إرجاع البيانات مع روابط الصور
    return res.status(200).json({
      id: profile.basicinfo.accountId || clean,
      name: profile.basicinfo.nickname,
      level: profile.basicinfo.level,
      region: region,
      rank: null, // يمكن جلبها لاحقاً إذا كانت المكتبة تدعمها
      avatarUrl: `https://discordbot.freefirecommunity.com/outfit_image_api?uid=${clean}&region=${regionLower}`,
      bannerUrl: `https://discordbot.freefirecommunity.com/banner_image_api?uid=${clean}&region=${regionLower}`,
    });

  } catch (error) {
    console.error('Free Fire API error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch player data' });
  }
}
