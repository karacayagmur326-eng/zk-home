"use client"
import MobileCategoryStrip from "@modules/home/components/mobile-category-strip"
export default function MobileTopCategoriesStrip({ categories = [] }: { categories?: any[] }) {
  const top = categories.filter(category => !category.parent_category_id && !category.parent_category)
  return <div className="lg:hidden w-full"><MobileCategoryStrip categories={top} /></div>
}
