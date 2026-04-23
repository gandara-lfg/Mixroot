require('dotenv').config()

const { searchSong, getArtist } = require('./spotify')

// Can remove this later ---- to get the song keys for testing.
async function getSongByUuid(uuid) {
    const response = await fetch(
        `https://customer.api.soundcharts.com/api/v2.25/song/${uuid}`,
        {
            headers: {
                'x-app-id': process.env.SOUNDCHARTS_APP_ID,
                'x-api-key': process.env.SOUNDCHARTS_API_KEY
            }
        }
    )
    return await response.json()
}

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

async function getArtistBySpotifyId(spotifyArtistId) {
    const response = await fetch(
        `https://customer.api.soundcharts.com/api/v2/artist/by-platform/spotify/${spotifyArtistId}`,
        {
            headers: {
                'x-app-id': process.env.SOUNDCHARTS_APP_ID,
                'x-api-key': process.env.SOUNDCHARTS_API_KEY
            }
        }
    )
    return await response.json()
}

async function getArtistSongs(soundchartsArtistId) {
    const response = await fetch(
        `https://customer.api.soundcharts.com/api/v2.21/artist/${soundchartsArtistId}/songs?offset=0&limit=5&sortBy=spotifyPopularity&sortOrder=desc`,
        {
            headers: {
                'x-app-id': process.env.SOUNDCHARTS_APP_ID,
                'x-api-key': process.env.SOUNDCHARTS_API_KEY
            }
        }
    )
    return await response.json()
}

module.exports = { getSongByUuid, getSongBySpotifyId, getArtistBySpotifyId, getArtistSongs }
