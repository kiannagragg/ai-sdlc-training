# Meridian LMS Design System

## Typography Scale

| Token | Size | Weight | Line Height | Usage |
|---|---|---|---|---|
| `h1` | 2rem (32px) | 700 (bold) | 1.2 | Page titles |
| `h2` | 1.5rem (24px) | 600 (semibold) | 1.3 | Section headers |
| `h3` | 1.25rem (20px) | 600 (semibold) | 1.4 | Card titles |
| `h4` | 1rem (16px) | 600 (semibold) | 1.4 | Subsection headers |
| `label` | 0.875rem (14px) | 500 (medium) | 1.4 | Form labels |
| `button` | 0.875rem (14px) | 500 (medium) | 1 | Button text |
| `input` | 0.875rem (14px) | 400 (regular) | 1.5 | Input text |
| `table` | 0.875rem (14px) | 400 (regular) | 1.5 | Table cells |
| `caption` | 0.75rem (12px) | 400 (regular) | 1.5 | Helper text, metadata |
| `small` | 0.75rem (12px) | 400 (regular) | 1.5 | Badges, timestamps |

```css
@theme inline {
  --font-size-h1: 2rem;
  --font-size-h2: 1.5rem;
  --font-size-h3: 1.25rem;
  --font-size-h4: 1rem;
  --font-size-label: 0.875rem;
  --font-size-button: 0.875rem;
  --font-size-input: 0.875rem;
  --font-size-table: 0.875rem;
  --font-size-caption: 0.75rem;
}
```

## Color Palette

### Light Mode

| Token | CSS Variable | Hex | Usage |
|---|---|---|---|
| **Background** | `--bg-primary` | `#ffffff` | Page background |
| | `--bg-secondary` | `#f9fafb` | Card / section background |
| | `--bg-tertiary` | `#f3f4f6` | Hover / active states |
| **Text** | `--text-primary` | `#111827` | Headings, body |
| | `--text-secondary` | `#6b7280` | Labels, metadata |
| | `--text-tertiary` | `#9ca3af` | Placeholders, disabled |
| | `--text-inverse` | `#ffffff` | Text on dark backgrounds |
| **Border** | `--border-primary` | `#e5e7eb` | Card borders, dividers |
| | `--border-secondary` | `#d1d5db` | Input borders |
| **Accent** | `--accent-primary` | `#3b82f6` | Primary buttons, links |
| | `--accent-hover` | `#2563eb` | Hover states |
| | `--accent- muted` | `#dbeafe` | Selected / active backgrounds |
| **Semantic** | `--success` | `#22c55e` | Approved, confirmed |
| | `--warning` | `#eab308` | Pending, in progress |
| | `--error` | `#ef4444` | Rejected, errors |
| | `--info` | `#3b82f6` | Information |

### Dark Mode

| Token | CSS Variable | Hex |
|---|---|---|
| Background | `--bg-primary` | `#0f172a` |
| Background secondary | `--bg-secondary` | `#1e293b` |
| Background tertiary | `--bg-tertiary` | `#334155` |
| Text primary | `--text-primary` | `#f8fafc` |
| Text secondary | `--text-secondary` | `#94a3b8` |
| Text tertiary | `--text-tertiary` | `#64748b` |
| Border primary | `--border-primary` | `#334155` |
| Border secondary | `--border-secondary` | `#475569` |

## Status Badge Colors

| Status | Hex | Tailwind Class |
|---|---|---|
| **PENDING** | `#eab308` | `bg-yellow-100 text-yellow-800 border-yellow-200` |
| **APPROVED** | `#22c55e` | `bg-green-100 text-green-800 border-green-200` |
| **REJECTED** | `#ef4444` | `bg-red-100 text-red-800 border-red-200` |
| **CANCELLED** | `#6b7280` | `bg-gray-100 text-gray-800 border-gray-200` |

```typescript
const STATUS_BADGE_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  APPROVED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
};
```

## Leave Type Badge Colors

