import { useState } from "react";
import Field from "../ui/Field";
import { inputStyle, submitStyle } from "../../theme/palette";

export default function FuelForm({ onSubmit, defaultKm }) {
  const [form, setForm] = useState({ date: new Date().toISOString().slice(0, 10), km: defaultKm || "", liters: "", price: "" });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!form.km || !form.liters) return;
        onSubmit(form);
      }}
    >
      <Field label="Date">
        <input style={inputStyle} type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} />
      </Field>
      <Field label="Kilométrage">
        <input style={inputStyle} type="number" placeholder="ex. 12450" value={form.km} onChange={(e) => setForm({ ...form, km: e.target.value })} />
      </Field>
      <Field label="Litres">
        <input style={inputStyle} type="number" step="0.01" placeholder="ex. 14.2" value={form.liters} onChange={(e) => setForm({ ...form, liters: e.target.value })} />
      </Field>
      <Field label="Prix total (€) — optionnel">
        <input style={inputStyle} type="number" step="0.01" placeholder="ex. 22.50" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} />
      </Field>
      <button type="submit" style={submitStyle}>Enregistrer le plein</button>
    </form>
  );
}
