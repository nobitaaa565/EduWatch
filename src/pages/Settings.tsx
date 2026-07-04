import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useBlocker } from "react-router-dom";
import { TopBar } from "../components/TopBar";
import {
  User,
  Bell,
  Shield,
  Palette,
  Plus,
  X,
  Camera,
  Lock,
  Github,
  Link as LinkIcon,
  Sun,
  Moon,
  AlertTriangle,
  ChevronRight,
  Rss,
  Database,
  Download,
  Trash2,
  Monitor,
  Check,
  Sliders,
  ArrowUp,
  ArrowDown,
  HardDrive,
  Globe,
  Compass,
  Languages,
  MapPin,
  Clock,
} from "lucide-react";
import { cn } from "../lib/utils";
import { useTheme } from "../lib/ThemeContext";
import { useAuth } from "../lib/AuthContext";
import { CityAutocomplete } from "../components/CityAutocomplete";
import { AVAILABLE_EXPERTISE_TAGS, ExpertiseTag } from "../data/mockData";

import { Sidebar } from "../components/Sidebar";
import { useSidebar } from "../lib/SidebarContext";
import { ContentMutingFilter } from "../components/ContentMutingFilter";
import {
  useSettings,
  ACCENT_PALETTES,
  AccentColor,
} from "../lib/SettingsContext";

const timezoneOptions = [
  { label: "UTC-12 (Baker Island / IDLW)", iana: "Etc/GMT+12" },
  { label: "UTC-11 (Niue / Midway)", iana: "Pacific/Midway" },
  { label: "UTC-10 (Hawaii / Honolulu)", iana: "Pacific/Honolulu" },
  { label: "UTC-9:30 (Marquesas Islands)", iana: "Pacific/Marquesas" },
  { label: "UTC-9 (Alaska / Anchorage)", iana: "America/Anchorage" },
  { label: "UTC-8 (Pacific Time - Los Angeles)", iana: "America/Los_Angeles" },
  { label: "UTC-7 (Mountain Time - Denver / Phoenix)", iana: "America/Denver" },
  { label: "UTC-6 (Central Time - Chicago / Mexico City)", iana: "America/Chicago" },
  { label: "UTC-5 (Eastern Time - New York / Toronto)", iana: "America/New_York" },
  { label: "UTC-4 (Atlantic Time - Halifax)", iana: "America/Halifax" },
  { label: "UTC-3:30 (Newfoundland - St. John's)", iana: "America/St_Johns" },
  { label: "UTC-3 (Argentina / Buenos Aires / Sao Paulo)", iana: "America/Argentina/Buenos_Aires" },
  { label: "UTC-2 (South Georgia)", iana: "Etc/GMT+2" },
  { label: "UTC-1 (Azores / Praia)", iana: "Atlantic/Azores" },
  { label: "UTC+0 (GMT / London / Dublin)", iana: "Europe/London" },
  { label: "UTC+1 (Central European Time - Paris / Berlin / Rome)", iana: "Europe/Paris" },
  { label: "UTC+2 (Eastern European Time - Cairo / Athens)", iana: "Europe/Cairo" },
  { label: "UTC+3 (East Africa / Moscow / Istanbul / Nairobi)", iana: "Europe/Moscow" },
  { label: "UTC+3:30 (Iran Standard Time - Tehran)", iana: "Asia/Tehran" },
  { label: "UTC+4 (Gulf Standard Time - Dubai / Baku)", iana: "Asia/Dubai" },
  { label: "UTC+4:30 (Afghanistan - Kabul)", iana: "Asia/Kabul" },
  { label: "UTC+5 (Pakistan Standard Time - Karachi)", iana: "Asia/Karachi" },
  { label: "UTC+5:30 (India Standard Time - New Delhi / Kolkata)", iana: "Asia/Kolkata" },
  { label: "UTC+5:45 (Nepal Standard Time - Kathmandu)", iana: "Asia/Kathmandu" },
  { label: "UTC+6 (Bangladesh Standard Time - Dhaka)", iana: "Asia/Dhaka" },
  { label: "UTC+6:30 (Myanmar / Cocos Islands)", iana: "Asia/Yangon" },
  { label: "UTC+7 (Indochina Time - Bangkok / Jakarta)", iana: "Asia/Bangkok" },
  { label: "UTC+8 (China Standard Time / Singapore / Perth)", iana: "Asia/Singapore" },
  { label: "UTC+9 (Japan Standard Time / Tokyo)", iana: "Asia/Tokyo" },
  { label: "UTC+9:30 (Australian Central - Darwin)", iana: "Australia/Darwin" },
  { label: "UTC+10 (Australian Eastern - Sydney)", iana: "Australia/Sydney" },
  { label: "UTC+11 (Solomon Islands)", iana: "Pacific/Guadalcanal" },
  { label: "UTC+12 (New Zealand Standard Time - Auckland)", iana: "Pacific/Auckland" },
  { label: "UTC+13 (Samoa Standard Time / Tonga)", iana: "Pacific/Tongatapu" },
  { label: "UTC+14 (Line Islands / Kiritimati)", iana: "Pacific/Kiritimati" },
];

type TabType =
  | "profile"
  | "appearance"
  | "language"
  | "feed"
  | "notifications"
  | "security"
  | "danger";

