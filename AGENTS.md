# Developer Instructions

## Layout and Styling Guidelines
- **Reference Document:** Always follow the specifications defined in `/DESIGN_SYSTEM.md` for any UI changes.
- **Consistency:** Ensure that headers, text sizes, icon scales, and container widths match across all pages (Home, Profile, Settings, etc.).
- **Mobile First:** Adhere to the mobile-first classes provided in the design system while optimizing for the desktop widths specified.
- **Micro-post & Article Typography Safeguard:** Do not enlarge or change the font sizes, headings, avatars, or container sizes of microposts or articles in the future.
  - **Post Body Text:** Must be kept strictly at standard feed size of `text-[14px] leading-relaxed font-normal text-on-surface` (never let it inflate to `text-[16px]`, `text-[17px]`, or bold/medium weights).
  - **Full Details and Modals:** The focused detailed views (`MicroPostView.tsx`, `ArticleView.tsx`), search result posts, and post modal dialogs (`PostModal.tsx`) must preserve identical element sizes, titles, and text sizes as they are shown in the main feed list views instead of scaling up.
  - **Post Header UI:** Profile images must be `w-10 h-10` and author names must remain `text-[13px] font-bold text-on-surface hover:underline cursor-pointer transition-all`.
  - **Comment Section UI:** Core comment text must be `text-[13px] text-on-surface/90 font-normal leading-relaxed` with author headers at `text-[12px] font-bold`.
  - **Consolidated Layout Constraints:** Keep the body containers optimized (`max-w-[740px]`) for clean, single-screen responsive flow.

## Code Conventions
- Use functional components with Tailwind CSS.
- Ensure all meaningful elements have unique `id` attributes.
- Use `lucide-react` for icons and `motion/react` for animations.
