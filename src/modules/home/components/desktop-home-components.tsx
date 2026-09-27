"use client"

import dynamic from "next/dynamic"

// Keep desktop-only JavaScript out of the phone home entry point.
// SSR stays enabled so desktop hero images and product links remain in HTML.
export const HeroSlider = dynamic(() => import("./hero-slider"))
export const CategoryStrip = dynamic(() => import("./category-strip"))
export const FeaturedTabs = dynamic(() => import("./featured-tabs"))
