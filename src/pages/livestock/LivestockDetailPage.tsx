import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, CreditCard as Edit, Scale, Heart, Syringe, Baby, Tag, Activity } from 'lucide-react';
import { StatusBadge, SpeciesBadge } from '../../components/ui/Badge';
import { getAnimal, getWeightRecords, createWeightRecord, getAnimalAttributes } from '../../lib/api';
import { getHealthRecords, getVaccinations, getBreedingEvents } from '../../lib/api';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';
import type { Animal, WeightRecord, HealthRecord, Vaccination, BreedingEvent } from '../../types';

function InfoRow({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null;
  return (
    <div className="flex justify-between py-2 border-b border-neutral-50">
      <span className="text-sm text-neutral-500">{label}</span>
      <span className="text-sm font-medium text-neutral-800">{value}</span>
    </div>
  );
}

export function LivestockDetailPage() {
  const { t, locale } = useTranslation();
  const { user } = useAuth();
  const { id } = useParams();
  const [activeTab, setActiveTab] = useState('info');
  const [loading, setLoading] = useState(true);
  const [animal, setAnimal] = useState<(Animal & { locations: { name: string } | null; dam: { tag_id: string; breed: string } | null; sire: { tag_id: string; breed: string } | null }) | null>(null);
  const [weightHistory, setWeightHistory] = useState<WeightRecord[]>([]);
  const [healthHistory, setHealthHistory] = useState<(HealthRecord & { animals: { tag_id: string } })[]>([]);
  const [vaccinations, setVaccinations] = useState<(Vaccination & { animals: { tag_id: string } | null })[]>([]);
  const [breedingEvents, setBreedingEvents] = useState<(BreedingEvent & { animals: { tag_id: string }; sire: { tag_id: string } | null })[]>([]);
  const [attributes, setAttributes] = useState<any[]>([]);

  const loadData = () => {
    if (!id) return;
    Promise.all([
      getAnimal(user?.id, id),
      getWeightRecords(user?.id, id),
      getHealthRecords(user?.id, id),
      getVaccinations(user?.id, id),
      getBreedingEvents(user?.id, id),
      getAnimalAttributes(user?.id, id).catch(() => []),
    ])
      .then(([animalData, weights, health, vax, breeding, attrs]) => {
        setAnimal(animalData);
        setWeightHistory(weights);
        setHealthHistory(health as any);
        setVaccinations(vax as any);
        setBreedingEvents(breeding as any);
        setAttributes(attrs as any[]);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, [id, user?.id]);

  if (loading) {
    return (
      <div className="page-container">
        <div className="card p-12 text-center">
          <p className="text-neutral-400">{t('common.loading')}</p>
        </div>
      </div>
    );
  }

  if (!animal) {
    return (
      <div className="page-container">
        <div className="card p-12 text-center">
          <p className="text-neutral-500">{t('livestock.not.found')}</p>
          <Link to="/livestock" className="btn-primary mt-4">{t('common.back')}</Link>
        </div>
      </div>
    );
  }

  function getAge() {
    const birth = new Date(animal!.birth_date!);
    const now = new Date();
    const months = (now.getFullYear() - birth.getFullYear()) * 12 + (now.getMonth() - birth.getMonth());
    if (months < 12) return `${months} ${t('livestock.detail.age.month')}`;
    return `${Math.floor(months / 12)} ${t('livestock.detail.age.year')} ${months % 12} ${t('livestock.detail.age.month')}`;
  }

  const tabs = [
    { id: 'info', label: `${t('livestock.detail.tabs.info')}`, icon: <Tag size={14} /> },
    { id: 'weight', label: `${t('livestock.detail.tabs.weight')} (${weightHistory.length})`, icon: <Scale size={14} /> },
    { id: 'health', label: `${t('livestock.detail.tabs.health')} (${healthHistory.length})`, icon: <Heart size={14} /> },
    { id: 'vaccination', label: `${t('livestock.detail.tabs.vaccination')} (${vaccinations.length})`, icon: <Syringe size={14} /> },
    { id: 'breeding', label: `${t('livestock.detail.tabs.reproduction')} (${breedingEvents.length})`, icon: <Baby size={14} /> },
  ];

  const eventTypeLabels: Record<string, string> = {
    heat: t('livestock.detail.reproduction.event.heat'), insemination: t('livestock.detail.reproduction.event.insemination'), pregnancy_check: t('livestock.detail.reproduction.event.pregcheck'),
    birth: t('livestock.detail.reproduction.event.birth'), abortion: t('livestock.detail.reproduction.event.abortion'), dry_off: t('livestock.detail.reproduction.event.dryoff'),
  };

  const healthTypeLabels: Record<string, string> = {
    checkup: t('health.form.type.checkup'), illness: t('health.form.type.illness'), injury: t('health.form.type.injury'),
    treatment: t('health.form.type.treatment'), surgery: t('health.form.type.surgery'), preventive: t('health.form.type.preventive'),
  };

  return (
    <div className="page-container">
      {/* Header */}
      <div className="flex items-start gap-4">
        <Link to="/livestock" className="btn-secondary btn-sm mt-1">
          <ArrowLeft size={14} />
          {t('common.back')}
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="page-title">{animal.tag_id}</h1>
            <SpeciesBadge species={animal.species} />
            <StatusBadge status={animal.status} />
          </div>
          <p className="text-sm text-neutral-500 mt-1">{animal.breed} · {animal.gender === 'male' ? t('gender.male') : t('gender.female')} · {getAge()}</p>
        </div>
        <Link to={`/livestock/${animal.id}/edit`} className="btn-secondary">
          <Edit size={16} />
          {t('common.edit')}
        </Link>
      </div>

      {/* Photo + quick stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card overflow-hidden">
          {animal.photo_url ? (
            <img src={animal.photo_url} alt={animal.tag_id} className="w-full h-48 object-cover" />
          ) : (
            <div className="w-full h-48 bg-gradient-to-br from-earth-100 to-primary-50 flex items-center justify-center">
              <div className="text-center">
                <div className="w-16 h-16 bg-earth-200 rounded-full flex items-center justify-center mx-auto mb-3">
                  <span className="text-2xl">🐄</span>
                </div>
                <p className="text-sm text-earth-600 font-medium">{animal.tag_id}</p>
              </div>
            </div>
          )}
          <div className="p-4 grid grid-cols-2 gap-3">
            <div className="text-center bg-neutral-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-neutral-800">{animal.current_weight_kg}</p>
              <p className="text-xs text-neutral-500">{t('livestock.detail.weight.current')}</p>
            </div>
            <div className="text-center bg-neutral-50 rounded-xl p-3">
              <p className="text-2xl font-bold text-neutral-800">{animal.birth_weight_kg}</p>
              <p className="text-xs text-neutral-500">{t('livestock.detail.weight.birth')}</p>
            </div>
          </div>
        </div>

        <div className="lg:col-span-2 card p-5">
          <h3 className="font-semibold text-neutral-700 mb-4 flex items-center gap-2">
            <Activity size={16} />
            {t('livestock.detail.summary')}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
            <div>
              <InfoRow label={t('livestock.table.tag')} value={animal.tag_id} />
              <InfoRow label={t('livestock.form.rfid')} value={animal.rfid} />
              <InfoRow label={t('livestock.table.species')} value={{ cattle: t('species.cattle'), sheep: t('species.sheep'), goat: t('species.goat') }[animal.species]} />
              <InfoRow label={t('livestock.table.breed')} value={animal.breed} />
              <InfoRow label={t('livestock.table.gender')} value={animal.gender === 'male' ? t('gender.male') : t('gender.female')} />
              <InfoRow label={t('livestock.form.dob')} value={animal.birth_date ? new Date(animal.birth_date).toLocaleDateString(locale) : '-'} />
              <InfoRow label={t('livestock.table.age')} value={getAge()} />
            </div>
            <div>
              <InfoRow label={t('livestock.table.status')} value={animal.status} />
              <InfoRow label={t('livestock.table.purpose')} value={animal.purpose} />
              <InfoRow label={t('livestock.form.color')} value={animal.color} />
              <InfoRow label={t('livestock.table.location')} value={animal.locations?.name || '-'} />
              <InfoRow label={t('livestock.form.acquisition')} value={{ born: t('livestock.form.acquisition.born'), purchased: t('livestock.form.acquisition.purchased'), gift: t('livestock.form.acquisition.gift') }[animal.acquisition_type]} />
              {animal.acquisition_cost && (
                <InfoRow label={t('livestock.form.price')} value={`Rp ${animal.acquisition_cost.toLocaleString(locale)}`} />
              )}
              {animal.notes && <InfoRow label={t('livestock.form.notes')} value={animal.notes} />}
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex overflow-x-auto gap-0 border-b border-neutral-100 px-4">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-3.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary-600 text-primary-700'
                  : 'border-transparent text-neutral-500 hover:text-neutral-700'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-5">
          {activeTab === 'weight' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-neutral-700">{t('livestock.detail.weight.history')}</h3>
                <button className="btn-primary btn-sm" onClick={async () => {
                  const weight = prompt('Masukkan berat badan (kg):');
                  if (weight && !isNaN(Number(weight))) {
                    try {
                      await createWeightRecord(user?.id, { animal_id: animal.id, weigh_date: new Date().toISOString().split('T')[0], weight_kg: Number(weight) });
                      loadData();
                    } catch { alert('Gagal menyimpan berat badan'); }
                  }
                }}>
                  <Scale size={14} />
                  {t('livestock.detail.weight.record')}
                </button>
              </div>
              {weightHistory.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-8">{t('livestock.detail.weight.empty')}</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('livestock.detail.weight.table.date')}</th>
                      <th>{t('livestock.detail.weight.table.weight')}</th>
                      <th>{t('livestock.detail.weight.table.bcs')}</th>
                      <th>{t('livestock.detail.weight.table.chest')}</th>
                      <th>{t('livestock.detail.weight.table.length')}</th>
                      <th>{t('livestock.detail.weight.table.height')}</th>
                      <th>{t('livestock.detail.weight.table.officer')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {weightHistory.map(w => (
                      <tr key={w.id}>
                        <td>{new Date(w.weigh_date).toLocaleDateString(locale)}</td>
                        <td className="font-semibold">{w.weight_kg}</td>
                        <td>{w.body_condition_score || '-'}</td>
                        <td>{w.chest_girth_cm ? `${w.chest_girth_cm} cm` : '-'}</td>
                        <td>{w.body_length_cm ? `${w.body_length_cm} cm` : '-'}</td>
                        <td>{w.height_cm ? `${w.height_cm} cm` : '-'}</td>
                        <td>{(w as any).users?.full_name || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'health' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-neutral-700">{t('livestock.detail.health.title')}</h3>
                <Link to="/health" className="btn-primary btn-sm">
                  <Heart size={14} />
                  {t('livestock.detail.health.add')}
                </Link>
              </div>
              {healthHistory.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-8">{t('livestock.detail.health.empty')}</p>
              ) : (
                <div className="space-y-3">
                  {healthHistory.map(h => (
                    <div key={h.id} className={`p-4 rounded-xl border ${h.is_resolved ? 'border-neutral-100 bg-neutral-50' : 'border-error-100 bg-error-50'}`}>
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold bg-white px-2 py-0.5 rounded-full border border-neutral-200 capitalize">
                              {healthTypeLabels[h.type]}
                            </span>
                            {!h.is_resolved && <span className="text-xs text-error-600 font-medium">{t('status.unresolved')}</span>}
                            {h.is_resolved && <span className="text-xs text-primary-600 font-medium">{t('status.resolved')}</span>}
                          </div>
                          <p className="text-sm font-medium text-neutral-800">{h.diagnosis}</p>
                          {h.treatment && <p className="text-sm text-neutral-500 mt-0.5">{t('livestock.detail.health.treatment')} {h.treatment}</p>}
                          {h.vet_name && <p className="text-xs text-neutral-400 mt-1">{t('livestock.detail.health.vet')} {h.vet_name}</p>}
                        </div>
                        <div className="text-right flex-shrink-0">
                          <p className="text-sm font-medium text-neutral-700">{new Date(h.record_date).toLocaleDateString(locale)}</p>
                          {h.cost > 0 && <p className="text-xs text-neutral-500">Rp {h.cost.toLocaleString(locale)}</p>}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'vaccination' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-neutral-700">{t('livestock.detail.vaccination.title')}</h3>
                <Link to="/vaccinations" className="btn-primary btn-sm">
                  <Syringe size={14} />
                  {t('livestock.detail.vaccination.add')}
                </Link>
              </div>
              {vaccinations.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-8">{t('livestock.detail.vaccination.empty')}</p>
              ) : (
                <table className="table">
                  <thead>
                    <tr>
                      <th>{t('livestock.detail.vaccination.table.vaccine')}</th>
                      <th>{t('livestock.detail.vaccination.table.date')}</th>
                      <th>{t('livestock.detail.vaccination.table.batch')}</th>
                      <th>{t('livestock.detail.vaccination.table.due')}</th>
                      <th>{t('livestock.detail.vaccination.table.cost')}</th>
                      <th>{t('livestock.detail.vaccination.table.officer')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {vaccinations.map(v => (
                      <tr key={v.id}>
                        <td className="font-medium">{v.vaccine_name}</td>
                        <td>{new Date(v.date_administered).toLocaleDateString(locale)}</td>
                        <td>{v.batch_number || '-'}</td>
                        <td>
                          {v.next_due_date ? (
                            <span className={`text-sm ${new Date(v.next_due_date) <= new Date(new Date().toISOString().split('T')[0]) ? 'text-error-600 font-medium' : ''}`}>
                              {new Date(v.next_due_date).toLocaleDateString(locale)}
                            </span>
                          ) : '-'}
                        </td>
                        <td>Rp {v.cost.toLocaleString(locale)}</td>
                        <td>{v.administered_by || '-'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'breeding' && (
            <div>
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-semibold text-neutral-700">{t('livestock.detail.reproduction.title')}</h3>
                <Link to="/breeding" className="btn-primary btn-sm">
                  <Baby size={14} />
                  {t('livestock.detail.reproduction.add')}
                </Link>
              </div>
              {breedingEvents.length === 0 ? (
                <p className="text-sm text-neutral-400 text-center py-8">{t('livestock.detail.reproduction.empty')}</p>
              ) : (
                <div className="relative">
                  <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-neutral-100" />
                  <div className="space-y-4">
                    {breedingEvents.map(e => (
                      <div key={e.id} className="flex gap-4 relative">
                        <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center flex-shrink-0 z-10">
                          <Baby size={16} className="text-primary-600" />
                        </div>
                        <div className="flex-1 card p-4">
                          <div className="flex items-center justify-between gap-3">
                            <div>
                              <span className="text-sm font-semibold text-neutral-800">{eventTypeLabels[e.event_type]}</span>
                              {e.notes && <p className="text-xs text-neutral-500 mt-0.5">{e.notes}</p>}
                              {e.expected_due_date && (
                                <p className="text-xs text-earth-600 mt-0.5">{t('livestock.detail.reproduction.due')} {new Date(e.expected_due_date).toLocaleDateString(locale)}</p>
                              )}
                            </div>
                            <div className="text-right flex-shrink-0">
                              <p className="text-sm text-neutral-600">{new Date(e.event_date).toLocaleDateString(locale)}</p>
                              {e.cost > 0 && <p className="text-xs text-neutral-400">Rp {e.cost.toLocaleString(locale)}</p>}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'info' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8">
              <div>
                <h3 className="font-semibold text-neutral-700 mb-3">{t('livestock.detail.info.basic')}</h3>
                <InfoRow label={t('livestock.table.tag')} value={animal.tag_id} />
                <InfoRow label={t('livestock.table.species')} value={{ cattle: t('species.cattle'), sheep: t('species.sheep'), goat: t('species.goat') }[animal.species]} />
                <InfoRow label={t('livestock.table.breed')} value={animal.breed} />
                <InfoRow label={t('livestock.table.gender')} value={animal.gender === 'male' ? t('gender.male') : t('gender.female')} />
                <InfoRow label={t('livestock.form.color')} value={animal.color} />
                <InfoRow label={t('livestock.form.dob')} value={animal.birth_date ? new Date(animal.birth_date).toLocaleDateString(locale) : '-'} />
                <InfoRow label={t('livestock.form.birth.weight')} value={`${animal.birth_weight_kg} kg`} />
                <InfoRow label={t('livestock.form.current.weight')} value={`${animal.current_weight_kg} kg`} />
              </div>
              <div>
                <h3 className="font-semibold text-neutral-700 mb-3">{t('livestock.detail.info.status')}</h3>
                <InfoRow label={t('livestock.form.status')} value={animal.status} />
                <InfoRow label={t('livestock.form.purpose')} value={animal.purpose} />
                <InfoRow label={t('livestock.form.location')} value={animal.locations?.name || '-'} />
                <InfoRow label={t('livestock.form.acquisition')} value={{ born: t('livestock.form.acquisition.born'), purchased: t('livestock.form.acquisition.purchased'), gift: t('livestock.form.acquisition.gift') }[animal.acquisition_type]} />
                {animal.acquisition_cost && (
                  <InfoRow label={t('livestock.form.price')} value={`Rp ${animal.acquisition_cost.toLocaleString(locale)}`} />
                )}
                {animal.acquisition_date && (
                  <InfoRow label={t('livestock.detail.info.acquisition_date')} value={new Date(animal.acquisition_date).toLocaleDateString(locale)} />
                )}
                {animal.notes && <InfoRow label={t('livestock.form.notes')} value={animal.notes} />}
                {attributes.length > 0 && (
                  <>
                    <div className="border-t border-neutral-100 pt-3 mt-3" />
                    <h3 className="font-semibold text-neutral-700 mb-2">Atribut Spesifik</h3>
                    {attributes.map(a => (
                      <InfoRow key={a.id} label={a.attribute_key.replace(/_/g, ' ')} value={a.attribute_value} />
                    ))}
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
