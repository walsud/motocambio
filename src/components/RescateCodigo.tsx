"use client";
import { useEffect } from "react";

// Red de seguridad: si un código de recuperación de contraseña cae
// perdido en la página de inicio (por ejemplo, por una redirección mal
// configurada), lo reenviamos a la página correcta con el código intacto.
export function RescateCodigo() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.has("code")) {
      window.location.replace("/recuperar" + window.location.search);
    }
  }, []);
  return null;
}
