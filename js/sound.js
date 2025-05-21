const SoundManager = {
    sounds: {},
    isMuted: false, // Optional: for mute functionality later

    loadSound: function(name, path) {
        const audio = new Audio(path);
        audio.addEventListener('error', () => {
            console.warn(`Error loading sound: ${name} at ${path}`);
        });
        // Optional: Add 'canplaythrough' listener for more robust loading indication
        this.sounds[name] = audio;
    },

    playSound: function(name) {
        if (this.isMuted) return;

        if (this.sounds[name]) {
            this.sounds[name].currentTime = 0; // Rewind to start
            this.sounds[name].play().catch(error => {
                // Autoplay policy might block sound, especially music if not user-initiated
                // console.warn(`Error playing sound ${name}:`, error); 
                // This is common for background music if not started by a user gesture.
                // For short effects, it's usually fine after the first user interaction.
            });
        } else {
            console.warn(`Sound not found: ${name}`);
        }
    },

    // Optional: functions to control volume or mute
    setVolume: function(name, volume) {
        if (this.sounds[name]) {
            this.sounds[name].volume = volume;
        }
    },

    toggleMute: function() {
        this.isMuted = !this.isMuted;
        // If unmuting and music was supposed to be playing, might need to restart it.
        // Or adjust all currently playing sounds. For simplicity, this is a basic toggle.
        if (this.isMuted) {
            // Stop all sounds if muting (optional)
            for (const soundName in this.sounds) {
                if (this.sounds.hasOwnProperty(soundName) && !this.sounds[soundName].paused) {
                    this.sounds[soundName].pause();
                    // For music, you might want to remember its state to resume later
                }
            }
        } else {
            // If unmuting, and music was playing, it might need a manual restart
            // if (this.sounds['music'] && this.sounds['music'].loop) this.playSound('music');
        }
        console.log(`Sounds ${this.isMuted ? 'muted' : 'unmuted'}`);
    }
};

// Preload sounds
SoundManager.loadSound('move', 'assets/sounds/move.wav');
SoundManager.loadSound('rotate', 'assets/sounds/rotate.wav');
SoundManager.loadSound('lock', 'assets/sounds/lock.wav');
SoundManager.loadSound('clear', 'assets/sounds/clear.wav');
SoundManager.loadSound('gameOver', 'assets/sounds/gameOver.wav');
SoundManager.loadSound('music', 'assets/sounds/music.mp3');

// Set music to loop
if (SoundManager.sounds['music']) {
    SoundManager.sounds['music'].loop = true;
}
