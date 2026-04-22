// Dual-handle BPM range slider
document.addEventListener('DOMContentLoaded', () => {
    const minThumb = document.getElementById('bpmRangeMin')
    const maxThumb = document.getElementById('bpmRangeMax')
    const minLabel = document.getElementById('bpmMin')
    const maxLabel = document.getElementById('bpmMax')
    const fill    = document.getElementById('bpmRangeFill')

    const RANGE_MIN = 60
    const RANGE_MAX = 220
    const TOTAL     = RANGE_MAX - RANGE_MIN

    function updateDisplay() {
        let minVal = parseInt(minThumb.value)
        let maxVal = parseInt(maxThumb.value)

        // Keep min from passing max and vice versa
        if (minVal > maxVal) {
            minVal = maxVal
            minThumb.value = minVal
        }
        if (maxVal < minVal) {
            maxVal = minVal
            maxThumb.value = maxVal
        }

        minLabel.textContent = minVal
        maxLabel.textContent = maxVal

        // Position the amber fill between the two thumbs
        const leftPct  = ((minVal - RANGE_MIN) / TOTAL) * 100
        const rightPct = ((RANGE_MAX - maxVal)  / TOTAL) * 100
        fill.style.left  = leftPct  + '%'
        fill.style.right = rightPct + '%'

        // Raise the min thumb's z-index when it's pushed to the far right
        // so the user can always drag it back left
        if (minVal > (RANGE_MAX + RANGE_MIN) / 2) {
            minThumb.style.zIndex = 5
        } else {
            minThumb.style.zIndex = 3
        }
    }

    minThumb.addEventListener('input', updateDisplay)
    maxThumb.addEventListener('input', updateDisplay)

    // Set initial fill position on page load
    updateDisplay()
})

async function searchSong() {
    const songInput = document.getElementById('songInput')
    const artistInput = document.getElementById('artistInput')
    const result = document.getElementById('result')

    const song = songInput.value.trim()
    const artist = artistInput.value.trim()

    if (song === '' || artist === '') {
        result.innerHTML = `
            <div class="neon-card-purple h-full rounded-2xl bg-[#14141f] border border-red-500/30 p-4 flex items-center justify-center">
                <p class="text-red-400 text-sm font-medium">Please enter both a song and artist.</p>
            </div>`
        return
    }

    result.innerHTML = `
        <div class="neon-card-purple h-full rounded-2xl bg-[#14141f] border border-purple-500/20 p-4 flex items-center justify-center">
            <span class="loading loading-spinner loading-md text-purple-400"></span>
        </div>`

    const response = await fetch(
        `/search?song=${encodeURIComponent(song)}&artist=${encodeURIComponent(artist)}`
    )

    const data = await response.json()

    if (data.error) {
        result.innerHTML = `
            <div class="neon-card-purple h-full rounded-2xl bg-[#14141f] border border-red-500/30 p-4 flex items-center justify-center">
                <p class="text-red-400 text-sm font-medium">${data.error}</p>
            </div>`
        return
    }

    result.innerHTML = `
        <div class="neon-card-purple h-full rounded-2xl bg-[#14141f] border border-purple-500/20 p-4 flex flex-col justify-between">
            <div class="flex items-center gap-3">
                <img src="${data.image || ''}" alt="Album"
                    class="w-14 h-14 rounded-xl object-cover shrink-0 bg-purple-900/40"
                    onerror="this.style.display='none'">
                <div class="min-w-0">
                    <p class="font-bold text-white text-sm leading-tight truncate">${data.song}</p>
                    <p class="text-xs text-gray-400 truncate">${data.artist}</p>
                    ${data.album ? `<p class="text-[10px] text-gray-600 mt-0.5 truncate">${data.album}</p>` : ''}
                </div>
            </div>
            <div class="grid grid-cols-3 gap-2 mt-3">
                <div class="stat-pill bg-[#0d0d18] rounded-xl p-2 text-center border border-purple-500/10">
                    <p class="text-[9px] text-gray-500 uppercase tracking-wider">Key</p>
                    <p class="text-sm font-bold text-purple-300 mt-0.5">${data.key || '—'}</p>
                </div>
                <div class="stat-pill bg-[#0d0d18] rounded-xl p-2 text-center border border-cyan-500/10">
                    <p class="text-[9px] text-gray-500 uppercase tracking-wider">BPM</p>
                    <p class="text-sm font-bold text-cyan-300 mt-0.5">${data.bpm || '—'}</p>
                </div>
                <div class="stat-pill bg-[#0d0d18] rounded-xl p-2 text-center border border-pink-500/10">
                    <p class="text-[9px] text-gray-500 uppercase tracking-wider">Genre</p>
                    <p class="text-sm font-bold text-pink-300 mt-0.5">${data.genres && data.genres.length > 0 ? data.genres[0] : '—'}</p>
                    <p class="text-[10px] font-semibold text-pink-300 opacity-60 mt-0.5">${data.genres && data.genres.length > 1 ? data.genres[1] : ''}</p>
                </div>
            </div>
            ${data.spotifyUrl ? `
            <a href="${data.spotifyUrl}" target="_blank"
                class="btn btn-xs btn-outline border-green-500/30 text-green-400 hover:bg-green-900/30 hover:border-green-500 mt-2 rounded-lg font-semibold">
                Open in Spotify ↗
            </a>` : ''}
        </div>`
}

