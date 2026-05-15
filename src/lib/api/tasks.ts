import { supabaseAdmin } from '../supabaseAdmin';
import type { Task, Alert } from '../../types';

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

async function resolveAnimalId(idOrTag: string): Promise<string | undefined> {
  if (UUID_RE.test(idOrTag)) return idOrTag;
  const { data } = await supabaseAdmin.from('animals').select('id').eq('tag_id', idOrTag).maybeSingle();
  return data?.id;
}

// ─── Tasks ───
export async function getTasks(userId: string = '', _params?: { assignedTo?: string; status?: string }) {
  if (!userId) return [];
  const { data, error } = await supabaseAdmin.from('tasks').select('*').eq('user_id', userId).order('created_at', { ascending: false });
  if (error) throw error;
  // Resolve assigned name + animal tag_id manually
  const result = await Promise.all((data || []).map(async (t: any) => {
    let assigned: { full_name: string } | null = null;
    if (t.assigned_to) {
      const { data: u } = await supabaseAdmin.from('users').select('full_name').eq('id', t.assigned_to).maybeSingle();
      if (u) assigned = u;
    }
    let animals: { tag_id: string } | null = null;
    if (t.related_animal_id) {
      const { data: a } = await supabaseAdmin.from('animals').select('tag_id').eq('id', t.related_animal_id).maybeSingle();
      if (a) animals = a;
    }
    return { ...t, assigned, animals };
  }));
  return result as (Task & { assigned: { full_name: string } | null; animals: { tag_id: string } | null })[];
}

export async function createTask(userId: string = '', task: Partial<Task>) {
  if (!userId) throw new Error('User ID required');
  const insertData: any = { ...task, user_id: userId };
  if (insertData.related_animal_id) {
    const uuid = await resolveAnimalId(insertData.related_animal_id);
    if (uuid) insertData.related_animal_id = uuid;
    else delete insertData.related_animal_id;
  }
  const { data, error } = await supabaseAdmin.from('tasks').insert(insertData).select().single();
  if (error) throw error;
  return data as Task;
}

export async function updateTaskStatus(userId: string = '', id: string, status: string) {
  if (!userId) return;
  const updates: Record<string, string | null> = { status };
  if (status === 'completed') updates.completed_at = new Date().toISOString();
  const { error } = await supabaseAdmin.from('tasks').update(updates).eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function getTaskSummary(userId: string = '') {
  if (!userId) return { pending: 0, inProgress: 0, overdue: 0, total: 0 };
  const { data, error } = await supabaseAdmin.from('tasks').select('status, due_date').eq('user_id', userId);
  if (error) throw error;
  const now = new Date().toISOString().split('T')[0];
  let pending = 0, inProgress = 0, overdue = 0;
  for (const t of data) {
    if (t.status === 'pending') pending++;
    else if (t.status === 'in_progress') inProgress++;
    if ((t.status === 'pending' || t.status === 'in_progress') && t.due_date && t.due_date < now) overdue++;
  }
  return { pending, inProgress, overdue, total: data.length };
}

// ─── Alerts ───
export async function getAlerts(userId: string = '', unresolvedOnly?: boolean) {
  if (!userId) return [];
  let q = supabaseAdmin.from('alerts').select('*, animals(tag_id)').eq('user_id', userId).order('created_at', { ascending: false }).limit(50);
  if (unresolvedOnly) q = q.eq('is_resolved', false);
  const { data, error } = await q;
  if (error) throw error;
  return data as (Alert & { animals: { tag_id: string } | null })[];
}

export async function resolveAlert(userId: string = '', id: string) {
  if (!userId) return;
  const { error } = await supabaseAdmin.from('alerts').update({ is_resolved: true }).eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function markAlertRead(userId: string = '', id: string) {
  if (!userId) return;
  const { error } = await supabaseAdmin.from('alerts').update({ is_read: true }).eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function updateTask(userId: string = '', id: string, task: Partial<Task>) {
  if (!userId) throw new Error('User ID required');
  const updateData: any = { ...task };
  if (updateData.related_animal_id) {
    const uuid = await resolveAnimalId(updateData.related_animal_id);
    if (uuid) updateData.related_animal_id = uuid;
    else delete updateData.related_animal_id;
  }
  const { data, error } = await supabaseAdmin.from('tasks').update(updateData).eq('id', id).eq('user_id', userId).select().single();
  if (error) throw error;
  return data as Task;
}

export async function deleteTask(userId: string = '', id: string) {
  if (!userId) return;
  const { error } = await supabaseAdmin.from('tasks').delete().eq('id', id).eq('user_id', userId);
  if (error) throw error;
}

export async function getAlertSummary(userId: string = '') {
  if (!userId) return { total: 0, unresolved: 0, critical: 0, unread: 0 };
  const { data, error } = await supabaseAdmin.from('alerts').select('severity, is_resolved, is_read').eq('user_id', userId);
  if (error) throw error;
  return {
    total: data.length,
    unresolved: data.filter(a => !a.is_resolved).length,
    critical: data.filter(a => a.severity === 'critical' && !a.is_resolved).length,
    unread: data.filter(a => !a.is_read).length,
  };
}
