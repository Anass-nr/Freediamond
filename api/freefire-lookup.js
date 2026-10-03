// api/freefire-lookup.js
import { fetchFreeFireAccountDetails } from 'mika-ffstalk';

export default async function handler(req, res) {
  // إعدادات CORS
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

  const clean = query.trim();

  // التحقق من المدخل: إذا كان أرقاماً فقط، نعتبره UID
  if (!/^[0-9]+$/.test(clean)) {
    // لا ندعم البحث بالاسم حالياً في هذا الـ SDK
    return res.status(400).json({ error: 'Please enter a valid numeric UID' });
  }

  try {
    const data = await fetchFreeFireAccountDetails(clean);

    if (!data || !data.metadata) {
      return res.status(404).json({ error: 'Player not found' });
    }

    return res.status(200).json({
      id: data.metadata.accountId,
      name: data.metadata.nickname,
      level: data.metadata.level,
      region: data.metadata.region,
      rank: data.metadata.rank,
      lastLogin: data.metadata.lastLoginAt,
      // روابط الصور من مكتبة mika-ffstalk
      avatarUrl: data.assets.outfitImageUrl || null,
      bannerUrl: data.assets.bannerImageUrl || null,
    });

  } catch (error) {
    console.error('Free Fire API error:', error.message);
    // رسائل خطأ أكثر دقة
    if (error.message.includes('not found') || error.message.includes('404')) {
      return res.status(404).json({ error: 'Player not found' });
    }
    return res.status(500).json({ error: 'Failed to fetch player data' });
  }
}
