import { supabase } from '../supabase';
import { supabaseAdmin } from '../supabaseAdmin';
import type { Task, Alert } from '../../types';

// ─── Tasks ───
export async function getTasks(params?: { assignedTo?: string; status?: string }) {
  let q = supabase.from('tasks').select('*, assigned:assigned_to(full_name), animals!tasks_related_animal_id_fkey(tag_id)').order('created_at', { ascending: false });
  if (params?.assignedTo) q = q.eq('assigned_to', params.assignedTo);
  if (params?.status) q = q.eq('status', params.status);
  const { data, error } = await q;
  if (error) throw error;
  return data as (Task & { assigned: { full_name: string } | null; animals: { tag_id: string } | null })[];
}

export async function createTask(task: Partial<Task>) {
  const { data, error } = await supabaseAdmin.from('tasks').insert(task).select().single();
  if (error) throw error;
  return data as Task;
}

export async function updateTaskStatus(id: string, status: string) {
  const updates: Record<string, string | null> = { status };
  if (status === 'completed') updates.completed_at = new Date().toISOString();
  const { error } = await supabaseAdmin.from('tasks').update(updates).eq('id', id);
  if (error) throw error;
}

export async function getTaskSummary() {
  const { data, error } = await supabase.from('tasks').select('status, due_date');
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
export async function getAlerts(unresolvedOnly?: boolean) {
  let q = supabase.from('alerts').select('*, animals(tag_id)').order('created_at', { ascending: false }).limit(50);
  if (unresolvedOnly) q = q.eq('is_resolved', false);
  const { data, error } = await q;
  if (error) throw error;
  return data as (Alert & { animals: { tag_id: string } | null })[];
}

export async function resolveAlert(id: string) {
  const { error } = await supabaseAdmin.from('alerts').update({ is_resolved: true }).eq('id', id);
  if (error) throw error;
}

export async function markAlertRead(id: string) {
  const { error } = await supabaseAdmin.from('alerts').update({ is_read: true }).eq('id', id);
  if (error) throw error;
}

export async function getAlertSummary() {
  const { data, error } = await supabase.from('alerts').select('severity, is_resolved, is_read');
  if (error) throw error;
  return {
    total: data.length,
    unresolved: data.filter(a => !a.is_resolved).length,
    critical: data.filter(a => a.severity === 'critical' && !a.is_resolved).length,
    unread: data.filter(a => !a.is_read).length,
  };
}
