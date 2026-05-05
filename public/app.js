let deckAKey  = null
let pickedKey = null

function keyToId(key) {
    return 'key-' + key.replace('#', 's')
}

function pickKey(key) {
    if (pickedKey !== null) {
        const prev = document.getElementById(keyToId(pickedKey))
        if (prev) prev.classList.remove('key-btn-active')
    }
    if (pickedKey === key) {
        pickedKey = null
        deckAKey  = null
        return
    }
    pickedKey = key
    deckAKey  = key
    const btn = document.getElementById(keyToId(key))
    if (btn) btn.classList.add('key-btn-active')
}

function switchDeckTab(tab) {
    const panelSearch = document.getElementById('deckPanelSearch')
    const panelKey    = document.getElementById('deckPanelKey')
    const tabSearch   = document.getElementById('deckTabSearch')
    const tabKey      = document.getElementById('deckTabKey')
    if (tab === 'search') {
        panelSearch.classList.remove('hidden')
        panelKey.classList.add('hidden')
        tabSearch.classList.add('modal-tab-active')
        tabKey.classList.remove('modal-tab-active')
    } else {
        panelSearch.classList.add('hidden')
        panelKey.classList.remove('hidden')
        tabSearch.classList.remove('modal-tab-active')
        tabKey.classList.add('modal-tab-active')
    }
}

// Dual-handle range slider factory
function initDualRangeSlider({ minId, maxId, minLabelId, maxLabelId, fillId, rangeMin, rangeMax }) {
    const minThumb = document.getElementById(minId)
    const maxThumb = document.getElementById(maxId)
    const minLabel = document.getElementById(minLabelId)
    const maxLabel = document.getElementById(maxLabelId)
    const fill     = document.getElementById(fillId)
    const TOTAL    = rangeMax - rangeMin

    function updateDisplay() {
        let minVal = parseInt(minThumb.value)
        let maxVal = parseInt(maxThumb.value)

        if (minVal > maxVal) { minVal = maxVal; minThumb.value = minVal }
        if (maxVal < minVal) { maxVal = minVal; maxThumb.value = maxVal }

        minLabel.textContent = minVal
        maxLabel.textContent = maxVal

        fill.style.left  = ((minVal - rangeMin) / TOTAL * 100) + '%'
        fill.style.right = ((rangeMax - maxVal)  / TOTAL * 100) + '%'

        minThumb.style.zIndex = minVal > (rangeMax + rangeMin) / 2 ? 5 : 3
    }

    minThumb.addEventListener('input', updateDisplay)
    maxThumb.addEventListener('input', updateDisplay)
    updateDisplay()
}

