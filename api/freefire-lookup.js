// api/freefire-lookup.js
const FreeFireAPI = require('@pure0cd/freefire-api');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { uid } = req.body || {};

  if (!uid || typeof uid !== 'string' || !/^[0-9]+$/.test(uid)) {
    return res.status(400).json({ error: 'Valid UID is required' });
  }

  try {
    const api = new FreeFireAPI();
    const profile = await api.getPlayerProfile(uid);

    if (!profile || !profile.basicinfo) {
      return res.status(404).json({ error: 'Player not found' });
    }

    return res.status(200).json({
      id: uid,
      name: profile.basicinfo.nickname,
      level: profile.basicinfo.level,
      region: profile.basicinfo.region,
      created: profile.basicinfo.createat,
      lastLogin: profile.basicinfo.lastloginat,
      clan: profile.claninfo ? profile.claninfo.clanname : null,
    });

  } catch (error) {
    console.error('Free Fire API error:', error.message);
    if (error.message && (error.message.includes('not found') || error.message.includes('Player not found'))) {
      return res.status(404).json({ error: 'Player not found' });
    }
    return res.status(500).json({ error: 'Failed to fetch player data' });
  }
}
