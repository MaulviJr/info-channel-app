function FormInput({
  id,
  label,
  type = 'text',
  autoComplete,
  registerProps,
  error,
  ...props
}) {
  return (
    <div>
      <label className="text-sm font-medium" htmlFor={id}>{label}</label>
      <input
        id={id}
        type={type}
        autoComplete={autoComplete}
        {...registerProps}
        {...props}
        className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2 text-sm"
      />
      {error ? (
        <p className="mt-2 text-xs text-destructive">{error}</p>
      ) : null}
    </div>
  );
}

export default FormInput;
