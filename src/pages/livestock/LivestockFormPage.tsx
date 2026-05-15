import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save } from 'lucide-react';
import { getLocations } from '../../lib/api';
import { createAnimal, updateAnimal, getAnimal } from '../../lib/api/animals';
import { useAuth } from '../../contexts/AuthContext';
import { useTranslation } from '../../contexts/LanguageContext';

export function LivestockFormPage() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const isEditing = !!id;
  const [locations, setLocations] = useState<any[]>([]);
  const [loading, setLoading] = useState(isEditing);
  useEffect(() => { if (user?.id) getLocations(user.id).then(setLocations); }, [user?.id]);
  useEffect(() => {
    if (id) {
      getAnimal(user?.id, id).then(a => {
        setForm({
          tag_id: a.tag_id,
          rfid: a.rfid || '',
          species: a.species,
          breed: a.breed,
          gender: a.gender,
          birth_date: a.birth_date || '',
          birth_weight_kg: a.birth_weight_kg !== undefined ? String(a.birth_weight_kg) : '',
          current_weight_kg: a.current_weight_kg !== undefined ? String(a.current_weight_kg) : '',
          color: a.color || '',
          status: a.status,
          purpose: a.purpose,
          current_location_id: a.current_location_id || '',
          acquisition_type: a.acquisition_type,
          acquisition_cost: a.acquisition_cost !== undefined ? String(a.acquisition_cost) : '',
          notes: a.notes || '',
        });
        setLoading(false);
      }).catch(() => { navigate('/livestock'); });
    }
    }, [id, user?.id]);

  const [form, setForm] = useState({
    tag_id: '', rfid: '', species: 'cattle', breed: '', gender: 'female',
    birth_date: '', birth_weight_kg: '', current_weight_kg: '', color: '',
    status: 'healthy', purpose: 'dairy', current_location_id: '',
    acquisition_type: 'born', acquisition_cost: '', notes: '',
  });

  const breedOptions: Record<string, string[]> = {
    cattle: ['FH (Friesian Holstein)', 'Jersey', 'Brahman', 'Simmental', 'Bali', 'Ongole', 'Limousin', 'Angus'],
    sheep: ['Garut', 'Merino', 'Dorper', 'Texel', 'Corriedale'],
    goat: ['Boer', 'Ettawa (PE)', 'Kacang', 'Saanen', 'Nubian'],
  };

  const purposeOptions: Record<string, string[]> = {
    cattle: ['dairy', 'beef', 'breeding', 'dual'],
    sheep: ['dairy', 'beef', 'breeding', 'dual'],
    goat: ['beef', 'dairy', 'breeding', 'dual'],
  };

  const change = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = {
        tag_id: form.tag_id,
        rfid: form.rfid || undefined,
        species: form.species as any,
        breed: form.breed,
        gender: form.gender as any,
        birth_date: form.birth_date || undefined,
        birth_weight_kg: form.birth_weight_kg ? Number(form.birth_weight_kg) : undefined,
        current_weight_kg: form.current_weight_kg ? Number(form.current_weight_kg) : undefined,
        status: form.status as any,
        purpose: form.purpose as any,
        color: form.color || undefined,
        current_location_id: form.current_location_id || undefined,
        acquisition_type: form.acquisition_type as any,
        acquisition_cost: form.acquisition_cost ? Number(form.acquisition_cost) : undefined,
        notes: form.notes || undefined,
      };
      if (isEditing) {
        await updateAnimal(user?.id, id, data);
      } else {
        await createAnimal(user?.id, data);
      }
      navigate('/livestock');
    } catch {
      alert('Gagal menyimpan data ternak');
    }
  };

  if (loading) return <div className="page-container"><div className="card p-12 text-center"><p>{t('common.loading')}</p></div></div>;

  return (
    <div className="page-container max-w-3xl">
      <div className="flex items-center gap-4">
        <Link to="/livestock" className="btn-secondary btn-sm">
          <ArrowLeft size={14} />
          {t('common.back')}
        </Link>
        <h1 className="page-title">{isEditing ? t('livestock.form.edit') : t('livestock.form.new')}</h1>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Basic Identity */}
        <div className="card p-5">
          <h2 className="font-semibold text-neutral-700 mb-4">{t('livestock.form.id.title')}</h2>
          <div className="form-grid-2">
            <div>
              <label className="label">{t('livestock.form.tag')} <span className="text-error-500">*</span></label>
              <input name="tag_id" className="input" placeholder="SP-025" value={form.tag_id} onChange={change} required />
            </div>
            <div>
              <label className="label">{t('livestock.form.rfid')}</label>
              <input name="rfid" className="input" placeholder="RFID number" value={form.rfid} onChange={change} />
            </div>
            <div>
              <label className="label">{t('livestock.form.species')} <span className="text-error-500">*</span></label>
              <select name="species" className="select" value={form.species} onChange={change}>
                <option value="cattle">{t('species.cattle')}</option>
                <option value="sheep">{t('species.sheep')}</option>
                <option value="goat">{t('species.goat')}</option>
              </select>
            </div>
            <div>
              <label className="label">{t('livestock.form.breed')}</label>
              <select name="breed" className="select" value={form.breed} onChange={change}>
                <option value="">{t('livestock.form.breed.placeholder')}</option>
                {breedOptions[form.species].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            <div>
              <label className="label">{t('livestock.form.gender')} <span className="text-error-500">*</span></label>
              <select name="gender" className="select" value={form.gender} onChange={change}>
                <option value="female">{t('gender.female')}</option>
                <option value="male">{t('gender.male')}</option>
              </select>
            </div>
            <div>
              <label className="label">{t('livestock.form.purpose')}</label>
              <select name="purpose" className="select" value={form.purpose} onChange={change}>
                {purposeOptions[form.species].map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('livestock.form.color')}</label>
              <input name="color" className="input" placeholder="Hitam Putih" value={form.color} onChange={change} />
            </div>
            <div>
              <label className="label">{t('livestock.form.status')}</label>
              <select name="status" className="select" value={form.status} onChange={change}>
                <option value="healthy">{t('status.healthy')}</option>
                <option value="sick">{t('status.sick')}</option>
                <option value="pregnant">{t('status.pregnant')}</option>
                <option value="lactating">{t('status.lactating')}</option>
                <option value="dry">{t('status.dry')}</option>
              </select>
            </div>
          </div>
        </div>

        {/* Physical Data */}
        <div className="card p-5">
          <h2 className="font-semibold text-neutral-700 mb-4">{t('livestock.form.physical.title')}</h2>
          <div className="form-grid-3">
            <div>
              <label className="label">{t('livestock.form.dob')}</label>
              <input name="birth_date" type="date" className="input" value={form.birth_date} onChange={change} />
            </div>
            <div>
              <label className="label">{t('livestock.form.birth.weight')}</label>
              <input name="birth_weight_kg" type="number" step="0.1" className="input" placeholder="38" value={form.birth_weight_kg} onChange={change} />
            </div>
            <div>
              <label className="label">{t('livestock.form.current.weight')}</label>
              <input name="current_weight_kg" type="number" step="0.1" className="input" placeholder="540" value={form.current_weight_kg} onChange={change} />
            </div>
          </div>
        </div>

        {/* Location & Acquisition */}
        <div className="card p-5">
          <h2 className="font-semibold text-neutral-700 mb-4">{t('livestock.form.location.title')}</h2>
          <div className="form-grid-2">
            <div>
              <label className="label">{t('livestock.form.location')}</label>
              <select name="current_location_id" className="select" value={form.current_location_id} onChange={change}>
                <option value="">{t('livestock.form.location.placeholder')}</option>
                {locations.filter((l: any) => l.type !== 'storage' && l.type !== 'office').map((loc: any) => (
                  <option key={loc.id} value={loc.id}>{loc.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label">{t('livestock.form.acquisition')}</label>
              <select name="acquisition_type" className="select" value={form.acquisition_type} onChange={change}>
                <option value="born">{t('livestock.form.acquisition.born')}</option>
                <option value="purchased">{t('livestock.form.acquisition.purchased')}</option>
                <option value="gift">{t('livestock.form.acquisition.gift')}</option>
              </select>
            </div>
            {form.acquisition_type === 'purchased' && (
              <div>
                <label className="label">{t('livestock.form.price')}</label>
                <input name="acquisition_cost" type="number" className="input" placeholder="15000000" value={form.acquisition_cost} onChange={change} />
              </div>
            )}
          </div>
        </div>

        {/* Notes */}
        <div className="card p-5">
          <label className="label">{t('livestock.form.notes')}</label>
          <textarea name="notes" className="input h-24 resize-none" placeholder="Catatan tambahan..." value={form.notes} onChange={change} />
        </div>

        <div className="flex justify-end gap-3">
          <Link to="/livestock" className="btn-secondary">{t('common.cancel')}</Link>
          <button type="submit" className="btn-primary">
            <Save size={16} />
            {t('livestock.form.submit')}
          </button>
        </div>
      </form>
    </div>
  );
}
