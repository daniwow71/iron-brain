-- ============================================================
-- Migración: Crear tabla profiles
-- ============================================================
-- Tabla de perfiles de usuario para Iron Brain. Cada fila se
-- corresponde con un registro de auth.users gestionado por
-- Supabase Auth, enriquecido con datos propios de la aplicación
-- (rol, departamento, teléfono).
--
-- Diseño:
-- - id (UUID) es a la vez clave primaria y clave foránea a auth.users(id)
--   con eliminación en cascada: si se elimina el usuario, su perfil
--   desaparece automáticamente.
-- - email se replica desde auth.users para simplificar consultas y
--   se mantiene sincronizado mediante trigger.
-- - role se valida con CHECK contra los dos valores permitidos en
--   esta fase (admin, user). Se ampliará en migraciones futuras
--   cuando aparezcan los megadashboards específicos por departamento.
-- - phone es opcional y se valida con expresión regular permisiva.
--   Caso de uso: directorio interno de empleados.
--
-- Triggers:
-- - on_auth_user_created: crea automáticamente el perfil al registrarse
--   un nuevo usuario. La lógica de inserción vive en la base de datos
--   para garantizar consistencia.
-- - on_auth_user_email_change: sincroniza el email replicado en profiles
--   cuando se modifica en auth.users.
--
-- Seguridad: Row Level Security activo. Los autenticados pueden leer
-- todos los perfiles (directorio interno). Cada usuario solo puede
-- modificar su propio perfil, excepto el rol. Los admins pueden
-- modificar cualquier perfil incluyendo el rol.
-- ============================================================

CREATE TABLE public.profiles (
    id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email       TEXT NOT NULL UNIQUE,
    full_name   TEXT,
    avatar_url  TEXT,
    role        TEXT NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'user')),
    department  TEXT,
    phone       TEXT CHECK (phone IS NULL OR phone ~ '^\+?[0-9 ()\-]{7,20}$'),
    created_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.profiles IS
    'Perfiles de usuario de Iron Brain, vinculados 1:1 con auth.users.';

COMMENT ON COLUMN public.profiles.id IS
    'Clave primaria. Coincide con el id en auth.users.';

COMMENT ON COLUMN public.profiles.email IS
    'Email del usuario, replicado desde auth.users y mantenido sincronizado por trigger.';

COMMENT ON COLUMN public.profiles.full_name IS
    'Nombre completo del usuario, obtenido de los metadatos del proveedor OAuth.';

COMMENT ON COLUMN public.profiles.avatar_url IS
    'URL de la foto de perfil, obtenida del proveedor OAuth.';

COMMENT ON COLUMN public.profiles.role IS
    'Rol funcional del usuario en Iron Brain. Valores actuales: admin, user.';

COMMENT ON COLUMN public.profiles.department IS
    'Departamento al que pertenece el usuario en TodoCESPED.';

COMMENT ON COLUMN public.profiles.phone IS
    'Telefono de contacto opcional para directorio interno. '
    'Se valida con expresion regular permisiva.';

COMMENT ON COLUMN public.profiles.created_at IS
    'Fecha de creación del perfil con zona horaria.';

COMMENT ON COLUMN public.profiles.updated_at IS
    'Fecha de última modificación del perfil con zona horaria.';

-- ============================================================
-- Índices
-- ============================================================
-- Índice por role: consultas tipo "todos los admins".
CREATE INDEX idx_profiles_role
    ON public.profiles (role);

-- Índice por department: consultas tipo "todos los del departamento de ventas".
CREATE INDEX idx_profiles_department
    ON public.profiles (department);

-- ============================================================
-- Trigger: actualización automática de updated_at
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.set_updated_at() IS
    'Actualiza updated_at automaticamente en cada UPDATE.';

CREATE TRIGGER trg_profiles_set_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW
    EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- Trigger: creación automática de perfil al registrarse usuario
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    INSERT INTO public.profiles (id, email, full_name, avatar_url, role)
    VALUES (
        NEW.id,
        NEW.email,
        NEW.raw_user_meta_data->>'full_name',
        NEW.raw_user_meta_data->>'avatar_url',
        'user'
    );
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_new_user() IS
    'Crea automaticamente un registro en profiles cuando un usuario se registra. '
    'Se ejecuta con SECURITY DEFINER para tener permisos de INSERT en profiles.';

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- Trigger: sincronización del email cuando cambia en auth.users
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_user_email_change()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
    IF OLD.email IS DISTINCT FROM NEW.email THEN
        UPDATE public.profiles
        SET email = NEW.email
        WHERE id = NEW.id;
    END IF;
    RETURN NEW;
END;
$$;

COMMENT ON FUNCTION public.handle_user_email_change() IS
    'Sincroniza el email replicado en profiles cuando cambia en auth.users.';

CREATE TRIGGER on_auth_user_email_change
    AFTER UPDATE OF email ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION public.handle_user_email_change();

-- ============================================================
-- Función auxiliar: comprobar si el usuario actual es admin
-- ============================================================
-- Esta función se utiliza dentro de las políticas RLS para evitar
-- recursión infinita. Si una política de profiles consulta profiles
-- directamente, RLS se aplica recursivamente y entra en bucle.
-- Con SECURITY DEFINER, la función bypasea RLS y consulta directamente.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
    SELECT EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'admin'
    );
$$;

COMMENT ON FUNCTION public.is_admin() IS
    'Devuelve TRUE si el usuario autenticado tiene rol admin. '
    'Usa SECURITY DEFINER para evitar recursion en politicas RLS.';

-- ============================================================
-- Row Level Security
-- ============================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Lectura: cualquier usuario autenticado puede leer todos los perfiles.
-- Caso de uso: directorio interno de empleados.
CREATE POLICY "authenticated_can_read_all_profiles"
ON public.profiles
FOR SELECT
TO authenticated
USING (true);

-- Modificación del propio perfil: cualquier usuario autenticado puede
-- modificar SU propio perfil, EXCEPTO el campo role (no puede auto-promocionarse).
CREATE POLICY "users_can_update_own_profile_except_role"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
    auth.uid() = id
    AND role = (SELECT role FROM public.profiles WHERE id = auth.uid())
);

-- Modificación por admins: los admins pueden modificar cualquier perfil
-- incluyendo el campo role (promocionar/degradar a otros usuarios).
CREATE POLICY "admins_can_update_any_profile"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.is_admin())
WITH CHECK (public.is_admin());

-- ============================================================
-- Permisos del esquema
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.profiles TO service_role;
GRANT SELECT, UPDATE ON public.profiles TO authenticated;