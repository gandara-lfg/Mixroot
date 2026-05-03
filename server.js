const express = require('express')
const app = express()

// Serve the frontend files from the /public folder and parse JSON request bodies
app.use(express.static('public'))
app.use(express.json())

// Import helper functions for talking to Spotify and Soundcharts
const { searchSong } = require('./spotify')
const { getSongByUuid, getSongBySpotifyId, getRecSongs, DEFAULT_TERRITORIES } = require('./soundcharts')

// Maps key strings (as returned by formatKey) to Soundcharts pitch class integers (0–11)
const KEY_TO_PITCH = {
    'C': 0,   'C#': 1,  'D': 2,   'D#': 3,  'E': 4,  'F': 5,
    'F#': 6,  'G': 7,   'G#': 8,  'A': 9,   'A#': 10, 'B': 11,
    'Cm': 0,  'C#m': 1, 'Dm': 2,  'D#m': 3, 'Em': 4, 'Fm': 5,
    'F#m': 6, 'Gm': 7,  'G#m': 8, 'Am': 9,  'A#m': 10, 'Bm': 11,
}

// Camelot wheel — for each key, the 4 harmonically compatible keys (same, relative, +1, -1)
const HARMONIC_KEYS = {
    'C':   ['C', 'Am', 'G', 'F'],
    'G':   ['G', 'Em', 'D', 'C'],
    'D':   ['D', 'Bm', 'A', 'G'],
    'A':   ['A', 'F#m', 'E', 'D'],
    'E':   ['E', 'C#m', 'B', 'A'],
    'B':   ['B', 'G#m', 'F#', 'E'],
    'F#':  ['F#', 'D#m', 'C#', 'B'],
    'C#':  ['C#', 'A#m', 'G#', 'F#'],
    'G#':  ['G#', 'Fm', 'D#', 'C#'],
    'D#':  ['D#', 'Cm', 'A#', 'G#'],
    'A#':  ['A#', 'Gm', 'F', 'D#'],
    'F':   ['F', 'Dm', 'C', 'A#'],
    'Am':  ['Am', 'C', 'Em', 'Dm'],
    'Em':  ['Em', 'G', 'Bm', 'Am'],
    'Bm':  ['Bm', 'D', 'F#m', 'Em'],
    'F#m': ['F#m', 'A', 'C#m', 'Bm'],
    'C#m': ['C#m', 'E', 'G#m', 'F#m'],
    'G#m': ['G#m', 'B', 'D#m', 'C#m'],
    'D#m': ['D#m', 'F#', 'A#m', 'G#m'],
    'A#m': ['A#m', 'C#', 'Fm', 'D#m'],
    'Fm':  ['Fm', 'G#', 'Cm', 'A#m'],
    'Cm':  ['Cm', 'D#', 'Gm', 'Fm'],
    'Gm':  ['Gm', 'A#', 'Dm', 'Cm'],
    'Dm':  ['Dm', 'F', 'Am', 'Gm'],
}

// Maps Spotify's numeric key (0-11) to a note name, and adds 'm' if the song is in a minor key
const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const GENRES = {
    "Electronic": ["electro", "electronic"],
    "Hip-Hop": ["hip hop", "hip-hop & rap"],
    "Pop": ["pop"],
    "Latin": ["latin"],
    "R&B": ["r&b", "funk & soul", "soul"],
    "Dance": ["edm", "dance"],
    "Rock": ["rock", "metal"]
}

function formatKey(keyNum, mode) {
    if (keyNum == null || keyNum < 0) return null
    const noteName = KEY_NAMES[keyNum]
    let suffix
    if (mode === 0) {
        suffix = 'm'
    } else {
        suffix = ''
    }
    return noteName + suffix
}

function getKeyAndBpm(audio) {
    if (audio) {
        return { key: formatKey(audio.key, audio.mode), bpm: audio.tempo ? Math.round(audio.tempo) : null }
    } else {
        return { key: null, bpm: null }
    }
}

// Route: Search for a single song by name and artist, then return its audio info
app.get('/search', async (req, res) => {
    const song = req.query.song
    const artist = req.query.artist

    // Make sure both fields were provided
    if (!song || !artist) {
        return res.json({ error: 'Missing song or artist' })
    }

    // Search Spotify for the song
    const data = await searchSong(song, artist)

    if (!data.tracks || data.tracks.items.length === 0) {
        return res.json({ error: 'Song not found' })
    }
    // Grab the first result from Spotify
    const track = data.tracks.items[0]

    const soundchartsData = await getSongBySpotifyId(track.id)

    // Pull the audio features and genre out of the Soundcharts response
    const scObject = soundchartsData.object
    let audio = null
    let genre = null

    if (scObject) {
        audio = scObject.audio
        const scGenres = scObject.genres
        const genres = []

        if (scGenres && scGenres.length > 0) {
            for (let i = 0; i < scGenres.length; i++) {
                if (scGenres[i].root == 'edm' && scGenres[i].sub && scGenres[i].sub.length > 0) {
                    genres.push(scGenres[i].sub[0])
                    break
                }
            }

            for (let i = 0; i < scGenres.length; i++) {
                if (genres.length >= 2) break
                if (scGenres[i].root != 'edm') {
                    genres.push(scGenres[i].root)
                }
            }
        }

        genre = genres
    }

    // Pull the album image URL out of the Spotify response
    const albumImages = track.album.images
    const imageUrl = albumImages.length > 0 ? albumImages[0].url : null

    const { key, bpm } = getKeyAndBpm(audio)

    // console.log(track.name, '| key:', key, '| bpm:', bpm, '| genre:', genre)

    res.json({
        song: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        popularity: track.popularity,
        image: imageUrl,
        spotifyUrl: track.external_urls.spotify,
        key: key,
        bpm: bpm,
        genres: genre
    })
})

