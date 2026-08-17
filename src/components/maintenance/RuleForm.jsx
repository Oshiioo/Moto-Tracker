import { useState } from "react";
import Field from "../ui/Field";
import { PALETTE, FONT_BODY, inputStyle, submitStyle } from "../../theme/palette";

export default function RuleForm({ onSubmit }) {
  const [form, setForm] = useState({ name: "", intervalKm: "", intervalMonths: "" });
  const canSubmit = form.name && (form.intervalKm || form.intervalMonths);
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSubmit) return;
        onSubmit({
          name: form.name,
          intervalKm: form.intervalKm ? Number(form.intervalKm) : undefined,
          intervalMonths: form.intervalMonths ? Number(form.intervalMonths) : undefined,
        });
      }}
    >
      <Field label="Nom">
        <input style={inputStyle} type="text" placeholder="ex. Liquide de frein" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
      </Field>
      <Field label="Intervalle en kilomètres — optionnel">
        <input style={inputStyle} type="number" placeholder="ex. 20000" value={form.intervalKm} onChange={(e) => setForm({ ...form, intervalKm: e.target.value })} />
      </Field>
      <Field label="Intervalle en mois — optionnel">
        <input style={inputStyle} type="number" placeholder="ex. 24" value={form.intervalMonths} onChange={(e) => setForm({ ...form, intervalMonths: e.target.value })} />
      </Field>
      <div style={{ fontFamily: FONT_BODY, fontSize: 11, color: PALETTE.textMuted }} className="mb-2">
        Renseigne au moins un des deux. L'alerte se déclenchera sur celui qui arrive en premier.
      </div>
      <button type="submit" style={submitStyle} disabled={!canSubmit}>Ajouter</button>
    </form>
  );
}
