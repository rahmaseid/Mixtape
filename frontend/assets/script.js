/*
 * Mixtape Frontend Script
 * Handles theme toggling, form switching, and mixtape creation
*/

// Messages for radio display
const messages = [
    "CREATE YOUR MIXTAPE",
    "CUSTOMIZE YOUR SOUND",
    "YOUR PERSONAL PLAYLIST"
];

// Variables to track state
let currentMessage = 0;
let isProcessing = false;
let originalMessage = "";
let messageInterval;

// Playback variables 
let playlists = [];
let previousPlaylists = [];
let currentPlaylistIndex = 0;
let currentTrack = 0;
let isPlaying = false;
let playerInterval;
let currentTime = 0;
let currentDuration = 0;
let isPaused = true;
let pauseTimeout = null;
// Variable for YT API
let ytPlayer;
let youtubeApiLoaded = false;
let domLoaded = false;

function maybeInitYouTubePlayer() {
    // Only create the player once, when both DOM and API are ready
    if (ytPlayer) return;
    if (!youtubeApiLoaded || !domLoaded) return;
    if (typeof YT === 'undefined' || typeof YT.Player === 'undefined') return;

    console.log("Initialising YouTube player");
    initYouTubePlayer();
}


// Initialize theme from localStorage or default to light
function initTheme() {
    const savedTheme = localStorage.getItem('darkMode') === 'true';
    const isDarkMode = savedTheme || false;
    
    if (isDarkMode) {
        document.body.classList.add('dark-mode');
    }
    
    const themeBtn = document.querySelector('.theme-btn');
    if (themeBtn) {
        themeBtn.textContent = isDarkMode ? 'Light Mode' : ' Dark Mode';
    }
}

// Create and set up the theme toggle button
function setupThemeToggle() {
    const themeBtn = document.createElement('button');
    themeBtn.className = 'theme-btn';
    themeBtn.textContent = ' Dark Mode';
    
    themeBtn.addEventListener('click', () => {
        const isDarkMode = document.body.classList.toggle('dark-mode');
        localStorage.setItem('darkMode', isDarkMode.toString());
        themeBtn.textContent = isDarkMode ? ' Light Mode' : ' Dark Mode';
    });
    
    document.body.appendChild(themeBtn);
}

// Start cycling radio messages
function startMessageCycle() {
    messageInterval = setInterval(() => {
        if (!isProcessing) {
            currentMessage = (currentMessage + 1) % messages.length;
            const radioMessage = document.getElementById('radio-message');
            if (radioMessage) {
                radioMessage.textContent = messages[currentMessage];
            }
        }
    }, 3000);
}

// Switch between login and mixtape views
function switchToMixtapeView() {
    document.getElementById('login-view').classList.add('hidden');
    document.getElementById('mixtape-view').classList.remove('hidden');
    clearInterval(messageInterval);
}

// Switch back to login view
function switchToLoginView() {
    document.getElementById('mixtape-view').classList.add('hidden');
    document.getElementById('playback-view').classList.add('hidden');
    document.getElementById('login-view').classList.remove('hidden');
    
    // Reset login form
    document.getElementById('login-form').reset();
    
    // Show login container, hide signup container
    document.getElementById('login-container').classList.remove('hidden');
    document.getElementById('signup-container').classList.add('hidden');
    
    // Restart message cycling
    startMessageCycle();
    
    // Show welcome back message
    isProcessing = true;
    document.getElementById('radio-message').textContent = "WELCOME BACK";
    setTimeout(() => { isProcessing = false; }, 2000);
}

// Update track numbers when tracks are added/removed
function updateTrackNumbers() {
    const tracksContainer = document.getElementById('tracks-container');
    if (!tracksContainer) return;
    
    const trackItems = tracksContainer.querySelectorAll('.track-item');
    trackItems.forEach((item, index) => {
        item.querySelector('.track-number').textContent = index + 1;
    });
}

// YouTube player ready callback
function onPlayerReady(event) {
    console.log("YouTube player ready");
}

// YouTube player state change callback
function onPlayerStateChange(event) {
    if (event.data === YT.PlayerState.ENDED) {
        nextTrack();
    }
}

