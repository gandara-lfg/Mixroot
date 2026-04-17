const express = require('express')
const app = express()

// Create the server for the frontend
app.use(express.static('public'))
app.use(express.json())

const { searchSong, getArtist } = require('./spotify')

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
    const artistData = await getArtist(artistId)
    console.log(track.name)
    console.log(artistData)
    console.log(track.popularity)
    console.log(artistData.genres)

    res.json({
        song: track.name,
        artist: track.artists[0].name,
        album: track.album.name,
        popularity: track.popularity,
        image: track.album.images[0]?.url,
        spotifyUrl: track.external_urls.spotify,
        genres: artistData.genres || []
    })
})

// Run it on port 3000
app.listen(3000, () => {
    console.log('Server Running on port 3000')
})
