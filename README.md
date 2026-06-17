# Portal Contable — Instrucciones de instalación

## Estructura de archivos

```
contabilidad-app/
├── index.html          ← Hub principal (menú de módulos)
├── banco.html          ← Módulo conciliación bancaria
├── iva.html            ← Módulo conciliación IVA
├── config.js           ← TU configuración (NO subir a GitHub)
├── config.example.js   ← Ejemplo de config (sí subir)
├── .gitignore          ← Protege config.js
└── README.md           ← Este archivo
```

---

## Paso 1 — Configurar

1. Copiá `config.example.js` y renombralo `config.js`
2. Completá los datos:

```js
window.APP_CONFIG = {
  CLAUDE_API_KEY: "sk-ant-xxxxxxxxxxxx",  // Tu API key de Anthropic
  EMPRESA: "Mi Empresa SA",               // Aparece en el header
  SECRET_PATH: "contabilidad-xk7m2p",    // Parte secreta de la URL
};
```

> ⚠️ `config.js` está en `.gitignore` — nunca se sube a GitHub.

---

## Paso 2 — Subir a GitHub

1. Creá un repositorio nuevo en github.com (puede ser privado)
2. Subí todos los archivos **excepto `config.js`**
3. Andá a **Settings → Pages → Branch: main → Save**
4. GitHub te da una URL tipo: `https://tuusuario.github.io/nombre-repo/`

---

## Paso 3 — Acceso privado

La URL secreta funciona así:

- URL pública: `https://tuusuario.github.io/nombre-repo/index.html`
- **Sin** `SECRET_PATH` en la URL → pantalla de acceso denegado
- **Con** `SECRET_PATH`: `https://tuusuario.github.io/nombre-repo/index.html?contabilidad-xk7m2p`

Mandales a las contadoras el link completo con el `?contabilidad-xk7m2p` al final.

---

## Paso 4 — config.js en las computadoras de las contadoras

Como `config.js` no está en GitHub, cada persona que use la app necesita tenerlo localmente. Opciones:

**Opción A (recomendada):** Mandales `config.js` por WhatsApp o mail y que lo pongan en la misma carpeta que los archivos descargados.

**Opción B:** Usarlo directo de la URL de GitHub Pages — en ese caso el `config.js` tiene que estar en el repo (con cuidado de no exponer la API key públicamente si el repo es público).

---

## Módulos disponibles

| Módulo | Archivo | Descripción |
|--------|---------|-------------|
| 🏠 Hub | `index.html` | Menú principal + asistente Claude |
| 🏦 Banco | `banco.html` | Resumen banco vs libro banco |
| 📄 IVA | `iva.html` | Subdiario IVA PDF vs ARCA Excel |
| 🔜 Retenciones | — | Próximamente |

---

## Agregar un módulo nuevo

1. Copiá `banco.html` como base
2. Modificá la lógica de carga y conciliación
3. Agregá la tarjeta en `index.html` (sección `.modules`)
