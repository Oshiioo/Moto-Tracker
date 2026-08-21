import { useState } from "react";
import Field from "../ui/Field";
import { inputStyle, submitStyle } from "../../theme/palette";
import { EXTRA_KNOWN_TYPES } from "../../lib/typeNormalization";

export default function MaintenanceForm({ onSubmit, defaultKm, rules, initial }) {
  const pickerTypes = rules.filter((r) => !r.hideFromPicker).map((r) => r.name);
  const visibleTypes = [...pickerTypes, ...EXTRA_KNOWN_TYPES.filter((t) => !pickerTypes.includes(t))];
  const [form, setForm] = useState(
    initial
      ? { date: initial.date, km: initial.km, type: initial.type, note: initial.note ?? "", cost: initial.cost ?? "" }
      : { date: new Date().toISOString().slice(0, 10), km: defaultKm || "", type: pickerTypes[0] || "", note: "", cost: "" },
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.km || !form.type) return;
        onSubmit(form);
      }}
    >
      <Field label="Type d'entretien">
        <input
          style={inputStyle}
          type="text"
          list="maint-types"
          value={form.type}
          onChange={(e) => setForm({ ...form, type: e.target.value })}
        />
        <datalist id="maint-types">
          {visibleTypes.map((t) => (
            <option key={t} value={t} />
          ))}
        </datalist>
      </Field>
      <Field label="Date">
        <input style={inputStyle} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      </Field>
      <Field label="Kilométrage">
        <input style={inputStyle} type="number" placeholder="ex. 12450" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} />
      </Field>
      <Field label="Note — optionnel">
        <input style={inputStyle} type="text" placeholder="ex. huile 10W40, filtre changé" value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} />
      </Field>
      <Field label="Coût (€) — optionnel">
        <input style={inputStyle} type="number" step="0.01" value={form.cost} onChange={(e) => setForm({ ...form, cost: e.target.value })} />
      </Field>
      <button type="submit" style={submitStyle}>{initial ? "Mettre à jour l'entretien" : "Enregistrer l'entretien"}</button>
    </form>
  );
}
