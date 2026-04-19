const express = require('express')
const app = express()

// Create the server for the frontend
app.use(express.static('public'))
app.use(express.json())

const { searchSong, getArtist } = require('./spotify')
const { getSongBySpotifyId } = require('./soundcharts')

const KEY_NAMES = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']

function formatKey(keyNum, mode) {
    if (keyNum == null || keyNum < 0) return null
    return KEY_NAMES[keyNum] + (mode === 0 ? 'm' : '')
}

app.get('/search', async (req, res) => {
    const song = req.query.song
    const artist = req.query.artist

    if (!song || !artist) {
        return res.json({error: 'Missing song or artist'})
    }

    const data = await searchSong(song, artist)

    if (!data.tracks || data.tracks.items.length === 0){
        return res.json({ error: 'Song not found'})
    }

    const track = data.tracks.items[0]
    const artistId = track.artists[0].id
    const [artistData, soundchartsData] = await Promise.all([
        getArtist(artistId),
        getSongBySpotifyId(track.id)
    ])

    const audio = soundchartsData?.object?.audio
    const scGenres = soundchartsData?.object?.genres
    const genre = scGenres?.length ? scGenres[0].root : null

    console.log(track.name, '| key:', audio?.key, audio?.mode, '| tempo:', audio?.tempo, '| genre:', genre)

    res.json({
        song: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        popularity: track.popularity,
        image: track.album.images[0]?.url,
        spotifyUrl: track.external_urls.spotify,
        key: formatKey(audio?.key, audio?.mode),
        bpm: audio?.tempo ? Math.round(audio.tempo) : null,
        genre
    })
})

// Run it on port 3000
app.listen(3000, () => {
    console.log('Server Running on port 3000')
})
