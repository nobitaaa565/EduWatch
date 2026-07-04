# EduWatch Design System Guidelines

This document specifies the standard UI parameters to be used across all pages of the EduWatch application to ensure visual consistency.

## 1. Layout & Containers

| Element | Desktop Size | Mobile Size |
| :--- | :--- | :--- |
| **Profile Sidebar (Left)** | `w-full lg:w-[340px]` | `w-full` |
| **Main Content Column** | `flex-1 min-w-0` | `w-full` |
| **Standard Card Padding** | `p-5` or `p-6` | `p-4` |
| **Section Spacing** | `space-y-5` or `space-y-6` | `space-y-4` |

## 2. Typography

| Role | Class | Notes |
| :--- | :--- | :--- |
| **Primary Titles** | `text-2xl font-black` | Page headings, high-level titles |
| **Card Header / Post Title** | `text-lg font-black` | Inside cards or feed items |
| **Standard Body Text** | `text-[13px] font-medium` | Primary reading content |
| **Secondary Detail Text** | `text-[11px] font-bold` | Metadata, stats labels, timestamps |
| **Label / Uppercase Text** | `text-[9px] font-black uppercase` | Smallest labels, tracking-widest |

## 3. Icons & Media

| Element | Class | Notes |
| :--- | :--- | :--- |
| **Section Icons** | `w-5 h-5` | In card headers, main actions |
| **Detail/Inline Icons** | `w-3 h-3` or `w-4 h-4` | Next to text, inside small buttons |
| **Main Profile Avatar** | `w-20 h-20` | Profile page main image |
| **Post/Comment Avatar** | `w-9 h-9` | Feed items, author info |

## 4. Buttons & Interactive Elements

| Style | Padding | Text Size |
| :--- | :--- | :--- |
| **Action Button (Main)** | `px-6 py-2.5` | `text-xs font-black` |
| **Sidebar Action (Small)** | `px-3 py-1.5` | `text-[10px] font-bold` |
| **Pill Toggle / Tab** | `px-4 py-2` | `text-sm font-bold` |

## 5. UI Accents

- **Border Radius:** Standardize on `rounded-2xl` for cards, `rounded-xl` for inner elements, `rounded-full` for buttons.
- **Shadows:** Use `shadow-sm` or `ambient-shadow` (custom).
- **Colors:** Use Tailwind theme variables (`primary`, `on-surface`, `secondary`, `outline-variant`).
