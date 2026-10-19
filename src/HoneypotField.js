export default function HoneypotField({ value = "", onChange }) {
  return (
    <div aria-hidden="true" style={{ display: "none" }}>
      <label>
        Sitio web de la empresa
        <input name="company_website" type="text" autoComplete="off" tabIndex={-1} value={value} onChange={event => onChange(event.target.value)} />
      </label>
    </div>
  );
}
