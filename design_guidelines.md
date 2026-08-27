{
  "brand": {
    "name": "LineSight QA",
    "visual_personality": [
      "control-room precise",
      "high-trust industrial",
      "quiet-by-default (alerts pop)",
      "scan-first information density",
      "operator-friendly (gloves/low light)"
    ],
    "north_star": "A calm inspection console where normal looks neutral and anomalies are unmistakable (color + icon + label + shape)."
  },

  "inspiration_refs": {
    "layout_and_density": [
      {
        "title": "Factory Digital Twin Platform — Manufacturing SaaS UI (Behance)",
        "url": "https://www.behance.net/gallery/252574767/Factory-Digital-Twin-Platform-Manufacturing-SaaS-UI",
        "takeaways": [
          "Left rail navigation + dense dashboard cards",
          "Soft surfaces, thin dividers, strong typographic hierarchy",
          "Widgetized layout: KPI row → charts → activity feed"
        ]
      },
      {
        "title": "Terafab AI Smart Factory Dashboard (Dribbble)",
        "url": "https://dribbble.com/shots/27457368-Terafab-AI-Smart-Factory-Dashboard-Robotics-Monitoring",
        "takeaways": [
          "Control-room dark mode with restrained accents",
          "Status chips + compact tables",
          "Charts with subtle gridlines and bright alert markers"
        ]
      }
    ],
    "industrial_color_strategy": [
      {
        "title": "ISA-101 High Performance HMI color strategy",
        "url": "https://industrialmonitordirect.com/blogs/knowledgebase/isa-101-high-performance-hmi-design-principles-color-strategy",
        "takeaways": [
          "Use neutral grays for normal states",
          "Reserve saturated colors for abnormal/alerts",
          "Red/amber/magenta only when needed"
        ]
      }
    ]
  },

  "design_tokens": {
    "notes": [
      "We ship both Light and Dark themes. Default to Light for daytime QA offices; Dark is a true control-room mode.",
      "Status colors must be distinguishable beyond red/green: use icon + label + shape + pattern.",
      "Avoid gradients except small decorative header bands (<20% viewport)."
    ],

    "css_custom_properties": {
      "global": {
        "--radius-sm": "10px",
        "--radius-md": "14px",
        "--radius-lg": "18px",
        "--shadow-sm": "0 1px 2px rgba(16,24,40,0.06)",
        "--shadow-md": "0 10px 30px rgba(16,24,40,0.10)",
        "--shadow-inset": "inset 0 1px 0 rgba(255,255,255,0.6)",
        "--ring-width": "2px",
        "--focus-outline": "0 0 0 2px hsl(var(--background)), 0 0 0 4px hsl(var(--ring))"
      },

      "palette_light_hex": {
        "bg": "#F6F7F8",
        "surface": "#FFFFFF",
        "surface_2": "#F0F2F4",
        "text": "#0B1220",
        "text_muted": "#4B5565",
        "border": "#D7DCE2",
        "gridline": "#E7EBF0",

        "brand_primary": "#0E7490",
        "brand_primary_2": "#155E75",
        "brand_accent": "#F59E0B",

        "pass": "#1F7A4D",
        "fail": "#B42318",
        "uncertain": "#1D4ED8",
        "warning": "#B45309",
        "info": "#0E7490",

        "severity_low": "#2563EB",
        "severity_med": "#D97706",
        "severity_high": "#B42318",

        "canvas_bg": "#0B1220",
        "canvas_grid": "rgba(255,255,255,0.06)",
        "canvas_label_bg": "rgba(11,18,32,0.72)"
      },

      "palette_dark_hex": {
        "bg": "#0B0F14",
        "surface": "#0F1620",
        "surface_2": "#121C28",
        "text": "#E7EEF8",
        "text_muted": "#A7B3C4",
        "border": "#223042",
        "gridline": "#1A2635",

        "brand_primary": "#22B8CF",
        "brand_primary_2": "#0EA5B7",
        "brand_accent": "#FBBF24",

        "pass": "#2FBF71",
        "fail": "#FF5A4E",
        "uncertain": "#60A5FA",
        "warning": "#F59E0B",
        "info": "#22B8CF",

        "severity_low": "#60A5FA",
        "severity_med": "#F59E0B",
        "severity_high": "#FF5A4E",

        "canvas_bg": "#070A0E",
        "canvas_grid": "rgba(255,255,255,0.07)",
        "canvas_label_bg": "rgba(7,10,14,0.72)"
      },

      "semantic_hsl_for_shadcn_index_css": {
        "light": {
          "--background": "210 20% 97%",
          "--foreground": "222 47% 9%",
          "--card": "0 0% 100%",
          "--card-foreground": "222 47% 9%",
          "--popover": "0 0% 100%",
          "--popover-foreground": "222 47% 9%",
          "--primary": "191 82% 31%",
          "--primary-foreground": "210 40% 98%",
          "--secondary": "210 16% 94%",
          "--secondary-foreground": "222 47% 11%",
          "--muted": "210 16% 94%",
          "--muted-foreground": "215 16% 35%",
          "--accent": "210 16% 94%",
          "--accent-foreground": "222 47% 11%",
          "--destructive": "4 74% 40%",
          "--destructive-foreground": "210 40% 98%",
          "--border": "214 18% 86%",
          "--input": "214 18% 86%",
          "--ring": "191 82% 31%",
          "--radius": "0.875rem",
          "--chart-1": "191 82% 31%",
          "--chart-2": "142 55% 30%",
          "--chart-3": "217 91% 60%",
          "--chart-4": "38 92% 50%",
          "--chart-5": "4 74% 40%"
        },
        "dark": {
          "--background": "215 35% 6%",
          "--foreground": "210 40% 96%",
          "--card": "215 35% 9%",
          "--card-foreground": "210 40% 96%",
          "--popover": "215 35% 9%",
          "--popover-foreground": "210 40% 96%",
          "--primary": "188 78% 47%",
          "--primary-foreground": "215 35% 10%",
          "--secondary": "215 28% 14%",
          "--secondary-foreground": "210 40% 96%",
          "--muted": "215 28% 14%",
          "--muted-foreground": "215 18% 72%",
          "--accent": "215 28% 14%",
          "--accent-foreground": "210 40% 96%",
          "--destructive": "4 90% 64%",
          "--destructive-foreground": "215 35% 10%",
          "--border": "215 25% 20%",
          "--input": "215 25% 20%",
          "--ring": "188 78% 47%",
          "--radius": "0.875rem",
          "--chart-1": "188 78% 47%",
          "--chart-2": "142 60% 45%",
          "--chart-3": "217 91% 70%",
          "--chart-4": "38 92% 55%",
          "--chart-5": "4 90% 64%"
        }
      }
    },

    "typography": {
      "google_fonts": [
        {
          "family": "Space Grotesk",
          "weights": ["400", "500", "600", "700"],
          "usage": "Headings, KPI numerals"
        },
        {
          "family": "IBM Plex Sans",
          "weights": ["400", "500", "600"],
          "usage": "Body, tables, forms"
        },
        {
          "family": "IBM Plex Mono",
          "weights": ["400", "500"],
          "usage": "IDs, timestamps, model version, drift metrics"
        }
      ],
      "tailwind_font_mapping": {
        "heading": "font-[\"Space Grotesk\"]",
        "body": "font-[\"IBM Plex Sans\"]",
        "mono": "font-[\"IBM Plex Mono\"]"
      },
      "text_size_hierarchy": {
        "h1": "text-4xl sm:text-5xl lg:text-6xl",
        "h2": "text-base md:text-lg",
        "body": "text-sm md:text-base",
        "small": "text-xs"
      },
      "kpi_numerals": {
        "style": "tabular-nums",
        "tailwind": "[font-variant-numeric:tabular-nums]"
      }
    },

    "spacing_and_grid": {
      "layout": {
        "app_shell": "Left rail (icon+label) + top bar (context actions) + content area",
        "max_width": "2xl screens: keep content at max-w-[1400px] but DO NOT center text globally; center only the container with padding",
        "page_padding": "px-4 sm:px-6 lg:px-8 py-5",
        "card_padding": "p-4 sm:p-5",
        "section_gap": "gap-4 sm:gap-6",
        "kpi_grid": "grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4",
        "dashboard_grid": "grid grid-cols-1 xl:grid-cols-12 gap-4 sm:gap-6"
      },
      "density_modes": {
        "comfortable": "default",
        "compact": "tables: text-xs, row height 36px, tighter padding"
      }
    },

    "elevation_and_surfaces": {
      "card_style": "rounded-[var(--radius-md)] bg-card border border-border shadow-[var(--shadow-sm)]",
      "control_room_dark": "In dark mode, use subtle borders and minimal shadows; rely on surface contrast",
      "noise_texture": {
        "usage": "Apply a subtle noise overlay to page background only (not cards) to avoid flatness",
        "css_snippet": ".app-noise::before{content:'';position:fixed;inset:0;pointer-events:none;background-image:url('data:image/svg+xml;utf8,<svg xmlns=\"http://www.w3.org/2000/svg\" width=\"160\" height=\"160\"><filter id=\"n\"><feTurbulence type=\"fractalNoise\" baseFrequency=\"0.8\" numOctaves=\"3\" stitchTiles=\"stitch\"/></filter><rect width=\"160\" height=\"160\" filter=\"url(%23n)\" opacity=\"0.06\"/></svg>');mix-blend-mode:overlay;opacity:.35;}",
        "tailwind_usage": "Add className=\"app-noise\" on the root layout wrapper"
      }
    }
  },

  "status_system": {
    "principles": [
      "Never rely on color alone: always pair with icon + label.",
      "PASS/FAIL/UNCERTAIN must be readable at a glance in tables and on the result page.",
      "Use neutral UI by default; reserve saturated colors for anomalies and warnings (ISA-101 spirit)."
    ],
    "badges": {
      "pass": {
        "label": "PASS",
        "icon": "CheckCircle2 (lucide-react)",
        "classes": "bg-emerald-50 text-emerald-800 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-200 dark:border-emerald-900",
        "data_testid": "status-badge-pass"
      },
      "fail": {
        "label": "FAIL",
        "icon": "XCircle (lucide-react)",
        "classes": "bg-red-50 text-red-800 border-red-200 dark:bg-red-950/35 dark:text-red-200 dark:border-red-900",
        "data_testid": "status-badge-fail"
      },
      "uncertain": {
        "label": "UNCERTAIN",
        "icon": "HelpCircle (lucide-react)",
        "classes": "bg-blue-50 text-blue-800 border-blue-200 dark:bg-blue-950/35 dark:text-blue-200 dark:border-blue-900",
        "data_testid": "status-badge-uncertain"
      }
    },
    "drift_indicator": {
      "states": [
        {
          "state": "stable",
          "icon": "ShieldCheck",
          "label": "Drift: Stable",
          "color": "muted",
          "data_testid": "drift-indicator-stable"
        },
        {
          "state": "watch",
          "icon": "TriangleAlert",
          "label": "Drift: Watch",
          "color": "amber",
          "data_testid": "drift-indicator-watch"
        },
        {
          "state": "high",
          "icon": "Siren",
          "label": "Drift: High",
          "color": "red",
          "data_testid": "drift-indicator-high"
        }
      ]
    }
  },

  "annotation_overlay_spec": {
    "canvas_layout": {
      "container": "Left: image canvas (primary). Right: regions list + confidence + notes.",
      "responsive": "Mobile: stack canvas first, then regions panel; keep verdict sticky at top.",
      "aspect": "Use AspectRatio component to preserve image ratio; canvas overlays absolute positioned."
    },
    "bounding_boxes": {
      "stroke_width": "2px (normal), 3px (hover/selected)",
      "corner_style": "8px radius + corner ticks (L-shape) for industrial feel",
      "colors_by_severity": {
        "low": "severity_low",
        "medium": "severity_med",
        "high": "severity_high"
      },
      "pattern": "For UNCERTAIN regions, use dashed stroke (6px dash / 4px gap) regardless of severity.",
      "label_pill": {
        "position": "top-left of box, offset 6px",
        "content": "Defect type • Severity • Confidence%",
        "style": "rounded-md px-2 py-1 text-xs font-medium backdrop-blur bg-[var(--canvas_label_bg)] text-white border border-white/10",
        "include_icon": "Dot indicator matching severity color"
      },
      "hover_and_selection": {
        "hover": "Increase stroke width + show subtle glow shadow",
        "selected": "Lock highlight + scroll regions table to row; show handles disabled (read-only)",
        "glow": "shadow-[0_0_0_3px_rgba(34,184,207,0.18)] in dark; rgba(14,116,144,0.16) in light"
      }
    },
    "regions_panel": {
      "table_columns": ["Region", "Type", "Severity", "Confidence", "Area"],
      "row_behavior": "Hover row highlights corresponding box; clicking row selects box.",
      "empty_state": "If no regions: show PASS explanation + link to view calibration baseline.",
      "data_testids": {
        "regions_table": "inspection-regions-table",
        "region_row": "inspection-region-row"
      }
    },
    "confidence_gauge": {
      "style": "Semi-circular gauge (0–100) with needle + segmented arc",
      "segments": [
        {"range": "0-40", "label": "Low", "color": "fail"},
        {"range": "40-70", "label": "Medium", "color": "warning"},
        {"range": "70-100", "label": "High", "color": "pass"}
      ],
      "uncertainty_note": "If model returns uncertainty: show blue UNCERTAIN badge + short explanation + recommended action (recalibrate / add samples).",
      "implementation": {
        "library": "Recharts (custom Pie + needle) OR simple SVG component",
        "data_testid": "inspection-confidence-gauge"
      }
    }
  },

  "components": {
    "component_path": {
      "shadcn_primary": "/app/frontend/src/components/ui/",
      "use_components": [
        {"name": "button", "file": "button.jsx"},
        {"name": "badge", "file": "badge.jsx"},
        {"name": "card", "file": "card.jsx"},
        {"name": "tabs", "file": "tabs.jsx"},
        {"name": "table", "file": "table.jsx"},
        {"name": "dialog", "file": "dialog.jsx"},
        {"name": "drawer", "file": "drawer.jsx", "note": "Use Drawer for mobile filters"},
        {"name": "select", "file": "select.jsx"},
        {"name": "calendar", "file": "calendar.jsx", "note": "Use for date range in history filters"},
        {"name": "progress", "file": "progress.jsx"},
        {"name": "skeleton", "file": "skeleton.jsx"},
        {"name": "scroll-area", "file": "scroll-area.jsx"},
        {"name": "tooltip", "file": "tooltip.jsx"},
        {"name": "sonner", "file": "sonner.jsx", "note": "Use Sonner for toasts"}
      ]
    },

    "app_shell": {
      "left_nav": {
        "pattern": "Icon + label, collapsible to icon-only",
        "active_state": "Left accent bar + subtle background",
        "classes": "rounded-lg px-3 py-2 text-sm flex items-center gap-2 hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        "data_testid": "app-left-nav"
      },
      "top_bar": {
        "contents": ["Breadcrumb", "Line selector", "Global date range", "Theme toggle"],
        "data_testid": "app-top-bar"
      }
    },

    "dashboard_widgets": {
      "kpi_card": {
        "structure": "Title + big number + delta chip + sparkline",
        "classes": "rounded-[var(--radius-md)] border bg-card p-4 sm:p-5",
        "data_testid": "dashboard-kpi-card"
      },
      "charts": {
        "pass_fail_rate": "Stacked area or bar (Recharts)",
        "defect_distribution": "Horizontal bar with severity color markers",
        "confidence_trend": "Line chart with uncertainty markers",
        "drift": "Small card with timeline + threshold line"
      }
    },

    "history_list": {
      "row": {
        "pattern": "Thumbnail + verdict badge + confidence + timestamp + quick actions",
        "thumbnail": "Use AspectRatio + Skeleton while loading",
        "filters": "Date range (Calendar), verdict (Select), confidence slider (Slider)",
        "data_testid": "inspection-history-list"
      }
    },

    "forms_and_upload": {
      "upload_dropzone": {
        "pattern": "Large dashed area with icon + instructions + file constraints",
        "states": ["idle", "drag-over", "uploading", "success", "error"],
        "classes": "rounded-[var(--radius-lg)] border border-dashed bg-card/60 p-6 hover:bg-muted/40",
        "data_testid": "image-upload-dropzone"
      },
      "calibration_batch": {
        "pattern": "Grid of thumbnails with per-image status + overall progress",
        "data_testid": "calibration-batch-grid"
      }
    }
  },

  "motion_and_microinteractions": {
    "library": {
      "recommended": "framer-motion",
      "install": "npm i framer-motion",
      "usage": "Use for page transitions, card entrance, hover lift, and overlay selection animations"
    },
    "rules": [
      "No universal transition: never use transition-all.",
      "Prefer: transition-colors, transition-opacity, transition-shadow.",
      "Hover: cards lift by 2px (translate-y-[-2px]) ONLY if it doesn't conflict with layout; otherwise shadow change.",
      "Selection: region row click animates a subtle pulse on the corresponding bounding box (opacity 0.6→1).",
      "Loading: skeleton shimmer for image thumbnails and charts."
    ],
    "scroll": {
      "sticky_verdict": "On inspection result page, keep verdict + confidence sticky at top on mobile.",
      "reduced_motion": "Respect prefers-reduced-motion: disable entrance animations and pulses."
    }
  },

  "accessibility": {
    "requirements": [
      "WCAG AA contrast for text and interactive controls.",
      "Status communicated via color + icon + label.",
      "Keyboard: all controls reachable; focus ring visible using --focus-outline.",
      "Tables: use proper headers; row selection must be keyboard accessible.",
      "Canvas: provide a regions list as the accessible alternative to purely visual boxes."
    ]
  },

  "image_urls": {
    "hero_or_empty_states": [
      {
        "category": "empty_state_header",
        "description": "Subtle industrial camera mast image for onboarding/empty dashboard header (use as small side illustration, not full-bleed)",
        "url": "https://images.unsplash.com/photo-1609234153285-78b715b9dfd7?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NTYxOTJ8MHwxfHNlYXJjaHwxfHxpbmR1c3RyaWFsJTIwZmFjdG9yeSUyMHF1YWxpdHklMjBpbnNwZWN0aW9uJTIwY2FtZXJhfGVufDB8fHx0ZWFsfDE3ODc4NDM3MTl8MA&ixlib=rb-4.1.0&q=85"
      }
    ],
    "product_line_cards": [
      {
        "category": "product_line_cover",
        "description": "Robotic arm close-up for product line card cover (use with dark overlay for legibility)",
        "url": "https://images.unsplash.com/photo-1532186773960-85649e5cb70b?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwxfHxmYWN0b3J5JTIwYXV0b21hdGlvbiUyMHJvYm90aWNzJTIwY2xvc2UlMjB1cHxlbnwwfHx8YmxhY2t8MTc4Nzg0MzczMXww&ixlib=rb-4.1.0&q=85"
      },
      {
        "category": "product_line_cover",
        "description": "Machine detail shot for alternate product line cover",
        "url": "https://images.unsplash.com/photo-1550591105-db111a357d63?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjAxODF8MHwxfHNlYXJjaHwyfHxmYWN0b3J5JTIwYXV0b21hdGlvbiUyMHJvYm90aWNzJTIwY2xvc2UlMjB1cHxlbnwwfHx8YmxhY2t8MTc4Nzg0MzczMXww&ixlib=rb-4.1.0&q=85"
      }
    ]
  },

  "instructions_to_main_agent": {
    "theme_setup": [
      "Replace default CRA App.css styles; do not center the app container.",
      "Update /app/frontend/src/index.css :root and .dark tokens using semantic_hsl_for_shadcn_index_css above.",
      "Add Google Fonts imports in index.html (Space Grotesk, IBM Plex Sans, IBM Plex Mono) and set body font to IBM Plex Sans.",
      "Implement theme toggle by toggling 'dark' class on <html> or <body>."
    ],
    "ui_patterns": [
      "Use a left sidebar + top bar shell; keep primary actions in top bar (Calibrate, Inspect, Export).",
      "Dashboard: KPI grid + charts + recent inspections feed.",
      "Product Line detail: Tabs (Calibration / Inspect / History / Insights).",
      "Inspection result: Split view canvas + regions panel; clicking either syncs selection.",
      "History: filter drawer on mobile; table on desktop with thumbnails."
    ],
    "testing_attributes": [
      "Add data-testid to every button, input, select, tab trigger, nav link, upload dropzone, and key status text.",
      "Use kebab-case describing role (e.g., data-testid=\"inspection-upload-submit-button\")."
    ],
    "performance": [
      "Use Skeleton for image-heavy lists.",
      "Lazy-load thumbnails; prefer object URLs for previews.",
      "Keep canvas rendering efficient: only redraw on selection/hover changes."
    ]
  },

  "general_ui_ux_design_guidelines_appendix": "<General UI UX Design Guidelines>  \n    - You must **not** apply universal transition. Eg: `transition: all`. This results in breaking transforms. Always add transitions for specific interactive elements like button, input excluding transforms\n    - You must **not** center align the app container, ie do not add `.App { text-align: center; }` in the css file. This disrupts the human natural reading flow of text\n   - NEVER: use AI assistant Emoji characters like`🤖🧠💭💡🔮🎯📚🎭🎬🎪🎉🎊🎁🎀🎂🍰🎈🎨🎰💰💵💳🏦💎🪙💸🤑📊📈📉💹🔢🏆🥇 etc for icons. Always use **FontAwesome cdn** or **lucid-react** library already installed in the package.json\n\n **GRADIENT RESTRICTION RULE**\nNEVER use dark/saturated gradient combos (e.g., purple/pink) on any UI element.  Prohibited gradients: blue-500 to purple 600, purple 500 to pink-500, green-500 to blue-500, red to pink etc\nNEVER use dark gradients for logo, testimonial, footer etc\nNEVER let gradients cover more than 20% of the viewport.\nNEVER apply gradients to text-heavy content or reading areas.\nNEVER use gradients on small UI elements (<100px width).\nNEVER stack multiple gradient layers in the same viewport.\n\n**ENFORCEMENT RULE:**\n    • Id gradient area exceeds 20% of viewport OR affects readability, **THEN** use solid colors\n\n**How and where to use:**\n   • Section backgrounds (not content backgrounds)\n   • Hero section header content. Eg: dark to light to dark color\n   • Decorative overlays and accent elements only\n   • Hero section with 2-3 mild color\n   • Gradients creation can be done for any angle say horizontal, vertical or diagonal\n\n- For AI chat, voice application, **do not use purple color. Use color like light green, ocean blue, peach orange etc**\n\n</Font Guidelines>\n\n- Every interaction needs micro-animations - hover states, transitions, parallax effects, and entrance animations. Static = dead. \n   \n- Use 2-3x more spacing than feels comfortable. Cramped designs look cheap.\n\n- Subtle grain textures, noise overlays, custom cursors, selection states, and loading animations: separates good from extraordinary.\n   \n- Before generating UI, infer the visual style from the problem statement (palette, contrast, mood, motion) and immediately instantiate it by setting global design tokens (primary, secondary/accent, background, foreground, ring, state colors), rather than relying on any library defaults. Don't make the background dark as a default step, always understand problem first and define colors accordingly\n    Eg: - if it implies playful/energetic, choose a colorful scheme\n           - if it implies monochrome/minimal, choose a black–white/neutral scheme\n\n**Component Reuse:**\n\t- Prioritize using pre-existing components from src/components/ui when applicable\n\t- Create new components that match the style and conventions of existing components when needed\n\t- Examine existing components to understand the project's component patterns before creating new ones\n\n**IMPORTANT**: Do not use HTML based component like dropdown, calendar, toast etc. You **MUST** always use `/app/frontend/src/components/ui/ ` only as a primary components as these are modern and stylish component\n\n**Best Practices:**\n\t- Use Shadcn/UI as the primary component library for consistency and accessibility\n\t- Import path: ./components/[component-name]\n\n**Export Conventions:**\n\t- Components MUST use named exports (export const ComponentName = ...)\n\t- Pages MUST use default exports (export default function PageName() {...})\n\n**Toasts:**\n  - Use `sonner` for toasts\"\n  - Sonner component are located in `/app/src/components/ui/sonner.tsx`\n\nUse 2–4 color gradients, subtle textures/noise overlays, or CSS-based noise to avoid flat visuals.\n</General UI UX Design Guidelines>"
}