document.addEventListener('DOMContentLoaded', () => {
    initDualRangeSlider({
        minId: 'bpmRangeMin', maxId: 'bpmRangeMax',
        minLabelId: 'bpmMin', maxLabelId: 'bpmMax',
        fillId: 'bpmRangeFill', rangeMin: 60, rangeMax: 220
    })

    initDualRangeSlider({
        minId: 'popRangeMin', maxId: 'popRangeMax',
        minLabelId: 'popMin', maxLabelId: 'popMax',
        fillId: 'popRangeFill', rangeMin: 0, rangeMax: 100
    })
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

// ─────────────────────────────────────────────────────────────────────────────
// ARTIST TAB — commented out while the Artist tab is hidden from the UI.
// searchArtistSongs fetches top songs for a given artist and renders them as
// match cards in the #recommendations container.
// Re-enable by restoring the Artist tab in index.html and uncommenting below.
// ─────────────────────────────────────────────────────────────────────────────
// async function searchArtistSongs() {
//     const input = document.getElementById('artistSearchInput')
//     const container = document.getElementById('recommendations')
//     const countBadge = document.getElementById('matchCount')
//
//     const artist = input.value.trim()
//     if (!artist) return
//
//     container.innerHTML = `
//         <div class="flex items-center justify-center h-full">
//             <span class="loading loading-spinner loading-md" style="color:#c8a86e"></span>
//         </div>`
//     if (countBadge) countBadge.textContent = ''
//
//     const response = await fetch(`/artist-songs?artist=${encodeURIComponent(artist)}`)
//     const data = await response.json()
//
//     if (data.error) {
//         container.innerHTML = `
//             <div class="flex items-center justify-center h-full text-sm" style="color:#c0806a">${data.error}</div>`
//         return
//     }
//
//     renderRecommendations(data.tracks)
// }

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
    const bpmMin = document.getElementById('bpmRangeMin').value
    const bpmMax = document.getElementById('bpmRangeMax').value

    const territoriesParam = selectedTerritories.length > 0 ? '&territories=' + selectedTerritories.join(',') : ''

    const langCodes = []
    selectedLanguages.forEach(function(code) { langCodes.push(code) })
    const languagesParam = langCodes.length > 0 ? '&languages=' + langCodes.join(',') : ''

    const response = await fetch('/rec-songs?key=' + encodeURIComponent(deckAKey) + '&year=' + encodeURIComponent(year) + '&genre=' + encodeURIComponent(genre) + '&bpmMin=' + bpmMin + '&bpmMax=' + bpmMax + territoriesParam + languagesParam)
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

// ─────────────────────────────────────────────────────────────────────────────
// ARTIST TAB — Tab switcher, also commented out with the Artist tab.
// Re-enable alongside searchArtistSongs and renderRecommendations below.
// ─────────────────────────────────────────────────────────────────────────────
// function switchDeckTab(tab) {
//     const tabs = ['artist', 'discover']
//     tabs.forEach(function(t) {
//         document.getElementById('deck-tab-' + t).classList.toggle('hidden', t !== tab)
//         const btn = document.querySelector('[data-tab="' + t + '"]')
//         if (btn) btn.classList.toggle('deck-tab-active', t === tab)
//     })
// }

// ─────────────────────────────────────────────────────────────────────────────
// ARTIST TAB — Renders a list of artist tracks into the #recommendations panel.
// Re-enable alongside searchArtistSongs and switchDeckTab above.
// ─────────────────────────────────────────────────────────────────────────────
// function renderRecommendations(tracks) {
//     const container = document.getElementById('recommendations')
//     const countBadge = document.getElementById('matchCount')
//
//     if (!tracks || tracks.length === 0) {
//         container.innerHTML = `
//             <div class="flex items-center justify-center h-full text-sm" style="color:#5a5248">
//                 No matches found.
//             </div>`
//         if (countBadge) countBadge.textContent = '0 found'
//         return
//     }
//
//     if (countBadge) countBadge.textContent = `${tracks.length} found`
//
//     const colors = [
//         'from-cyan-900 to-teal-700',
//         'from-violet-900 to-indigo-700',
//         'from-pink-900 to-rose-700',
//         'from-amber-900 to-orange-700',
//         'from-emerald-900 to-green-700',
//     ]
//
//     container.innerHTML = `<div class="absolute inset-0 flex flex-col gap-1.5 overflow-y-auto pr-0.5">${tracks.map((track, i) => `
//         <div class="match-card flex items-center gap-2.5 bg-[#111009] border border-white/[0.05] hover:border-[rgba(200,168,100,0.2)] rounded-lg px-3 py-2 cursor-pointer transition-all group shrink-0">
//             <div class="w-8 h-8 rounded-md bg-gradient-to-br ${colors[i % colors.length]} flex items-center justify-center text-xs shrink-0 overflow-hidden">
//                 ${track.image
//                     ? `<img src="${track.image}" class="w-full h-full object-cover" alt="">`
//                     : '♫'}
//             </div>
//             <div class="flex-1 min-w-0">
//                 <p class="text-xs font-semibold truncate group-hover:text-[#c8a86e] transition-colors" style="color:#c8c0b4">${track.song}</p>
//                 <p class="text-[10px] truncate mt-0.5" style="color:#5a5248">${track.artist}</p>
//             </div>
//             <div class="flex gap-1 shrink-0">
//                 <span class="stat-badge stat-key">${track.key || '—'}</span>
//                 <span class="stat-badge stat-bpm">${track.bpm || '—'}</span>
//                 <span class="stat-badge stat-genre">${track.genre || '—'}</span>
//             </div>
//         </div>`
//     ).join('')}</div>`
// }

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
        { label: 'Rock',        value: 'Rock' }
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

// ─── MAP MODAL ──────────────────────────────────────────────────────────────

const CONTINENT_COUNTRIES = {
    'Africa': [
        'DZ','AO','BJ','BW','BF','BI','CM','CV','CF','TD','KM','CD','CG','CI','DJ',
        'EG','GQ','ER','SZ','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG',
        'MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO',
        'ZA','SS','SD','TZ','TG','TN','UG','ZM','ZW','EH','RE','YT','SH','IO','TF','BV'
    ],
    'Antarctica': ['AQ'],
    'Asia': [
        'AF','AM','AZ','BH','BD','BT','BN','KH','CN','CY','GE','HK','IN','ID','IR',
        'IQ','IL','JP','JO','KZ','KW','KG','LA','LB','MO','MY','MV','MN','MM','NP',
        'KP','OM','PK','PS','PH','QA','RU','SA','SG','KR','LK','SY','TW','TJ','TH',
        'TL','TR','TM','AE','UZ','VN','YE','CC','CX'
    ],
    'Europe': [
        'AL','AD','AT','BY','BE','BA','BG','HR','CZ','DK','EE','FI','FR','DE','GR',
        'HU','IS','IE','IT','XK','LV','LI','LT','LU','MT','MD','MC','ME','NL','MK',
        'NO','PL','PT','RO','SM','RS','SK','SI','ES','SE','CH','UA','GB','VA','AX',
        'FO','GI','GG','IM','JE','SJ'
    ],
    'North America': [
        'AG','BS','BB','BZ','CA','CR','CU','DM','DO','SV','GD','GT','HT','HN','JM',
        'MX','NI','PA','KN','LC','VC','TT','US','AI','AW','BM','BQ','VG','KY','CW',
        'GL','GP','MQ','MS','PR','BL','MF','SX','TC','VI','PM'
    ],
    'South America': [
        'AR','BO','BR','CL','CO','EC','GY','PY','PE','SR','UY','VE','FK','GF','GS'
    ],
    'Oceania': [
        'AU','FJ','KI','MH','FM','NR','NZ','PW','PG','WS','SB','TO','TV','VU','CK',
        'NU','AS','GU','MP','PF','NC','WF','TK','NF','PN','UM','HM'
    ],
}

let regionMap        = null
let mapInitializing  = false
let hoveredContinent = null

const selectedContinents = new Set()
const continentLayers    = {}
let selectedTerritories  = []

const STYLE_DEFAULT  = { color: 'rgba(255,255,255,0.15)', weight: 0.5, fillColor: 'rgba(200,168,100,0.06)', fillOpacity: 1 }
const STYLE_HOVER    = { color: 'rgba(200,168,100,0.70)', weight: 1,   fillColor: 'rgba(200,168,100,0.20)', fillOpacity: 1 }
const STYLE_SELECTED = { color: 'rgba(192,132,252,0.80)', weight: 1.5, fillColor: 'rgba(192,132,252,0.22)', fillOpacity: 1 }
const STYLE_SEL_HOV  = { color: 'rgba(192,132,252,1.00)', weight: 2,   fillColor: 'rgba(192,132,252,0.34)', fillOpacity: 1 }

function styleFor(name, hovering) {
    const selected = selectedContinents.has(name)
    if (selected && hovering) return STYLE_SEL_HOV
    if (selected)             return STYLE_SELECTED
    if (hovering)             return STYLE_HOVER
    return STYLE_DEFAULT
}

function paintContinent(name, hovering) {
    const layers = continentLayers[name]
    if (!layers) return
    const style = styleFor(name, hovering)
    for (let i = 0; i < layers.length; i++) {
        layers[i].setStyle(style)
    }
}

function setHover(name) {
    if (hoveredContinent === name) return
    if (hoveredContinent !== null) paintContinent(hoveredContinent, false)
    hoveredContinent = name
    if (name !== null) paintContinent(name, true)
}

function openMapModal() {
    document.getElementById('mapModal').classList.remove('hidden')
    if (regionMap !== null || mapInitializing) return
    mapInitializing = true

    // Give the browser one frame to render the modal before Leaflet measures the container
    setTimeout(function() {
        regionMap = L.map('regionMap', {
            zoomControl: false,
            attributionControl: false,
            minZoom: 2,
            maxZoom: 5
        }).setView([20, 0], 2)

        // dark_nolabels: solid dark tiles — no roads, cities, or text cluttering the view
        L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_nolabels/{z}/{x}/{y}{r}.png', {
            subdomains: 'abcd'
        }).addTo(regionMap)

        // Natural Earth 110m countries — small file, has CONTINENT property on each feature
        fetch('https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson')
            .then(function(r) { return r.json() })
            .then(function(data) {
                L.geoJSON(data, {
                    style: function() { return STYLE_DEFAULT },
                    onEachFeature: function(feature, layer) {
                        let continent = feature.properties.CONTINENT || 'Unknown'
                        // Natural Earth places Russia in Europe; override to Asia
                        if (feature.properties.ISO_A3 === 'RUS') continent = 'Asia'

                        if (!continentLayers[continent]) {
                            continentLayers[continent] = []
                        }
                        continentLayers[continent].push(layer)

                        layer.bindTooltip(continent, {
                            sticky: true,
                            className: 'continent-tooltip'
                        })

                        layer.on('mouseover', function() { setHover(continent) })
                        layer.on('mouseout',  function() { setHover(null) })

                        layer.on('click', function() {
                            if (selectedContinents.has(continent)) {
                                selectedContinents.delete(continent)
                            } else {
                                selectedContinents.add(continent)
                            }
                            paintContinent(continent, hoveredContinent === continent)

                            selectedTerritories = []
                            selectedContinents.forEach(function(c) {
                                const codes = CONTINENT_COUNTRIES[c] || []
                                for (let j = 0; j < codes.length; j++) {
                                    if (selectedTerritories.indexOf(codes[j]) === -1) {
                                        selectedTerritories.push(codes[j])
                                    }
                                }
                            })
                        })
                    }
                }).addTo(regionMap)
            })
    }, 50)
}

