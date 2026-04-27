let deckAKey = null

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

        const leftPct  = ((minVal - RANGE_MIN) / TOTAL) * 100
        const rightPct = ((RANGE_MAX - maxVal)  / TOTAL) * 100
        fill.style.left  = leftPct  + '%'
        fill.style.right = rightPct + '%'

        if (minVal > (RANGE_MAX + RANGE_MIN) / 2) {
            minThumb.style.zIndex = 5
        } else {
            minThumb.style.zIndex = 3
        }
    }

    minThumb.addEventListener('input', updateDisplay)
    maxThumb.addEventListener('input', updateDisplay)

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
            <div class="info-empty h-full rounded-2xl">
                <p class="info-empty-text" style="color:#c0806a">Please enter both a song and artist.</p>
            </div>`
        return
    }

    result.innerHTML = `
        <div class="info-empty h-full rounded-2xl">
            <span class="loading loading-spinner loading-md" style="color:#c8a86e"></span>
        </div>`

    const response = await fetch(
        `/search?song=${encodeURIComponent(song)}&artist=${encodeURIComponent(artist)}`
    )

    const data = await response.json()

    if (data.error) {
        result.innerHTML = `
            <div class="info-empty h-full rounded-2xl">
                <p class="info-empty-text" style="color:#c0806a">${data.error}</p>
            </div>`
        return
    }

    deckAKey = data.key || null

    result.innerHTML = `
        <div class="h-full rounded-2xl bg-[#0f0d0a] border border-[rgba(200,168,100,0.15)] p-4 flex flex-col justify-between">
            <div class="flex items-center gap-3">
                <img src="${data.image || ''}" alt="Album"
                    class="w-14 h-14 rounded-xl object-cover shrink-0 bg-[#1a1610]"
                    onerror="this.style.display='none'">
                <div class="min-w-0">
                    <p class="font-bold text-white text-sm leading-tight truncate">${data.song}</p>
                    <p class="text-xs truncate" style="color:#6a6258">${data.artist}</p>
                    ${data.album ? `<p class="text-[10px] mt-0.5 truncate" style="color:#48443a">${data.album}</p>` : ''}
                </div>
            </div>
            <div class="grid grid-cols-3 gap-2 mt-3">
                <div class="rounded-xl p-2 text-center" style="background:rgba(192,132,252,0.06);border:1px solid rgba(192,132,252,0.15)">
                    <p class="text-[9px] uppercase tracking-wider" style="color:rgba(192,132,252,0.5)">Key</p>
                    <p class="text-sm font-bold mt-0.5" style="color:#c084fc">${data.key || '—'}</p>
                </div>
                <div class="rounded-xl p-2 text-center" style="background:rgba(56,189,248,0.06);border:1px solid rgba(56,189,248,0.15)">
                    <p class="text-[9px] uppercase tracking-wider" style="color:rgba(56,189,248,0.5)">BPM</p>
                    <p class="text-sm font-bold mt-0.5" style="color:#38bdf8">${data.bpm || '—'}</p>
                </div>
                <div class="rounded-xl p-2 text-center" style="background:rgba(244,114,182,0.06);border:1px solid rgba(244,114,182,0.15)">
                    <p class="text-[9px] uppercase tracking-wider" style="color:rgba(244,114,182,0.5)">Genre</p>
                    <p class="text-sm font-bold mt-0.5" style="color:#f472b6">${data.genres && data.genres.length > 0 ? data.genres[0] : '—'}</p>
                    <p class="text-[10px] font-semibold mt-0.5" style="color:rgba(244,114,182,0.5)">${data.genres && data.genres.length > 1 ? data.genres[1] : ''}</p>
                </div>
            </div>
            ${data.spotifyUrl ? `
            <a href="${data.spotifyUrl}" target="_blank"
                class="btn btn-xs btn-outline mt-2 rounded-lg font-semibold"
                style="border-color:rgba(200,168,100,0.2);color:#c8a86e">
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

async function searchRecSongs() {
    const container = document.getElementById('rec-results')
    const countBadge = document.getElementById('recMatchCount')

    if (!deckAKey) {
        container.innerHTML = `
            <div class="flex items-center justify-center h-full text-sm" style="color:#c0806a">
                Load a song on Deck A first.
            </div>`
        return
    }

    container.innerHTML = `
        <div class="flex items-center justify-center h-full">
            <span class="loading loading-spinner loading-md" style="color:#c8a86e"></span>
        </div>`
    if (countBadge) countBadge.textContent = ''

    const year = document.getElementById('yearFilter').value
    const genre = document.getElementById('genreFilter').value
    const response = await fetch('/rec-songs?key=' + encodeURIComponent(deckAKey) + '&year=' + encodeURIComponent(year) + '&genre=' + encodeURIComponent(genre))
    const data = await response.json()

    if (data.error) {
        container.innerHTML = `
            <div class="flex items-center justify-center h-full text-sm" style="color:#c0806a">${data.error}</div>`
        return
    }

    const tracks = data.tracks
    if (!tracks || tracks.length === 0) {
        container.innerHTML = `
            <div class="flex items-center justify-center h-full text-sm" style="color:#5a5248">No matches found.</div>`
        if (countBadge) countBadge.textContent = '0 found'
        return
    }

    if (countBadge) countBadge.textContent = tracks.length + ' found'

    const colors = [
        'from-cyan-900 to-teal-700',
        'from-violet-900 to-indigo-700',
        'from-pink-900 to-rose-700',
        'from-amber-900 to-orange-700',
        'from-emerald-900 to-green-700',
    ]

    container.innerHTML = '<div class="absolute inset-0 flex flex-col gap-1.5 overflow-y-auto pr-0.5">' + tracks.map(function(track, i) {
        return `
        <div class="match-card flex items-center gap-2.5 bg-[#111009] border border-white/[0.05] hover:border-[rgba(200,168,100,0.2)] rounded-lg px-3 py-2 cursor-pointer transition-all group shrink-0">
            <div class="w-8 h-8 rounded-md bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center text-xs shrink-0 overflow-hidden">
                ${track.image ? '<img src="' + track.image + '" class="w-full h-full object-cover" alt="">' : '♫'}
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold truncate group-hover:text-[#c8a86e] transition-colors" style="color:#c8c0b4">${track.song}</p>
                <p class="text-[10px] truncate mt-0.5" style="color:#5a5248">${track.artist}</p>
            </div>
            <div class="flex gap-1 shrink-0">
                <span class="stat-badge stat-key">${track.key || '—'}</span>
                <span class="stat-badge stat-bpm">${track.bpm || '—'}</span>
                <span class="stat-badge stat-year">${track.releaseYear || '—'}</span>
            </div>
        </div>`
    }).join('') + '</div>'
}

// ─── DECK B TAB SWITCHING ───────────────────────────────────────────────────

function switchDeckTab(tab) {
    const tabs = ['artist', 'discover']
    tabs.forEach(function(t) {
        document.getElementById('deck-tab-' + t).classList.toggle('hidden', t !== tab)
        const btn = document.querySelector('[data-tab="' + t + '"]')
        if (btn) btn.classList.toggle('deck-tab-active', t === tab)
    })
}

// ─── DRAGGABLE KNOBS ────────────────────────────────────────────────────────

document.addEventListener('DOMContentLoaded', () => {
    const genreOptions = [
        { label: 'All Genres',  value: '' },
        { label: 'Electronic',  value: 'Electronic' },
        { label: 'Hip-Hop',     value: 'Hip-Hop' },
        { label: 'Pop',         value: 'Pop' },
        { label: 'Latin',       value: 'Latin' },
        { label: 'R&B',         value: 'R&B' },
        { label: 'Dance',       value: 'Dance' },
    ]

    const sortOptions = [
        { label: 'Key Match', value: 'Key Match' },
    ]

    const yearOptions = [
        { label: 'All Years', value: '' },
        { label: '1970s',     value: '1970' },
        { label: '1980s',     value: '1980' },
        { label: '1990s',     value: '1990' },
        { label: '2000s',     value: '2000' },
        { label: '2010s',     value: '2010' },
        { label: '2020s',     value: '2020' },
    ]

    initDragKnob('genreKnob', genreOptions, 'genreFilter', 'genreLabel')
    initDragKnob('sortKnob',  sortOptions,  'sortBy',      'sortLabel')
    initDragKnob('yearKnob',  yearOptions,  'yearFilter',  'yearLabel')
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

function renderRecommendations(tracks) {
    const container = document.getElementById('recommendations')
    const countBadge = document.getElementById('matchCount')

    if (!tracks || tracks.length === 0) {
        container.innerHTML = `
            <div class="flex items-center justify-center h-full text-sm" style="color:#5a5248">
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

    container.innerHTML = `<div class="absolute inset-0 flex flex-col gap-1.5 overflow-y-auto pr-0.5">${tracks.map((track, i) => `
        <div class="match-card flex items-center gap-2.5 bg-[#111009] border border-white/[0.05] hover:border-[rgba(200,168,100,0.2)] rounded-lg px-3 py-2 cursor-pointer transition-all group shrink-0">
            <div class="w-8 h-8 rounded-md bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center text-xs shrink-0 overflow-hidden">
                ${track.image
                    ? `<img src="${track.image}" class="w-full h-full object-cover" alt="">`
                    : '♫'}
            </div>
            <div class="flex-1 min-w-0">
                <p class="text-xs font-semibold truncate group-hover:text-[#c8a86e] transition-colors" style="color:#c8c0b4">${track.song}</p>
                <p class="text-[10px] truncate mt-0.5" style="color:#5a5248">${track.artist}</p>
            </div>
            <div class="flex gap-1 shrink-0">
                <span class="stat-badge stat-key">${track.key || '—'}</span>
                <span class="stat-badge stat-bpm">${track.bpm || '—'}</span>
                <span class="stat-badge stat-genre">${track.genre || '—'}</span>
            </div>
        </div>`
    ).join('')}</div>`
}
