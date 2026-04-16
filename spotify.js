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

module.exports = { getToken }