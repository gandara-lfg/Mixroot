const express = require('express')
const app = express()

// Serve the frontend files from the /public folder and parse JSON request bodies
app.use(express.static('public'))
app.use(express.json())

// Import helper functions for talking to Spotify and Soundcharts
const { searchSong, searchArtist } = require('./spotify')
const { getSongByUuid, getSongBySpotifyId, getArtistSongs, getArtistBySpotifyId } = require('./soundcharts')

// Maps Spotify's numeric key (0-11) to a note name, and adds 'm' if the song is in a minor key
const KEY_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

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

    console.log(track.name, '| key:', key, '| bpm:', bpm, '| genre:', genre)

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

// Route: Search for an artist and return their top 10 songs by Spotify popularity
app.get('/artist-songs', async (req, res) => {
    const artist = req.query.artist
    if (!artist) return res.json({ error: 'Missing artist' })

    const searchData = await searchArtist(artist)
    if (!searchData.artists || searchData.artists.items.length === 0) {
        return res.json({ error: 'Artist not found' })
    }

    const spotifyArtistId = searchData.artists.items[0].id
    const scArtist = await getArtistBySpotifyId(spotifyArtistId)

    if (!scArtist.object || !scArtist.object.uuid) {
        return res.json({ error: 'Artist not found in Soundcharts' })
    }

    const songsData = await getArtistSongs(scArtist.object.uuid)
    const items = songsData.items || []

    // Log the first item's full shape — useful to check if Spotify IDs are
    // available (would let us swap these 5 calls for 1 Spotify batch call)
    if (items.length > 0) console.log('[item shape]', JSON.stringify(items[0], null, 2))

    const songDetails = await Promise.all(items.map(async function(item) {
        const songData = await getSongByUuid(item.uuid)
        const scObject = songData.object || null
        const audio = scObject ? scObject.audio : null
        const { key, bpm } = getKeyAndBpm(audio)
        let genre = null
        if (scObject && scObject.genres && scObject.genres.length > 0) {
            genre = scObject.genres[0].root
        }
        console.log(item.name, '| key:', key, '| bpm:', bpm, '| genre:', genre)
        return { key, bpm, genre }
    }))

    const tracks = []
    for (let i = 0; i < items.length; i++) {
        const item = items[i]
        const details = songDetails[i]
        tracks.push({
            song: item.name,
            artist: searchData.artists.items[0].name,
            image: item.imageUrl || null,
            popularity: item.spotifyPopularity || null,
            key: details.key,
            bpm: details.bpm,
            genre: details.genre
        })
    }
    
    res.json({ tracks })
})

// Start the server on port 3000
app.listen(3000, () => {
    console.log('Server Running on port 3000')
})
