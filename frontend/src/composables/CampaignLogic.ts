/**
 * Format a date string to a more readable format
 *
 * @param {string} isoString - ISO date string
 * @returns {string} the formatted date
 */
export function formatDateTime(isoString: string): string {
    const date = new Date(isoString);

    const options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: false,
    };

    return date.toLocaleString(undefined, options);
}

/**
 * Updates the countdown timer for the campaign banner
 *
 * @param {string} endTime - The end time of the campaign
 * @returns {{ hasEnded: boolean; timeLeft: string }} the time remaining, or the message "Campaign has ended!"
 */
export function updateCountdown(endTime: string) {
    const now = new Date().getTime();
    const end = new Date(endTime).getTime();
    const diffMs = now - end;
    if (diffMs > 0) {
        return {
            hasEnded: true,
            timeLeft: "Campaign has ended!",
        };
    }

    const totalSeconds = Math.abs(Math.floor(diffMs / 1000));
    const days = Math.abs(Math.floor(totalSeconds / (3600 * 24)));
    const hours = Math.abs(Math.floor((totalSeconds % (3600 * 24)) / 3600));
    const minutes = Math.abs(Math.floor((totalSeconds % 3600) / 60));
    const seconds = Math.abs(totalSeconds % 60);

    return {
        hasEnded: false,
        timeLeft: `${days}d ${hours}h ${minutes}m ${seconds}s`,
    };
}