| Type | Hex | Tailwind Class |
|---|---|---|
| **Annual** | `#3b82f6` | `bg-blue-100 text-blue-800 border-blue-200` |
| **Sick** | `#ef4444` | `bg-red-100 text-red-800 border-red-200` |
| **Emergency** | `#f97316` | `bg-orange-100 text-orange-800 border-orange-200` |
| **Unpaid** | `#6b7280` | `bg-gray-100 text-gray-800 border-gray-200` |
| **Paternity** | `#a855f7` | `bg-purple-100 text-purple-800 border-purple-200` |
| **Maternity** | `#a855f7` | `bg-purple-100 text-purple-800 border-purple-200` |

```typescript
const LEAVE_TYPE_BADGE_COLORS: Record<string, string> = {
  annual: 'bg-blue-100 text-blue-800 border-blue-200',
  sick: 'bg-red-100 text-red-800 border-red-200',
  emergency: 'bg-orange-100 text-orange-800 border-orange-200',
  unpaid: 'bg-gray-100 text-gray-800 border-gray-200',
  paternity: 'bg-purple-100 text-purple-800 border-purple-200',
  maternity: 'bg-purple-100 text-purple-800 border-purple-200',
};
```

## Audit Action Badge Colors

| Action | Hex | Tailwind Class |
|---|---|---|
| **CREATED** | `#22c55e` | `bg-green-100 text-green-800` |
| **UPDATED** | `#3b82f6` | `bg-blue-100 text-blue-800` |
| **APPROVED** | `#16a34a` | `bg-emerald-100 text-emerald-800` |
| **REJECTED** | `#ef4444` | `bg-red-100 text-red-800` |
| **CANCELLED** | `#6b7280` | `bg-gray-100 text-gray-800` |
| **DELETED** | `#dc2626` | `bg-red-100 text-red-800` |

## Border Radius Scale

| Token | Value | Usage |
|---|---|---|
| `--radius-sm` | `0.25rem` (4px) | Badges, tags |
| `--radius-md` | `0.5rem` (8px) | Inputs, buttons, cards |
| `--radius-lg` | `0.75rem` (12px) | Modals, drawers, large cards |
| `--radius-xl` | `1rem` (16px) | Full-screen containers |

```css
@theme inline {
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
  --radius-lg: 0.75rem;
  --radius-xl: 1rem;
}
```

## Shadow Levels

| Token | Value | Usage |
|---|---|---|
| `--shadow-sm` | `0 1px 2px 0 rgb(0 0 0 / 0.05)` | Cards, subtle elevation |
| `--shadow-md` | `0 4px 6px -1px rgb(0 0 0 / 0.1)` | Dropdowns, popovers |
| `--shadow-lg` | `0 10px 15px -3px rgb(0 0 0 / 0.1)` | Modals, drawers |
| `--shadow-xl` | `0 20px 25px -5px rgb(0 0 0 / 0.1)` | Toast notifications |

## Spacing Conventions

| Token | Value | Usage |
|---|---|---|
| `space-1` | `0.25rem` (4px) | Icon padding, gap between badge text |
| `space-2` | `0.5rem` (8px) | Input padding, small gaps |
| `space-3` | `0.75rem` (12px) | Button padding, stacked spacing |
| `space-4` | `1rem` (16px) | Card padding, section gaps |
| `space-6` | `1.5rem` (24px) | Page padding (mobile: `p-4`, desktop: `lg:p-6`) |
| `space-8` | `2rem` (32px) | Section separators |
| `space-12` | `3rem` (48px) | Page section margins |

## Grid Patterns

| Pattern | Code | Usage |
|---|---|---|
| **1-column** | `grid grid-cols-1` | Mobile default, detail pages |
| **2-column** | `grid grid-cols-1 md:grid-cols-2` | Form layouts, side-by-side cards |
| **3-column** | `grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3` | Card grids, dashboards |
| **4-column** | `grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4` | Stats, small cards |
| **Auto-fill** | `grid grid-cols-[repeat(auto-fill,minmax(300px,1fr))]` | Dynamic collections |

