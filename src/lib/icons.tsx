import type { ComponentType, ReactElement } from "react"
import Image from "@components/common/SmartImage"
import { SafeImage } from "./SafeImage"
import {
  AlertTriangle,
  ArrowRight,
  ArrowUpRight,
  Award,
  BadgePercent,
  Battery,
  BatteryCharging,
  Box,
  Briefcase,
  Building2,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Circle,
  LayoutGrid,
  Plus,
  Trash2,
  Edit3,
  CircleAlert,
  CircleCheck,
  CircleHelp,
  CircleX,
  ClipboardList,
  Clock,
  Coins,
  Cookie,
  CornerUpLeft,
  Cpu,
  CreditCard,
  Database,
  Drill,
  FileCheck,
  FileText,
  Files,
  Flame,
  FolderHeart,
  GalleryHorizontalEnd,
  Gauge,
  GitBranch,
  Hammer,
  HardHat,
  Headphones,
  Heart,
  Images,
  Layers,
  LayoutDashboard,
  List,
  ListTree,
  LoaderCircle,
  Lock,
  LogOut,
  Mail,
  MapPin,
  Menu,
  MessageSquare,
  MessagesSquare,
  Navigation,
  Package,
  PackageCheck,
  PackageOpen,
  PanelsTopLeft,
  Percent,
  Phone,
  PhoneCall,
  Plug,
  PlugZap,
  Receipt,
  RefreshCw,
  RotateCcw,
  Scale,
  Scissors,
  Search,
  Settings,
  Settings2,
  Share2,
  Shield,
  ShieldCheck,
  ShoppingBag,
  ShoppingCart,
  Sliders,
  Smartphone,
  Sparkles,
  SquarePen,
  Star,
  Store,
  Tag,
  Truck,
  User,
  UserCheck,
  UserCog,
  Users,
  UsersRound,
  Wrench,
  X,
  Zap,
  type LucideIcon,
  type LucideProps,
} from "lucide-react"

export * from "lucide-react"

const ICON_ALIASES: Record<string, string> = {
  // Existing content/admin values.
  bolt: "Zap",
  gear: "Settings",
  cog: "Settings",
  case: "Briefcase",
  toolbox: "Briefcase",
  speed: "Gauge",
  brushless: "Cpu",
  security: "ShieldCheck",
  support: "Headphones",
  return: "RefreshCw",
  original: "PackageCheck",
  factory: "Building2",
  drill: "Drill",
  damaged: "AlertTriangle",
  cancel: "CornerUpLeft",
  withdrawal: "FileCheck",
  address: "MapPin",
  refund: "RotateCcw",
  delivery: "Truck",

  // Former @medusajs/icons names kept compatible with stored values/imports.
  CheckCircleMiniSolid: "CircleCheck",
  CheckCircleSolid: "CircleCheck",
  XCircleSolid: "CircleX",
  ExclamationCircleSolid: "CircleAlert",
  ChevronDownMini: "ChevronDown",
  ChevronUpDown: "ChevronsUpDown",
  ArrowRightOnRectangle: "LogOut",
  PencilSquare: "SquarePen",
  EllipseMiniSolid: "Circle",
  ArrowUpRightMini: "ArrowUpRight",
  XMark: "X",
  Github: "GitBranch",
  Spinner: "LoaderCircle",
}

const normalizedAliases = Object.fromEntries(
  Object.entries(ICON_ALIASES).map(([name, target]) => [name.toLowerCase(), target])
)

