"use client";
import { useState } from "react";

// Campo de contraseña con el ojito para mostrarla u ocultarla
export function CampoPassword({
  value,
  onChange,
  placeholder,
  required = true,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
}) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="relative mt-1">
      <input
        required={required}
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        className="w-full border-2 border-linea rounded-xl px-3.5 py-2.5 pr-12 font-normal outline-none focus:border-rojo"
      />
      <button
        type="button"
        onClick={() => setVisible(!visible)}
        aria-label={visible ? "Ocultar contraseña" : "Ver contraseña"}
        title={visible ? "Ocultar contraseña" : "Ver contraseña"}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-xl leading-none opacity-60 hover:opacity-100 select-none"
      >
        {visible ? "🙈" : "👁️"}
      </button>
    </div>
  );
}
