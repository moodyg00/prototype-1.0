import { NextRequest, NextResponse } from 'next/server';
import { taskStore } from '@/src/core/tasks/store';
import { z } from 'zod';

const ActionSchema = z.object({
  taskId: z.string(),
  type: z.enum(['approve', 'reject', 'provide_input', 'record_decision', 'defer', 'escalate', 'mark_complete']),
  payload: z.record(z.string(), z.any()).optional(),
  note: z.string().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = ActionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: 'Invalid action' }, { status: 400 });
    }

    const action = await taskStore.performAction(parsed.data.taskId, {
      type: parsed.data.type,
      payload: parsed.data.payload || {},
      actor: 'human',
      note: parsed.data.note,
    });

    return NextResponse.json({ success: true, action });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function GET() {
  const tasks = await taskStore.listTasks();
  return NextResponse.json({ tasks });
}