const toPascalCase = (name: string) =>
  name
    .trim()
    .replace(/([a-z0-9])([A-Z])/g, "$1 $2")
    .split(/[^a-zA-Z0-9]+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
    .join("")

// Import only the icons that the storefront and its curated admin picker use.
// Importing Lucide's `icons` registry pulled the complete icon catalogue into
// the mobile client bundle even though only a few icons were visible.
export const APP_ICON_MAP: Record<string, LucideIcon> = {
  AlertTriangle, ArrowRight, ArrowUpRight, Award, BadgePercent, Battery,
  BatteryCharging, Box, Briefcase, Building2, Check, ChevronDown, ChevronRight,
  ChevronsUpDown, Circle, CircleAlert, CircleCheck, CircleHelp, CircleX,
  ClipboardList, Clock, Coins, Cookie, CornerUpLeft, Cpu, CreditCard, Database,
  Drill, FileCheck, FileText, Files, Flame, FolderHeart, GalleryHorizontalEnd,
  Gauge, GitBranch, Hammer, HardHat, Headphones, Heart, Images, Layers,
  LayoutDashboard, List, ListTree, LoaderCircle, Lock, LogOut, Mail, MapPin,
  Menu, MessageSquare, MessagesSquare, Navigation, Package, PackageCheck,
  PackageOpen, PanelsTopLeft, Percent, Phone, PhoneCall, Plug, PlugZap, Receipt,
  RefreshCw, RotateCcw, Scale, Scissors, Search, Settings, Settings2, Share2,
  Shield, ShieldCheck, ShoppingBag, ShoppingCart, Sliders, Smartphone, Sparkles,
  SquarePen, Star, Store, Tag, Truck, User, UserCheck, UserCog, Users,
  ChevronLeft,
  LayoutGrid,
  Trash2,
  Plus,
  Edit3,
  // Backward-compatible names stored by older admin forms.
  HelpCircle: CircleHelp,
}

export const APP_ICON_NAMES = Object.keys(APP_ICON_MAP).sort((a, b) =>
  a.localeCompare(b)
)

export function resolveAppIcon(name?: string | null): LucideIcon | undefined {
  if (!name) return undefined

  const trimmed = name.trim()
  const alias = ICON_ALIASES[trimmed] ?? normalizedAliases[trimmed.toLowerCase()]
  const pascalName = toPascalCase(trimmed)

  return (
    APP_ICON_MAP[alias ?? ""] ??
    APP_ICON_MAP[trimmed] ??
    APP_ICON_MAP[pascalName]
  )
}

export type AppIconProps = LucideProps & {
  name?: string | null
  fallback?: string | null
}

export function AppIcon({ name, fallback = "Shield", ...props }: AppIconProps) {
  if (name && (name.startsWith("/") || name.startsWith("http") || /\.(png|jpg|jpeg|svg|webp)$/i.test(name))) {
    const className = `object-contain ${props.className || "h-5 w-5"}`

    // Admin-selected category icons can be multi-megabyte source images even
    // though the UI displays them at thumbnail size. Local media is therefore
    // routed through Next's responsive AVIF/WebP image pipeline.
    if (name.startsWith("/")) {
      return (
        <Image
          src={name}
          alt=""
          width={96}
          height={96}
          sizes="96px"
          quality={50}
          className={className}
        />
      )
    }

    return <SafeImage src={name} alt="" className={className} />
  }
  const Icon = resolveAppIcon(name) ?? resolveAppIcon(fallback)
  return Icon ? <Icon {...props} /> : null
}

// Named compatibility exports let existing components migrate imports without
// changing their JSX or visual intent.
export const CheckCircleMiniSolid = APP_ICON_MAP.CircleCheck
export const CheckCircleSolid = APP_ICON_MAP.CircleCheck
export const XCircleSolid = APP_ICON_MAP.CircleX
export const ExclamationCircleSolid = APP_ICON_MAP.CircleAlert
export const ChevronDownMini = APP_ICON_MAP.ChevronDown
export const ChevronUpDown = APP_ICON_MAP.ChevronsUpDown
export { ChevronLeft, ChevronRight, LayoutGrid, Plus, Trash2, Edit3 }
export const ArrowRightOnRectangle = APP_ICON_MAP.LogOut
export const PencilSquare = APP_ICON_MAP.SquarePen
export const EllipseMiniSolid = APP_ICON_MAP.Circle
export const ArrowUpRightMini = APP_ICON_MAP.ArrowUpRight
export const XMark = APP_ICON_MAP.X
export const Github = APP_ICON_MAP.GitBranch
export const Spinner = APP_ICON_MAP.LoaderCircle

export type AppIconCategory = "teslimat" | "magaza" | "hirdavat" | "kurumsal"

export interface AppIconOption {
  name: string
  label: string
  category: AppIconCategory
  icon: ReactElement
}

const option = (name: string, label: string, category: AppIconCategory): AppIconOption => ({
  name,
  label,
  category,
  icon: <AppIcon name={name} className="w-5 h-5" />,
})

export const APP_ICON_OPTIONS: AppIconOption[] = [
  // 1. Teslimat, Sipariş & İade İkonları (Kapsamlı Paket)
  option("truck", "Hızlı Kargo & Teslimat", "teslimat"),
  option("package-check", "Orijinal Ürün / Sipariş Hazırlığı", "teslimat"),
  option("package", "Sipariş Paketi", "teslimat"),
  option("box", "Kutu & Ambalaj", "teslimat"),
  option("alert-triangle", "Hasarlı Paket Bildirimi", "teslimat"),
  option("rotate-ccw", "İade Koşulları / 14 Gün İade", "teslimat"),
  option("corner-up-left", "Sipariş İptali", "teslimat"),
  option("file-check", "Cayma Hakkı & Form", "teslimat"),
  option("map-pin", "Teslimat & İade Adresi", "teslimat"),
  option("clock", "1-3 İş Günü Teslimat", "teslimat"),
  option("shield-check", "2 Yıl Resmi Garanti", "teslimat"),
  option("headphones", "7/24 Canlı Destek", "teslimat"),

  // 2. Mağaza & Alışveriş İkonları
  option("credit-card", "Güvenli Ödeme", "magaza"),
  option("lock", "256-Bit SSL Güvenlik", "magaza"),
  option("coins", "Kapıda Ödeme / Ücret İadesi", "magaza"),
  option("receipt", "e-Fatura / İade Faturası", "magaza"),
  option("award", "Yerli Üretim / Kalite", "magaza"),
  option("star", "Öne Çıkan Ürün", "magaza"),
  option("tag", "Kampanya & İndirim", "magaza"),
  option("percent", "Fırsat Ürünü", "magaza"),
  option("shopping-bag", "Mağaza Siparişi", "magaza"),
  option("shopping-cart", "Sepet İşlemleri", "magaza"),

  // 3. El Aletleri & Teknik İkonlar
  option("drill", "Matkap / Vidalama", "hirdavat"),
  option("battery-charging", "Çift Akü / Şarj", "hirdavat"),
  option("battery", "Akü / Batarya", "hirdavat"),
  option("hammer", "Kırıcı / Çekiç", "hirdavat"),
  option("wrench", "Anahtar / Lokma", "hirdavat"),
  option("toolbox", "Takım Çantası", "hirdavat"),
  option("scissors", "Kesici / Testere", "hirdavat"),
  option("zap", "Güç / Elektrik", "hirdavat"),
  option("flame", "Kaynak / Sıcaklık", "hirdavat"),
  option("gauge", "Tork / Hız Göstergesi", "hirdavat"),
  option("hard-hat", "Baret / İş Güvenliği", "hirdavat"),
  option("shield", "Koruma / Dayanıklılık", "hirdavat"),
  option("cog", "Dişli / Aksesuar", "hirdavat"),
  option("layers", "Zımpara / Katman", "hirdavat"),
  option("cpu", "Kömürsüz Motor (Brushless)", "hirdavat"),
  option("plug", "Kablolu / Fiş", "hirdavat"),

  // 4. Kurumsal & İletişim İkonları
  option("store", "Nalbur Mağazası", "kurumsal"),
  option("building-2", "Fabrika / Üretim", "kurumsal"),
  option("phone-call", "Telefon İletişim", "kurumsal"),
  option("mail", "E-posta Destek", "kurumsal"),
  option("file-text", "Katalog / Fatura", "kurumsal"),
  option("help-circle", "Destek / SSS", "kurumsal"),
  option("navigation", "Konum & Yol Tarifi", "kurumsal"),
  option("users", "Müşteri Temsilcisi", "kurumsal"),
]

export type AppIconComponent = ComponentType<LucideProps>
