import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import type { DashboardStats, Alert, Task, FeedInventory } from '../types';

export function useDashboardData(today = '2026-05-14') {
  const [stats, setStats] = useState<DashboardStats>(() => ({
    cattleCount: 0, sheepCount: 0, goatCount: 0, totalAnimals: 0,
    healthyCount: 0, sickCount: 0, pregnantCount: 0, lactatingCount: 0, dryCount: 0,
    totalIncome: 0, totalExpense: 0, netProfit: 0,
    totalFeedValue: 0, totalMedValue: 0, totalInventoryValue: 0,
    avgMilkToday: 0, pendingTasks: 0, overdueTasks: 0, unreadAlerts: 0, criticalAlerts: 0, lowStockCount: 0,
  }));
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [tasks, setTasks] = useState<Task[]>([]);
  const [feedInv, setFeedInv] = useState<FeedInventory[]>([]);
  const [milkData, setMilkData] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const todayObj = new Date(today);
        const sevenDaysAgo = new Date(todayObj.getTime() - 7 * 86400000).toISOString().split('T')[0];
        const monthStart = today.slice(0, 7) + '-01';
        const [animalsRes, alertsRes, tasksRes, feedRes, prodRes, finRes] = await Promise.all([
          supabase.from('animals').select('species, status'),
          supabase.from('alerts').select('*').eq('is_resolved', false).order('created_at', { ascending: false }).limit(5),
          supabase.from('tasks').select('*').in('status', ['pending', 'in_progress']).order('created_at', { ascending: false }).limit(5),
          supabase.from('feed_inventory').select('*, feeds(name, category)').order('feeds(name)'),
          supabase.from('daily_production').select('quantity, production_date').gte('production_date', sevenDaysAgo).order('production_date'),
          supabase.from('financial_transactions').select('type, amount').gte('transaction_date', monthStart),
        ]);

        const species: Record<string, number> = {};
        const status: Record<string, number> = {};
        for (const a of animalsRes.data || []) {
          species[a.species] = (species[a.species] || 0) + 1;
          status[a.status] = (status[a.status] || 0) + 1;
        }

        let income = 0, expense = 0;
        for (const t of finRes.data || []) {
          if (t.type === 'income') income += Number(t.amount);
          else expense += Number(t.amount);
        }

        setStats({
          cattleCount: species.cattle || 0, sheepCount: species.sheep || 0, goatCount: species.goat || 0,
          totalAnimals: animalsRes.data?.length || 0,
          healthyCount: status.healthy || 0, sickCount: status.sick || 0,
          pregnantCount: status.pregnant || 0, lactatingCount: status.lactating || 0, dryCount: status.dry || 0,
          totalIncome: income, totalExpense: expense, netProfit: income - expense,
          totalFeedValue: feedRes.data?.reduce((s, f) => s + Number(f.total_cost), 0) || 0,
          totalMedValue: 0, totalInventoryValue: 0,
          avgMilkToday: prodRes.data?.length ? Number(prodRes.data[prodRes.data.length - 1].quantity) : 0,
          pendingTasks: tasksRes.data?.length || 0,
          overdueTasks: tasksRes.data?.filter(t => t.due_date && t.due_date < today).length || 0,
          unreadAlerts: alertsRes.data?.filter(a => !a.is_read).length || 0,
          criticalAlerts: alertsRes.data?.filter(a => a.severity === 'critical').length || 0,
          lowStockCount: feedRes.data?.filter(f => Number(f.quantity_on_hand) < Number(f.min_threshold)).length || 0,
        });

        setAlerts(alertsRes.data || []);
        setTasks(tasksRes.data || []);
        setFeedInv(feedRes.data?.slice(0, 5) || []);
        setMilkData((prodRes.data || []).map(d => Number(d.quantity)));
      } catch (err) {
        console.error('Dashboard load error:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [today]);

  return { stats, alerts, tasks, feedInv, milkData, loading };
}