// Initialize YouTube player
function initYouTubePlayer() {
    ytPlayer = new YT.Player('yt-player', {
        height: '0',
        width: '0',
        events: {
            'onReady': onPlayerReady,
            'onStateChange': onPlayerStateChange
        }
    });
}

// Called by YouTube API when it's ready  
window.onYouTubeIframeAPIReady = function () {
    console.log("YouTube iframe API ready");
    youtubeApiLoaded = true;
    maybeInitYouTubePlayer();
};

// Initialize the application when DOM is fully loaded
document.addEventListener('DOMContentLoaded', () => {
    domLoaded = true;
    maybeInitYouTubePlayer();
    // Set up theme
    initTheme();
    setupThemeToggle();
    
    // Start radio message cycle
    startMessageCycle();

    function ensureYouTubePlayer() {
        // If it already exists, we're done
        if (ytPlayer) {
            console.log('ytPlayer already initialized');
            return;
        }
    
        // If the API is loaded, create the player now
        if (window.YT && window.YT.Player) {
            console.log('YouTube API detected, initializing player (fallback)');
            initYouTubePlayer();
            return;
        }
    
        // Otherwise, keep checking until it’s there
        console.log('Waiting for YouTube API...');
        setTimeout(ensureYouTubePlayer, 300);
    }
    
    // Kick off the check
    ensureYouTubePlayer();
        
    // Set up logout button functionality
    const logoutBtn = document.getElementById('logout-btn');
    if (logoutBtn) {
        logoutBtn.addEventListener('click', function(e) {
            e.preventDefault();
            fetch('../backend/auth/logout.php')
                .then(res => res.json())
                .then(data => {
                    console.log(data.message);
                    switchToLoginView();
                });
        });        
    }
    
    // Logout button for playback view
    const logoutBtnPlayback = document.getElementById('logout-btn-playback');
    if (logoutBtnPlayback) {
        logoutBtnPlayback.addEventListener('click', function(e) {
            e.preventDefault();
            fetch('../backend/auth/logout.php')
                .then(res => res.json())
                .then(data => {
                    console.log(data.message);
                    switchToLoginView();
                })
                .catch(error => {
                    console.error("Logout error:", error);
                    switchToLoginView();
                });
        });
    }

    const prevPlaylistBtnMixtape = document.getElementById('prev-playlist-btn-mixtape');
    if (prevPlaylistBtnMixtape) {
        prevPlaylistBtnMixtape.addEventListener('click', function(e) {
            e.preventDefault();
            // Show previous playlists container in mixtape view
            document.getElementById('mixtape-form-container').classList.add('hidden');
            document.getElementById('previous-playlists-mixtape').classList.remove('hidden');
            loadPreviousPlaylists('mixtape');
        });
    }
    
    // Add event listener for back button in previous playlists view (mixtape creation)
    const backToMixtapeBtn = document.getElementById('back-to-mixtape-btn');
    if (backToMixtapeBtn) {
        backToMixtapeBtn.addEventListener('click', function(e) {
            e.preventDefault();
            // Hide previous playlists and show mixtape form
            document.getElementById('previous-playlists-mixtape').classList.add('hidden');
            document.getElementById('mixtape-form-container').classList.remove('hidden');
        });
    }

    // Form toggling functionality - Switch to signup form
    document.getElementById('show-signup').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('login-container').classList.add('hidden');
        document.getElementById('signup-container').classList.remove('hidden');
        
        // Pause message cycling and show specific message
        isProcessing = true;
        originalMessage = document.getElementById('radio-message').textContent;
        document.getElementById('radio-message').textContent = "CREATE NEW ACCOUNT";
        
        // Resume message cycling after delay
        setTimeout(() => { isProcessing = false; }, 2000);
    });
    
    // Form toggling functionality - Switch to login form
    document.getElementById('show-login').addEventListener('click', function(e) {
        e.preventDefault();
        document.getElementById('signup-container').classList.add('hidden');
        document.getElementById('login-container').classList.remove('hidden');
        
        // Pause message cycling and show specific message
        isProcessing = true;
        originalMessage = document.getElementById('radio-message').textContent;
        document.getElementById('radio-message').textContent = "WELCOME BACK";
        
        // Resume message cycling after delay
        setTimeout(() => { isProcessing = false; }, 2000);
    });

    // Handle login form submission
    document.getElementById('login-form').addEventListener('submit', function(e) {
        e.preventDefault();
        isProcessing = true;
        document.getElementById('radio-message').textContent = "LOGGING IN...";
    
        const formData = new FormData(document.getElementById('login-form'));
    
        fetch('../backend/auth/login.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.json())
        .then(data => {
            if (data.status === 'success') {
                document.getElementById('radio-message').textContent = "Login successful!";
                switchToMixtapeView();
            } else {
                document.getElementById('radio-message').textContent = data.message || "Login failed.";
            }
        })
        .catch(error => {
            console.error("Login error:", error);
            document.getElementById('radio-message').textContent = "Server error.";
        })
        .finally(() => {
            isProcessing = false;
        });
    });
    
    // Handle signup form submission
    document.getElementById('signup-form').addEventListener('submit', function(e) {
        e.preventDefault();
        isProcessing = true;
        document.getElementById('radio-message').textContent = "CREATING ACCOUNT...";
        
        const formData = new FormData(document.getElementById('signup-form'));

        fetch('../backend/auth/register.php', {
            method: 'POST',
            body: formData
        })
        .then(response => response.text())
        .then(text => {
            console.log('Raw response:', text);
            try {
                const data = JSON.parse(text);
                if (data.status === 'success') {
                    document.getElementById('radio-message').textContent = "Registered successfully!";
                    switchToMixtapeView();
                } else {
                    document.getElementById('radio-message').textContent = data.message || "Registration failed.";
                }
            } catch (e) {
                console.error("JSON parse error:", e);
                console.error("Raw response:", text);
                document.getElementById('radio-message').textContent = "Server error.";
            }
        })
        .catch(error => {
            console.error("Fetch error:", error);
            document.getElementById('radio-message').textContent = "Network error.";
        })
        .finally(() => {
            isProcessing = false;
        });        
    });

    // Get references to mixtape view elements
    const mixtapeTitle = document.getElementById('mixtape-title');
    const tapeTitle = document.getElementById('tape-title');
    const addTrackBtn = document.getElementById('add-track');
    const tracksContainer = document.getElementById('tracks-container');
    const createMixtapeBtn = document.getElementById('create-mixtape');
    
    // Update title when user types in title field
    if (mixtapeTitle && tapeTitle) {
        mixtapeTitle.addEventListener('input', function() {
            tapeTitle.textContent = this.value || "Your Mixtape Title";
        });
    }
    
      // Add new track when add button is clicked
      if (addTrackBtn && tracksContainer) {
        addTrackBtn.addEventListener('click', () => {
            // Check if max tracks limit is reached
            const currentTracks = tracksContainer.querySelectorAll('.track-item').length;
            if (currentTracks >= 10) {
                alert("Maximum 10 tracks allowed!");
                return;
            }
            
            // Create and append new track item
         
const trackItem = document.createElement('div');
trackItem.className = 'track-item';
trackItem.innerHTML = `
    <div class="track-number">${currentTracks + 1}</div>
    <div class="track-input-container">
        <input type="text" class="youtube-link" placeholder="Paste YouTube link here...">
    </div>
    <button class="remove-track" title="Remove this track">
        <img src="assets/remove.png" alt="Remove" class="remove-icon">
    </button>
`;
            tracksContainer.appendChild(trackItem);
            updateTrackNumbers();
        });
    }
    
    // Handle track removal using event delegation
       
        if (tracksContainer) {
            tracksContainer.addEventListener('click', (e) => {
                // Check if the clicked element is the remove button or the image inside it
                if (e.target.classList.contains('remove-track') || 
                    e.target.classList.contains('remove-icon') || 
                    e.target.parentElement.classList.contains('remove-track')) {
                    
                    // Get the track item element
                    const trackItem = e.target.closest('.track-item');
                    
                    // If it's the last track, just clear the input instead of removing
                    if (tracksContainer.querySelectorAll('.track-item').length <= 1) {
                        const input = trackItem.querySelector('.youtube-link');
                        if (input) input.value = '';
                        return;
                    }
                    
                    // Otherwise remove the track item completely
                    trackItem.remove();
                    updateTrackNumbers();
                }
            });
        }

    // Tab switching functionality
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            // Toggle active class
            document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            if (this.textContent === 'Previous Playlists') {
                document.getElementById('playlist').classList.add('hidden');
                document.getElementById('previous-playlists').classList.remove('hidden');
                loadPreviousPlaylists();
            } else {
                document.getElementById('playlist').classList.remove('hidden');
                document.getElementById('previous-playlists').classList.add('hidden');
            }
        });
    });

    // Load and play a track
    function playTrack(videoId) {
        if (!ytPlayer) return;
        
        ytPlayer.loadVideoById(videoId);
        ytPlayer.playVideo();
        isPaused = false;
        document.getElementById('play-pause-icon').src = 'assets/pause.png';
        
        // Update duration from API
        updateTrackDuration();
        
        startProgress();
    }
    
    // Update track duration display
    function updateTrackDuration() {
        if (!ytPlayer) return;
        
        setTimeout(() => {
            currentDuration = ytPlayer.getDuration();
            const formattedDuration = formatDuration(currentDuration);
            document.getElementById('duration').textContent = formattedDuration;
            
            const trackItems = document.querySelectorAll('#playlist .track-item');
            if (trackItems[currentTrack]) {
                trackItems[currentTrack].querySelector('.track-duration').textContent = formattedDuration;
            }
        }, 1000);
    }
    
    // Extract YouTube ID from various URL formats
    function extractYouTubeId(url) {
        // Standard URL
        let match = url.match(/(?:\?|\&)v=([^&#\s]{11})/);
        if (match && match[1]) return match[1];

        // youtu.be links
        match = url.match(/youtu\.be\/([^"&?\/\s]{11})/);
        if (match && match[1]) return match[1];
        
        // Embedded player URLs
        match = url.match(/\/embed\/([^"&?\/\s]{11})/);
        if (match && match[1]) return match[1];
        
        // URL with v= parameter
        match = url.match(/[?&]v=([^"&?\/\s]{11})/);
        if (match && match[1]) return match[1];
        
        // URL with vi= parameter
        match = url.match(/[?&]vi=([^"&?\/\s]{11})/);
        if (match && match[1]) return match[1];
        
        // No match found
        return null;
    }

    // Fetch video data from YouTube API
    async function fetchVideoData(url) {
        const videoId = extractYouTubeId(url);
        if (!videoId) {
            console.error('Invalid YouTube URL:', url);
            return {
                title: `[Invalid YouTube URL]`,
                duration: '0:00',
                durationSeconds: 0,
                videoId: videoId
            };
        }
    
        try {
            const response = await fetch(`../backend/mixtape/video_info.php?video_id=${videoId}`);
            const text = await response.text();
    
            console.log("Raw response:", text);
    
            const data = JSON.parse(text);
    
            if (!data || !data.duration) {
                throw new Error('Invalid response structure');
            }
    
            return {
                title: data.title || `Track ${newPlaylist.tracks.length + 1}`,
                duration: formatDuration(data.duration),
                durationSeconds: data.duration,
                videoId: videoId
            };            
        } catch (error) {
            console.error('Error fetching video metadata:', error);
            return {
                title: `[Error Loading] ${videoId}`,
                duration: '0:00',
                durationSeconds: 0,
                videoId: videoId
            };
        }
    }
    
    // Convert seconds to minutes:seconds format
    function formatDuration(seconds) {
        const secs = Number(seconds) || 0;
        const mins = Math.floor(secs / 60);
        const remainingSecs = Math.floor(secs % 60);
        return `${mins}:${remainingSecs < 10 ? '0' : ''}${remainingSecs}`;
    }
    
    // Handle mixtape creation
    if (createMixtapeBtn && tracksContainer) {
        createMixtapeBtn.addEventListener('click', async () => {
            const title = mixtapeTitle.value.trim();
            if (!title) {
                alert("Please provide a title for your mixtape!");
                return;
            }
    
            const trackInputs = tracksContainer.querySelectorAll('.youtube-link');
            const tracks = [];
    
            trackInputs.forEach(input => {
                const value = input.value.trim();
                if (value) tracks.push(value);
            });
    
            if (tracks.length === 0) {
                alert("Please add at least one track to your mixtape!");
                return;
            }
    
            isProcessing = true;
            document.getElementById('tape-title').textContent = "CREATING...";
    
            try {
                const newPlaylist = {
                    title: title,
                    date: new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
                    tracks: [],
                    description: generateDescription(title)
                };
    
                const songIds = [];
    
                for (let i = 0; i < tracks.length; i++) {
                    const url = tracks[i];
                    const videoId = extractYouTubeId(url);
                    if (videoId) {
                        const data = await fetchVideoData(url);
    
                        newPlaylist.tracks.push({
                            id: videoId,
                            title: data.title || `Track ${i + 1}`,
                            artist: "YouTube",
                            duration: data.duration,
                            durationSeconds: data.durationSeconds,
                            videoId: videoId
                        });
    
                        songIds.push(videoId);
                    }
                }
    
                // Send to server for saving
                const response = await fetch('../backend/mixtape/create_mixtape.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                    body: new URLSearchParams({
                        title: title,
                        songs: JSON.stringify(songIds)
                    })
                });
    
                const result = await response.json();
                if (!result.success) {
                    console.error('Server error saving playlist:', result.error);
                    alert('Failed to save playlist to the database.');
                    return;
                }
    
                // Add to local playlist and switch views
                playlists.unshift(newPlaylist);
                currentPlaylistIndex = 0;
                renderPlaylist(currentPlaylistIndex);
                switchToPlaybackView();
                playTrack(newPlaylist.tracks[0].videoId);
    
            } catch (error) {
                console.error('Error creating mixtape:', error);
                alert('Error creating mixtape. Please try again.');
            } finally {
                isProcessing = false;
            }
        });
    }    
    
      // Switch to playback view
      function switchToPlaybackView() {
        document.getElementById('mixtape-view').classList.add('hidden');
        document.getElementById('playback-view').classList.remove('hidden');
        
        // Reset variables
        currentTrack = 0;
        isPaused = false;
        currentTime = 0;
        
        // Update controls
        setupPlayerControls();
        
       
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelector('.tab-btn:first-child').classList.add('active');
        
       
        document.getElementById('playlist').classList.remove('hidden');
        document.getElementById('previous-playlists').classList.add('hidden');
        
        // Render playlist
        renderPlaylist(currentPlaylistIndex);
        
        // Show first track as active
        updateNowPlayingDisplay();
    }

        // Set up player controls
        function setupPlayerControls() {
            const playBtn = document.getElementById('play-btn');
            const prevBtn = document.getElementById('prev-btn');
            const nextBtn = document.getElementById('next-btn');
            const createNewBtn = document.getElementById('create-new-btn');
            
            // Remove existing event listeners by cloning and replacing elements
            if (playBtn) {
                const newPlayBtn = playBtn.cloneNode(true);
                playBtn.parentNode.replaceChild(newPlayBtn, playBtn);
                newPlayBtn.addEventListener('click', togglePlay);
            }
            
            if (prevBtn) {
                const newPrevBtn = prevBtn.cloneNode(true);
                prevBtn.parentNode.replaceChild(newPrevBtn, prevBtn);
                newPrevBtn.addEventListener('click', () => {
                    if (!ytPlayer) return;
            
                    const time = ytPlayer.getCurrentTime();
            
                    if (time > 5) {
                        // Restart current track
                        ytPlayer.seekTo(0);
                        currentTime = 0;
                        document.getElementById('song-progress').style.width = '0%';
                        document.getElementById('current-time').textContent = '0:00';
            
                        if (!isPaused) {
                            startProgress();
                        }
                    } else {
                        // Skip to previous track
                        prevTrack();
                    }
                });
            }
            
            if (nextBtn) {
                const newNextBtn = nextBtn.cloneNode(true);
                nextBtn.parentNode.replaceChild(newNextBtn, nextBtn);
                newNextBtn.addEventListener('click', nextTrack);
            }
            
                // Setup create new button
    if (createNewBtn) {
        const newCreateBtn = createNewBtn.cloneNode(true);
        createNewBtn.parentNode.replaceChild(newCreateBtn, createNewBtn);
        newCreateBtn.addEventListener('click', () => {
            document.getElementById('playback-view').classList.add('hidden');
            document.getElementById('mixtape-view').classList.remove('hidden');
            
            
            document.getElementById('mixtape-form-container').classList.remove('hidden');
            document.getElementById('previous-playlists-mixtape').classList.add('hidden');
            
            // Reset form
            document.getElementById('mixtape-title').value = '';
            const tracksContainer = document.getElementById('tracks-container');
            tracksContainer.innerHTML = `
                <div class="track-item">
                    <div class="track-number">1</div>
                    <div class="track-input-container">
                        <input type="text" class="youtube-link" placeholder="Paste YouTube link here...">
                    </div>
                    <button class="remove-track" title="Remove this track" style="visibility: hidden;">✕</button>
                </div>
            `;
            document.getElementById('tape-title').textContent = "Your Mixtape Title";
        });
    }
        }
    // Toggle play/pause
    function togglePlay() {
        if (!ytPlayer) return;
    
        if (isPaused) {
            ytPlayer.playVideo();
            document.getElementById('play-pause-icon').src = 'assets/pause.png';
        } else {
            ytPlayer.pauseVideo();
            document.getElementById('play-pause-icon').src = 'assets/play.png';
        }
        isPaused = !isPaused;
    }

    // Start progress tracking
    function startProgress() {
        clearInterval(playerInterval);
        
        const activeTrack = document.querySelector('#playlist .track-item.active');
        if (!activeTrack) return;
        
        const progress = document.getElementById('song-progress');
        const currentTimeDisplay = document.getElementById('current-time');
        
        playerInterval = setInterval(() => {
            if (isPaused || !ytPlayer) return;
            
            currentTime = ytPlayer.getCurrentTime() || 0;
            currentDuration = ytPlayer.getDuration() || 225;
            
            const percent = (currentTime / currentDuration) * 100;
            progress.style.width = `${Math.min(percent, 100)}%`;
            
            // Update time display
            const displayMinutes = Math.floor(currentTime / 60);
            const displaySeconds = Math.floor(currentTime % 60);
            currentTimeDisplay.textContent = 
                `${displayMinutes}:${displaySeconds < 10 ? '0' : ''}${displaySeconds}`;
            
        }, 100);
    }

    // Play next track
    function nextTrack() {
        const trackItems = document.querySelectorAll('#playlist .track-item');
        if (trackItems.length === 0) return;
        
        currentTrack = (currentTrack + 1) % trackItems.length;
        currentTime = 0;
        
        const currentPlaylist = playlists[currentPlaylistIndex];
        const videoId = currentPlaylist.tracks[currentTrack].videoId;
        playTrack(videoId);
        
        updateNowPlayingDisplay();
    }
    
    // Play previous track
    function prevTrack() {
        const trackItems = document.querySelectorAll('#playlist .track-item');
        if (trackItems.length === 0) return;

        currentTrack = (currentTrack - 1 + trackItems.length) % trackItems.length;
        currentTime = 0;

        const currentPlaylist = playlists[currentPlaylistIndex];
        const videoId = currentPlaylist.tracks[currentTrack].videoId;

        playTrack(videoId);
        updateNowPlayingDisplay();
    }


       // Render playlist
// Render playlist
function renderPlaylist(index) {
    const playlist = playlists[index];
    if (!playlist) return;

    document.getElementById('now-playing-title').textContent = playlist.title;

    const dateToShow = playlist.created_at ? formatDate(playlist.created_at) : playlist.date;
        document.getElementById('creation-date').textContent = `Created on ${dateToShow}`;
    
    // Generate and display description instead of date
    const descElement = document.querySelector('.mixtape-description p');
    if (descElement) {
        // Use existing description if available, otherwise generate a new one
        descElement.textContent = playlist.description || generateDescription(playlist.title);
    }

    const playlistElement = document.getElementById('playlist');
    playlistElement.innerHTML = '';

    playlist.tracks.forEach((track, i) => {
        const trackItem = document.createElement('div');
        trackItem.className = 'track-item';
        trackItem.innerHTML = `
            <div class="track-number">${i + 1}</div>
            <div class="track-info">
                <div class="track-title">${track.title}</div>
                <div class="track-artist">${track.artist}</div>
            </div>
            <div class="track-duration">${track.duration || '0:00'}</div>
        `;
        
        // Play track when clicked
        trackItem.addEventListener('click', () => {
            currentTrack = i;
            currentTime = 0;
            playTrack(track.videoId);
            updateNowPlayingDisplay();
        });
        
        playlistElement.appendChild(trackItem);
    });
    
    updateNowPlayingDisplay();
}

    // Update now playing display
    function updateNowPlayingDisplay() {
        const trackItems = document.querySelectorAll('#playlist .track-item');
        
        trackItems.forEach(item => item.classList.remove('active'));
        
        if (trackItems[currentTrack]) {
            trackItems[currentTrack].classList.add('active');
            
            // Update "now playing" text
            document.querySelector('.section-header span').textContent = 
                `Now Playing Track ${currentTrack + 1}`;
                
            // Update duration display
            const durationText = trackItems[currentTrack].querySelector('.track-duration').textContent;
            document.getElementById('duration').textContent = durationText;
        }
    }

       // Load previous playlists for the current user
       async function loadPreviousPlaylists(view = 'playback') {
        try {
            const container = view === 'mixtape' ? 
                document.getElementById('previous-playlists-list-mixtape') : 
                document.getElementById('previous-playlists-list');
                
            if (!container) return;
            
            container.innerHTML = '<div class="loading-message">Loading your playlists...</div>';
            
            const response = await fetch('../backend/mixtape/get_playlists.php');
            const data = await response.json();
            
            if (data.success && data.playlists && data.playlists.length > 0) {
                previousPlaylists = data.playlists;
                renderPreviousPlaylists(view);
            } else {
                container.innerHTML = '<div class="empty-message">You haven\'t created any playlists yet</div>';
            }
        } catch (error) {
            console.error('Error loading playlists:', error);
            const container = view === 'mixtape' ? 
                document.getElementById('previous-playlists-list-mixtape') : 
                document.getElementById('previous-playlists-list');
                
            if (container) {
                container.innerHTML = '<div class="error-message">Failed to load your playlists</div>';
            }
        }
    }

    // Render previous playlists list
    function renderPreviousPlaylists(view = 'playback') {
        const container = view === 'mixtape' ? 
            document.getElementById('previous-playlists-list-mixtape') : 
            document.getElementById('previous-playlists-list');
            
        if (!container) return;
        
        container.innerHTML = '';
        
        if (previousPlaylists.length === 0) {
            container.innerHTML = '<div class="empty-message">No playlists found</div>';
            return;
        }
        
        previousPlaylists.forEach(playlist => {
            const playlistElement = document.createElement('div');
            playlistElement.className = 'playlist-item';
            playlistElement.innerHTML = `
                <div class="playlist-info">
                    <div class="playlist-title">${playlist.title}</div>
                    <div class="playlist-date">${formatDate(playlist.created_at)}</div>
                </div>
               <button class="btn-small load-playlist" 
            data-id="${playlist.playlist_id}"
            style="width: 50%; height: 30px; padding: 0px 10px ; box-sizing: border-box;">
        Load
    </button>
            `;
            
            playlistElement.querySelector('.load-playlist').addEventListener('click', () => {
                if (view === 'mixtape') {
                    // For mixtape view, load the playlist into the form
                    loadPlaylistIntoForm(playlist.playlist_id);
                } else {
                    // For playback view, load the playlist for playback
                    loadPlaylist(playlist.playlist_id);
                }
            });
            
            container.appendChild(playlistElement);
        });
    }

                // Load a playlist into the mixtape creation form
    async function loadPlaylistIntoForm(playlistId) {
        try {
            // Show loading in the playback view 
            document.getElementById('mixtape-view').classList.add('hidden');
            document.getElementById('playback-view').classList.remove('hidden');
            document.getElementById('playlist').innerHTML = '<div class="loading-message">Loading your playlist...</div>';
            
            const response = await fetch(`../backend/mixtape/get_playlist.php?id=${playlistId}`);
            const data = await response.json();
            
            if (data.success) {
                // Add or update the playlist in our local array
                const existingIndex = playlists.findIndex(p => p.playlist_id === data.playlist.playlist_id);
                if (existingIndex >= 0) {
                    playlists[existingIndex] = data.playlist;
                    currentPlaylistIndex = existingIndex;
                } else {
                    playlists.unshift(data.playlist);
                    currentPlaylistIndex = 0;
                }
                
                
                document.getElementById('playlist').classList.remove('hidden');
                document.getElementById('previous-playlists').classList.add('hidden');
                
               
                document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
                document.querySelector('.tab-btn:first-child').classList.add('active');
                
                // Render the playlist
                renderPlaylist(currentPlaylistIndex);
                
                
                setupPlayerControls();
                
                // Play first track if available
                if (data.playlist.tracks && data.playlist.tracks.length > 0) {
                    currentTrack = 0; // Ensure the first track is selected
                    playTrack(data.playlist.tracks[0].videoId);
                    updateNowPlayingDisplay();
                }
            } else {
                throw new Error(data.error || 'Failed to load playlist');
            }
        } catch (error) {
            console.error('Error loading playlist into form:', error);
            document.getElementById('playlist').innerHTML = 
                `<div class="error-message">Error loading playlist: ${error.message}</div>`;
        }
    }
    

    // Format date for display
    function formatDate(dateString) {
        const options = { year: 'numeric', month: 'short', day: 'numeric' };
        return new Date(dateString).toLocaleDateString('en-US', options);
    }

    // Load a specific playlist
    async function loadPlaylist(playlistId) {
        try {
            document.getElementById('previous-playlists-list').innerHTML = 
                '<div class="loading-message">Loading playlist...</div>';
            
            const response = await fetch(`../backend/mixtape/get_playlist.php?id=${playlistId}`);
            const data = await response.json();
            
            if (data.success) {
                // Switch back to current playlist view
                document.querySelector('.tab-btn.active').classList.remove('active');
                document.querySelector('.tab-btn:first-child').classList.add('active');
                document.getElementById('playlist').classList.remove('hidden');
                document.getElementById('previous-playlists').classList.add('hidden');
                
                // Add or update the playlist in our local array
                const existingIndex = playlists.findIndex(p => p.playlist_id === data.playlist.playlist_id);
                if (existingIndex >= 0) {
                    playlists[existingIndex] = data.playlist;
                    currentPlaylistIndex = existingIndex;
                } else {
                    playlists.unshift(data.playlist);
                    currentPlaylistIndex = 0;
                }
                
                renderPlaylist(currentPlaylistIndex);
                
                // Play first track if available
                if (data.playlist.tracks && data.playlist.tracks.length > 0) {
                    currentTrack = 0; // Ensure the first track is selected
                    playTrack(data.playlist.tracks[0].videoId);
                    updateNowPlayingDisplay();
                }
            } else {
                throw new Error(data.error || 'Failed to load playlist');
            }
        } catch (error) {
            console.error('Error loading playlist:', error);
            document.getElementById('previous-playlists-list').innerHTML = 
                `<div class="error-message">Error loading playlist: ${error.message}</div>`;
        }
    }

    // Generate mixtape description
    function generateDescription(title) {
        const descriptors = [
            "A collection of songs that capture the essence of",
            "The perfect soundtrack for",
            "A musical journey through",
            "Timeless melodies that define",
            "Songs that embody the spirit of"
        ];
        
        const endings = [
            "moments that last a lifetime.",
            "memories you'll cherish forever.",
            "times you'll never forget.",
            "experiences that shape who you are.",
            "the soundtrack of your life."
        ];
        
        const randomDescriptor = descriptors[Math.floor(Math.random() * descriptors.length)];
        const randomEnding = endings[Math.floor(Math.random() * endings.length)];
        
        return `${randomDescriptor} ${title.toLowerCase()}, ${randomEnding}`;
    }
});
