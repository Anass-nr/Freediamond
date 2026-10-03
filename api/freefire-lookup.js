// api/freefire-lookup.js — DEBUG
const mika = require('mika-ffstalk');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // GET: عرض دوال المكتبة للتشخيص
  if (req.method === 'GET') {
    var keys = Object.keys(mika);
    var types = {};
    keys.forEach(function(k) { types[k] = typeof mika[k]; });
    return res.status(200).json({
      debug: true,
      libraryKeys: keys,
      types: types
    });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const query = (body.query || '').toString().trim();

  if (!/^[0-9]{8,12}$/.test(query)) {
    return res.status(400).json({ error: 'Invalid UID (8-12 digits)' });
  }

  try {
    var data;
    var usedFn = '';

    if (typeof mika.fetchFreeFireAccountDetails === 'function') {
      usedFn = 'fetchFreeFireAccountDetails';
      data = await mika.fetchFreeFireAccountDetails(query);
    } else if (typeof mika.default === 'function') {
      usedFn = 'default';
      data = await mika.default(query);
    } else if (typeof mika.getPlayerInfo === 'function') {
      usedFn = 'getPlayerInfo';
      data = await mika.getPlayerInfo(query);
    } else if (typeof mika.fetchPlayerProfile === 'function') {
      usedFn = 'fetchPlayerProfile';
      data = await mika.fetchPlayerProfile(query);
    } else {
      return res.status(500).json({
        error: 'No known function',
        libraryKeys: Object.keys(mika)
      });
    }

    return res.status(200).json({
      usedFunction: usedFn,
      rawType: typeof data,
      rawKeys: data && typeof data === 'object' ? Object.keys(data) : null,
      rawResponse: data
    });

  } catch (error) {
    return res.status(500).json({
      error: 'Exception',
      message: error.message,
      stackTop: error.stack ? error.stack.split('\n').slice(0, 3).join(' | ') : null
    });
  }
}