function closeMapModal() {
    document.getElementById('mapModal').classList.add('hidden')
}

async function openChangelogModal() {
    document.getElementById('changelogModal').classList.remove('hidden')
    const list = document.getElementById('changelogList')
    list.innerHTML = '<div class="flex items-center justify-center py-8"><span class="loading loading-spinner loading-md" style="color:#c8a86e"></span></div>'

    const response = await fetch('https://api.github.com/repos/gandara-lfg/Mixroot/commits?per_page=20')
    if (!response.ok) {
        list.innerHTML = '<p style="color:#c0806a;font-size:12px;padding:16px">Could not load commits.</p>'
        return
    }
    const commits = await response.json()

    list.innerHTML = commits.map(function(c) {
        const msg    = c.commit.message.split('\n')[0]
        const sha    = c.sha.substring(0, 7)
        const date   = new Date(c.commit.author.date)
        const label  = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
        return '<a href="' + c.html_url + '" target="_blank" class="commit-item">' +
            '<span class="commit-msg">' + msg + '</span>' +
            '<span class="commit-meta">' +
                '<span class="commit-sha">' + sha + '</span>' +
                '<span class="commit-date">' + label + '</span>' +
            '</span>' +
        '</a>'
    }).join('')
}

function closeChangelogModal() {
    document.getElementById('changelogModal').classList.add('hidden')
}

function switchModalTab(tab) {
    const panelRegions   = document.getElementById('panelRegions')
    const panelLanguages = document.getElementById('panelLanguages')
    const tabRegions     = document.getElementById('tabRegions')
    const tabLanguages   = document.getElementById('tabLanguages')

    if (tab === 'regions') {
        panelRegions.classList.remove('hidden')
        panelLanguages.classList.add('hidden')
        tabRegions.classList.add('modal-tab-active')
        tabLanguages.classList.remove('modal-tab-active')
        if (regionMap) regionMap.invalidateSize()
    } else {
        panelRegions.classList.add('hidden')
        panelLanguages.classList.remove('hidden')
        tabRegions.classList.remove('modal-tab-active')
        tabLanguages.classList.add('modal-tab-active')
    }
}

const selectedLanguages = new Set()

function toggleLanguage(code) {
    if (selectedLanguages.has(code)) {
        selectedLanguages.delete(code)
    } else {
        selectedLanguages.add(code)
    }
    const btn = document.getElementById('lang-' + code)
    if (btn) {
        if (selectedLanguages.has(code)) {
            btn.classList.add('lang-pill-active')
        } else {
            btn.classList.remove('lang-pill-active')
        }
    }
}