## Card Patterns

| Variant | Classes | Usage |
|---|---|---|
| **Default** | `bg-white rounded-lg border p-4 shadow-sm` | Standard card |
| **Hover** | `bg-white rounded-lg border p-4 shadow-sm hover:shadow-md hover:border-accent-primary transition-all cursor-pointer` | Clickable cards |
| **Form** | `bg-white rounded-lg border p-6 space-y-4` | Form container |
| **Info** | `bg-blue-50 border-blue-200 rounded-lg p-4` | Info messages |
| **Warning** | `bg-yellow-50 border-yellow-200 rounded-lg p-4` | Warning messages |
| **Error** | `bg-red-50 border-red-200 rounded-lg p-4` | Error messages |
| **Compliance** | `bg-purple-50 border-purple-200 rounded-lg p-4` | Compliance info |
| **Success** | `bg-green-50 border-green-200 rounded-lg p-4` | Success messages |
| **File Upload** | `border-2 border-dashed border-gray-300 rounded-lg p-6 hover:border-accent-primary transition-colors` | Drag-and-drop upload area |

## Modal / Drawer Patterns

### Modal

```typescript
// Use shadcn/ui Dialog
<Dialog>
  <DialogTrigger asChild><Button>Open</Button></DialogTrigger>
  <DialogContent className="sm:max-w-[425px]">
    <DialogHeader>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogDescription>This action cannot be undone.</DialogDescription>
    </DialogHeader>
    {/* content */}
    <DialogFooter>
      <Button variant="outline">Cancel</Button>
      <Button>Confirm</Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
```

### Drawer (Sheet)

```typescript
<Sheet>
  <SheetTrigger asChild><Button variant="outline">Open</Button></SheetTrigger>
  <SheetContent side="right" className="w-[400px] sm:w-[540px]">
    <SheetHeader>
      <SheetTitle>Edit Leave Request</SheetTitle>
      <SheetDescription>Make changes to your leave request</SheetDescription>
    </SheetHeader>
    {/* form content */}
  </SheetContent>
</Sheet>
```

## Icon Library

Use **Lucide React** exclusively.

### Sizing Conventions

| Size | className | Usage |
|---|---|---|
| 12px | `size-3` | Inline with caption text |
| 14px | `size-3.5` | Badge icons, small indicators |
| 16px | `size-4` | Button icons, input icons |
| 20px | `size-5` | Section headers, list items |
| 24px | `size-6` | Card icons, status indicators |
| 32px | `size-8` | Empty state illustrations |
| 48px | `size-12` | Page-level status icons |

### Icon Color Conventions

```
<Icon className="size-4" />                    // currentColor (inherits from text)
<Icon className="size-4 text-muted-foreground" /> // secondary text color
<Icon className="size-4 text-primary" />           // accent color
<Icon className="size-4 text-destructive" />        // error color
<Icon className="size-4 text-success" />            // success color
<Icon className="size-4 text-warning" />            // warning color
```

## Full Icon Inventory