async function searchArtistSongs() {
    const input = document.getElementById('artistSearchInput')
    const container = document.getElementById('recommendations')
    const countBadge = document.getElementById('matchCount')

    const artist = input.value.trim()
    if (!artist) return

    container.innerHTML = `
        <div class="flex items-center justify-center h-full">
            <span class="loading loading-spinner loading-md" style="color:#c8a86e"></span>
        </div>`
    if (countBadge) countBadge.textContent = ''

    const response = await fetch(`/artist-songs?artist=${encodeURIComponent(artist)}`)
    const data = await response.json()

    if (data.error) {
        container.innerHTML = `
            <div class="flex items-center justify-center h-full text-sm" style="color:#c0806a">${data.error}</div>`
        return
    }

    renderRecommendations(data.tracks)
}

// ─── DRAGGABLE KNOBS ────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const genreOptions = [
        { label: 'All Genres',  value: '' },
        { label: 'Electronic',  value: 'Electronic' },
        { label: 'Hip-Hop',     value: 'Hip-Hop' },
        { label: 'Pop',         value: 'Pop' },
        { label: 'R&B',         value: 'R&B' },
        { label: 'House',       value: 'House' },
        { label: 'Techno',      value: 'Techno' },
        { label: 'Latin',       value: 'Latin' },
        { label: 'Ambient',     value: 'Ambient' },
    ]

    const sortOptions = [
        { label: 'Key Match',   value: 'Key Match' },
    ]

    initDragKnob('genreKnob', genreOptions, 'genreFilter', 'genreLabel')
    initDragKnob('sortKnob',  sortOptions,  'sortBy',      'sortLabel')
})

function initDragKnob(knobId, options, selectId, labelId) {
    const knob   = document.getElementById(knobId)
    const select = document.getElementById(selectId)
    const label  = document.getElementById(labelId)
    if (!knob || !label) return

    const PX_PER_STEP = 18
    const MIN_ANGLE   = -135
    const MAX_ANGLE   =  135

    let index        = 0
    let dragStartY   = 0
    let dragStartIdx = 0
    let isDragging   = false

    function angleFor(i) {
        if (options.length <= 1) return 0
        return MIN_ANGLE + (i / (options.length - 1)) * (MAX_ANGLE - MIN_ANGLE)
    }

    function commit(newIndex) {
        index = Math.max(0, Math.min(options.length - 1, newIndex))
        knob.style.transform = `rotate(${angleFor(index)}deg)`
        label.textContent = options[index].label
        if (select) {
            select.value = options[index].value
            select.dispatchEvent(new Event('change'))
        }
    }

    knob.addEventListener('mousedown', (e) => {
        isDragging   = true
        dragStartY   = e.clientY
        dragStartIdx = index
        document.body.style.userSelect = 'none'
        document.body.style.cursor     = 'ns-resize'
        e.preventDefault()
    })

    document.addEventListener('mousemove', (e) => {
        if (!isDragging) return
        const steps = Math.round((dragStartY - e.clientY) / PX_PER_STEP)
        commit(dragStartIdx + steps)
    })

    document.addEventListener('mouseup', () => {
        if (!isDragging) return
        isDragging = false
        document.body.style.userSelect = ''
        document.body.style.cursor     = ''
    })

    commit(0)
}

// ─── RENDER RECOMMENDATIONS ─────────────────────────────────────────────────

// Render recommendations — call this when you have match data from the API
function renderRecommendations(tracks) {
    const container = document.getElementById('recommendations')
    const countBadge = document.getElementById('matchCount')

    if (!tracks || tracks.length === 0) {
        container.innerHTML = `
            <div class="flex items-center justify-center h-full text-gray-600 text-sm">
                No matches found.
            </div>`
        if (countBadge) countBadge.textContent = '0 found'
        return
    }

    if (countBadge) countBadge.textContent = `${tracks.length} found`

    const colors = [
        'from-cyan-900 to-teal-700',
        'from-violet-900 to-indigo-700',
        'from-pink-900 to-rose-700',
        'from-amber-900 to-orange-700',
        'from-emerald-900 to-green-700',
    ]

    container.innerHTML = `<div class="flex flex-col gap-2 overflow-y-auto h-full pr-0.5">${tracks.map((track, i) => `
        <div class="match-card neon-card-cyan bg-[#14141f] border border-cyan-500/15 hover:border-cyan-500/40 rounded-xl p-3 flex items-center gap-3 cursor-pointer transition-all group">
            <div class="album-thumb w-10 h-10 rounded-lg bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center text-base shrink-0 overflow-hidden">
                ${track.image
                    ? `<img src="${track.image}" class="w-full h-full object-cover" alt="">`
                    : '♫'}
            </div>
            <div class="flex-1 min-w-0">
                <p class="font-semibold text-sm text-white truncate group-hover:text-cyan-300 transition-colors">${track.song}</p>
                <p class="text-xs text-gray-500 truncate">${track.artist}</p>
            </div>
            <div class="flex flex-col gap-1 items-end shrink-0">
                <span class="badge badge-xs bg-purple-900/50 text-purple-300 border-purple-500/20 font-mono">${track.key || '—'}</span>
                <span class="badge badge-xs bg-cyan-900/50 text-cyan-300 border-cyan-500/20 font-mono">${track.bpm || '—'} BPM</span>
            </div>
        </div>`
    ).join('')}</div>`
}
