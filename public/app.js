async function searchSong() {
    const songInput = document.getElementById("songInput")
    const artistInput = document.getElementById("artistInput")
    const result = document.getElementById("result")

    const song = songInput.value.trim()
    const artist = artistInput.value.trim()

    if (song === "" || artist === "") {
        result.innerHTML = `<p class="error">Please enter both a song and artist.</p>`
        return
    }

    const response = await fetch(
        `/search?song=${encodeURIComponent(song)}&artist=${encodeURIComponent(artist)}`
    )

    const data = await response.json()

    if (data.error) {
        result.innerHTML = `<p class="error">${data.error}</p>`
        return
    }

    result.innerHTML = `
        <div class="song-card">
            <img src="${data.image}" alt="Album Cover">
            <div class="song-info">
                <h2>${data.song}</h2>
                <p><strong>Artist:</strong> ${data.artist}</p>
                <p><strong>Album:</strong> ${data.album}</p>
                <p><a href="${data.spotifyUrl}" target="_blank">Open in Spotify</a></p>
            </div>
        </div>
    `
}