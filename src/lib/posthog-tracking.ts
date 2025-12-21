/**
 * PostHog Analytics Tracking Examples
 * 
 * This file contains example functions for tracking user events in your application.
 * Import and use these functions throughout your app to capture user interactions.
 */

import { usePostHog } from "posthog-js/react";

/**
 * Example: Track booking attempts
 */
export function useBookingTracking() {
    const posthog = usePostHog();

    const trackBookingAttempt = (data: {
        slotId: string;
        date: string;
        sport: "football" | "cricket";
    }) => {
        posthog.capture("booking_attempt", {
            slot_id: data.slotId,
            date: data.date,
            sport: data.sport,
        });
    };

    const trackBookingSuccess = (data: {
        bookingId: string;
        amount: number;
        sport: "football" | "cricket";
    }) => {
        posthog.capture("booking_success", {
            booking_id: data.bookingId,
            amount: data.amount,
            sport: data.sport,
        });
    };

    const trackBookingError = (error: {
        type: string;
        message: string;
        step: string;
    }) => {
        posthog.capture("booking_error", {
            error_type: error.type,
            error_message: error.message,
            booking_step: error.step,
        });
    };

    return {
        trackBookingAttempt,
        trackBookingSuccess,
        trackBookingError,
    };
}

/**
 * Example: Track form interactions
 */
export function useFormTracking() {
    const posthog = usePostHog();

    const trackFormInteraction = (fieldName: string, action: string) => {
        posthog.capture("form_interaction", {
            field: fieldName,
            action: action, // focus, blur, change, etc.
        });
    };

    const trackFormSubmit = (formName: string, success: boolean) => {
        posthog.capture("form_submit", {
            form_name: formName,
            success: success,
        });
    };

    return {
        trackFormInteraction,
        trackFormSubmit,
    };
}

/**
 * Example: Track user authentication events
 */
export function useAuthTracking() {
    const posthog = usePostHog();

    const trackLogin = (method: string) => {
        posthog.capture("user_login", {
            method: method,
        });
    };

    const trackLogout = () => {
        posthog.capture("user_logout");
    };

    const trackSignup = (method: string) => {
        posthog.capture("user_signup", {
            method: method,
        });
    };

    return {
        trackLogin,
        trackLogout,
        trackSignup,
    };
}

/**
 * Example: Track gallery interactions
 */
export function useGalleryTracking() {
    const posthog = usePostHog();

    const trackImageView = (imageId: string) => {
        posthog.capture("gallery_image_view", {
            image_id: imageId,
        });
    };

    const trackImageShare = (imageId: string, platform: string) => {
        posthog.capture("gallery_image_share", {
            image_id: imageId,
            platform: platform,
        });
    };

    return {
        trackImageView,
        trackImageShare,
    };
}

/**
 * Example: Track navigation events
 */
export function useNavigationTracking() {
    const posthog = usePostHog();

    const trackTabChange = (from: string, to: string) => {
        posthog.capture("tab_change", {
            from_tab: from,
            to_tab: to,
        });
    };

    const trackExternalLinkClick = (url: string, label: string) => {
        posthog.capture("external_link_click", {
            url: url,
            label: label,
        });
    };

    return {
        trackTabChange,
        trackExternalLinkClick,
    };
}

/**
 * Example: Identify a user (call after successful login/signup)
 */
export function identifyUser(
    posthog: ReturnType<typeof usePostHog>,
    userId: string,
    properties?: Record<string, string | number | boolean | null>
) {
    posthog.identify(userId, properties);
}

/**
 * Enrich user identification with customer details
 * Call this after fetching customer data to add more properties to the user profile
 */
export function enrichUserProfile(
    posthog: ReturnType<typeof usePostHog>,
    customerData: {
        phoneNumber: string;
        name?: string | null;
        email?: string | null;
        languagePreference?: string | null;
        alternateContactName?: string | null;
        alternateContactNumber?: string | null;
    }
) {
    const properties: Record<string, string | boolean | null> = {
        phone_number: customerData.phoneNumber,
    };

    if (customerData.name) properties.name = customerData.name;
    if (customerData.email) properties.email = customerData.email;
    if (customerData.languagePreference)
        properties.language = customerData.languagePreference;
    if (customerData.alternateContactName)
        properties.alternate_contact_name = customerData.alternateContactName;
    if (customerData.alternateContactNumber)
        properties.alternate_contact_number = customerData.alternateContactNumber;

    posthog.identify(customerData.phoneNumber, properties);
}

/**
 * Example: Reset user identity (call on logout)
 */
export function resetUser(posthog: ReturnType<typeof usePostHog>) {
    posthog.reset();
}