const express = require('express')
const app = express()

// Serve the frontend files from the /public folder and parse JSON request bodies
app.use(express.static('public'))
app.use(express.json())

// Import helper functions for talking to Spotify and Soundcharts
const { searchSong, getArtist } = require('./spotify')
const { getSongBySpotifyId } = require('./soundcharts')

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
    const artistId = track.artists[0].id

    // Fetch the artist details from Spotify and the audio data from Soundcharts at the same time
    const [artistData, soundchartsData] = await Promise.all([
        getArtist(artistId),
        getSongBySpotifyId(track.id)
    ])

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
        console.log(scObject.genres)
    }

    // Pull the album image URL out of the Spotify response
    const albumImages = track.album.images
    const imageUrl = albumImages.length > 0 ? albumImages[0].url : null

    // Build the key and BPM values, falling back to null if data is missing
    const key = audio ? formatKey(audio.key, audio.mode) : null
    const bpm = audio && audio.tempo ? Math.round(audio.tempo) : null

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

// Start the server on port 3000
app.listen(3000, () => {
    console.log('Server Running on port 3000')
})
