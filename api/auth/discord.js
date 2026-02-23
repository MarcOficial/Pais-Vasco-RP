export default async function handler(req, res) {
    const CLIENT_ID = "1472984276533248103";
    const CLIENT_SECRET = process.env.DISCORD_SECRET;
    const REDIRECT_URI = "https://pais-vasco-rp.vercel.app/auth/callback.html";

    const { code } = req.body;

    if (!code) return res.status(400).json({ error: "Missing code" });

    try {
        const tokenRes = await fetch("https://discord.com/api/oauth2/token", {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: new URLSearchParams({
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: "authorization_code",
                code,
                redirect_uri: REDIRECT_URI
            })
        });

        const tokenData = await tokenRes.json();

        if (!tokenData.access_token) {
            return res.status(400).json({ error: "Invalid token exchange" });
        }

        const userRes = await fetch("https://discord.com/api/users/@me", {
            headers: { Authorization: `Bearer ${tokenData.access_token}` }
        });

        const user = await userRes.json();

        return res.json({
            success: true,
            user
        });

    } catch (err) {
        return res.status(500).json({ error: "OAuth error" });
    }
}
