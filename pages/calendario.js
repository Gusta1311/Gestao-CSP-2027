import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';

const MESES = [
  'Janeiro','Fevereiro','Março','Abril','Maio','Junho',
  'Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'
];
const DIAS = ['Dom','Seg','Ter','Qua','Qui','Sex','Sáb'];

const CORES = [
  { label: 'Azul',     value: '#1B5CA8' },
  { label: 'Verde',    value: '#7DC242' },
  { label: 'Vermelho', value: '#E53935' },
  { label: 'Amarelo',  value: '#F9A825' },
  { label: 'Roxo',     value: '#7B1FA2' },
  { label: 'Laranja',  value: '#F57C00' },
  { label: 'Rosa',     value: '#E91E63' },
  { label: 'Ciano',    value: '#00ACC1' },
];

const FERIADOS_2027 = {
  '2027-01-01': 'Ano Novo',
  '2027-01-25': 'Aniversário de São Paulo',
  '2027-02-08': 'Carnaval',
  '2027-02-09': 'Carnaval',
  '2027-02-10': 'Quarta-feira de Cinzas',
  '2027-03-26': 'Sexta-feira Santa',
  '2027-03-28': 'Páscoa',
  '2027-04-21': 'Tiradentes',
  '2027-05-01': 'Dia do Trabalhador',
  '2027-05-27': 'Corpus Christi',
  '2027-07-09': 'Revolução Constitucionalista (SP)',
  '2027-09-07': 'Independência do Brasil',
  '2027-10-12': 'N.S. Aparecida / Dia das Crianças',
  '2027-11-02': 'Finados',
  '2027-11-15': 'Proclamação da República',
  '2027-11-20': 'Consciência Negra',
  '2027-12-25': 'Natal',
};

