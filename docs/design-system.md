# Design System — أكاديمية الإمام البخاري (Al-Bukhari Academy)

> **Version**: 1.0.0
> **Date**: August 2026
> **Tech Stack**: Next.js 16.3 · React 19 · Tailwind CSS 4 · shadcn v4 (base-nova) · Lucide Icons

---

## Table of Contents

1. [Brand Identity](#1-brand-identity)
2. [Color System](#2-color-system)
3. [Typography](#3-typography)
4. [Spacing & Layout](#4-spacing--layout)
5. [Border Radius](#5-border-radius)
6. [Icon System](#6-icon-system)
7. [Component Catalog](#7-component-catalog)
8. [Pattern Library](#8-pattern-library)
9. [Dark Mode](#9-dark-mode)
10. [RTL Readiness](#10-rtl-readiness)
11. [File Structure](#11-file-structure)
12. [Usage Guidelines](#12-usage-guidelines)

---

## 1. Brand Identity

### Vision
> **"جيلٌ ربانيٌّ يُحيي السنة"** — A generation devoted to reviving the Sunnah.

### Design Philosophy

The design system for Al-Bukhari Academy draws from **Islamic scholarly heritage** while embracing modern digital standards. The visual language communicates:

- **Scholarly authority** — Deep emerald tones evoke centuries of Islamic scholarship
- **Achievement & warmth** — Gold/amber accents celebrate learning milestones
- **Clarity & structure** — Clean layouts reflect the structured learning path methodology
- **Accessibility** — High contrast ratios ensure readability for all audiences

### Brand Keywords
`Scholarly` · `Trustworthy` · `Structured` · `Warm` · `Modern` · `Accessible`

---

## 2. Color System

All colors use the **OKLCH** color space for perceptual uniformity. Defined as CSS custom properties in [`globals.css`](../src/app/globals.css).

### 2.1 Core Palette

#### Primary — Deep Emerald
The primary color represents Islamic scholarly heritage. Used for primary actions, links, and navigation emphasis.

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--primary` | `oklch(0.42 0.12 168)` | `oklch(0.68 0.16 168)` | Buttons, links, active states |
| `--primary-foreground` | `oklch(0.985 0.005 155)` | `oklch(0.13 0.02 168)` | Text on primary surfaces |

#### Secondary — Warm Gold
The secondary color represents achievement and warmth. Used for secondary actions and highlights.

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--secondary` | `oklch(0.955 0.025 85)` | `oklch(0.26 0.025 200)` | Secondary buttons, tags |
| `--secondary-foreground` | `oklch(0.30 0.06 75)` | `oklch(0.92 0.02 85)` | Text on secondary surfaces |

#### Surfaces

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--background` | `oklch(0.985 0.003 90)` | `oklch(0.145 0.015 260)` | Page background |
| `--foreground` | `oklch(0.165 0.015 260)` | `oklch(0.96 0.005 90)` | Primary text |
| `--card` | `oklch(1 0 0)` | `oklch(0.195 0.015 260)` | Card surfaces |
| `--popover` | `oklch(1 0 0)` | `oklch(0.195 0.015 260)` | Popover surfaces |
| `--muted` | `oklch(0.955 0.012 155)` | `oklch(0.26 0.015 260)` | Muted backgrounds |
| `--accent` | `oklch(0.94 0.035 155)` | `oklch(0.26 0.03 168)` | Accent surfaces |

#### Borders & Interactive

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--border` | `oklch(0.905 0.01 155)` | `oklch(1 0 0 / 10%)` | Borders, dividers |
| `--input` | `oklch(0.905 0.01 155)` | `oklch(1 0 0 / 15%)` | Input borders |
| `--ring` | `oklch(0.50 0.10 168)` | `oklch(0.55 0.12 168)` | Focus rings |
| `--destructive` | `oklch(0.577 0.245 27.325)` | `oklch(0.704 0.191 22.216)` | Error, delete actions |

### 2.2 LMS Semantic Colors

Custom tokens for learning-specific states. These extend the base shadcn palette.

| Token | Light Mode | Dark Mode | Usage |
|-------|-----------|-----------|-------|
| `--success` | `oklch(0.55 0.16 145)` | `oklch(0.65 0.18 145)` | Lesson completed, quiz passed |
| `--warning` | `oklch(0.75 0.15 75)` | `oklch(0.78 0.14 75)` | Deadline approaching, low score |
| `--info` | `oklch(0.55 0.15 245)` | `oklch(0.65 0.14 245)` | Informational banners, tips |
| `--gold` | `oklch(0.72 0.14 75)` | `oklch(0.75 0.14 75)` | Certificates, achievements |

**Tailwind usage:**
```tsx
<div className="bg-success text-success-foreground">Lesson Complete ✓</div>
<div className="bg-gold text-gold-foreground">Certificate Earned 🏆</div>
```

### 2.3 PathCategory Colors

Each learning path category has a distinct color for visual identification. Used on category badges, filter chips, and path cards.

| Category | Token | Light Mode | Dark Mode |
|----------|-------|-----------|-----------|
| Fiqh (الفقه) | `--category-fiqh` | `oklch(0.55 0.15 168)` | `oklch(0.65 0.16 168)` |
| Aqeeda (العقيدة) | `--category-aqeeda` | `oklch(0.58 0.15 260)` | `oklch(0.68 0.15 260)` |
| Life Affairs (شؤون الحياة) | `--category-life-affairs` | `oklch(0.68 0.14 85)` | `oklch(0.75 0.14 85)` |
| Seerah (السيرة) | `--category-seerah` | `oklch(0.60 0.16 30)` | `oklch(0.70 0.16 30)` |
| Tafsir (التفسير) | `--category-tafsir` | `oklch(0.55 0.14 310)` | `oklch(0.65 0.14 310)` |

**Tailwind usage:**
```tsx
<Badge className="bg-category-fiqh text-white">الفقه</Badge>
<Badge className="bg-category-seerah text-white">السيرة</Badge>
```

### 2.4 Chart Palette

Used for admin dashboard data visualizations (Recharts).

| Token | Light | Dark | Suggested Use |
|-------|-------|------|---------------|
| `--chart-1` | `oklch(0.50 0.14 168)` | `oklch(0.68 0.16 168)` | Enrollments |
| `--chart-2` | `oklch(0.72 0.12 85)` | `oklch(0.72 0.12 85)` | Completions |
| `--chart-3` | `oklch(0.55 0.18 260)` | `oklch(0.65 0.15 260)` | Quiz scores |
| `--chart-4` | `oklch(0.65 0.15 30)` | `oklch(0.70 0.14 30)` | Certificates |
| `--chart-5` | `oklch(0.60 0.12 310)` | `oklch(0.68 0.12 310)` | Active users |

### 2.5 Sidebar Colors

Dedicated tokens for the sidebar component used in the `(app)` and `(admin)` layouts.

| Token | Light | Dark |
|-------|-------|------|
| `--sidebar` | `oklch(0.975 0.008 155)` | `oklch(0.175 0.015 260)` |
| `--sidebar-foreground` | `oklch(0.165 0.015 260)` | `oklch(0.96 0.005 90)` |
| `--sidebar-primary` | `oklch(0.42 0.12 168)` | `oklch(0.68 0.16 168)` |
| `--sidebar-accent` | `oklch(0.94 0.035 155)` | `oklch(0.26 0.03 168)` |
| `--sidebar-border` | `oklch(0.905 0.01 155)` | `oklch(1 0 0 / 10%)` |

---

## 3. Typography

### 3.1 Font Families

Defined in [`layout.tsx`](../src/app/layout.tsx) using `next/font/google` for optimal loading.

| Variable | Font | Weights | Subsets | Usage |
|----------|------|---------|---------|-------|
| `--font-sans` | **IBM Plex Sans Arabic** | 300, 400, 500, 600, 700 | Arabic, Latin | Body text, UI elements, form labels |
| `--font-heading` | **Amiri** | 400, 700 | Arabic, Latin | Headings, titles, decorative text |
| `--font-geist-mono` | **Geist Mono** | Variable | Latin | Code snippets, technical content |

### 3.2 Why These Fonts?

- **IBM Plex Sans Arabic** — Professional sans-serif with excellent Arabic and Latin support. Clean for UI text, highly legible at small sizes, and supports all weights needed for visual hierarchy.
- **Amiri** — A classical Arabic Naskh typeface inspired by the Bulaq Press tradition. Perfect for headings and titles in a scholarly Islamic context.
- **Geist Mono** — Maintained for code/technical content consistency.

### 3.3 Type Scale

Use Tailwind's built-in type scale. Recommended usage:

| Element | Tailwind Class | Font Family | Weight |
|---------|---------------|-------------|--------|
| Page Title (h1) | `text-3xl` or `text-4xl` | `font-heading` | `font-bold` |
| Section Title (h2) | `text-2xl` | `font-heading` | `font-bold` |
| Subsection (h3) | `text-xl` | `font-sans` | `font-semibold` |
| Card Title | `text-lg` | `font-sans` | `font-semibold` |
| Body | `text-sm` or `text-base` | `font-sans` | `font-normal` |
| Caption/Label | `text-xs` or `text-sm` | `font-sans` | `font-medium` |
| Mono/Code | `text-sm` | `font-mono` | `font-normal` |

**Example:**
```tsx
<h1 className="font-heading text-4xl font-bold">المسارات التعليمية</h1>
<p className="text-base text-muted-foreground">اكتشف مسارات علمية متكاملة</p>
```

---

## 4. Spacing & Layout

### 4.1 Spacing Scale

Use Tailwind's default spacing scale (based on 0.25rem = 4px increments). Recommended patterns:

| Context | Spacing | Tailwind |
|---------|---------|----------|
| Tight (icon gaps, badge padding) | 4–6px | `gap-1` to `gap-1.5` |
| Default (form fields, list items) | 8–12px | `gap-2` to `gap-3` |
| Section padding (cards, containers) | 16–24px | `p-4` to `p-6` |
| Page padding | 24–32px | `px-6` to `px-8` |
| Section gaps (page sections) | 32–48px | `gap-8` to `gap-12` |
| Page-level vertical spacing | 48–64px | `py-12` to `py-16` |

### 4.2 Layout Containers

| Context | Max Width | Padding |
|---------|-----------|---------|
| Marketing pages | `max-w-7xl mx-auto` | `px-4 sm:px-6 lg:px-8` |
| App content area | Full width (sidebar provides constraint) | `p-4 md:p-6` |
| Admin content area | Full width within sidebar | `p-4 md:p-6` |
| Form containers | `max-w-2xl` | `space-y-6` |
| Dialog content | `max-w-lg` | `p-6` |

### 4.3 Grid System

| Layout | Pattern | Breakpoints |
|--------|---------|-------------|
| Path catalog grid | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3` | 1→2→3 columns |
| Admin data tables | Full width with horizontal scroll | `overflow-x-auto` |
| Dashboard stat cards | `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4` | 1→2→4 columns |
| Lesson player layout | Two-column: content (2/3) + sidebar (1/3) | `grid grid-cols-1 lg:grid-cols-3` |

---

## 5. Border Radius

Defined as CSS variables that scale from the base `--radius` value (0.625rem = 10px).

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-sm` | `0.375rem` (6px) | Small badges, inline elements |
| `--radius-md` | `0.5rem` (8px) | Inputs, buttons (sm) |
| `--radius-lg` | `0.625rem` (10px) | Cards, dialogs, default |
| `--radius-xl` | `0.875rem` (14px) | Large cards, image containers |
| `--radius-2xl` | `1.125rem` (18px) | Feature cards, hero sections |
| `--radius-3xl` | `1.375rem` (22px) | Modal overlays |
| `--radius-4xl` | `1.625rem` (26px) | Full-page panels |

**Tailwind usage:**
```tsx
<Card className="rounded-lg">...</Card>     // Default card
<Badge className="rounded-sm">DRAFT</Badge> // Small badge
<Dialog className="rounded-xl">...</Dialog>  // Large dialog
```

---

## 6. Icon System

### Provider
**Lucide React** (`lucide-react` v1.29.0) — consistent, clean, open-source icon set.

### Sizing Convention

| Context | Size | Tailwind |
|---------|------|----------|
| Inline with text (xs) | 12px | `size-3` |
| Inline with text (sm) | 14px | `size-3.5` |
| Default (buttons, nav) | 16px | `size-4` |
| Standalone (card headers) | 20px | `size-5` |
| Feature icons | 24px | `size-6` |
| Hero/large display | 32–48px | `size-8` to `size-12` |

### Recommended Icons by Feature

| Feature | Icon | Import |
|---------|------|--------|
| Learning Paths | `Route` | `lucide-react` |
| Stages | `Layers` | `lucide-react` |
| Lessons (Video) | `PlayCircle` | `lucide-react` |
| Lessons (Text) | `FileText` | `lucide-react` |
| Quizzes | `ClipboardCheck` | `lucide-react` |
| Certificates | `Award` | `lucide-react` |
| Enrollment | `BookOpen` | `lucide-react` |
| Progress | `TrendingUp` | `lucide-react` |
| Users | `Users` | `lucide-react` |
| Admin Dashboard | `LayoutDashboard` | `lucide-react` |
| Settings | `Settings` | `lucide-react` |
| Search | `Search` | `lucide-react` |
| Success | `CheckCircle` | `lucide-react` |
| Error | `XCircle` | `lucide-react` |
| Warning | `AlertTriangle` | `lucide-react` |
| Info | `Info` | `lucide-react` |
| Delete | `Trash2` | `lucide-react` |
| Edit | `Pencil` | `lucide-react` |
| Add | `Plus` | `lucide-react` |

---

## 7. Component Catalog

All components are installed via **shadcn v4** (base-nova style) and live in `src/components/ui/`. They use `@base-ui/react` primitives underneath.

### 7.1 Installed Components (33 total)

#### Form Controls

| Component | File | Purpose in LMS |
|-----------|------|----------------|
| **Button** | `button.tsx` | Primary CTAs, form submissions, enroll actions |
| **Input** | `input.tsx` | Text fields in all entity forms |
| **Input Group** | `input-group.tsx` | Input with prefix/suffix (search, URL fields) |
| **Textarea** | `textarea.tsx` | Lesson content, path descriptions |
| **Label** | `label.tsx` | Form field labels |
| **Select** | `select.tsx` | PathCategory, LessonType, ContentType, UserRole dropdowns |
| **Switch** | `switch.tsx` | isFeatured, certificationActivated, isFinal toggles |
| **Checkbox** | `checkbox.tsx` | Quiz option isCorrect, bulk selection in admin |
| **Radio Group** | `radio-group.tsx` | Quiz answer selection (single correct answer) |

#### Data Display

| Component | File | Purpose in LMS |
|-----------|------|----------------|
| **Card** | `card.tsx` | PathCard, CertificateCard, stat cards, SectionCard |
| **Table** | `table.tsx` | Admin data tables (paths, stages, lessons, quizzes, users) |
| **Badge** | `badge.tsx` | Status (DRAFT/PUBLISHED), category, role indicators |
| **Avatar** | `avatar.tsx` | User profile images, logo-avatar |
| **Progress** | `progress.tsx` | Enrollment progress bars, stage completion |
| **Separator** | `separator.tsx` | Section dividers in forms and detail pages |
| **Skeleton** | `skeleton.tsx` | Loading states for all data-dependent UIs |
| **Aspect Ratio** | `aspect-ratio.tsx` | Video player container, path cover images |
| **Chart** | `chart.tsx` | Admin dashboard statistics (Recharts wrapper) |

#### Navigation

| Component | File | Purpose in LMS |
|-----------|------|----------------|
| **Sidebar** | `sidebar.tsx` | App and admin layout navigation shell |
| **Tabs** | `tabs.tsx` | Lesson type switch (Video/Text), admin sections |
| **Breadcrumb** | `breadcrumb.tsx` | Admin navigation, path detail breadcrumbs |
| **Pagination** | `pagination.tsx` | All paginated list views |
| **Command** | `command.tsx` | Search input with keyboard shortcuts |
| **Dropdown Menu** | `dropdown-menu.tsx` | User menu, contextual action menus |
| **Scroll Area** | `scroll-area.tsx` | Sidebar, long content, attachment lists |
| **Collapsible** | `collapsible.tsx` | Sidebar groups, expandable navigation |

#### Feedback

| Component | File | Purpose in LMS |
|-----------|------|----------------|
| **Dialog** | `dialog.tsx` | Forms in modals, quiz results, detail views |
| **Alert Dialog** | `alert-dialog.tsx` | Delete confirmation, destructive action gates |
| **Alert** | `alert.tsx` | FormAlert, success/error inline messages |
| **Sheet** | `sheet.tsx` | Mobile sidebar, mobile navigation drawers |
| **Tooltip** | `tooltip.tsx` | Icon button labels, truncated text, help hints |
| **Sonner** | `sonner.tsx` | Toast notifications (enroll, quiz submit, CRUD) |
| **Accordion** | `accordion.tsx` | Stage expansion in path detail, FAQ sections |

### 7.2 Additional Files

| File | Location | Purpose |
|------|----------|---------|
| `use-mobile.ts` | `src/hooks/` | Mobile breakpoint detection hook (installed with sidebar) |

### 7.3 Auto-Installed Dependencies

| Package | Version | Installed By |
|---------|---------|-------------|
| `cmdk` | ^1.1.1 | `command` component |
| `next-themes` | ^0.4.6 | Theme switching support |
| `recharts` | ^3.8.0 | `chart` component |
| `sonner` | ^2.0.7 | `sonner` toast component |

---

## 8. Pattern Library

### 8.1 Entity Card Pattern

Used for PathCard, CertificateCard, and dashboard stat cards.

```tsx
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

function PathCard({ path }) {
  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <Badge className="bg-category-fiqh text-white">الفقه</Badge>
          <Badge variant="outline">PUBLISHED</Badge>
        </div>
        <CardTitle className="font-heading text-lg">{path.title}</CardTitle>
        <CardDescription>{path.description}</CardDescription>
      </CardHeader>
      <CardContent>
        <Progress value={path.progress} />
      </CardContent>
      <CardFooter>
        <Button className="w-full">التسجيل في المسار</Button>
      </CardFooter>
    </Card>
  )
}
```

### 8.2 Admin Data Table Pattern

Used for all admin CRUD listing pages.

```tsx
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MoreHorizontal, Pencil, Trash2 } from "lucide-react"

function PathsTable({ paths }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>العنوان</TableHead>
          <TableHead>التصنيف</TableHead>
          <TableHead>الحالة</TableHead>
          <TableHead className="w-12" />
        </TableRow>
      </TableHeader>
      <TableBody>
        {paths.map((path) => (
          <TableRow key={path.id}>
            <TableCell className="font-medium">{path.title}</TableCell>
            <TableCell><Badge variant="secondary">{path.category}</Badge></TableCell>
            <TableCell><Badge variant="outline">{path.status}</Badge></TableCell>
            <TableCell>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon"><MoreHorizontal /></Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem><Pencil /> تعديل</DropdownMenuItem>
                  <DropdownMenuItem className="text-destructive"><Trash2 /> حذف</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  )
}
```

### 8.3 Form Pattern

Used for all entity forms (path, stage, lesson, quiz, question).

```tsx
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Button } from "@/components/ui/button"

function PathForm({ defaultValues, onSubmit }) {
  return (
    <form onSubmit={onSubmit} className="space-y-6 max-w-2xl">
      <div className="space-y-2">
        <Label htmlFor="title">عنوان المسار</Label>
        <Input id="title" defaultValue={defaultValues?.title} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="description">الوصف</Label>
        <Textarea id="description" defaultValue={defaultValues?.description} />
      </div>

      <div className="space-y-2">
        <Label>التصنيف</Label>
        <Select defaultValue={defaultValues?.category}>
          <SelectTrigger><SelectValue placeholder="اختر التصنيف" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="FIQH">الفقه</SelectItem>
            <SelectItem value="AQEEDA">العقيدة</SelectItem>
            <SelectItem value="SEERAH">السيرة</SelectItem>
            <SelectItem value="TAFSIR">التفسير</SelectItem>
            <SelectItem value="LIFE_AFFAIRS">شؤون الحياة</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="flex items-center gap-3">
        <Switch id="featured" defaultChecked={defaultValues?.isFeatured} />
        <Label htmlFor="featured">مسار مميز</Label>
      </div>

      <Button type="submit">حفظ المسار</Button>
    </form>
  )
}
```

### 8.4 Empty State Pattern

Used when a list has no items.

```tsx
import { BookOpen } from "lucide-react"
import { Button } from "@/components/ui/button"

function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-center">
      <div className="rounded-2xl bg-muted p-4 mb-4">
        <Icon className="size-8 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{title}</h3>
      <p className="text-sm text-muted-foreground mt-1 max-w-sm">{description}</p>
      {action && <Button className="mt-4" {...action} />}
    </div>
  )
}

// Usage:
<EmptyState
  icon={BookOpen}
  title="لا توجد مسارات"
  description="ابدأ بإنشاء أول مسار تعليمي"
  action={{ children: "إنشاء مسار", onClick: () => {} }}
/>
```

### 8.5 Loading State Pattern

Used while data is being fetched.

```tsx
import { Skeleton } from "@/components/ui/skeleton"
import { Card, CardHeader, CardContent } from "@/components/ui/card"

function PathCardSkeleton() {
  return (
    <Card>
      <CardHeader>
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-6 w-3/4 mt-2" />
        <Skeleton className="h-4 w-full mt-1" />
      </CardHeader>
      <CardContent>
        <Skeleton className="h-2 w-full" />
      </CardContent>
    </Card>
  )
}
```

### 8.6 Delete Confirmation Pattern

Used for all destructive admin actions.

```tsx
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel,
  AlertDialogContent, AlertDialogDescription, AlertDialogFooter,
  AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger
} from "@/components/ui/alert-dialog"
import { Button } from "@/components/ui/button"
import { Trash2 } from "lucide-react"

function DeleteConfirmation({ entityName, onConfirm }) {
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="destructive" size="sm"><Trash2 /> حذف</Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>هل أنت متأكد؟</AlertDialogTitle>
          <AlertDialogDescription>
            سيتم حذف {entityName} نهائيًا. لا يمكن التراجع عن هذا الإجراء.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>إلغاء</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm}>حذف</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
```

### 8.7 Toast Notification Pattern

Used for transient feedback after actions.

```tsx
import { Toaster } from "@/components/ui/sonner"
import { toast } from "sonner"

// Add <Toaster /> in root layout
// Then use anywhere:
toast.success("تم التسجيل في المسار بنجاح")
toast.error("حدث خطأ أثناء حفظ البيانات")
toast.info("جاري تحميل الدرس...")
```

### 8.8 Quiz Answer Pattern

Used for the quiz runner question flow.

```tsx
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

function QuestionCard({ question, selectedOptionId, onSelect }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">{question.text}</CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup value={selectedOptionId} onValueChange={onSelect}>
          {question.options.map((option) => (
            <div key={option.id} className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted">
              <RadioGroupItem value={option.id} id={option.id} />
              <Label htmlFor={option.id} className="cursor-pointer flex-1">
                {option.text}
              </Label>
            </div>
          ))}
        </RadioGroup>
      </CardContent>
    </Card>
  )
}
```

---

## 9. Dark Mode

### Implementation

Dark mode is supported via `next-themes` (auto-installed with shadcn components). The theme is toggled by adding/removing the `.dark` class on `<html>`.

### Setup Required

Add the `ThemeProvider` to the root layout:

```tsx
import { ThemeProvider } from "next-themes"

// In root layout:
<ThemeProvider attribute="class" defaultTheme="system" enableSystem>
  {children}
</ThemeProvider>
```

### Theme Toggle Component

```tsx
import { useTheme } from "next-themes"
import { Button } from "@/components/ui/button"
import { Sun, Moon } from "lucide-react"

function ThemeToggle() {
  const { theme, setTheme } = useTheme()
  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
    >
      <Sun className="size-4 dark:hidden" />
      <Moon className="hidden size-4 dark:block" />
    </Button>
  )
}
```

### Design Principles

- All color tokens have light and dark variants defined in `globals.css`
- Dark mode uses warmer, more luminous versions of the primary emerald
- Charts auto-adapt via the `--chart-*` CSS variables
- Sidebar has dedicated dark mode tokens for distinct treatment

---

## 10. RTL Readiness

### Current State — RTL is live

The root layout renders `lang="ar" dir="rtl"`, and `components.json` has
`"rtl": true`. Arabic is the primary interface language.

Full write-up: [`admin-dashboard.md`](./admin-dashboard.md) §9.

### What was done

1. `dir="ltr"` → `dir="rtl"` in `src/app/layout.tsx`
2. `"rtl": false` → `"rtl": true` in `components.json`
3. Physical-direction classes in already-installed `components/ui/*` replaced
   with logical ones (see the table below)

> The `components.json` flag only affects components generated **from now on**.
> It does not rewrite the 33 already installed — those were fixed by hand.

### Fixes applied to installed components

| File | Change |
|------|--------|
| `sidebar.tsx` | `text-left`→`text-start`, `pr-8`→`pe-8`, `right-1/3`→`end-1/3`, `border-l`→`border-s`, `ml-0/ml-2`→`ms-0/ms-2`; trigger icon gets `rtl:rotate-180` |
| `table.tsx` | `text-left`→`text-start`, `pr-0`→`pe-0` |
| `select.tsx` | `text-left`→`text-start`, trigger and item padding to `ps-*/pe-*`, check indicator `right-2`→`end-2` |
| `dialog.tsx` | close button `right-2`→`end-2` — physical `right` is the RTL *start* edge, which put the button over the title |
| `progress.tsx` | `ProgressValue` `ml-auto`→`ms-auto`, so the value sits at the RTL end of the row |
| `alert-dialog.tsx` | `sm:…text-left`→`text-start` |

If you re-add any of these from the shadcn registry, re-apply the fixes or
verify the generated output is already logical.

### Rules for new code

- **Always** use logical utilities: `ms-*`, `me-*`, `ps-*`, `pe-*`, `start-*`,
  `end-*`, `border-s`, `border-e`, `text-start`, `text-end`. Never `ml-*`,
  `pl-*`, `left-*`, `text-left`.
- Mirror directional icons: breadcrumb separators point left; "previous" points
  right and "next" points left.
- Base UI popups accept logical sides — prefer `side="inline-end"` over
  `side="right"` so placement follows the document direction.
- Both IBM Plex Sans Arabic and Amiri render correctly in RTL.
- The sidebar takes `side="right"`, which is the RTL start edge.
- Numbers and dates: `ar-EG-u-nu-latn` (Arabic month names, Latin digits) via
  `src/utils/format.ts`.

---

## 11. File Structure

```text
src/
├── app/
│   ├── globals.css              ← Color system, custom tokens, base styles
│   └── layout.tsx               ← Font loading, metadata, root providers
│
├── components/
│   └── ui/                      ← All 33 shadcn components
│       ├── accordion.tsx
│       ├── alert-dialog.tsx
│       ├── alert.tsx
│       ├── aspect-ratio.tsx
│       ├── avatar.tsx
│       ├── badge.tsx
│       ├── breadcrumb.tsx
│       ├── button.tsx
│       ├── card.tsx
│       ├── chart.tsx
│       ├── checkbox.tsx
│       ├── collapsible.tsx
│       ├── command.tsx
│       ├── dialog.tsx
│       ├── dropdown-menu.tsx
│       ├── input-group.tsx
│       ├── input.tsx
│       ├── label.tsx
│       ├── pagination.tsx
│       ├── progress.tsx
│       ├── radio-group.tsx
│       ├── scroll-area.tsx
│       ├── select.tsx
│       ├── separator.tsx
│       ├── sheet.tsx
│       ├── sidebar.tsx
│       ├── skeleton.tsx
│       ├── sonner.tsx
│       ├── switch.tsx
│       ├── table.tsx
│       ├── tabs.tsx
│       ├── textarea.tsx
│       └── tooltip.tsx
│
├── hooks/
│   └── use-mobile.ts            ← Mobile breakpoint hook
│
└── lib/
    ├── db.ts                    ← Prisma client
    └── utils.ts                 ← cn() utility
```

---

## 12. Usage Guidelines

### Do

- ✅ Always use CSS variable tokens (`bg-primary`, `text-muted-foreground`) instead of raw colors
- ✅ Use the `cn()` utility for conditional class merging
- ✅ Import components from `@/components/ui/*`
- ✅ Use `font-heading` for all headings and display text
- ✅ Use semantic color tokens (`bg-success`, `bg-gold`) for LMS-specific states
- ✅ Use category color tokens (`bg-category-fiqh`) for path category badges
- ✅ Follow the entity-specific pattern examples (§8) for consistency
- ✅ Wrap the app with `<Toaster />` for toast notifications
- ✅ Use `<Skeleton />` for all loading states

### Don't

- ❌ Don't use raw hex/rgb/oklch values in component code
- ❌ Don't create custom button/input/card variants — extend the shadcn components
- ❌ Don't bypass the `ui/` components with raw HTML elements for interactive controls
- ❌ Don't use `left`/`right` padding — prefer `start`/`end` for RTL readiness
- ❌ Don't install additional icon libraries — use Lucide exclusively
- ❌ Don't add inline styles — use Tailwind classes and CSS variables

---

*End of Design System Documentation*
