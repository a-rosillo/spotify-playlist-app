const clientId = 'a91002a8aab14a76bb485df3e9c5ef62'
const redirectUri = 'https://spotify-api-project.netlify.app'
//const redirectUri = 'http://localhost:3000'
let accessToken = null

function getAccessToken () {
    const hashParams = getHashParams(window.location.href)
    accessToken = hashParams.accesstoken
    
    }

function authorize () {
    let url = 'https://accounts.spotify.com/authorize';
    url += '?response_type=token';
    url += '&client_id=' + encodeURIComponent(clientId);
    url += '&redirect_uri=' + encodeURIComponent(redirectUri);
    url += '&scope=playlist-modify-public'
    window.location = url
}

async function getCurrentUserId () {
    const endpoint = 'https://api.spotify.com/v1/me'
    const response = await fetch(endpoint,{
        method: 'GET',
        headers: {
            'Authorization': `Bearer ${accessToken}`
        },
    })
    const jsonData = await response.json()
    const id = jsonData.id
    return id
}

function getHashParams (url){
    const hashFragmentIndex = url.indexOf('#')
    const hashFragment = url.slice(hashFragmentIndex)
    if (hashFragment.indexOf('&') === -1){
        authorize()
    }
    let currentAmpersandIndex = hashFragment.indexOf('&')
    const ampersandIndicies =[]
    while (currentAmpersandIndex !== -1){
        ampersandIndicies.push(currentAmpersandIndex)
        currentAmpersandIndex = hashFragment.indexOf('&', currentAmpersandIndex + 1)
    }
    const keyValuePairs = getKeyValuePairs(hashFragment, ampersandIndicies)
    const hashParams = createObjectFromArrayOfPairs(keyValuePairs)
    return hashParams
}

function getKeyValuePairs (string, indicies){
    const pairs = []
    let start = null
    let end = null
    for (let index = 0; index < indicies.length + 1; index++) {
        if(index === 0){
            start = 0
        } else {
            start = indicies[index - 1]
        }
        if(index === indicies.length){
            end = undefined
        } else {
            end = indicies[index]
        }
        pairs.push(string.slice(start + 1, end)) //the +1 is to remove the # or & from the key
    }
    return pairs
}

function createObjectFromArrayOfPairs (arrayOfPairs) {
    let equalsIndex = null
    let key = ''
    let value = ''
    const params = {}
    arrayOfPairs.forEach((keyValuePair) => {
        equalsIndex = keyValuePair.indexOf('=')
        key = keyValuePair.slice(0,equalsIndex)
        value = keyValuePair.slice(equalsIndex + 1)
        params[key.replace("_", "")] = value
    })
    return params
}

async function searchSpotify(text) {
    if (window.location.href.indexOf('#') === -1){
        alert('Please authorise access to Spotify.')
        authorize()
    } else {
        if(!accessToken){
            getAccessToken()
        }
        const endpoint = 'https://api.spotify.com/v1/search'
        const type = ['track']
        const response = await fetch(`${endpoint}?q=${text}&type=${type}`,{
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
        })
        const jsonData = await response.json()
        const tracks = jsonData.tracks.items

        const formattedTracks = tracks.map(track => {
            const trackImportantInfo = {
                artist: track.artists[0].name,
                trackName: track.name,
                album: track.album.name,
                uri: track.uri
            }
            return trackImportantInfo
        })
        return formattedTracks
    }
}

async function createPlaylist (playlistName, playlistTracks){
    const playListId = await createEmptyPlaylist(playlistName)
    const uris = playlistTracks.map(track => track.uri)
    const trackUris = {
        uris: uris
    }
    addSongsToPlaylist(playListId, trackUris)
}

async function createEmptyPlaylist (playlistName) {
    if (window.location.href.indexOf('#') === -1){
        alert('Please authorise access to Spotify.')
        authorize()
    } else {
        if(!accessToken){
            getAccessToken()
        }
        if(typeof playlistName !== 'string'){
            throw Error('Playlist name must be a string')
        }
        const id = await getCurrentUserId()
        const endpoint = `https://api.spotify.com/v1/users/${id}/playlists`
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                "Authorization": `Bearer ${accessToken}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({name: playlistName})
        })
        const jsonData = await response.json()
        return jsonData.id
        
    }
}

function addSongsToPlaylist (playlistId, trackUris) {
    const endpoint = `https://api.spotify.com/v1/playlists/${playlistId}/tracks`
    fetch(endpoint, {
        method: 'POST',
        headers: {
            "Authorization": `Bearer ${accessToken}`,
            "Content-Type": "application/json"
        },
        body: JSON.stringify(trackUris)
    })
}

export { searchSpotify, createPlaylist }