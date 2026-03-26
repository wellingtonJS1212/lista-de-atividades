(function attachNativeSoundPicker() {
    const capacitor = window.Capacitor;

    if (!capacitor || typeof capacitor.registerPlugin !== "function") {
        window.NativeSoundPicker = {
            isAvailable() {
                return false;
            },
            async pickSystemSound() {
                return null;
            },
            async playSystemSound() {
                return false;
            }
        };
        return;
    }

    const plugin = capacitor.registerPlugin("SystemSoundPicker");

    window.NativeSoundPicker = {
        isAvailable() {
            return true;
        },
        async pickSystemSound() {
            return plugin.pickSystemSound();
        },
        async playSystemSound(options) {
            return plugin.playSystemSound(options);
        }
    };
})();
