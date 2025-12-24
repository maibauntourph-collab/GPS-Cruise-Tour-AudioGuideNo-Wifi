# GPS Audio Guide - Design Guidelines

## Design Approach: Hybrid Travel-Utility System

**Primary References:** Google Maps (navigation clarity) + Airbnb Experiences (travel aesthetic) + Citymapper (transit-focused UI)

**Rationale:** This GPS audio guide requires map-first utility with travel-oriented visual appeal. We'll blend navigation precision with tourism warmth.

---

## Core Design Elements

### A. Color Palette

**Light Mode:**
- Primary: 14 85% 55% (Vibrant Roman terracotta/red-orange for landmarks and CTAs)
- Surface: 0 0% 98% (Clean off-white background)
- Map UI: 220 15% 25% (Deep slate for map controls and text overlays)
- Success/Active: 142 71% 45% (Green for GPS lock and active routes)
- Accent: 45 95% 50% (Warm gold for premium features)

**Dark Mode:**
- Primary: 14 75% 60% (Softer terracotta for visibility)
- Surface: 220 20% 12% (Deep charcoal for map overlay panels)
- Map UI: 0 0% 90% (Light text for controls)
- Success/Active: 142 60% 55% (Brighter green for night visibility)

### B. Typography

**Font Stack:**
- Primary: 'Inter' (Google Fonts) - Clean, legible for navigation UI
- Accent: 'Playfair Display' (Google Fonts) - Elegant serif for landmark names and headers

**Hierarchy:**
- H1: 32px/40px, Playfair Display, Semibold (Landmark titles)
- H2: 24px/32px, Inter, Semibold (Section headers)
- Body: 16px/24px, Inter, Regular (Navigation instructions, descriptions)
- UI Text: 14px/20px, Inter, Medium (Buttons, labels, metadata)
- Caption: 12px/16px, Inter, Regular (Distance, timing info)

### C. Layout System

**Spacing Primitives:** Tailwind units of 2, 4, 8, 12, 16 (p-2, gap-4, mb-8, py-12, mt-16)

**Map Layout:**
- Full-viewport map as primary canvas (h-screen)
- Floating overlay panels with backdrop-blur-md
- Bottom sheet for landmark details (expandable)
- Top bar for search and settings (fixed, glass-morphic)

**Grid System:**
- Single column mobile-first
- Landmark cards: Single column stack on mobile, 2-column grid on tablet (md:grid-cols-2)
- Route options: Horizontal scroll on mobile, grid on desktop

### D. Component Library

**Core Navigation Components:**

*Map Interface:*
- Custom landmark markers (terracotta pins with white icons)
- Route polyline (primary color, 4px stroke with subtle glow)
- User location pulse (green circle with animated ripple)
- Zoom controls (rounded square buttons, glass-morphic)

*Info Overlays:*
- Floating control panel (top-left): rounded-2xl, bg-white/90 dark:bg-slate-900/90, backdrop-blur-md, shadow-xl
- Bottom sheet (landmark details): Slide-up panel with drag handle, max-h-2/3, overflow-scroll
- Route summary card: Fixed bottom position when navigating, compact info display

*Interactive Elements:*
- Primary CTA buttons: px-8 py-4, rounded-full, bg-primary, text-white, shadow-lg
- Secondary buttons: px-6 py-3, rounded-full, border-2 border-primary, backdrop-blur-md (when over map)
- Icon buttons: p-3, rounded-full, bg-white/90 dark:bg-slate-800/90
- Toggle switches: iOS-style for audio on/off, GPS tracking

*Content Cards:*
- Landmark preview: rounded-xl, overflow-hidden, aspect-video image, p-4 content area
- Audio status indicator: Floating badge showing "🔊 Playing" / "🔇 Muted"
- Distance badge: Pill-shaped, absolute top-2 right-2 on cards, bg-black/60 text-white

**Data Display:**
- Route steps list: Numbered circles (bg-primary), connecting vertical line, step text on right
- Stats row: Flex container with icon + value pairs (distance, duration, stops)
- POI metadata: Small pills for category tags (🏛️ Ancient Rome, ⛲ Fountain, etc.)

**Forms & Controls:**
- Search bar: Large rounded input (rounded-full), magnifying glass icon left, clear button right
- Audio controls: Play/Pause button (large, circular), volume slider (if needed)
- Route options: Radio cards with visual preview and timing info

### E. Interaction & Motion

**Micro-interactions (minimal, purposeful):**
- Marker bounce on selection (0.3s ease-out)
- Route drawing animation (0.6s path reveal)
- Bottom sheet slide (0.4s ease-in-out with spring)
- Haptic feedback on landmark proximity (if supported)

**Transitions:**
- Panel overlays: fade + slide (from bottom/top, 0.3s)
- Button states: scale(0.95) on active, no other animations
- Map zoom: Smooth easing (0.4s) when centering on landmark

---

## Mobile-First Specifications

**Touch Targets:** Minimum 44px × 44px for all interactive elements

**Gesture Support:**
- Swipe up: Expand bottom sheet
- Swipe down: Collapse bottom sheet
- Pinch zoom: Map navigation
- Long press: Drop custom waypoint (future feature)

**Viewport Management:**
- Map: 100vh minus top bar height (64px)
- Bottom sheet: Starts at 140px (collapsed), expands to 66vh
- Overlay panels: Max 90vw width, centered

---

## Content Strategy

**Information Hierarchy:**
1. Current location + nearest landmark distance (always visible top)
2. Map with route visualization (primary focus)
3. Landmark details (on-demand via bottom sheet)
4. Audio playback status (persistent indicator)
5. Navigation instructions (appears when route active)

**Icon Usage:**
- Heroicons for UI controls (outline style)
- Custom landmark icons (simple, monochrome within markers)
- Font Awesome for audio/location status (solid style)

**Audio Interface:**
- Visible waveform animation when narration playing
- Text transcript available in bottom sheet
- Auto-play toggle in settings panel

---

## Images

**Map Tiles:** OpenStreetMap tiles (already implemented)

**Landmark Thumbnails:**
- Use high-quality photos for each POI (Colosseum, Forum, Trevi, Pantheon, Spanish Steps)
- Aspect ratio: 16:9 for cards, 4:3 for detail view
- Placement: Background of expanded bottom sheet with gradient overlay

**UI Photography:**
- Hero state (onboarding): Full-bleed image of Rome skyline with app overlay preview
- Empty state: Illustrated map placeholder when no location detected

**Visual Treatment:**
- Map overlays: Use backdrop-blur-md and bg-opacity-90 for glass-morphic effect
- Photo cards: Subtle vignette overlay, white text with shadow for readability
- Marker icons: White silhouettes on terracotta background circles

---

## Accessibility & Performance

- High contrast mode support (WCAG AAA for text on map overlays)
- Audio narration with text fallback for hearing-impaired users
- Large touch targets (minimum 44px) for outdoor use
- Offline map caching strategy (progressive enhancement)
- Battery-efficient GPS polling (reduce frequency when stationary)
- Screen reader announcements for proximity alerts and route changes