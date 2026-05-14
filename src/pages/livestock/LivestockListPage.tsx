import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Plus, Search, Filter, Download, Eye, CreditCard as Edit, Beef } from 'lucide-react';
import { StatusBadge, SpeciesBadge } from '../../components/ui/Badge';
import { EmptyState } from '../../components/ui/EmptyState';
import { getAnimals } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import type { Animal } from '../../types';

export function LivestockListPage() {
  const { hasRole } = useAuth();
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [speciesFilter, setSpeciesFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [animals, setAnimals] = useState<(Animal & { locations: { name: string } | null })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getAnimals()
      .then(data => setAnimals(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = animals.filter(a => {
    const matchSearch = a.tag_id.toLowerCase().includes(search.toLowerCase()) ||
      a.breed.toLowerCase().includes(search.toLowerCase());
    const matchSpecies = speciesFilter === 'all' || a.species === speciesFilter;
    const matchStatus = statusFilter === 'all' || a.status === statusFilter;
    return matchSearch && matchSpecies && matchStatus;
  });

  const speciesCounts = {
    cattle: animals.filter(a => a.species === 'cattle').length,
    sheep: animals.filter(a => a.species === 'sheep').length,
    goat: animals.filter(a => a.species === 'goat').length,
  };

  function getAge(birthDate?: string) {
    if (!birthDate) return '-';
    const birth = new Date(birthDate);
    const now = new Date('2026-05-14');
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months < 12) return `${months} bln`;
    return `${Math.floor(months / 12)} th ${months % 12 > 0 ? `${months % 12} bln` : ''}`;
  }

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
           <h1 className="page-title">{t('livestock.title')}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{t('livestock.count').replace('{count}', String(animals.length))}</p>
        </div>
        {hasRole(['owner', 'manager']) && (
          <Link to="/livestock/new" className="btn-primary">
            <Plus size={16} />
            {t('livestock.add')}
          </Link>
        )}
      </div>

      {/* Summary chips */}
      <div className="flex flex-wrap gap-2">
        {[
          { label: t('livestock.filter.all'), value: 'all', count: animals.length },
          { label: t('species.cattle'), value: 'cattle', count: speciesCounts.cattle },
          { label: t('species.sheep'), value: 'sheep', count: speciesCounts.sheep },
          { label: t('species.goat'), value: 'goat', count: speciesCounts.goat },
        ].map(s => (
          <button
            key={s.value}
            onClick={() => setSpeciesFilter(s.value)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              speciesFilter === s.value
                ? 'bg-primary-600 text-white'
                : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50'
            }`}
          >
            {s.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full ${
              speciesFilter === s.value ? 'bg-primary-500 text-white' : 'bg-neutral-100 text-neutral-500'
            }`}>{s.count}</span>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="card p-12 text-center">
          <p className="text-neutral-400">{t('common.loading')}</p>
        </div>
      ) : (
      <div className="card">
        {/* Filters */}
        <div className="p-4 border-b border-neutral-100 flex flex-wrap gap-3">
          <div className="flex-1 min-w-48 relative">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-neutral-400" />
            <input
              type="text"
              className="input pl-9"
              placeholder={t('livestock.search')}
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
          </div>
          <select className="select w-40" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">{t('livestock.filter.status.all')}</option>
            <option value="healthy">{t('status.healthy')}</option>
            <option value="sick">{t('status.sick')}</option>
            <option value="pregnant">{t('status.pregnant')}</option>
            <option value="lactating">{t('status.lactating')}</option>
            <option value="dry">{t('status.dry')}</option>
            <option value="culled">{t('status.culled')}</option>
            <option value="sold">{t('status.sold')}</option>
          </select>
          <button className="btn-secondary">
            <Filter size={16} />
            {t('common.filter')}
          </button>
          <button className="btn-secondary">
            <Download size={16} />
            {t('common.export')}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-x-auto">
          {filtered.length === 0 ? (
            <EmptyState
              icon={<Beef size={24} />}
              title={t('livestock.empty')}
              description={t('livestock.empty.desc')}
            />
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>{t('livestock.table.tag')}</th>
                  <th>{t('livestock.table.species')}</th>
                  <th>{t('livestock.table.breed')}</th>
                  <th>{t('livestock.table.gender')}</th>
                  <th>{t('livestock.table.age')}</th>
                  <th>{t('livestock.table.weight')}</th>
                  <th>{t('livestock.table.status')}</th>
                  <th>{t('livestock.table.purpose')}</th>
                  <th>{t('livestock.table.location')}</th>
                  <th>{t('common.actions')}</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map(animal => (
                  <tr key={animal.id}>
                    <td>
                      <Link to={`/livestock/${animal.id}`} className="font-semibold text-primary-700 hover:text-primary-800">
                        {animal.tag_id}
                      </Link>
                    </td>
                    <td><SpeciesBadge species={animal.species} /></td>
                    <td className="max-w-[140px] truncate">{animal.breed}</td>
                    <td>{animal.gender === 'male' ? t('gender.male') : t('gender.female')}</td>
                    <td>{getAge(animal.birth_date)}</td>
                    <td className="font-medium">{animal.current_weight_kg}</td>
                    <td><StatusBadge status={animal.status} /></td>
                    <td>
                      <span className="text-xs text-neutral-500 capitalize">{animal.purpose}</span>
                    </td>
                    <td className="max-w-[160px] truncate text-xs text-neutral-500">{animal.locations?.name || '-'}</td>
                    <td>
                      <div className="flex items-center gap-1">
                        <Link to={`/livestock/${animal.id}`} className="btn-ghost btn-sm p-1.5 rounded">
                          <Eye size={14} />
                        </Link>
                        {hasRole(['owner', 'manager']) && (
                          <Link to={`/livestock/${animal.id}/edit`} className="btn-ghost btn-sm p-1.5 rounded">
                            <Edit size={14} />
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {filtered.length > 0 && (
          <div className="px-4 py-3 border-t border-neutral-100 text-sm text-neutral-400">
            {t('livestock.showing').replace('{shown}', String(filtered.length)).replace('{total}', String(animals.length))}
          </div>
        )}
      </div>)}
    </div>
  );
}
