declare global {
    interface Window {
        fbq?: (...args: unknown[]) => void;
    }
}

export function trackMetaPageView() {
    if (typeof window === "undefined" || typeof window.fbq !== "function") {
        return;
    }

    window.fbq("track", "PageView");
}

export function trackMetaEvent(eventName: string, parameters?: Record<string, unknown>) {
    if (typeof window === "undefined" || typeof window.fbq !== "function") {
        return;
    }

    if (parameters) {
        window.fbq("track", eventName, parameters);
        return;
    }

    window.fbq("track", eventName);
}
