// We load our .env variables using dotenv to load them
require('dotenv').config()

// async means that we can use await
// Create function to get the token
async function getToken(){
    // Buffer is a built-in Node tool for handling raw binary data.
    // converts it into Base64 — a format that's safe to send over the internet.
    
    const credentials = Buffer.from(
        process.env.SPOTIFY_CLIENT_ID + ":" + process.env.SPOTIFY_CLIENT_SECRET
    ).toString('base64')

    // talk to the server
    const response = await fetch('https://accounts.spotify.com/api/token', {
        // send my credentials
        method: 'POST',
        headers: {
            'Authorization': 'Basic ' + credentials,
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: 'grant_type=client_credentials'
    })

    const data = await response.json()
    const token = data.access_token
    return token
}

async function searchSong(songName, artistName) {
    const token = await getToken()
    const q = `track:${songName} artist:${artistName}`

    const response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(q)}&type=track&limit=10`,
        {
            headers: {
                Authorization: 'Bearer ' + token
            }
        }
    )

    return await response.json()
}

async function getArtist(artistId) {
    const token = await getToken()

    const response = await fetch(
        `https://api.spotify.com/v1/artists/${artistId}`,
        {
            headers: {
                Authorization: 'Bearer ' + token
            }
        }
    )

    return await response.json()
}



module.exports = { getToken, searchSong, getArtist }