export function formatElapsedTime(dateInput: string | Date | number | undefined | null): string {
  if (!dateInput) return '';

  // If it's a number (timestamp)
  let date: Date;
  if (typeof dateInput === 'number') {
    date = new Date(dateInput);
  } else if (dateInput instanceof Date) {
    date = dateInput;
  } else {
    // It's a string
    const parsed = Date.parse(dateInput);
    if (isNaN(parsed)) {
      return dateInput;
    }
    date = new Date(parsed);
  }

  if (isNaN(date.getTime())) {
    return String(dateInput);
  }

  const now = Date.now();
  const diffMs = now - date.getTime();

  // If it's in the future or very recent (less than 1 minute)
  if (diffMs < 60000) {
    return 'Just now';
  }

  const diffMinutes = Math.floor(diffMs / 60000);
  if (diffMinutes < 60) {
    return `${diffMinutes} min ago`;
  }

  const diffHours = Math.floor(diffMs / 3600000);
  if (diffHours < 24) {
    return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
  }

  // If it's past 24 hours, format it according to user's selected language, region, and timezone!
  try {
    const saved = localStorage.getItem("userSettings");
    let appLanguage = 'English';
    let regionFormat = 'Bangladesh';
    let timezoneIANA = 'Asia/Dhaka';

    if (saved) {
      const parsed = JSON.parse(saved);
      appLanguage = parsed.appLanguage || 'English';
      regionFormat = parsed.regionFormat || 'Bangladesh';
      timezoneIANA = parsed.timezoneIANA || 'Asia/Dhaka';
    }

    // Determine BCP-47 locale
    let locale = 'en';
    switch (appLanguage) {
      case 'Bengali': locale = 'bn-BD'; break;
      case 'Spanish': locale = 'es-ES'; break;
      case 'French': locale = 'fr-FR'; break;
      case 'German': locale = 'de-DE'; break;
      case 'Japanese': locale = 'ja-JP'; break;
      case 'Arabic': locale = 'ar-AE'; break;
    }

    // Adjust based on region format
    switch (regionFormat) {
      case 'Bangladesh':
        locale = appLanguage === 'Bengali' ? 'bn-BD' : 'en-BD';
        break;
      case 'United States':
        locale = appLanguage === 'English' ? 'en-US' : locale;
        break;
      case 'United Kingdom':
        locale = appLanguage === 'English' ? 'en-GB' : locale;
        break;
      case 'Europe':
        locale = appLanguage === 'English' ? 'en-DE' : locale;
        break;
      case 'Japan':
        locale = appLanguage === 'English' ? 'ja-JP' : locale;
        break;
    }

    // Format with timezone
    return date.toLocaleString(locale, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: timezoneIANA,
    });
  } catch (error) {
    console.error("Failed to format date with user settings:", error);
    return date.toLocaleDateString([], { month: 'short', day: 'numeric', year: 'numeric' });
  }
}
