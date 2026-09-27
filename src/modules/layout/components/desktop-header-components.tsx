"use client"

import dynamic from "next/dynamic"

// These controls are not rendered by phone chrome. Split their code while
// preserving server rendering for desktop navigation and accessibility.
export const SideMenu = dynamic(() => import("./side-menu"))
export const DesktopMenu = dynamic(() => import("./desktop-menu"))
export const HeaderSearch = dynamic(() => import("./header-search"))
