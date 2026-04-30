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

async function getRecSongsByGenre(genres, keys) {
    const response = fetch('https://customer.api.soundcharts.com/api/v2/top/songs?offset=0&limit=100', 
        {
            method: 'POST',
            headers: {
                'x-app-id': process.env.SOUNDCHARTS_APP_ID,
                'x-api-key': process.env.SOUNDCHARTS_API_KEY,
                'content-type': 'application/x-www-form-urlencoded'
            },
            body: `{"sort": {"platform": "spotify","metricType": "streams", "sortBy": "total","order": "desc"},"filters": [{"type": "metric","data": {"platform": "spotify","metricType": "streams","min": "1000000","max": "100000000"}}, {"type":"songGenres", "data.values": {${genres}}{"type": "releaseDate","data": {"min": "2010-01-01","max": "2026-03-31","operator": "in"}}, {"type":"songKey", "data.values":{${keys}}]}`
        }
    )
}

async function getRecSongs(keys, offset, year, genres, bpm) {
    const dates = getYears(year)
    const filters = [
        { type: 'metric', data: { platform: 'spotify', metricType: 'streams', min: '1000000' } },
        { type: 'songKey', data: { values: keys, operator: 'in' } },
        { type: 'territory', data: { values: ['US', 'MX', 'CO', 'AR', 'CL', 'PE', 'VE', 'EC', 'DO', 'PA', 'CR', 'GT', 'HN', 'SV', 'NI', 'BO', 'PY', 'UY', 'CU', 'PR'], operator: 'in' } },
    ]
    if (year) {
        filters.splice(1, 0, { type: 'releaseDate', data: { min: dates.start, max: dates.end, operator: 'in' } })
    }
    if (genres && genres.length > 0) {
        filters.splice(1, 0, { type: 'songGenres', data: { values: genres, operator: 'in' } })
    }
    if (bpm) {
        filters.push({ type: 'tempo', data: { min: bpm.min, max: bpm.max } })
    }
    const body = {
        sort: { platform: 'spotify', metricType: 'streams', sortBy: 'total', order: 'desc' },
        filters: filters
    }
    const response = await fetch('https://customer.api.soundcharts.com/api/v2/top/songs?offset=' + offset + '&limit=50', {
        method: 'POST',
        headers: {
            'x-app-id': process.env.SOUNDCHARTS_APP_ID,
            'x-api-key': process.env.SOUNDCHARTS_API_KEY,
            'content-type': 'application/json'
        },
        body: JSON.stringify(body)
    })
    return await response.json()
}

function getYears(year) {
    let start, end
    if (year == '' || year == 'All Years') {
        start = '1970-01-01'
        end = '2026-04-24'
    } else if (year == '2020') {
        start = '2020-01-01'
        end = '2026-04-24'
    } else {
        start = year + '-01-01'
        const yearNum = Number(year)
        if (yearNum >= 2000) {
            end = '20' + year[2] + '9-12-31'
        } else {
            end = '19' + year[2] + '9-12-31'
        }
    }
    return { start: start, end: end }
}

module.exports = { getSongByUuid, getSongBySpotifyId, getArtistBySpotifyId, getArtistSongs, getRecSongs }
