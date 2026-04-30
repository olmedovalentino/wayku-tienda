declare global {
    interface Window {
        fbq?: (...args: unknown[]) => void;
    }
}

function canUseMetaPixel() {
    return typeof window !== "undefined" && typeof window.fbq === "function";
}

function canUseSessionStorage() {
    return typeof window !== "undefined" && typeof window.sessionStorage !== "undefined";
}

export function trackMetaPageView() {
    if (!canUseMetaPixel()) {
        return;
    }

    window.fbq!("track", "PageView");
}

export function trackMetaEvent(eventName: string, parameters?: Record<string, unknown>) {
    if (!canUseMetaPixel()) {
        return;
    }

    if (parameters) {
        window.fbq!("track", eventName, parameters);
        return;
    }

    window.fbq!("track", eventName);
}

export function trackMetaEventOnce(storageKey: string, eventName: string, parameters?: Record<string, unknown>) {
    if (!canUseMetaPixel()) {
        return false;
    }

    if (canUseSessionStorage() && window.sessionStorage.getItem(storageKey) === "1") {
        return false;
    }

    trackMetaEvent(eventName, parameters);

    if (canUseSessionStorage()) {
        window.sessionStorage.setItem(storageKey, "1");
    }

    return true;
}