| Component Name | Lucide Icon | Usage |
|---|---|---|
| `<IconCalendar />` | `Calendar` | Date fields, leave request cards |
| `<IconClock />` | `Clock` | Time tracking, duration |
| `<IconUser />` | `User` | Profile, user avatar fallback |
| `<IconUsers />` | `Users` | Team, department views |
| `<IconMail />` | `Mail` | Notifications, contact |
| `<IconBell />` | `Bell` | Notifications dropdown |
| `<IconSearch />` | `Search` | Search bars |
| `<IconFilter />` | `Filter` | Filter controls |
| `<IconPlus />` | `Plus` | Create new, add action |
| `<IconMinus />` | `Minus` | Remove, subtract |
| `<IconEdit />` | `Pencil` | Edit action |
| `<IconTrash />` | `Trash2` | Delete action |
| `<IconCopy />` | `Copy` | Duplicate, copy to clipboard |
| `<IconDownload />` | `Download` | Export, download |
| `<IconUpload />` | `Upload` | Import, upload |
| `<IconCheck />` | `Check` | Confirm, success indicator |
| `<IconX />` | `X` | Close, cancel, dismiss |
| `<IconAlertCircle />` | `AlertCircle` | Error states, validation |
| `<IconAlertTriangle />` | `AlertTriangle` | Warnings, destructive actions |
| `<IconInfo />` | `Info` | Information tooltips |
| `<IconHelpCircle />` | `HelpCircle` | Help, guidance |
| `<IconSettings />` | `Settings` | Settings, preferences |
| `<IconLogOut />` | `LogOut` | Sign out |
| `<IconLogIn />` | `LogIn` | Sign in |
| `<IconMenu />` | `Menu` | Mobile hamburger menu |
| `<IconChevronDown />` | `ChevronDown` | Dropdown indicators, accordion |
| `<IconChevronUp />` | `ChevronUp` | Collapse indicators |
| `<IconChevronLeft />` | `ChevronLeft` | Back navigation, pagination |
| `<IconChevronRight />` | `ChevronRight` | Forward navigation, pagination |
| `<IconArrowLeft />` | `ArrowLeft` | Back button |
| `<IconArrowRight />` | `ArrowRight` | Forward, continue |
| `<IconArrowUp />` | `ArrowUp` | Sort ascending |
| `<IconArrowDown />` | `ArrowDown` | Sort descending |
| `<IconExternalLink />` | `ExternalLink` | Open in new tab |
| `<IconFile />` | `File` | General document |
| `<IconFileText />` | `FileText` | Text document, report |
| `<IconFolder />` | `Folder` | Folder, category |
| `<IconImage />` | `Image` | Image upload, gallery |
| `<IconPaperclip />` | `Paperclip` | Attachment |
| `<IconSend />` | `Send` | Submit, send message |
| `<IconRefreshCw />` | `RefreshCw` | Refresh, retry |
| `<IconLoader2 />` | `Loader2` | Loading spinner |
| `<IconEye />` | `Eye` | View, show password |
| `<IconEyeOff />` | `EyeOff` | Hide password |
| `<IconLock />` | `Lock` | Security, permissions |
| `<IconUnlock />` | `Unlock` | Unlocked, accessible |
| `<IconShield />` | `Shield` | Security badge, admin |
| `<IconBarChart3 />` | `BarChart3` | Analytics, reports |
| `<IconPieChart />` | `PieChart` | Statistics, distribution |
| `<IconTrendingUp />` | `TrendingUp` | Positive trend |
| `<IconTrendingDown />` | `TrendingDown` | Negative trend |
| `<IconHome />` | `Home` | Home, dashboard |
| `<IconLayoutDashboard />` | `LayoutDashboard` | Dashboard layout |
| `<IconList />` | `List` | List view |
| `<IconGrid3X3 />` | `Grid3x3` | Grid view |
| `<IconTable />` | `Table` | Table view |
| `<IconCalendarCheck />` | `CalendarCheck` | Approved leave |
| `<IconCalendarX />` | `CalendarX` | Rejected leave |
| `<IconCalendarPlus />` | `CalendarPlus` | New leave request |
| `<IconCalendarRange />` | `CalendarRange` | Date range picker |
| `<IconMapPin />` | `MapPin` | Location |
| `<IconPhone />` | `Phone` | Contact phone |
| `<IconPrinter />` | `Printer` | Print |
| `<IconShare2 />` | `Share2` | Share |
| `<IconThumbsUp />` | `ThumbsUp` | Approve |
| `<IconThumbsDown />` | `ThumbsDown` | Reject |
| `<IconUndo2 />` | `Undo2` | Undo, restore |
| `<IconGripVertical />` | `GripVertical` | Drag handle |
| `<IconMoreHorizontal />` | `MoreHorizontal` | More actions (kebab menu) |
| `<IconMoreVertical />` | `MoreVertical` | More actions (vertical kebab) |
