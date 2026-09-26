# Credenciales locales (NO subir a git)

## Alta de alumnos (emails / contraseñas)

1. Copiá la plantilla:
   ```
   copy credentials\alumnos.example.csv credentials\alumnos.local.csv
   ```
2. Editá `alumnos.local.csv` (emails reales; password vacío = se genera sola).
3. Corré:
   ```
   npm run alumnos:provision
   npm run alumnos:provision -- --course-slug=diplomatura-gestion-liderazgo
   ```
4. Abrí `credentials/credenciales-generadas.local.csv` y pasales email + password.

También: Admin → Solicitudes → Importar Excel → Crear listos → Descargar CSV.

## Auth URL Configuration (Site URL / Redirects)

La `SUPABASE_SERVICE_ROLE_KEY` **no alcanza** para esto: hace falta un Access Token personal.

1. Generá uno en https://supabase.com/dashboard/account/tokens
2. Pegalo en `.env`:
   ```
   SUPABASE_ACCESS_TOKEN=sbp_xxxxx
   ```
3. Corré:
   ```
   npm run supabase:auth-urls
   ```

Sin token, el script imprime los valores para pegarlos a mano en Authentication → URL Configuration.