// ─────────────────────────────────────────────────────────────────────────────
// ARTIST TAB — commented out while the Artist tab is hidden from the UI.
// This route searches Spotify for an artist, looks them up in Soundcharts,
// fetches their top songs, and returns key/bpm/genre for each track.
// Re-enable by uncommenting this route and restoring the Artist tab in the HTML.
// ─────────────────────────────────────────────────────────────────────────────
// app.get('/artist-songs', async (req, res) => {
//     const artist = req.query.artist
//     if (!artist) return res.json({ error: 'Missing artist' })
//
//     const searchData = await searchArtist(artist)
//     if (!searchData.artists || searchData.artists.items.length === 0) {
//         return res.json({ error: 'Artist not found' })
//     }
//
//     const spotifyArtistId = searchData.artists.items[0].id
//     const scArtist = await getArtistBySpotifyId(spotifyArtistId)
//
//     if (!scArtist.object || !scArtist.object.uuid) {
//         return res.json({ error: 'Artist not found in Soundcharts' })
//     }
//
//     const songsData = await getArtistSongs(scArtist.object.uuid)
//     const items = songsData.items || []
//
//     const songDetails = await Promise.all(items.map(async function(item) {
//         const songData = await getSongByUuid(item.uuid)
//         const scObject = songData.object || null
//         const audio = scObject ? scObject.audio : null
//         const { key, bpm } = getKeyAndBpm(audio)
//         let genre = null
//         if (scObject && scObject.genres && scObject.genres.length > 0) {
//             genre = scObject.genres[0].root
//         }
//         return { key, bpm, genre }
//     }))
//
//     const tracks = []
//     for (let i = 0; i < items.length; i++) {
//         const item = items[i]
//         const details = songDetails[i]
//         tracks.push({
//             song: item.name,
//             artist: searchData.artists.items[0].name,
//             image: item.imageUrl || null,
//             popularity: item.spotifyPopularity || null,
//             key: details.key,
//             bpm: details.bpm,
//             genre: details.genre
//         })
//     }
//
//     res.json({ tracks })
// })

// Route: Return top songs that are harmonically compatible with a given key
app.get('/rec-songs', async (req, res) => {
    const key = req.query.key
    if (!key) return res.json({ error: 'Missing key' })

    const harmonicKeys = HARMONIC_KEYS[key]
    if (!harmonicKeys) return res.json({ error: 'Unknown key: ' + key })

    const pitchClasses = []
    for (let i = 0; i < harmonicKeys.length; i++) {
        const pitch = KEY_TO_PITCH[harmonicKeys[i]]
        if (pitch !== undefined && pitchClasses.indexOf(pitch) === -1) {
            pitchClasses.push(pitch)
        }
    }

    // Build exact (pitch, mode) pairs so we can filter out wrong-mode results
    // Soundcharts only filters by pitch class, not mode, so E and Em both come back
    const validPairs = []
    for (let i = 0; i < harmonicKeys.length; i++) {
        const k = harmonicKeys[i]
        const pitch = KEY_TO_PITCH[k]
        const mode = k.endsWith('m') ? 0 : 1
        validPairs.push({ pitch: pitch, mode: mode })
    }

    const year = req.query.year || ''
    const genre = req.query.genre || ''
    const genreValues = GENRES[genre] || null
    const bpmMin = parseInt(req.query.bpmMin)
    const bpmMax = parseInt(req.query.bpmMax)
    let bpm = null
    if (!isNaN(bpmMin) && !isNaN(bpmMax)) {
        bpm = { min: bpmMin, max: bpmMax }
    }
    const territoriesRaw = req.query.territories || ''
    let territories = null
    if (territoriesRaw) {
        territories = territoriesRaw.split(',').filter(function(t) { return t.length > 0 })
    }
    const languagesRaw = req.query.languages || ''
    let languages = null
    if (languagesRaw) {
        languages = languagesRaw.split(',').filter(function(l) { return l.length > 0 })
    }
    const offset = Math.floor(Math.random() * 150)
    const data = await getRecSongs(pitchClasses, offset, year, genreValues, bpm, territories, languages)

    const allItems = data.items || []
    const items = allItems.filter(function(item) {
        if (!item.audio) return false
        // If a decade was selected, drop songs with no release date
        if (year && !item.song.releaseDate) return false
        for (let i = 0; i < validPairs.length; i++) {
            if (item.audio.key === validPairs[i].pitch && item.audio.mode === validPairs[i].mode) {
                return true
            }
        }
        return false
    })

    const tracks = items.map(function(item) {
        const song = item.song || {}
        const audio = item.audio || null
        const { key, bpm } = getKeyAndBpm(audio)
        const releaseYear = song.releaseDate ? song.releaseDate.substring(0, 4) : null
        return {
            song: song.name,
            artist: song.creditName || '',
            image: song.imageUrl || null,
            popularity: null,
            key: key,
            bpm: bpm,
            genre: null,
            releaseYear: releaseYear
        }
    })
    res.json({ tracks })
})

// Start the server on port 3000
app.listen(3000, () => {
    console.log('server running...')
})
