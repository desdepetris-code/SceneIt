type Listener = (message: string) => void;

class ConfirmationService {
    private listener: Listener | null = null;
    private settingEnabled: boolean = true;

    subscribe(newListener: Listener) {
        this.listener = newListener;
        return () => { this.listener = null; };
    }

    show(message: string) {
        if (this.listener && this.settingEnabled) {
            this.listener(message);
        }
    }

    updateSetting(isEnabled: boolean) {
        this.settingEnabled = isEnabled;
    }
}

export const confirmationService = new ConfirmationService();