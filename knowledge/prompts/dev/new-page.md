# New Page Template

## Server Component Fetch Pattern

```typescript
// app/leave-requests/page.tsx
import { createServerClient } from '@/lib/supabase/server';
import { LeaveRequestsList } from '@/components/leave-requests/leave-requests-list';

export const metadata = {
  title: 'Leave Requests — Meridian LMS',
  description: 'View and manage your leave requests',
};

export default async function LeaveRequestsPage() {
  const supabase = await createServerClient();
  const { data: user } = await supabase.auth.getUser();
  const { data: leaveRequests } = await supabase
    .from('leave_requests')
    .select('*, profiles(full_name, avatar_url)')
    .is('deleted_at', null)
    .order('created_at', { ascending: false });

  return (
    <div className="p-4 lg:p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Leave Requests</h1>
        <CreateLeaveRequestButton />
      </div>
      <LeaveRequestsList requests={leaveRequests ?? []} currentUser={user.user} />
    </div>
  );
}
```

## Client Component Wrapper Pattern

```typescript
'use client';

// components/leave-requests/create-leave-request-button.tsx
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export function CreateLeaveRequestButton() {
  const router = useRouter();
  return (
    <Button onClick={() => router.push('/leave-requests/new')}>
      <Plus className="size-4 mr-2" />
      New Request
    </Button>
  );
}
```

## Responsive Layout Guidelines

| Breakpoint | Padding | Layout |
|---|---|---|
| Mobile (< 768px) | `p-4` | Single column, stacked |
| Tablet (768px–1024px) | `p-6` | 2-column grid |
| Desktop (> 1024px) | `p-6 lg:p-8` | Sidebar + main content |

```typescript
// layout pattern
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6 p-4 lg:p-6">
  {items.map(item => <Card key={item.id}>{item.name}</Card>)}
</div>
```

## StatusBadge + LeaveTypeBadge Usage

```typescript
import { StatusBadge } from '@/components/ui/status-badge';
import { LeaveTypeBadge } from '@/components/ui/leave-type-badge';

// StatusBadge: leave_status column (PENDING, APPROVED, REJECTED, CANCELLED)
<StatusBadge status={leaveRequest.leave_status} />

// LeaveTypeBadge: leave_type column (annual, sick, emergency, unpaid, paternity, maternity)
<LeaveTypeBadge type={leaveRequest.leave_type} />
```

## Loading Skeleton via `loading.tsx`

```typescript
// app/leave-requests/loading.tsx
import { Skeleton } from '@/components/ui/skeleton';

export default function Loading() {
  return (
    <div className="p-4 lg:p-6 space-y-4">
      <Skeleton className="h-8 w-48" />
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-lg" />
        ))}
      </div>
    </div>
  );
}
```

## Error Boundary

```typescript
// app/leave-requests/error.tsx
'use client';

import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

export default function LeaveRequestsError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center p-8 gap-4">
      <AlertTriangle className="size-12 text-red-500" />
      <h2 className="text-xl font-semibold">Something went wrong</h2>
      <p className="text-muted-foreground text-sm">{error.message}</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  );
}
```

## Page Metadata Setup

```typescript
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Leave Requests — Meridian LMS',
  description: 'View and manage your leave requests',
  openGraph: {
    title: 'Leave Requests — Meridian LMS',
    description: 'View and manage your leave requests',
  },
};
```

Or for dynamic metadata:

```typescript
export async function generateMetadata({ params }: { params: { id: string } }): Promise<Metadata> {
  const supabase = await createServerClient();
  const { data } = await supabase.from('leave_requests').select('title').eq('id', params.id).single();
  return { title: `${data?.title} — Meridian LMS` };
}
```

## Page Checklist

- [ ] Server component fetches data, passes props to client components
- [ ] Loading skeleton in `loading.tsx`
- [ ] Error boundary in `error.tsx`
- [ ] Metadata (static or dynamic)
- [ ] Responsive layout (`p-4 lg:p-6`)
- [ ] `deleted_at IS NULL` filter on all queries
- [ ] RLS-compatible queries (no service client in server components)
- [ ] StatusBadge and LeaveTypeBadge for leave-related pages
- [ ] Pagination or infinite scroll for large datasets