export default function Calendario() {
  const { canEdit } = useAuth();
  const [eventos, setEventos] = useState({});
  const [loading, setLoading] = useState(true);
  const [clickModal, setClickModal] = useState(null);
  const [form, setForm] = useState({ nome: '', cor: '#1B5CA8' });
  const [saving, setSaving] = useState(false);
  const [erroSave, setErroSave] = useState('');

  useEffect(() => { loadEventos(); }, []);

  async function loadEventos() {
    setLoading(true);
    const { data } = await supabase.from('eventos').select('*').order('data_inicio');
    const byDate = {};
    (data || []).forEach(ev => {
      const start = new Date(ev.data_inicio + 'T12:00:00');
      const end = ev.data_fim ? new Date(ev.data_fim + 'T12:00:00') : start;
      const cur = new Date(start);
      while (cur <= end) {
        const key = cur.toISOString().split('T')[0];
        if (!byDate[key]) byDate[key] = [];
        byDate[key].push(ev);
        cur.setDate(cur.getDate() + 1);
      }
    });
    setEventos(byDate);
    setLoading(false);
  }

  async function saveEvento() {
    if (!form.nome.trim() || !clickModal) return;
    setSaving(true);
    setErroSave('');
    const { error } = await supabase.from('eventos').insert({
      nome: form.nome.trim(),
      cor: form.cor,
      tipo: 'Pedagógico',
      data_inicio: clickModal.date,
      data_fim: clickModal.date,
      status: 'Planejado',
    });
    setSaving(false);
    if (error) {
      setErroSave('Erro ao salvar: ' + error.message);
      return;
    }
    setClickModal(null);
    setForm({ nome: '', cor: '#1B5CA8' });
    loadEventos();
  }

  async function deleteEvento(id) {
    await supabase.from('eventos').delete().eq('id', id);
    loadEventos();
  }

  function getDaysInMonth(year, month) { return new Date(year, month + 1, 0).getDate(); }
  function getFirstDayOfMonth(year, month) { return new Date(year, month, 1).getDay(); }
  function dateKey(y, m, d) { return `${y}-${String(m+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`; }
  function fmtDateBR(key) {
    const [, m, d] = key.split('-');
    return `${d}/${m}`;
  }

  function getCellProps(y, m, d) {
    const key = dateKey(y, m, d);
    const dow = new Date(y, m, d).getDay();
    const evList = eventos[key] || [];
    const feriado = FERIADOS_2027[key];

    let bg = 'white';
    let color = undefined;
    let fontWeight = undefined;
    let dotColor = null;

    if (feriado) {
      bg = '#FFF3E0'; color = '#E53935'; fontWeight = 700;
    } else if (evList.length > 0) {
      const cor = evList[0].cor || '#1B5CA8';
      bg = cor + '28';
      dotColor = cor;
      fontWeight = 700;
    } else if (dow === 0 || dow === 6) {
      color = '#9E9E9E';
    }

    return { key, bg, color, fontWeight, dotColor, feriado, evList };
  }

  function getLegendaDoMes(mesIdx) {
    const y = 2027;
    const items = [];
    const seen = new Set();

    Object.keys(FERIADOS_2027).forEach(k => {
      const [ky, km] = k.split('-');
      if (parseInt(ky) === y && parseInt(km) - 1 === mesIdx) {
        const key = '#E53935|Feriado';
        if (!seen.has(key)) { seen.add(key); items.push({ cor: '#E53935', nome: 'Feriado', data: k }); }
      }
    });

    Object.keys(eventos).forEach(k => {
      const [ky, km] = k.split('-');
      if (parseInt(ky) === y && parseInt(km) - 1 === mesIdx) {
        eventos[k].forEach(ev => {
          const cor = ev.cor || '#1B5CA8';
          const key = `${cor}|${ev.nome}`;
          if (!seen.has(key)) { seen.add(key); items.push({ cor, nome: ev.nome, data: k }); }
        });
      }
    });

    items.sort((a, b) => a.data.localeCompare(b.data));
    return items;
  }

  function handleDayClick(y, m, d) {
    if (!canEdit) return;
    const key = dateKey(y, m, d);
    setClickModal({ date: key, evList: eventos[key] || [] });
    setForm({ nome: '', cor: '#1B5CA8' });
  }

  if (loading) return <Layout title="Calendário 2027"><div className="loading-spinner"><div className="spinner"></div></div></Layout>;

  return (
    <Layout title="Calendário 2027" subtitle="Calendário acadêmico do Colégio São Paulo 2027">
      <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap', fontSize: '12px' }}>
        {[
          { color: '#FFF3E0', label: 'Feriado' },
          { color: '#E3F2FD', label: 'Evento/anotação' },
          { color: '#fafafa', label: 'Fim de semana' },
          { color: 'white', label: 'Dia letivo' },
        ].map(l => (
          <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
            <div style={{ width: '14px', height: '14px', background: l.color, border: '1px solid #ddd', borderRadius: '3px' }} />
            <span style={{ color: 'var(--cinza-texto)' }}>{l.label}</span>
          </div>
        ))}
        {canEdit && (
          <span style={{ color: 'var(--cinza-texto)', marginLeft: '8px' }}>
            Clique em qualquer dia para adicionar uma anotação
          </span>
        )}
      </div>

      <div className="calendario-grid">
        {MESES.map((nomeMes, mesIdx) => {
          const y = 2027;
          const dias = getDaysInMonth(y, mesIdx);
          const primeiroDia = getFirstDayOfMonth(y, mesIdx);
          const cells = [];
          for (let i = 0; i < primeiroDia; i++) cells.push(null);
          for (let d = 1; d <= dias; d++) cells.push(d);
          const legenda = getLegendaDoMes(mesIdx);

          return (
            <div className="mes-card" key={nomeMes}>
              <div className="mes-header">
                <span>{nomeMes} 2027</span>
                <span className="mes-header-badge">2027</span>
              </div>
              <div className="mes-days">
                {DIAS.map(d => <div key={d} className="day-name">{d}</div>)}
                {cells.map((d, i) => {
                  if (!d) return <div key={i} className="day-cell empty" />;
                  const { key, bg, color, fontWeight, dotColor, feriado, evList } = getCellProps(y, mesIdx, d);
                  const title = feriado || evList.map(e => e.nome).join(', ') || '';
                  return (
                    <div
                      key={i}
                      className={`day-cell${canEdit ? ' clickable' : ''}`}
                      style={{ background: bg, color, fontWeight }}
                      title={title}
                      onClick={() => handleDayClick(y, mesIdx, d)}
                    >
                      <span className="day-num">{d}</span>
                      {dotColor && <div className="day-dot" style={{ background: dotColor }} />}
                    </div>
                  );
                })}
              </div>

              {legenda.length > 0 && (
                <div className="cal-legenda">
                  {legenda.map((item, i) => (
                    <div key={i} className="cal-legenda-item">
                      <div className="cal-legenda-dot" style={{ background: item.cor }} />
                      <span style={{ color: 'var(--cinza-texto)', marginRight: '3px' }}>{fmtDateBR(item.data)}</span>
                      <span>{item.nome}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {clickModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setClickModal(null)}>
          <div className="modal" style={{ maxWidth: '380px' }}>
            <div className="modal-header">
              <h3>📅 {fmtDateBR(clickModal.date).replace('/', ' de ' + MESES[parseInt(clickModal.date.split('-')[1]) - 1] + ' de ')}</h3>
              <button className="modal-close" onClick={() => setClickModal(null)}>×</button>
            </div>
            <div className="modal-body">
              {clickModal.evList.length > 0 && (
                <div style={{ marginBottom: '16px' }}>
                  <div style={{ fontSize: '12px', fontWeight: 700, marginBottom: '6px', color: 'var(--cinza-texto)' }}>Anotações neste dia:</div>
                  {clickModal.evList.map(ev => (
                    <div key={ev.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '6px 0', borderBottom: '1px solid var(--cinza-medio)' }}>
                      <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: ev.cor || '#1B5CA8', flexShrink: 0 }} />
                      <span style={{ flex: 1, fontSize: '13px' }}>{ev.nome}</span>
                      <button
                        onClick={() => { deleteEvento(ev.id); setClickModal(c => ({ ...c, evList: c.evList.filter(e => e.id !== ev.id) })); }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--vermelho)', fontSize: '14px', padding: '2px' }}
                      >🗑️</button>
                    </div>
                  ))}
                </div>
              )}
              {erroSave && <div className="alert alert-error" style={{ marginBottom: '12px' }}>⚠️ {erroSave}</div>}
              <div className="form-group">
                <label className="form-label">Nova anotação</label>
                <input
                  className="form-control"
                  value={form.nome}
                  onChange={e => setForm(f => ({ ...f, nome: e.target.value }))}
                  placeholder="Ex: Reunião pedagógica, Avaliação..."
                  onKeyDown={e => e.key === 'Enter' && saveEvento()}
                  autoFocus
                />
              </div>
              <div className="form-group">
                <label className="form-label">Cor</label>
                <div className="cor-picker">
                  {CORES.map(c => (
                    <div
                      key={c.value}
                      className={`cor-option${form.cor === c.value ? ' selected' : ''}`}
                      style={{ background: c.value }}
                      title={c.label}
                      onClick={() => setForm(f => ({ ...f, cor: c.value }))}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setClickModal(null)}>Fechar</button>
              <button className="btn btn-primary" onClick={saveEvento} disabled={saving || !form.nome.trim()}>
                {saving ? 'Salvando...' : '✅ Adicionar'}
              </button>
            </div>
          </div>
        </div>
      )}
    </Layout>
  );
}