export default function Settings() {
  const { theme, toggleTheme } = useTheme();
  const { user, updateProfile, logout } = useAuth();
  const navigate = useNavigate();
  const { isCollapsed } = useSidebar();
  const {
    setSavedFontSize,
    setSavedAccentColor,
    setSavedDenseLayout,
    setSavedAppLanguage,
    setSavedRegionFormat,
    setSavedTimezone,
    setSavedTimezoneIANA,
    setSavedVideoAutoplay,
    t,
  } = useSettings();

  const [settings, setSettings] = useState(() => {
    const saved = localStorage.getItem("userSettings");
    const defaultSettings = {
      displayName: user?.fullName || user?.username || "",
      username: user?.username || "",
      bio: user?.bio || "",
      emailAlerts: true,
      emailAlertsComments: true,
      emailAlertsMentions: true,
      platformNotifications: true,
      platformNotificationsInApp: true,
      platformNotificationsDMs: true,
      weeklyDigest: false,
      fontSize: 14,
      skills: user?.expertise || [],
      photoUrl: user?.profileImage || "",
      requireFollowApproval: false,
      pinnedCertificates: [
        "Meta Certified Frontend Developer",
        "Google Certified Professional Cloud Architect",
      ],
      feedSort: "relevance",
      videoAutoplay: true,
      mutedKeywords: ["advertising", "politics", "spam"],
      leaderboardOptIn: true,
      scoreVisibilityPublic: true,
      connectedGithub: false,
      connectedGoogle: true,
      accentColor: "sapphire" as AccentColor,
      denseLayout: false,
      appLanguage: "English",
      regionFormat: "Bangladesh",
      timezone: "UTC+6 (Asia/Dhaka)",
      timezoneIANA: "Asia/Dhaka",
      sessions: [
        {
          id: "sess-1",
          device: 'MacBook Pro 16" - Chrome',
          location: "Dhaka, Bangladesh",
          active: true,
        },
        {
          id: "sess-2",
          device: "Safari on iPhone 15 Pro",
          location: "Chittagong, Bangladesh",
          active: false,
        },
        {
          id: "sess-3",
          device: "Windows Desktop - Firefox",
          location: "Sylhet, Bangladesh",
          active: false,
        },
      ],
      storageUsed: 342, // MB out of 1024
      mediaFiles: [
        {
          id: "file-1",
          name: "avatar_june2026.png",
          size: "2.4 MB",
          sizeMb: 2.4,
          date: "2026-06-01",
        },
        {
          id: "file-2",
          name: "showcase_demo_preview.gif",
          size: "14.8 MB",
          sizeMb: 14.8,
          date: "2026-05-28",
        },
        {
          id: "file-3",
          name: "project_schema_v2.png",
          size: "4.1 MB",
          sizeMb: 4.1,
          date: "2026-05-15",
        },
      ],
    };
    return saved
      ? { ...defaultSettings, ...JSON.parse(saved) }
      : defaultSettings;
  });

  const [tempSettings, setTempSettings] = useState(settings);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [skillCategoryTab, setSkillCategoryTab] = useState<
    "All" | "Technical" | "Education" | "Research"
  >("All");
  const [activeTab, setActiveTab] = useState<TabType>("profile");

  // Modal visual overlays
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [passwordSuccess, setPasswordSuccess] = useState("");

  const [showFilesModal, setShowFilesModal] = useState(false);

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleteError, setDeleteError] = useState("");

  const [selectedCert, setSelectedCert] = useState("");

  const availableCertificates = [
    "Google Certified Professional Cloud Architect",
    "AWS Certified Solutions Architect",
    "Meta Certified Frontend Developer",
    "Harvard CS50x Computer Science Certificate",
    "Stanford Advanced Machine Learning Certificate",
    "Microsoft Azure Solutions Architect Expert",
  ];

  const isDirty = JSON.stringify(tempSettings) !== JSON.stringify(settings);

  const blocker = useBlocker(
    ({ currentLocation, nextLocation }) =>
      isDirty && currentLocation.pathname !== nextLocation.pathname,
  );

  useEffect(() => {
    if (blocker.state === "blocked") {
      setShowDiscardModal(true);
    }
  }, [blocker.state]);

  const [syncStatus, setSyncStatus] = useState<"idle" | "pending" | "success" | "error">("idle");
  const [detectedZone, setDetectedZone] = useState("");

  const handleAutoDetectTimezone = () => {
    setSyncStatus("pending");
    try {
      const iana = Intl.DateTimeFormat().resolvedOptions().timeZone;
      if (iana) {
        const option = timezoneOptions.find(
          (opt) => opt.iana === iana || iana.includes(opt.iana) || opt.iana.includes(iana)
        );
        if (option) {
          if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
              (pos) => {
                setSavedTimezone(option.label);
                setSavedTimezoneIANA(option.iana);
                setTempSettings((prev) => ({
                  ...prev,
                  timezone: option.label,
                  timezoneIANA: option.iana,
                }));
                setDetectedZone(`${option.label} (${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`);
                setSyncStatus("success");
              },
              () => {
                setSavedTimezone(option.label);
                setSavedTimezoneIANA(option.iana);
                setTempSettings((prev) => ({
                  ...prev,
                  timezone: option.label,
                  timezoneIANA: option.iana,
                }));
                setDetectedZone(option.label);
                setSyncStatus("success");
              }
            );
          } else {
            setSavedTimezone(option.label);
            setSavedTimezoneIANA(option.iana);
            setTempSettings((prev) => ({
              ...prev,
              timezone: option.label,
              timezoneIANA: option.iana,
            }));
            setDetectedZone(option.label);
            setSyncStatus("success");
          }
          return;
        }
      }
    } catch (e) {
      console.error(e);
    }

    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const offsetHours = -new Date().getTimezoneOffset() / 60;
          const sign = offsetHours >= 0 ? "+" : "";
          const queryOffset = `UTC${sign}${offsetHours}`;
          const closest = timezoneOptions.find((opt) => opt.label.startsWith(queryOffset)) || timezoneOptions[14];
          
          setSavedTimezone(closest.label);
          setSavedTimezoneIANA(closest.iana);
          setTempSettings((prev) => ({
            ...prev,
            timezone: closest.label,
            timezoneIANA: closest.iana,
          }));
          setDetectedZone(`${closest.label} (GPS: ${pos.coords.latitude.toFixed(2)}, ${pos.coords.longitude.toFixed(2)})`);
          setSyncStatus("success");
        },
        () => {
          setSyncStatus("error");
        }
      );
    } else {
      setSyncStatus("error");
    }
  };

  const [showSaveSuccess, setShowSaveSuccess] = useState(false);

  const handleSave = () => {
    setSettings(tempSettings);
    localStorage.setItem("userSettings", JSON.stringify(tempSettings));

    // Save to SettingsContext to update the global app layout live
    setSavedFontSize(tempSettings.fontSize);
    setSavedAccentColor(tempSettings.accentColor || "sapphire");
    setSavedDenseLayout(tempSettings.denseLayout || false);
    setSavedAppLanguage(tempSettings.appLanguage || "English");
    setSavedRegionFormat(tempSettings.regionFormat || "Bangladesh");
    setSavedTimezone(tempSettings.timezone || "UTC+6 (Asia/Dhaka)");
    setSavedTimezoneIANA(tempSettings.timezoneIANA || "Asia/Dhaka");
    setSavedVideoAutoplay(tempSettings.videoAutoplay !== undefined ? tempSettings.videoAutoplay : true);

    // Also store settings under the current username for other users to reference
    if (tempSettings.username) {
      try {
        const savedSettingsByUsername = JSON.parse(
          localStorage.getItem("curator_user_settings_by_username") || "{}",
        );
        savedSettingsByUsername[tempSettings.username] = tempSettings;
        localStorage.setItem(
          "curator_user_settings_by_username",
          JSON.stringify(savedSettingsByUsername),
        );
      } catch (e) {
        console.error("Failed to map user settings by username", e);
      }
    }

    // Sync with AuthContext
    updateProfile({
      fullName: tempSettings.displayName,
      username: tempSettings.username,
      bio: tempSettings.bio,
      expertise: tempSettings.skills,
      profileImage: tempSettings.photoUrl,
    });

    setShowSaveSuccess(true);
    setTimeout(() => setShowSaveSuccess(false), 3000);
  };

  const handleDiscard = () => {
    setTempSettings(settings);
    // Reset root live preview scale back to the saved settings
    const scale = settings.fontSize / 15;
    document.documentElement.style.setProperty("--font-scale", `${scale}`);

    // Reset accent color and dense layout live preview
    const savedPalette =
      ACCENT_PALETTES[settings.accentColor || "sapphire"] ||
      ACCENT_PALETTES.sapphire;
    const colors = theme === "dark" ? savedPalette.dark : savedPalette.light;
    document.documentElement.style.setProperty("--primary", colors.primary);
    document.documentElement.style.setProperty(
      "--primary-container",
      colors.primaryContainer,
    );

    if (settings.denseLayout) {
      document.documentElement.classList.add("dense-layout");
    } else {
      document.documentElement.classList.remove("dense-layout");
    }

    setShowDiscardModal(false);
    if (blocker.state === "blocked") {
      blocker.proceed();
    }
  };

  const addSkill = () => {
    if (newSkill && !tempSettings.skills.includes(newSkill)) {
      setTempSettings({
        ...tempSettings,
        skills: [...tempSettings.skills, newSkill],
      });
      setNewSkill("");
    }
  };

  const removeSkill = (skillToRemove: string) => {
    setTempSettings({
      ...tempSettings,
      skills: tempSettings.skills.filter((s: string) => s !== skillToRemove),
    });
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setTempSettings({
          ...tempSettings,
          photoUrl: event.target?.result as string,
        });
      };
      reader.readAsDataURL(e.target.files[0]);
    }
  };

  // New Support routines

  const filteredAvailableSkills = AVAILABLE_EXPERTISE_TAGS.filter((tag) => {
    if (tempSettings.skills.includes(tag.name)) return false;
    if (skillCategoryTab !== "All" && tag.category !== skillCategoryTab)
      return false;
    if (newSkill.trim() !== "") {
      return (
        tag.name.toLowerCase().includes(newSkill.toLowerCase()) ||
        tag.subCategory.toLowerCase().includes(newSkill.toLowerCase())
      );
    }
    return true;
  });

  // 2. Certificate showcase routines
  const pinCertificate = () => {
    if (
      selectedCert &&
      !tempSettings.pinnedCertificates.includes(selectedCert)
    ) {
      setTempSettings({
        ...tempSettings,
        pinnedCertificates: [...tempSettings.pinnedCertificates, selectedCert],
      });
      setSelectedCert("");
    }
  };

  const unpinCertificate = (certName: string) => {
    setTempSettings({
      ...tempSettings,
      pinnedCertificates: tempSettings.pinnedCertificates.filter(
        (c: string) => c !== certName,
      ),
    });
  };

  const moveCertificate = (index: number, direction: "up" | "down") => {
    const arr = [...tempSettings.pinnedCertificates];
    if (direction === "up" && index > 0) {
      const temp = arr[index];
      arr[index] = arr[index - 1];
      arr[index - 1] = temp;
    } else if (direction === "down" && index < arr.length - 1) {
      const temp = arr[index];
      arr[index] = arr[index + 1];
      arr[index + 1] = temp;
    }
    setTempSettings({
      ...tempSettings,
      pinnedCertificates: arr,
    });
  };

  // 3. Password modal routine
  const handlePasswordChangeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!oldPassword) {
      setPasswordError("Please provide your old password credential.");
      return;
    }
    if (newPassword.length < 6) {
      setPasswordError("Your new password must be at least 6 characters long.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setPasswordError("Conformation password does not match.");
      return;
    }

    setPasswordError("");
    setPasswordSuccess("Success! Your secure credentials have been updated.");
    setOldPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setTimeout(() => {
      setShowPasswordModal(false);
      setPasswordSuccess("");
    }, 2000);
  };

  // 4. Revoke Active device session
  const revokeSession = (id: string) => {
    setTempSettings({
      ...tempSettings,
      sessions: tempSettings.sessions.filter((s: any) => s.id !== id),
    });
  };

  // 5. Media storage files
  const deleteMediaFile = (id: string, weightMb: number) => {
    setTempSettings({
      ...tempSettings,
      mediaFiles: tempSettings.mediaFiles.filter((f: any) => f.id !== id),
      storageUsed: Math.max(
        0,
        parseFloat((tempSettings.storageUsed - weightMb).toFixed(1)),
      ),
    });
  };

  // 6. JSON personal archive trigger
  const triggerDataDownload = () => {
    const archiveData = {
      downloadTimestamp: new Date().toISOString(),
      accountIdentity: {
        username: user?.username,
        email: user?.email,
        fullName: tempSettings.displayName,
        bioDescription: tempSettings.bio,
        technicalExpertise: tempSettings.skills,
      },
      pinnedCertificates: tempSettings.pinnedCertificates,
      vibeAppearance: {
        baseFontSize: tempSettings.fontSize,
        themeMode: theme,
      },
      feedConfiguration: {
        sortOrder: tempSettings.feedSort,
        autoplayActive: tempSettings.videoAutoplay,
        mutedWords: tempSettings.mutedKeywords,
      },
      alertPreferences: {
        emailComments: tempSettings.emailAlertsComments,
        emailMentions: tempSettings.emailAlertsMentions,
        platformInApp: tempSettings.platformNotificationsInApp,
        platformDMs: tempSettings.platformNotificationsDMs,
        weeklyDigest: tempSettings.weeklyDigest,
      },
      securitySetup: {
        requireFollowApproval: tempSettings.requireFollowApproval,
        leaderboardOptIn: tempSettings.leaderboardOptIn,
        scoreVisibilityPublic: tempSettings.scoreVisibilityPublic,
      },
    };

    const blob = new Blob([JSON.stringify(archiveData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `curator-profile-archive-${user?.username || "user"}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // 7. Account Deactivation Confirmation workflow
  const handleDeactivateAccount = () => {
    if (deleteConfirmText !== user?.username) {
      setDeleteError(
        `Please type exactly "${user?.username || "your username"}" to confirm.`,
      );
      return;
    }
    setDeleteError("");
    alert("Your account has been permanently deactivated. Redirecting...");
    logout();
    navigate("/");
  };

  return (
    <div className="min-h-screen bg-surface">
      {/* Discard Changes Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-surface-container-lowest p-6 rounded-xl shadow-xl max-w-sm w-full">
            <h3 className="text-lg font-bold mb-2">Discard Changes?</h3>
            <p className="text-sm text-secondary mb-6">
              You have unsaved changes. Are you sure you want to discard them?
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowDiscardModal(false);
                  blocker.reset();
                }}
                className="px-4 py-2 text-secondary font-bold text-xs hover:bg-surface-container rounded-md"
              >
                Cancel
              </button>
              <button
                onClick={handleDiscard}
                className="px-4 py-2 bg-tertiary text-white font-bold text-xs rounded-md"
              >
                Discard
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Success Toast */}
      {showSaveSuccess && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in fade-in slide-in-from-bottom-4 duration-300">
          <div className="bg-primary text-white px-6 py-3 rounded-xl shadow-2xl font-bold text-sm flex items-center gap-3">
            <div className="w-5 h-5 rounded-full bg-white/20 flex items-center justify-center">
              <Plus className="w-3 h-3 rotate-45" />
            </div>
            Settings saved successfully!
          </div>
        </div>
      )}

      {/* Change Password Modal Overlay */}
      {showPasswordModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/10 p-6 rounded-2xl shadow-2xl max-w-md w-full relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowPasswordModal(false)}
              className="absolute top-4 right-4 text-secondary hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black tracking-tight mb-1 text-on-surface flex items-center gap-2">
              <Lock className="w-5 h-5 text-primary" /> Update Password
              Credentials
            </h3>
            <p className="text-xs text-secondary mb-5 leading-normal">
              Ensure your account remains locked down with a secure passphrase.
            </p>
            <form
              onSubmit={handlePasswordChangeSubmit}
              className="space-y-4 font-manrope"
            >
              <div>
                <label className="block text-xs font-bold text-on-surface mb-2">
                  Old Password
                </label>
                <input
                  type="password"
                  value={oldPassword}
                  onChange={(e) => setOldPassword(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-2.5 text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary/25 font-semibold font-manrope"
                  placeholder="••••••••"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface mb-2">
                  New Password
                </label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-2.5 text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary/25 font-semibold font-manrope"
                  placeholder="Minimum 6 characters"
                  required
                />
              </div>
              <div>
                <label className="block text-xs font-bold text-on-surface mb-2">
                  Confirm New Password
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4 py-2.5 text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary/25 font-semibold font-manrope"
                  placeholder="••••••••"
                  required
                />
              </div>

              {passwordError && (
                <p className="text-xs font-bold text-tertiary font-manrope">
                  {passwordError}
                </p>
              )}
              {passwordSuccess && (
                <p className="text-xs font-bold text-emerald-500 font-manrope">
                  {passwordSuccess}
                </p>
              )}

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowPasswordModal(false)}
                  className="px-4 py-2 text-secondary font-black text-xs hover:bg-surface-container rounded-lg cursor-pointer font-manrope"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-primary hover:bg-primary/95 text-white font-black text-xs rounded-lg shadow-md transition-colors cursor-pointer font-manrope"
                >
                  Update Password
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Files Media Management Modal Overlay */}
      {showFilesModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-surface-container-lowest border border-outline-variant/10 p-6 rounded-2xl shadow-2xl max-w-xl w-full relative animate-in zoom-in-95 duration-200">
            <button
              type="button"
              onClick={() => setShowFilesModal(false)}
              className="absolute top-4 right-4 text-secondary hover:text-on-surface p-1 rounded-full hover:bg-surface-container transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="text-lg font-black tracking-tight mb-1 text-on-surface flex items-center gap-2">
              <HardDrive className="w-5 h-5 text-primary" /> Active Storage
              Uploads
            </h3>
            <p className="text-xs text-secondary mb-4 leading-normal">
              Manage and prune individual media uploads associated with your
              posts.
            </p>

            <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
              {tempSettings.mediaFiles.map((file: any) => (
                <div
                  key={file.id}
                  className="flex items-center justify-between p-3 bg-surface-container-low border border-outline-variant/10 rounded-xl shadow-sm"
                >
                  <div className="min-w-0 flex-1 pr-3">
                    <p className="text-xs font-black truncate text-on-surface">
                      {file.name}
                    </p>
                    <p className="text-[10px] text-secondary mt-0.5 font-mono">
                      {file.date} • {file.size}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => deleteMediaFile(file.id, file.sizeMb)}
                    className="p-2 border border-outline-variant/10 bg-surface-container text-tertiary hover:bg-tertiary hover:text-white rounded-lg transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              {tempSettings.mediaFiles.length === 0 && (
                <p className="text-xs text-secondary italic text-center py-6">
                  Your cloud asset directory is completely empty.
                </p>
              )}
            </div>

            <div className="flex justify-between items-center border-t border-outline-variant/10 mt-5 pt-4 font-manrope">
              <span className="text-xs text-secondary font-semibold">
                Total Used:{" "}
                <strong className="text-primary">
                  {tempSettings.storageUsed} MB
                </strong>{" "}
                of 1,024 MB
              </span>
              <button
                type="button"
                onClick={() => setShowFilesModal(false)}
                className="px-5 py-2.5 bg-primary text-white font-black text-xs rounded-lg cursor-pointer"
              >
                Close Manager
              </button>
            </div>
          </div>
        </div>
      )}

      <TopBar />
      <main className="mt-[70px] h-[calc(100vh-70px)] overflow-hidden">
        <div className="flex flex-col lg:flex-row justify-between gap-6 lg:gap-10 relative w-full h-full px-4 md:px-10 lg:px-10 transition-all duration-300 ease-in-out">
          {/* Left Navigation Sidebar */}
          <aside
            className={cn(
              "hidden lg:block shrink-0 h-full overflow-y-auto no-scrollbar pt-6 pb-20 transition-all duration-300 ease-in-out",
              isCollapsed ? "w-[80px]" : "w-[350px]",
            )}
          >
            <Sidebar />
          </aside>

          {/* Main Content */}
          <div className="w-full lg:flex-[1] min-w-0 h-full overflow-y-auto no-scrollbar pt-6 pb-40">
            <div className="max-w-[1340px] mx-auto">
              <div className="flex flex-col md:flex-row gap-8 md:gap-10 items-start">
                {/* Secondary Sidebar (Settings Options Panel Left) */}
                <div className="w-full md:w-[320px] shrink-0 bg-surface-container-lowest border border-outline-variant/10 rounded-2xl p-5 space-y-5 shadow-sm md:sticky md:top-2">
                  {/* Category Section 1 - Profile & Personalization */}
                  <div className="space-y-2.5">
                    <p className="text-[14px] font-black uppercase tracking-wider text-secondary/90 pl-[3px]">
                      {t("personalExperience")}
                    </p>
                    <p className="text-[10px] text-secondary/65 pl-[3px] -mt-1.5 mb-2.5 leading-relaxed font-semibold">
                      Customize your public identity visual theme, and content
                      curation parameters.
                    </p>
                    <div className="space-y-1">
                      {[
                        {
                          id: "profile",
                          label: "Profile & Account",
                          key: "profileTab",
                          icon: User,
                        },
                        {
                          id: "appearance",
                          label: "Appearance & Display",
                          key: "appearanceTab",
                          icon: Palette,
                        },
                        {
                          id: "language",
                          label: "Language and region",
                          key: "languageTab",
                          icon: Globe,
                        },
                        { id: "feed", label: "Feed Preferences", key: "feedTab", icon: Rss },
                      ].map((cat) => {
                        const IconComponent = cat.icon;
                        const isActive = activeTab === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveTab(cat.id as any)}
                            className={cn(
                              "w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer group",
                              isActive
                                ? "bg-primary/10 text-primary border-l-4 border-primary pl-3"
                                : "text-secondary hover:text-on-surface hover:bg-surface-container pl-4",
                            )}
                          >
                            <IconComponent
                              className={cn(
                                "w-5 h-5 shrink-0 transition-colors",
                                isActive
                                  ? "text-primary"
                                  : "text-secondary group-hover:text-on-surface",
                              )}
                            />
                            <span className="text-xs font-bold leading-none">
                              {t(cat.key) || cat.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section Divider */}
                  <div className="h-px bg-outline-variant/10 mx-3.5" />

                  {/* Category Section 2 - Security & Alerts */}
                  <div className="space-y-2.5">
                    <p className="text-[14px] font-black uppercase tracking-wider text-secondary/90 pl-[3px]">
                      {t("alertsSecurity")}
                    </p>
                    <p className="text-[10px] text-secondary/65 pl-[3px] -mt-1.5 mb-2.5 leading-relaxed font-semibold">
                      Manage system alerts, email configurations, and profile
                      visibility criteria.
                    </p>
                    <div className="space-y-1">
                      {[
                        {
                          id: "notifications",
                          label: "Notifications",
                          key: "notificationsTab",
                          icon: Bell,
                        },
                        {
                          id: "security",
                          label: "Security & Privacy",
                          key: "securityTab",
                          icon: Shield,
                        },
                      ].map((cat) => {
                        const IconComponent = cat.icon;
                        const isActive = activeTab === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveTab(cat.id as any)}
                            className={cn(
                              "w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer group",
                              isActive
                                ? "bg-primary/10 text-primary border-l-4 border-primary pl-3"
                                : "text-secondary hover:text-on-surface hover:bg-surface-container pl-4",
                            )}
                          >
                            <IconComponent
                              className={cn(
                                "w-5 h-5 shrink-0 transition-colors",
                                isActive
                                  ? "text-primary"
                                  : "text-secondary group-hover:text-on-surface",
                              )}
                            />
                            <span className="text-xs font-bold leading-none">
                              {t(cat.key) || cat.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Section Divider */}
                  <div className="h-px bg-outline-variant/10 mx-3.5" />

                  {/* Category Section 3 - Management & Danger */}
                  <div className="space-y-2.5">
                    <p className="text-[14px] font-black uppercase tracking-wider text-secondary/90 pl-[3px]">
                      {t("administrative")}
                    </p>
                    <p className="text-[10px] text-secondary/65 pl-[3px] -mt-1.5 mb-2.5 leading-relaxed font-semibold">
                      Deactivate or delete your permanent publisher account
                      status directly.
                    </p>
                    <div className="space-y-1">
                      {[
                        {
                          id: "danger",
                          label: "Deactivation & Deletion",
                          key: "dangerTab",
                          icon: AlertTriangle,
                        },
                      ].map((cat) => {
                        const IconComponent = cat.icon;
                        const isActive = activeTab === cat.id;
                        return (
                          <button
                            key={cat.id}
                            type="button"
                            onClick={() => setActiveTab(cat.id as any)}
                            className={cn(
                              "w-full flex items-center gap-3.5 px-4 py-3 rounded-xl text-left transition-all duration-200 cursor-pointer group",
                              isActive
                                ? "bg-tertiary/10 text-tertiary border-l-4 border-tertiary pl-3"
                                : "text-secondary hover:text-tertiary hover:bg-tertiary/5 pl-4",
                            )}
                          >
                            <IconComponent
                              className={cn(
                                "w-5 h-5 shrink-0 transition-colors",
                                isActive
                                  ? "text-tertiary"
                                  : "text-secondary group-hover:text-tertiary",
                              )}
                            />
                            <span className="text-xs font-bold leading-none">
                              {t(cat.key) || cat.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Settings Right panel (Details) */}
                <div className="flex-1 w-full space-y-8">
                  {/* ACTIVE TAB: PROFILE */}
                  {activeTab === "profile" && (
                    <section className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-sm space-y-6">
                      <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-5">
                        <User className="w-6 h-6 text-primary" />
                        <div>
                          <h2 className="text-[18px] font-black tracking-tight font-manrope text-on-surface">
                            Account & Profile Settings
                          </h2>
                          <p className="text-xs text-secondary/90 leading-relaxed mt-0.5">
                            Manage your public bio, technical tags, and primary
                            display photo.
                          </p>
                        </div>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <div className="space-y-6">
                          <div>
                            <label className="block text-xs font-bold text-on-surface mb-2">
                              Display Name
                            </label>
                            <input
                              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4.5 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none font-medium"
                              type="text"
                              value={tempSettings.displayName}
                              onChange={(e) =>
                                setTempSettings({
                                  ...tempSettings,
                                  displayName: e.target.value,
                                })
                              }
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-on-surface mb-2">
                              Username
                            </label>
                            <input
                              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4.5 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none font-medium"
                              type="text"
                              value={tempSettings.username || ""}
                              onChange={(e) =>
                                setTempSettings({
                                  ...tempSettings,
                                  username: e.target.value
                                    .toLowerCase()
                                    .replace(/[^a-z0-9_]/g, ""),
                                })
                              }
                              placeholder="Type username..."
                            />
                            <p className="text-[10px] text-secondary leading-normal mt-1">
                              Unique alphanumeric identifier (a-z, 0-9, and
                              underscores). Helps other curators find you
                              efficiently.
                            </p>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-on-surface mb-2">
                              Bio Description
                            </label>
                            <textarea
                              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4.5 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none resize-none font-medium"
                              rows={5}
                              value={tempSettings.bio}
                              onChange={(e) =>
                                setTempSettings({
                                  ...tempSettings,
                                  bio: e.target.value,
                                })
                              }
                              placeholder="Describe yourself..."
                            />
                          </div>
                        </div>
                        <div className="space-y-6">
                          <div>
                            <label className="block text-xs font-bold text-on-surface mb-3">
                              Technical Expertise Tags
                            </label>
                            <div className="flex flex-wrap gap-2 mb-3.5 px-1 py-1 rounded-lg">
                              {tempSettings.skills.map((tag: string) => (
                                <div
                                  key={tag}
                                  className="flex items-center gap-2 bg-primary/10 text-primary px-3 py-1.5 rounded-lg text-[10px] font-bold shadow-sm"
                                >
                                  {tag}
                                  <X
                                    className="w-3.5 h-3.5 cursor-pointer hover:scale-110 active:scale-95"
                                    onClick={() => removeSkill(tag)}
                                  />
                                </div>
                              ))}
                              {tempSettings.skills.length === 0 && (
                                <p className="text-[10px] text-secondary italic">
                                  No expertise tags added yet.
                                </p>
                              )}
                            </div>

                            <div className="space-y-2">
                              <div className="flex gap-2">
                                <input
                                  type="text"
                                  value={newSkill}
                                  onChange={(e) => setNewSkill(e.target.value)}
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter") {
                                      e.preventDefault();
                                      addSkill();
                                    }
                                  }}
                                  className="flex-1 bg-surface-container-low border border-outline-variant/10 rounded-xl px-4.5 py-2.5 text-xs text-on-surface outline-none focus:ring-1 focus:ring-primary/25 font-medium"
                                  placeholder="Type custom skill..."
                                />
                                <button
                                  type="button"
                                  onClick={addSkill}
                                  className="bg-primary hover:bg-primary/95 text-white px-4 py-2.5 rounded-xl text-[10px] font-black transition-colors flex items-center justify-center cursor-pointer font-manrope shrink-0 gap-1.5"
                                >
                                  <Plus className="w-3.5 h-3.5" /> Add Tag
                                </button>
                              </div>

                              <p className="text-[10px] text-secondary leading-normal">
                                Enter custom academic degrees, technologies, or
                                disciplines of expertise. Press Enter or click
                                Add.
                              </p>
                            </div>
                          </div>
                          <div>
                            <label className="block text-xs font-bold text-on-surface mb-2">
                              Profile Photo
                            </label>
                            <div className="flex items-center gap-4">
                              <div className="w-16 h-16 rounded-full overflow-hidden bg-surface-container bg-surface-container-low relative group border border-outline-variant/10 shadow-sm flex items-center justify-center shrink-0">
                                {tempSettings.photoUrl ? (
                                  <img
                                    className="w-full h-full object-cover"
                                    src={tempSettings.photoUrl}
                                    alt="Profile"
                                    referrerPolicy="no-referrer"
                                  />
                                ) : (
                                  <User className="w-8 h-8 text-secondary" />
                                )}
                                <label className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                                  <Camera className="w-5 h-5 text-white" />
                                  <input
                                    type="file"
                                    className="hidden"
                                    onChange={handlePhotoUpload}
                                    accept="image/*"
                                  />
                                </label>
                              </div>
                              <label className="text-[10px] font-black text-primary px-4.5 py-2.5 bg-primary/10 hover:bg-primary/15 rounded-xl transition-all cursor-pointer">
                                Upload New Avatar
                                <input
                                  type="file"
                                  className="hidden"
                                  onChange={handlePhotoUpload}
                                  accept="image/*"
                                />
                              </label>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="h-px bg-outline-variant/10 my-6" />

                      <div className="space-y-6">
                        <div className="flex items-center gap-2">
                          <User className="w-5 h-5 text-primary" />
                          <h2 className="text-[18px] font-black tracking-tight font-manrope text-on-surface">
                            Personal Background Details
                          </h2>
                        </div>
                        <p className="text-[11px] text-secondary leading-relaxed mb-6 font-normal">
                          Provide optional personal and regional demographics to
                          customize your community interaction context.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-5">
                          <div>
                            <label className="block text-xs font-bold text-on-surface mb-2">
                              Current City / Location
                            </label>
                            <CityAutocomplete
                              value={tempSettings.hometown || ""}
                              onChange={(val) =>
                                setTempSettings({
                                  ...tempSettings,
                                  hometown: val,
                                })
                              }
                              placeholder="Search city or address..."
                              types={[]}
                              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4.5 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-on-surface mb-2">
                              Hometown
                            </label>
                            <CityAutocomplete
                              value={tempSettings.homeAddress || ""}
                              onChange={(val) =>
                                setTempSettings({
                                  ...tempSettings,
                                  homeAddress: val,
                                })
                              }
                              placeholder="e.g. Chittagong, Bangladesh"
                              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4.5 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none font-medium"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-on-surface mb-2">
                              Birthday Date
                            </label>
                            <input
                              type="date"
                              value={tempSettings.birthday || ""}
                              onChange={(e) =>
                                setTempSettings({
                                  ...tempSettings,
                                  birthday: e.target.value,
                                })
                              }
                              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4.5 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none font-medium text-left"
                            />
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-on-surface mb-2">
                              Gender identity
                            </label>
                            <select
                              value={tempSettings.gender || ""}
                              onChange={(e) =>
                                setTempSettings({
                                  ...tempSettings,
                                  gender: e.target.value,
                                })
                              }
                              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4.5 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none font-medium"
                            >
                              <option value="Male">Male</option>
                              <option value="Female">Female</option>
                              <option value="Non-binary">Non-binary</option>
                              <option value="Prefer not to say">
                                Prefer not to say
                              </option>
                            </select>
                          </div>

                          <div>
                            <label className="block text-xs font-bold text-on-surface mb-2">
                              Relationship Status
                            </label>
                            <select
                              value={tempSettings.relationshipStatus || ""}
                              onChange={(e) =>
                                setTempSettings({
                                  ...tempSettings,
                                  relationshipStatus: e.target.value,
                                })
                              }
                              className="w-full bg-surface-container-low border border-outline-variant/10 rounded-xl px-4.5 py-3 text-xs text-on-surface focus:ring-2 focus:ring-primary/20 focus:bg-surface-container-lowest transition-all outline-none font-medium"
                            >
                              <option value="Single">Single</option>
                              <option value="In a relationship">
                                In a relationship
                              </option>
                              <option value="Married">Married</option>
                              <option value="Engaged">Engaged</option>
                              <option value="It's complicated">
                                It's complicated
                              </option>
                              <option value="None">
                                None / Prefer not to share
                              </option>
                            </select>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ACTIVE TAB: FEED PREFERENCES */}
                  {activeTab === "feed" && (
                    <section className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-sm space-y-6 animate-in fade-in duration-200">
                      <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-5">
                        <Rss className="w-6 h-6 text-primary" />
                        <div>
                          <h2 className="text-[18px] font-black tracking-tight font-manrope text-on-surface">
                            Feed Preferences
                          </h2>
                          <p className="text-xs text-secondary/90 leading-relaxed mt-0.5">
                            Control the default layout, algorithmic relevance,
                            and content curation parameters for your home feed.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex items-center justify-between pb-4 border-b border-outline-variant/10">
                          <div className="pr-5">
                            <p className="text-xs font-bold text-on-surface font-manrope">
                              Video Autoplay
                            </p>
                            <p className="text-[10px] text-secondary mt-1 max-w-xl leading-relaxed">
                              Automatically play video attachments and preview
                              loops silently while scrolling the curator feed.
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={tempSettings.videoAutoplay}
                              onChange={(e) => {
                                const val = e.target.checked;
                                setTempSettings({
                                  ...tempSettings,
                                  videoAutoplay: val,
                                });
                                setSavedVideoAutoplay(val);
                                try {
                                  if (user?.username) {
                                    const saved = JSON.parse(
                                      localStorage.getItem("curator_user_settings_by_username") || "{}"
                                    );
                                    if (!saved[user.username]) {
                                      saved[user.username] = {};
                                    }
                                    saved[user.username].videoAutoplay = val;
                                    localStorage.setItem(
                                      "curator_user_settings_by_username",
                                      JSON.stringify(saved)
                                    );
                                  }
                                } catch (err) {
                                  console.warn("Failed to update user-specific autoplay fast persistence", err);
                                }
                              }}
                            />
                            <div className="relative w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>

                        <ContentMutingFilter
                          mutedKeywords={tempSettings.mutedKeywords}
                          onChange={(updated) =>
                            setTempSettings({
                              ...tempSettings,
                              mutedKeywords: updated,
                            })
                          }
                        />
                      </div>
                    </section>
                  )}

                  {/* ACTIVE TAB: NOTIFICATIONS */}
                  {activeTab === "notifications" && (
                    <section className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-sm space-y-6 animate-in fade-in duration-200">
                      <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-5">
                        <Bell className="w-6 h-6 text-primary" />
                        <div>
                          <h2 className="text-[18px] font-black tracking-tight font-manrope text-on-surface">
                            Notification Preferences
                          </h2>
                          <p className="text-xs text-secondary/90 leading-relaxed mt-0.5">
                            Control how we message or alert you about content
                            updates and conversations.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* Group 1: Email Alerts */}
                        <div className="space-y-4">
                          <h3 className="text-xs font-bold text-on-surface">
                            Email Alerts Configuration
                          </h3>
                          <div className="space-y-4 pl-1">
                            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/5 last:border-none last:pb-0">
                              <div className="pr-5">
                                <p className="text-xs font-bold text-on-surface">
                                  Comments on My Posts
                                </p>
                                <p className="text-[10px] text-secondary mt-0.5 leading-relaxed">
                                  Receive instant email receipts when someone
                                  comments or responds on your curated articles.
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={tempSettings.emailAlertsComments}
                                  onChange={(e) =>
                                    setTempSettings({
                                      ...tempSettings,
                                      emailAlertsComments: e.target.checked,
                                    })
                                  }
                                />
                                <div className="relative w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                              </label>
                            </div>

                            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/5 last:border-none last:pb-0">
                              <div className="pr-5">
                                <p className="text-xs font-bold text-on-surface">
                                  Mentions & Tags Alerts
                                </p>
                                <p className="text-[10px] text-secondary mt-0.5 leading-relaxed">
                                  Notify me over mail when another user
                                  @mentions my display handle in thread topics.
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={tempSettings.emailAlertsMentions}
                                  onChange={(e) =>
                                    setTempSettings({
                                      ...tempSettings,
                                      emailAlertsMentions: e.target.checked,
                                    })
                                  }
                                />
                                <div className="relative w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="h-px bg-outline-variant/10" />

                        {/* Group 2: Platform Notifications */}
                        <div className="space-y-4">
                          <h3 className="text-xs font-bold text-on-surface">
                            In-App Dashboard Alerts
                          </h3>
                          <div className="space-y-4 pl-1">
                            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/5 last:border-none last:pb-0">
                              <div className="pr-5">
                                <p className="text-xs font-bold text-on-surface">
                                  In-App Banners and Dots
                                </p>
                                <p className="text-[10px] text-secondary mt-0.5 leading-relaxed">
                                  Render badge dots and alerts at our header
                                  section for any feed movements.
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={
                                    tempSettings.platformNotificationsInApp
                                  }
                                  onChange={(e) =>
                                    setTempSettings({
                                      ...tempSettings,
                                      platformNotificationsInApp:
                                        e.target.checked,
                                    })
                                  }
                                />
                                <div className="relative w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                              </label>
                            </div>

                            <div className="flex items-center justify-between pb-3 border-b border-outline-variant/5 last:border-none last:pb-0">
                              <div className="pr-5">
                                <p className="text-xs font-bold text-on-surface">
                                  Direct Message Sounds
                                </p>
                                <p className="text-[10px] text-secondary mt-0.5 leading-relaxed">
                                  Show alerts with acoustic indicators upon
                                  receiving curated team queries.
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={
                                    tempSettings.platformNotificationsDMs
                                  }
                                  onChange={(e) =>
                                    setTempSettings({
                                      ...tempSettings,
                                      platformNotificationsDMs:
                                        e.target.checked,
                                    })
                                  }
                                />
                                <div className="relative w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="h-px bg-outline-variant/10" />

                        {/* Group 3: Weekly digests */}
                        <div className="flex items-center justify-between pb-4">
                          <div className="pr-5">
                            <p className="text-xs font-bold text-on-surface">
                              Weekly Digests and Curation Summaries
                            </p>
                            <p className="text-[10px] text-secondary mt-1 max-w-xl leading-relaxed">
                              Get a tidy weekend digest summarising key
                              curriculum debates, most voted peer insights, and
                              tech achievements in your sector.
                            </p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer shrink-0">
                            <input
                              type="checkbox"
                              className="sr-only peer"
                              checked={tempSettings.weeklyDigest}
                              onChange={(e) =>
                                setTempSettings({
                                  ...tempSettings,
                                  weeklyDigest: e.target.checked,
                                })
                              }
                            />
                            <div className="relative w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                          </label>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ACTIVE TAB: SECURITY */}
                  {activeTab === "security" && (
                    <section
                      className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-sm space-y-7 animate-in fade-in duration-200"
                      id="security-section"
                    >
                      <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-5">
                        <Shield className="w-6 h-6 text-primary" />
                        <div>
                          <h2 className="text-[18px] font-black tracking-tight font-manrope text-on-surface">
                            Security & Privacy Settings
                          </h2>
                          <p className="text-xs text-secondary/90 leading-relaxed mt-0.5">
                            Protect your accounts, set permissions, or hook up
                            external authentications.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        {/* 1. Change password block */}
                        <div>
                          <label className="block text-xs font-bold text-on-surface mb-2">
                            Access Credentials
                          </label>
                          <button
                            type="button"
                            onClick={() => setShowPasswordModal(true)}
                            className="w-full flex items-center justify-between p-4 rounded-xl bg-surface-container-low/40 hover:bg-surface-container-low border border-outline-variant/10 transition-colors text-left group"
                          >
                            <div className="flex items-center gap-3">
                              <Lock className="w-5 h-5 text-secondary" />
                              <span className="text-xs font-bold text-on-surface">
                                Change Secure Password Credentials
                              </span>
                            </div>
                            <ChevronRight className="w-5 h-5 text-secondary group-hover:translate-x-1 transition-transform" />
                          </button>
                        </div>

                        <div className="h-px bg-outline-variant/10" />

                        {/* 2. Privacy toggles */}
                        <div className="space-y-4">
                          <label className="block text-xs font-bold text-on-surface mb-2">
                            Visibility & Access Controls
                          </label>
                          <div className="space-y-4 pl-1">
                            <div className="flex items-center justify-between p-1">
                              <div className="pr-5">
                                <p className="text-xs font-bold text-on-surface">
                                  Require Follow Approval
                                </p>
                                <p className="text-[10px] text-secondary mt-1 leading-relaxed">
                                  If enabled, other users must request to follow
                                  you before they can see your posts.
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={tempSettings.requireFollowApproval}
                                  onChange={(e) =>
                                    setTempSettings({
                                      ...tempSettings,
                                      requireFollowApproval: e.target.checked,
                                    })
                                  }
                                />
                                <div className="relative w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                              </label>
                            </div>

                            <div className="flex items-center justify-between p-1">
                              <div className="pr-5">
                                <p className="text-xs font-bold text-on-surface">
                                  Leaderboard Participation
                                </p>
                                <p className="text-[10px] text-secondary mt-1 leading-relaxed">
                                  Opt into global community metrics. Opting out
                                  hides your name and score from the global
                                  leaderboards.
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={tempSettings.leaderboardOptIn}
                                  onChange={(e) =>
                                    setTempSettings({
                                      ...tempSettings,
                                      leaderboardOptIn: e.target.checked,
                                    })
                                  }
                                />
                                <div className="relative w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                              </label>
                            </div>

                            <div className="flex items-center justify-between p-1">
                              <div className="pr-5">
                                <p className="text-xs font-bold text-on-surface">
                                  Knowledge Score Publicity
                                </p>
                                <p className="text-[10px] text-secondary mt-1 leading-relaxed">
                                  Make your Knowledge Score and cumulative Edu
                                  Impact publicly visible to any curator
                                  browsing your card.
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={tempSettings.scoreVisibilityPublic}
                                  onChange={(e) =>
                                    setTempSettings({
                                      ...tempSettings,
                                      scoreVisibilityPublic: e.target.checked,
                                    })
                                  }
                                />
                                <div className="relative w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="h-px bg-outline-variant/10" />

                        <div className="space-y-4">
                          <label className="block text-xs font-bold text-on-surface mb-2">
                            Followers and public content & audience
                          </label>
                          <div className="space-y-4 pl-1">
                            <div className="flex items-center justify-between p-1">
                              <div className="pr-5">
                                <p className="text-xs font-bold text-on-surface">
                                  Who Can Follow Me
                                </p>
                                <p className="text-[10px] text-secondary mt-1 leading-relaxed">
                                  Choose who can follow your public account feed
                                  and notifications.
                                </p>
                              </div>
                              <select
                                value={tempSettings.whoCanFollow || "Public"}
                                onChange={(e) =>
                                  setTempSettings({
                                    ...tempSettings,
                                    whoCanFollow: e.target.value,
                                  })
                                }
                                className="bg-surface-container-low border border-outline-variant/10 rounded-xl px-3 py-1.5 text-xs text-on-surface focus:ring-1 focus:ring-primary/20 outline-none font-medium text-right shrink-0 max-w-[130px] md:max-w-none cursor-pointer"
                              >
                                <option value="Public">Public (Anyone)</option>
                                <option value="Friends">Friends only</option>
                              </select>
                            </div>

                            <div className="flex items-center justify-between p-1">
                              <div className="pr-5">
                                <p className="text-xs font-bold text-on-surface">
                                  Who Can Comment on Public Posts
                                </p>
                                <p className="text-[10px] text-secondary mt-1 leading-relaxed">
                                  Limit commentary permissions on your published
                                  articles and feed items.
                                </p>
                              </div>
                              <select
                                value={tempSettings.whoCanComment || "Public"}
                                onChange={(e) =>
                                  setTempSettings({
                                    ...tempSettings,
                                    whoCanComment: e.target.value,
                                  })
                                }
                                className="bg-surface-container-low border border-outline-variant/10 rounded-xl px-3 py-1.5 text-xs text-on-surface focus:ring-1 focus:ring-primary/20 outline-none font-medium text-right shrink-0 max-w-[130px] md:max-w-none cursor-pointer"
                              >
                                <option value="Public">Public (Anyone)</option>
                                <option value="Followers">
                                  Followers only
                                </option>
                                <option value="Friends">Friends only</option>
                              </select>
                            </div>

                            <div className="flex items-center justify-between p-1">
                              <div className="pr-5">
                                <p className="text-xs font-bold text-on-surface">
                                  Show most relevant comments first
                                </p>
                                <p className="text-[10px] text-secondary mt-1 leading-relaxed">
                                  Rank conversation threads according to
                                  relevance metric algorithms instead of
                                  chronological order.
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={
                                    tempSettings.relevantCommentsFirst !== false
                                  }
                                  onChange={(e) =>
                                    setTempSettings({
                                      ...tempSettings,
                                      relevantCommentsFirst: e.target.checked,
                                    })
                                  }
                                />
                                <div className="relative w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                              </label>
                            </div>

                            <div className="flex items-center justify-between p-1">
                              <div className="pr-5">
                                <p className="text-xs font-bold text-on-surface">
                                  Off-Platform Previews
                                </p>
                                <p className="text-[10px] text-secondary mt-1 leading-relaxed">
                                  Enable rich meta snippets when your public
                                  group posts or discussions are linked outside
                                  of the layout.
                                </p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer shrink-0">
                                <input
                                  type="checkbox"
                                  className="sr-only peer"
                                  checked={
                                    tempSettings.offPlatformPreviews !== false
                                  }
                                  onChange={(e) =>
                                    setTempSettings({
                                      ...tempSettings,
                                      offPlatformPreviews: e.target.checked,
                                    })
                                  }
                                />
                                <div className="relative w-11 h-6 bg-surface-container-highest rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-200 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                              </label>
                            </div>
                          </div>
                        </div>

                        <div className="h-px bg-outline-variant/10" />

                        {/* 3. Integration accounts */}
                        <div className="space-y-4">
                          <label className="block text-xs font-bold text-on-surface mb-2">
                            Connected Accounts & Integration Keys
                          </label>
                          <div className="space-y-3">
                            {/* GitHub Connection list */}
                            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant/10">
                              <div className="flex items-center gap-3">
                                <Github className="w-5 h-5 text-on-surface" />
                                <div>
                                  <span className="text-xs font-black block">
                                    GitHub Professional Hub
                                  </span>
                                  <span className="text-[10px] text-secondary">
                                    Sync your public contributions and
                                    certifications
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span
                                  className={cn(
                                    "text-[10px] font-bold px-2.5 py-1 rounded-full border",
                                    tempSettings.connectedGithub
                                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                      : "bg-surface-container text-secondary border-outline-variant/10",
                                  )}
                                >
                                  {tempSettings.connectedGithub
                                    ? "Connected"
                                    : "Not Connected"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setTempSettings({
                                      ...tempSettings,
                                      connectedGithub:
                                        !tempSettings.connectedGithub,
                                    })
                                  }
                                  className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-black cursor-pointer transition-colors border",
                                    tempSettings.connectedGithub
                                      ? "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-outline-variant/20 hover:bg-stone-200"
                                      : "bg-primary text-white border-primary hover:brightness-105",
                                  )}
                                >
                                  {tempSettings.connectedGithub
                                    ? "Disconnect"
                                    : "Connect"}
                                </button>
                              </div>
                            </div>

                            {/* Google Workspace Integration */}
                            <div className="flex items-center justify-between p-4 bg-surface-container-low rounded-xl border border-outline-variant/10">
                              <div className="flex items-center gap-3">
                                <LinkIcon className="w-5 h-5 text-on-surface" />
                                <div>
                                  <span className="text-xs font-black block">
                                    Google Workspace Integration APIs
                                  </span>
                                  <span className="text-[10px] text-secondary">
                                    Import study calendars and Google Drive
                                    resources
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center gap-3">
                                <span
                                  className={cn(
                                    "text-[10px] font-bold px-2.5 py-1 rounded-full border",
                                    tempSettings.connectedGoogle
                                      ? "bg-emerald-500/10 text-emerald-500 border-emerald-500/20"
                                      : "bg-surface-container text-secondary border-outline-variant/10",
                                  )}
                                >
                                  {tempSettings.connectedGoogle
                                    ? "Connected"
                                    : "Not Connected"}
                                </span>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setTempSettings({
                                      ...tempSettings,
                                      connectedGoogle:
                                        !tempSettings.connectedGoogle,
                                    })
                                  }
                                  className={cn(
                                    "px-3 py-1.5 rounded-lg text-[10px] font-black cursor-pointer transition-colors border",
                                    tempSettings.connectedGoogle
                                      ? "bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 border-outline-variant/20 hover:bg-stone-200"
                                      : "bg-primary text-white border-primary hover:brightness-105",
                                  )}
                                >
                                  {tempSettings.connectedGoogle
                                    ? "Disconnect"
                                    : "Connect"}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* ACTIVE TAB: APPEARANCE */}
                  {activeTab === "appearance" && (
                    <section className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/10 shadow-sm space-y-7 animate-in fade-in duration-200 font-medium font-manrope">
                      <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-5">
                        <Palette className="w-6 h-6 text-primary" />
                        <div>
                          <h2 className="text-[18px] font-black tracking-tight font-manrope text-on-surface">
                            Appearance & Theme Display
                          </h2>
                          <p className="text-xs text-secondary/90 leading-relaxed mt-0.5">
                            Customize visual theme modes, color accents, and
                            article rendering scale.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-7">
                        <div>
                          <label className="block text-xs font-bold text-on-surface mb-4">
                            Base Font Theme Mode Selection
                          </label>
                          <div className="grid grid-cols-2 gap-4">
                            <button
                              type="button"
                              onClick={
                                theme === "dark" ? toggleTheme : undefined
                              }
                              className={cn(
                                "flex flex-col items-center gap-3 p-5 border rounded-xl transition-all cursor-pointer",
                                theme === "light"
                                  ? "border-primary bg-primary/10 shadow-sm text-primary animate-pulse-once"
                                  : "border-outline-variant/10 bg-surface-container-low hover:bg-surface-container",
                              )}
                            >
                              <Sun
                                className={cn(
                                  "w-6 h-6",
                                  theme === "light"
                                    ? "text-primary"
                                    : "text-secondary",
                                )}
                              />
                              <span className="text-xs font-black font-manrope font-manrope">
                                Light Mode Display
                              </span>
                            </button>
                            <button
                              type="button"
                              onClick={
                                theme === "light" ? toggleTheme : undefined
                              }
                              className={cn(
                                "flex flex-col items-center gap-3 p-5 border rounded-xl transition-all cursor-pointer",
                                theme === "dark"
                                  ? "border-primary bg-primary/10 shadow-sm text-primary"
                                  : "border-outline-variant/10 bg-surface-container-low hover:bg-surface-container",
                              )}
                            >
                              <Moon
                                className={cn(
                                  "w-6 h-6",
                                  theme === "dark"
                                    ? "text-primary"
                                    : "text-secondary",
                                )}
                              />
                              <span className="text-xs font-black font-manrope font-manrope">
                                Dark Mode Display
                              </span>
                            </button>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex justify-between items-center">
                            <label className="block text-xs font-bold text-on-surface mb-2">
                              Base Font Scaling
                            </label>
                            <span className="text-xs font-black text-primary font-manrope">
                              {tempSettings.fontSize <= 14
                                ? "Compact"
                                : tempSettings.fontSize <= 16
                                  ? "Normal"
                                  : tempSettings.fontSize <= 18
                                    ? "Standard"
                                    : "Large"}{" "}
                              ({tempSettings.fontSize}px)
                            </span>
                          </div>
                          <input
                            className="w-full cursor-pointer py-2 focus:outline-none"
                            type="range"
                            min="14"
                            max="20"
                            value={tempSettings.fontSize}
                            onChange={(e) => {
                              const size = parseInt(e.target.value);
                              setTempSettings({
                                ...tempSettings,
                                fontSize: size,
                              });
                              // Dynamically update font-scale for live preview before saving
                              const scale = size / 15;
                              document.documentElement.style.setProperty(
                                "--font-scale",
                                `${scale}`,
                              );
                            }}
                          />
                          <div className="flex justify-between text-[10px] font-black text-outline-variant uppercase tracking-widest px-0.5">
                            <span>Compact (14px)</span>
                            <span>Standard (17px)</span>
                            <span>Large (20px)</span>
                          </div>
                        </div>

                        <div className="h-px bg-outline-variant/10" />

                        <div className="space-y-4">
                          <label className="block text-xs font-bold text-on-surface mb-2">
                            Aesthetic Color Accent
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                            {(
                              Object.keys(ACCENT_PALETTES) as AccentColor[]
                            ).map((col) => {
                              const palette = ACCENT_PALETTES[col];
                              const isSelected =
                                tempSettings.accentColor === col;
                              const colors =
                                theme === "dark" ? palette.dark : palette.light;
                              return (
                                <button
                                  key={col}
                                  type="button"
                                  onClick={() => {
                                    setTempSettings({
                                      ...tempSettings,
                                      accentColor: col,
                                    });
                                    // Dynamically update actual primary color for live preview
                                    document.documentElement.style.setProperty(
                                      "--primary",
                                      colors.primary,
                                    );
                                    document.documentElement.style.setProperty(
                                      "--primary-container",
                                      colors.primaryContainer,
                                    );
                                  }}
                                  className={cn(
                                    "flex flex-col items-center gap-2 p-3.5 border rounded-xl transition-all cursor-pointer",
                                    isSelected
                                      ? "border-primary bg-primary/10 shadow-sm"
                                      : "border-outline-variant/10 bg-surface-container-low hover:bg-surface-container",
                                  )}
                                  title={palette.name}
                                >
                                  <span
                                    className="w-5 h-5 rounded-full shadow-inner border border-outline-variant/10"
                                    style={{ backgroundColor: colors.primary }}
                                  />
                                  <span className="text-[10px] font-black tracking-tight leading-none text-center block truncate w-full">
                                    {palette.name.split(" ")[0]}
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    </section>
                  )}

                  {activeTab === "language" && (
                    <section className="bg-surface-container-lowest p-8 rounded-2xl border border-outline-variant/15 shadow-sm space-y-6 animate-in fade-in duration-200 text-left">
                      <div className="flex items-center gap-3 border-b border-outline-variant/10 pb-5">
                        <Globe className="w-6 h-6 text-primary" />
                        <div>
                          <h2 className="text-[18px] font-black tracking-tight font-manrope text-on-surface">
                            {t("languageTab")}
                          </h2>
                          <p className="text-xs text-secondary/90 leading-relaxed mt-0.5">
                            Configure preferred languages, localized date schemas, and region representations.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-4 font-medium font-manrope">
                        {/* App Language List Tile */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface-container-low border border-outline-variant/10 rounded-xl gap-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                              <Languages className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-xs font-bold block text-on-surface">
                                {t("appLanguage")}
                              </span>
                              <span className="text-[10px] text-secondary leading-relaxed block mt-0.5 max-w-md">
                                {t("appLanguageDesc")}
                              </span>
                            </div>
                          </div>
                          <div className="w-full sm:w-64 max-w-xs shrink-0 self-start sm:self-center">
                            <select
                              value={tempSettings.appLanguage || "English"}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTempSettings(prev => ({
                                  ...prev,
                                  appLanguage: val,
                                }));
                                setSavedAppLanguage(val);
                              }}
                              className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg px-3 py-2 text-xs text-on-surface focus:ring-1 focus:ring-primary/25 outline-none font-medium cursor-pointer"
                            >
                              <option value="English">English (US/UK)</option>
                              <option value="Bengali">Bengali (বাংলা)</option>
                              <option value="Spanish">Spanish (Español)</option>
                              <option value="French">French (Français)</option>
                              <option value="German">German (Deutsch)</option>
                              <option value="Japanese">Japanese (日本語)</option>
                              <option value="Arabic">Arabic (العربية)</option>
                            </select>
                          </div>
                        </div>

                        {/* Region Format List Tile */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface-container-low border border-outline-variant/10 rounded-xl gap-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                              <MapPin className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-xs font-bold block text-on-surface">
                                {t("regionFormat")}
                              </span>
                              <span className="text-[10px] text-secondary leading-relaxed block mt-0.5 max-w-md">
                                {t("regionFormatDesc")}
                              </span>
                            </div>
                          </div>
                          <div className="w-full sm:w-64 max-w-xs shrink-0 self-start sm:self-center">
                            <select
                              value={tempSettings.regionFormat || "Bangladesh"}
                              onChange={(e) => {
                                const val = e.target.value;
                                setTempSettings(prev => ({
                                  ...prev,
                                  regionFormat: val,
                                }));
                                setSavedRegionFormat(val);
                              }}
                              className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg px-3 py-2 text-xs text-on-surface focus:ring-1 focus:ring-primary/25 outline-none font-medium cursor-pointer"
                            >
                              <option value="Bangladesh">Bangladesh (Dhaka format)</option>
                              <option value="United States">United States (MM/DD/YYYY)</option>
                              <option value="United Kingdom">United Kingdom (DD/MM/YYYY)</option>
                              <option value="Europe">Europe (24h format)</option>
                              <option value="Japan">Japan (YYYY/MM/DD)</option>
                            </select>
                          </div>
                        </div>

                        {/* Preferred Time Zone List Tile */}
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between p-4 bg-surface-container-low border border-outline-variant/10 rounded-xl gap-4">
                          <div className="flex items-start gap-3">
                            <div className="p-2 bg-primary/10 rounded-lg text-primary shrink-0">
                              <Clock className="w-5 h-5" />
                            </div>
                            <div>
                              <span className="text-xs font-bold block text-on-surface">
                                {t("preferredTimezone")}
                              </span>
                              <span className="text-[10px] text-secondary leading-relaxed block mt-0.5 max-w-md">
                                {t("preferredTimezoneDesc")}
                              </span>
                            </div>
                          </div>
                          <div className="w-full sm:w-64 max-w-xs shrink-0 self-start sm:self-center">
                            <select
                              value={tempSettings.timezone || "UTC+6 (Asia/Dhaka)"}
                              onChange={(e) => {
                                const label = e.target.value;
                                const found = timezoneOptions.find(opt => opt.label === label);
                                const iana = found ? found.iana : "Asia/Dhaka";
                                setTempSettings(prev => ({
                                  ...prev,
                                  timezone: label,
                                  timezoneIANA: iana,
                                }));
                                setSavedTimezone(label);
                                setSavedTimezoneIANA(iana);
                              }}
                              className="w-full bg-surface-container-lowest border border-outline-variant/10 rounded-lg px-3 py-2 text-xs text-on-surface focus:ring-1 focus:ring-primary/25 outline-none font-medium cursor-pointer animate-none"
                            >
                              {timezoneOptions.map(opt => (
                                <option key={opt.label} value={opt.label}>
                                  {opt.label}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>

                      {/* GPS / IP Location Detection Block */}
                      <div className="p-5 bg-surface-container-low border border-outline-variant/10 rounded-xl space-y-3.5 font-manrope">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                          <div className="space-y-1">
                            <span className="text-xs font-bold block text-on-surface">
                              {t("syncLocationBtn")}
                            </span>
                            <span className="text-[10px] text-secondary leading-relaxed block font-semibold">
                              Automatically sync your timezone and region format using your current physical coordinates or IP region address.
                            </span>
                          </div>
                          <button
                            type="button"
                            onClick={handleAutoDetectTimezone}
                            disabled={syncStatus === "pending"}
                            className={cn(
                              "text-[10px] font-black uppercase tracking-wider px-5 py-2.5 rounded-lg transition-all shadow-sm flex items-center gap-2 cursor-pointer self-start sm:self-center shrink-0",
                              syncStatus === "pending"
                                ? "bg-primary/20 text-primary cursor-wait"
                                : "bg-primary text-white hover:brightness-110"
                            )}
                          >
                            <Compass className={cn("w-3.5 h-3.5", syncStatus === "pending" && "animate-spin")} />
                            {syncStatus === "pending" ? t("syncLocationPending") : t("syncLocationBtn")}
                          </button>
                        </div>

                        {syncStatus === "success" && (
                          <div className="text-[10px] font-bold text-emerald-500 bg-emerald-500/10 border border-emerald-500/15 p-2.5 rounded-lg animate-in fade-in duration-200">
                            {t("syncLocationSuccess")} <span className="font-mono text-on-surface">{detectedZone}</span>
                          </div>
                        )}

                        {syncStatus === "error" && (
                          <div className="text-[10px] font-bold text-tertiary bg-tertiary/10 border border-tertiary/15 p-2.5 rounded-lg animate-in fade-in duration-200">
                            {t("syncLocationError")}
                          </div>
                        )}
                      </div>
                    </section>
                  )}

                  {/* ACTIVE TAB: DEACTIVATION & DELETION */}
                  {activeTab === "danger" && (
                    <section className="bg-tertiary/5 p-8 rounded-2xl border border-tertiary/25 shadow-sm space-y-6 animate-in fade-in duration-200 text-left">
                      <div className="flex items-center gap-3 border-b border-tertiary/20 pb-5">
                        <AlertTriangle className="w-5 h-5 text-tertiary animate-pulse" />
                        <div>
                          <h2 className="text-[18px] font-black tracking-tight font-manrope text-tertiary">
                            Deactivation & Deletion
                          </h2>
                          <p className="text-xs text-tertiary/85 mt-0.5 font-semibold">
                            Irreversible administrative actions related to your
                            permanent digital residency.
                          </p>
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="p-4 bg-surface-container-lowest border border-outline-variant/10 rounded-xl space-y-2">
                          <p className="text-xs font-extrabold text-on-surface">
                            Permanent Account Deactivation
                          </p>
                          <p className="text-[10px] text-secondary leading-relaxed font-semibold">
                            Deleting or deactivating your curator account is
                            permanent, non-appealable, and instant. Your entire
                            history of microposts, peer compliments, bookmarked
                            reads, and technical credentials will be completely
                            erased from our servers in accordance with GDPR
                            privacy compliance.
                          </p>
                        </div>

                        <div className="space-y-4 border border-tertiary/20 bg-tertiary/5 p-5 rounded-xl">
                          <label className="block text-xs font-bold text-tertiary mb-2">
                            Confirm Account Deletion
                          </label>
                          <p className="text-[10px] text-secondary leading-normal">
                            To protect your account from accidental
                            deactivation, please type your EXACT username{" "}
                            <strong className="text-tertiary select-all">
                              {user?.username}
                            </strong>{" "}
                            below:
                          </p>
                          <input
                            type="text"
                            value={deleteConfirmText}
                            onChange={(e) => {
                              setDeleteConfirmText(e.target.value);
                              setDeleteError("");
                            }}
                            className="w-full max-w-sm bg-surface-container-low border border-tertiary/20 rounded-xl px-4 py-2.5 text-[10px] text-on-surface outline-none focus:ring-1 focus:ring-tertiary/40 font-semibold"
                            placeholder="Type your username to confirm"
                          />
                          {deleteError && (
                            <p className="text-[10px] font-bold text-tertiary">
                              {deleteError}
                            </p>
                          )}
                          <button
                            type="button"
                            onClick={handleDeactivateAccount}
                            disabled={deleteConfirmText !== user?.username}
                            className={cn(
                              "text-xs font-black uppercase tracking-wider px-6 py-3 rounded-xl transition-all cursor-pointer shadow-md",
                              deleteConfirmText === user?.username
                                ? "bg-tertiary text-white hover:brightness-110"
                                : "bg-tertiary/10 text-tertiary/50 cursor-not-allowed",
                            )}
                          >
                            Permanently Delete Account
                          </button>
                        </div>
                      </div>
                    </section>
                  )}

                  {/* PERSISTENT ACTIONS FOOTER (FOR ACTIVE TABS OTHER THAN DANGER) */}
                  {activeTab !== "danger" && (
                    <div className="flex items-center justify-end gap-3.5 bg-surface-container-lowest p-5 rounded-xl border border-outline-variant/10 shadow-sm">
                      <button
                        onClick={handleDiscard}
                        className="px-6 py-3 text-secondary hover:text-on-surface font-black text-[10px] uppercase tracking-wider hover:bg-surface-container rounded-lg transition-colors cursor-pointer animate-all duration-150"
                      >
                        Discard
                      </button>
                      <button
                        onClick={handleSave}
                        className={cn(
                          "px-8 py-3 text-white font-black text-[10px] uppercase tracking-wider rounded-lg shadow-md active:scale-95 transition-all cursor-pointer",
                          isDirty
                            ? "bg-primary shadow-primary/20 hover:brightness-110"
                            : "bg-primary/50 text-white/70 cursor-not-allowed",
                        )}
                        disabled={!isDirty}
                      >
                        Save Changes
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
