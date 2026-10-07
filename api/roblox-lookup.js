// api/roblox-lookup.js
export default async function handler(req, res) {
  // ===== CORS Headers =====
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ===== Input Validation =====
  const { username } = req.body || {};
  const clean = (username || '').toString().trim();

  if (!/^[A-Za-z0-9_]{3,20}$/.test(clean)) {
    return res.status(400).json({ error: 'Invalid username format' });
  }

  try {
    // ===== Step 1: Username → User ID =====
    const idRes = await fetch('https://users.roblox.com/v1/usernames/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify({
        usernames: [clean],
        excludeBannedUsers: false,
      }),
    });

    if (!idRes.ok) {
      return res.status(502).json({ error: 'Roblox API unavailable' });
    }

    const idData = await idRes.json();

    if (!idData.data || idData.data.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    const user = idData.data[0];
    const userId = user.id;

    // ===== Step 2: Get Avatar Headshot =====
    let avatarUrl = null;
    try {
      const avatarRes = await fetch(
        `https://thumbnails.roblox.com/v1/users/avatar-headshot?userIds=${userId}&size=150x150&format=Png&isCircular=false`
      );
      if (avatarRes.ok) {
        const avatarData = await avatarRes.json();
        avatarUrl = avatarData?.data?.[0]?.imageUrl || null;
      }
    } catch (e) {
      // Silently ignore avatar failure
    }

    // ===== Step 3: Get Account Creation Date =====
    let created = null;
    let description = null;
    try {
      const detailsRes = await fetch(`https://users.roblox.com/v1/users/${userId}`);
      if (detailsRes.ok) {
        const details = await detailsRes.json();
        created = details.created || null;
        description = details.description || null;
      }
    } catch (e) {
      // Silently ignore
    }

    // ===== Response =====
    return res.status(200).json({
      id: userId,
      name: user.name,
      displayName: user.displayName || user.name,
      avatarUrl: avatarUrl,
      created: created,
      description: description,
    });

  } catch (error) {
    console.error('Roblox lookup error:', error.message);
    return res.status(500).json({ error: 'Failed to fetch player data' });
  }
}
