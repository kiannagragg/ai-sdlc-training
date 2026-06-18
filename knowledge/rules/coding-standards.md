# Coding Standards

## Naming Conventions

| Category | Convention | Example |
|---|---|---|
| Components | PascalCase | `LeaveRequestCard.tsx` |
| Functions/Variables/Hooks | camelCase | `getLeaveBalance()`, `isSubmitting` |
| Environment Variables | SCREAMING_SNAKE | `NEXT_PUBLIC_SUPABASE_URL` |
| File names | kebab-case | `leave-request-form.tsx` |
| Types/Interfaces | PascalCase | `LeaveRequest` |
| Enum members | PascalCase | `LeaveStatus.Approved` |
| Routes | kebab-case | `/api/leave-requests` |
| Database tables | snake_case | `leave_requests` |
| Database columns | snake_case | `deleted_at` |

## File Organization

Import order (grouped with blank line between):

```typescript
// 1. React / Next.js
import { useState } from 'react';
import { useRouter } from 'next/navigation';

// 2. Lucide icons
import { Calendar, AlertCircle } from 'lucide-react';

// 3. shadcn/ui components
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

// 4. LMS domain components
import { LeaveRequestCard } from '@/components/leave-requests/leave-request-card';

// 5. Library utilities
import { cn } from '@/lib/utils';
import { createClient } from '@/lib/supabase/client';

// 6. Types
import type { LeaveRequest } from '@/types/leave-request';
```

## Component Patterns

### Server Components (Default)

```typescript
// leave-request-list.tsx — Server Component (no 'use client')
export default async function LeaveRequestList() {
  const supabase = await createServerClient();
  const { data } = await supabase.from('leave_requests').select('*');
  return <ul>{data?.map(r => <LeaveRequestItem key={r.id} request={r} />)}</ul>;
}
```

### Client Components (Only for Interactivity)

```typescript
'use client';

export function LeaveRequestForm() { /* interactive only */ }
```

**When to use Client Components:**
- Forms and user input
- `useState` / `useEffect` / `useReducer`
- `useContext` consumers
- `onClick` / `onSubmit` / event handlers
- Browser-only APIs (`localStorage`, `IntersectionObserver`)
- Animation libraries

## 5-State Form Validation

Every form field tracks these states:

| State | Visual | Implementation |
|---|---|---|
| **Default** | Normal appearance, no feedback | Initial render |
| **Focused** | Ring highlight, label active | `onFocus` handler |
| **Valid-filled** | Green border + check icon | `onBlur` after value passes validation |
| **Invalid** | Red border + error message | Zod schema failure on `onBlur` or `onSubmit` |
| **Disabled** | Grayed out, pointer-events: none | `disabled` prop from parent or submission state |

```typescript
type FieldState = 'default' | 'focused' | 'valid-filled' | 'invalid' | 'disabled';
```

## Error Boundary Placement

- Wrap **every page** in an error boundary at the top level of `app/`
- Wrap **each major section** (sidebar, main content, modals) independently
- Wrap **data-fetching regions** (tables, lists) so one failure doesn't crash the page

```typescript
// app/leave-requests/error.tsx
'use client';
export default function Error({ error, reset }: { error: Error; reset: () => void }) {
  return <ErrorCard message={error.message} onRetry={reset} />;
}
```

## Logging Conventions

```typescript
// ✅ Correct
import { logError } from '@/lib/errors';
logError(requestId, 'Failed to create leave request', error, duration);

// ❌ Never
console.log(error);
console.error(error);
```

Production logging goes through `lib/errors.ts` only. Never commit `console.log`, `console.error`, or `console.warn`.

## Testing

```typescript
describe('LeaveRequestForm', () => {
  it('renders all required fields', () => { /* ... */ });
  it('shows validation error when date is missing', () => { /* ... */ });
  it('submits successfully with valid data', () => { /* ... */ });
});
```

- Unit tests in `__tests__/` next to component
- Integration tests in `__tests__/integration/`
- E2E tests in `e2e/`

## CSS Conventions

Use Tailwind v4 `@theme inline` in `app.css`:

```css
@theme inline {
  --color-primary: #3b82f6;
  --color-primary-dark: #2563eb;
  --radius-sm: 0.25rem;
  --radius-md: 0.5rem;
}
```

Use `cn()` for conditional classes:

```typescript
import { cn } from '@/lib/utils';

<div className={cn('p-4 rounded-md', isError && 'bg-red-50 border-red-200')} />
```

- Prefer Tailwind utility classes over custom CSS
- Use CSS modules only for complex animations or third-party overrides
- No inline `style` props except for dynamic values (width, height, transform)
