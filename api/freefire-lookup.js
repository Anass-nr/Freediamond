// api/freefire-lookup.js — TEST VERSION
const mika = require('mika-ffstalk');

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS, GET');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  // TEST: ?uid=XXXXX via GET
  if (req.method === 'GET') {
    var testUid = req.query.uid || '';
    if (!testUid) {
      return res.status(200).json({
        message: 'Add ?uid=XXXXX to test',
        example: '/api/freefire-lookup?uid=2734630199'
      });
    }
    try {
      var testData = await mika.fetchFreeFireAccountDetails(testUid);
      return res.status(200).json({
        success: true,
        data: testData
      });
    } catch (err) {
      return res.status(500).json({
        success: false,
        errorMessage: err.message,
        errorStack: err.stack ? err.stack.split('\n').slice(0, 5) : null,
        errorName: err.name
      });
    }
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const body = req.body || {};
  const query = (body.query || '').toString().trim();

  if (!/^[0-9]{8,12}$/.test(query)) {
    return res.status(400).json({ error: 'Invalid UID' });
  }

  try {
    const data = await mika.fetchFreeFireAccountDetails(query);
    return res.status(200).json({
      id: data.metadata ? data.metadata.accountId : query,
      name: data.metadata ? data.metadata.nickname : 'Unknown',
      level: data.metadata ? data.metadata.level : null,
      region: data.metadata ? data.metadata.region : null,
      rank: data.metadata ? data.metadata.rank : null,
      avatarUrl: data.assets ? data.assets.outfitImageUrl : null,
      bannerUrl: data.assets ? data.assets.bannerImageUrl : null,
      rawData: data
    });
  } catch (error) {
    return res.status(500).json({
      error: 'Exception',
      message: error.message,
      stackTop: error.stack ? error.stack.split('\n').slice(0, 3) : null
    });
  }
}
