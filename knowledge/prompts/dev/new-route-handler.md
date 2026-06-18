# New Route Handler Template

## Boilerplate

```typescript
import { createServiceClient } from '@/lib/supabase/service';
import { createServerClient } from '@/lib/supabase/server';
import { AppError, handleApiError, logError } from '@/lib/errors';
import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const start = Date.now();

  try {
    // 1. Auth check
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new AppError('AUTH_ERROR', 'Unauthorized', 401);

    // 2. Set actor for audit
    await supabase.rpc('set_actor', { actor_id: user.id });

    // 3. Validate request
    // const schema = z.object({ ... });
    // const parsed = schema.parse(await request.json());

    // 4. Business logic
    // const { data, error } = await supabase.from('...').select('*');

    // 5. Response
    return NextResponse.json({ data, requestId }, { status: 200 });
  } catch (error) {
    logError(requestId, 'GET /api/...', error, Date.now() - start);
    return handleApiError(error, requestId);
  }
}

export async function POST(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const start = Date.now();

  try {
    // 1. Auth check
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new AppError('AUTH_ERROR', 'Unauthorized', 401);

    // 2. Set actor for audit
    await supabase.rpc('set_actor', { actor_id: user.id });

    // 3. Validate body
    // const schema = z.object({ ... });
    // const parsed = schema.parse(await request.json());

    // 4. Transaction / business logic
    // const { data, error } = await supabase.from('...').insert(parsed).select().single();

    // 5. Fire-and-forget notification
    // void notifyUser(user.id, data.id);

    // 6. Response
    return NextResponse.json({ data, requestId }, { status: 201 });
  } catch (error) {
    logError(requestId, 'POST /api/...', error, Date.now() - start);
    return handleApiError(error, requestId);
  }
}

export async function PUT(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const start = Date.now();

  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new AppError('AUTH_ERROR', 'Unauthorized', 401);

    await supabase.rpc('set_actor', { actor_id: user.id });

    // const schema = z.object({ id: z.string().uuid(), ... });
    // const parsed = schema.parse(await request.json());

    // Atomic mutation
    // const { data, error } = await supabase.from('...').update(parsed).eq('id', parsed.id).select().single();

    return NextResponse.json({ data, requestId }, { status: 200 });
  } catch (error) {
    logError(requestId, 'PUT /api/...', error, Date.now() - start);
    return handleApiError(error, requestId);
  }
}

export async function DELETE(request: NextRequest) {
  const requestId = crypto.randomUUID();
  const start = Date.now();

  try {
    const supabase = await createServerClient();
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    if (authError || !user) throw new AppError('AUTH_ERROR', 'Unauthorized', 401);

    await supabase.rpc('set_actor', { actor_id: user.id });

    // Soft-delete
    // const { data, error } = await supabase.from('...').update({ deleted_at: new Date().toISOString() }).eq('id', id).select().single();

    return NextResponse.json({ data, requestId }, { status: 200 });
  } catch (error) {
    logError(requestId, 'DELETE /api/...', error, Date.now() - start);
    return handleApiError(error, requestId);
  }
}
```

## Checklist

- [ ] Auth check at top (always `supabase.auth.getUser()`)
- [ ] `SET app.current_user_id` for audit via `rpc('set_actor')`
- [ ] Zod validation before any DB operation
- [ ] Transaction for mutations (use RPC or service client)
- [ ] Fire-and-forget notification (`void notifyUser(...)`)
- [ ] Response includes `requestId`
- [ ] Structured logging via `logError`
- [ ] Error handling via `AppError` + `handleApiError`
- [ ] Soft-delete for DELETE handlers
- [ ] Rate limiting considered (if high-traffic endpoint)

## Error Response Shape

```typescript
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Start date is required",
    "details": { "field": "start_date", "rule": "required" }
  },
  "requestId": "550e8400-e29b-41d4-a716-446655440000"
}
```
