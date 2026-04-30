declare global {
    interface Window {
        fbq?: (...args: unknown[]) => void;
    }
}

type MetaEventOptions = {
    eventID?: string;
};

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

export function trackMetaEvent(
    eventName: string,
    parameters?: Record<string, unknown>,
    options?: MetaEventOptions
) {
    if (!canUseMetaPixel()) {
        return;
    }

    if (parameters) {
        if (options?.eventID) {
            window.fbq!("track", eventName, parameters, { eventID: options.eventID });
            return;
        }

        window.fbq!("track", eventName, parameters);
        return;
    }

    if (options?.eventID) {
        window.fbq!("track", eventName, {}, { eventID: options.eventID });
        return;
    }

    window.fbq!("track", eventName);
}

export function trackMetaCustomEvent(
    eventName: string,
    parameters?: Record<string, unknown>,
    options?: MetaEventOptions
) {
    if (!canUseMetaPixel()) {
        return;
    }

    if (parameters) {
        if (options?.eventID) {
            window.fbq!("trackCustom", eventName, parameters, { eventID: options.eventID });
            return;
        }

        window.fbq!("trackCustom", eventName, parameters);
        return;
    }

    if (options?.eventID) {
        window.fbq!("trackCustom", eventName, {}, { eventID: options.eventID });
        return;
    }

    window.fbq!("trackCustom", eventName);
}

export function trackMetaEventOnce(
    storageKey: string,
    eventName: string,
    parameters?: Record<string, unknown>,
    options?: MetaEventOptions
) {
    if (!canUseMetaPixel()) {
        return false;
    }

    if (canUseSessionStorage() && window.sessionStorage.getItem(storageKey) === "1") {
        return false;
    }

    trackMetaEvent(eventName, parameters, options);

    if (canUseSessionStorage()) {
        window.sessionStorage.setItem(storageKey, "1");
    }

    return true;
}

export function trackMetaCustomEventOnce(
    storageKey: string,
    eventName: string,
    parameters?: Record<string, unknown>,
    options?: MetaEventOptions
) {
    if (!canUseMetaPixel()) {
        return false;
    }

    if (canUseSessionStorage() && window.sessionStorage.getItem(storageKey) === "1") {
        return false;
    }

    trackMetaCustomEvent(eventName, parameters, options);

    if (canUseSessionStorage()) {
        window.sessionStorage.setItem(storageKey, "1");
    }

    return true;
}
