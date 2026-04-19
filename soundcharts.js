require('dotenv').config()

async function getSongBySpotifyId(spotifyId) {
    const response = await fetch(
        `https://customer.api.soundcharts.com/api/v2.25/song/by-platform/spotify/${spotifyId}`,
        {
            headers: {
                'x-app-id': process.env.SOUNDCHARTS_APP_ID,
                'x-api-key': process.env.SOUNDCHARTS_API_KEY
            }
        }
    )

    return await response.json()
}

module.exports = { getSongBySpotifyId }
