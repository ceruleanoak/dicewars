/**
 * Dice Wars - Configuration System
 * Manages game settings with localStorage persistence
 */

var GameConfig = {
    // Visual Settings
    darkMode: true,
    animations: false,

    // Audio Settings
    soundEnabled: false,
    soundVolume: 0.5,

    // Gameplay Features
    allowRedeployment: true,
    allowAlliances: true,

    // Theme Colors
    themes: {
        light: {
            background: '#eeeeee',
            canvas: '#ffffff',
            text: '#000000'
        },
        dark: {
            background: '#000000',
            canvas: '#202020',
            text: '#ffffff'
        }
    },

    /**
     * Load configuration from localStorage
     * Falls back to defaults if not available
     */
    load: function() {
        try {
            if (typeof(Storage) !== "undefined" && localStorage.getItem('dicewars_config')) {
                var saved = JSON.parse(localStorage.getItem('dicewars_config'));

                // Restore saved settings
                if (saved.darkMode !== undefined) this.darkMode = saved.darkMode;
                if (saved.animations !== undefined) this.animations = saved.animations;
                if (saved.soundEnabled !== undefined) this.soundEnabled = saved.soundEnabled;
                if (saved.soundVolume !== undefined) this.soundVolume = saved.soundVolume;
                if (saved.allowRedeployment !== undefined) this.allowRedeployment = saved.allowRedeployment;
                if (saved.allowAlliances !== undefined) this.allowAlliances = saved.allowAlliances;

                console.log('Configuration loaded from localStorage');
            } else {
                console.log('Using default configuration');
            }
        } catch (e) {
            console.warn('Failed to load configuration, using defaults:', e);
        }

        // Apply theme after loading
        this.applyTheme();
    },

    /**
     * Save current configuration to localStorage
     */
    save: function() {
        try {
            if (typeof(Storage) !== "undefined") {
                var config = {
                    darkMode: this.darkMode,
                    animations: this.animations,
                    soundEnabled: this.soundEnabled,
                    soundVolume: this.soundVolume,
                    allowRedeployment: this.allowRedeployment,
                    allowAlliances: this.allowAlliances
                };

                localStorage.setItem('dicewars_config', JSON.stringify(config));
                console.log('Configuration saved to localStorage');
            }
        } catch (e) {
            console.warn('Failed to save configuration:', e);
        }
    },

    /**
     * Apply current theme to page
     */
    applyTheme: function() {
        var theme = this.darkMode ? this.themes.dark : this.themes.light;
        var style = document.getElementById('dynamic-theme');

        if (style) {
            style.innerHTML =
                'body { background: ' + theme.background + ' !important; color: ' + theme.text + ' !important; }' +
                'canvas { background-color: ' + theme.canvas + ' !important; }' +
                'a:link, a:visited { color: ' + (this.darkMode ? '#aaaaaa' : '#555555') + ' !important; }';
        }
    },

    /**
     * Reset to default settings
     */
    reset: function() {
        this.darkMode = true;
        this.animations = true;
        this.soundEnabled = false;
        this.soundVolume = 0.5;
        this.allowRedeployment = true;
        this.allowAlliances = true;

        this.save();
        this.applyTheme();
    }
};

// Auto-load configuration when script loads
if (typeof window !== 'undefined') {
    window.addEventListener('DOMContentLoaded', function() {
        GameConfig.load();
    });
}
