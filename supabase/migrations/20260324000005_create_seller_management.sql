-- Migration: 20260324000005_create_seller_management.sql
-- Function to create business seller users directly with credentials and assign them to the business

CREATE OR REPLACE FUNCTION public.create_business_seller(
    p_business_id UUID,
    p_email TEXT,
    p_password TEXT,
    p_full_name TEXT,
    p_phone TEXT DEFAULT NULL,
    p_role TEXT DEFAULT 'cashier'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth
AS $$
DECLARE
    v_calling_user_id UUID;
    v_is_owner_or_admin BOOLEAN;
    v_new_user_id UUID;
    v_existing_user_id UUID;
    v_member_id UUID;
    v_encrypted_pw TEXT;
BEGIN
    v_calling_user_id := auth.uid();
    
    -- Verificar permisos del usuario que llama
    IF v_calling_user_id IS NULL THEN
        RAISE EXCEPTION 'No autorizado. Debes iniciar sesión.';
    END IF;

    v_is_owner_or_admin := public.check_is_super_admin(v_calling_user_id) 
        OR public.user_has_business_role(p_business_id, v_calling_user_id, ARRAY['owner', 'admin']);

    IF NOT v_is_owner_or_admin THEN
        RAISE EXCEPTION 'No tienes permisos de Administrador o Propietario para registrar vendedores en este negocio.';
    END IF;

    -- Validar email y password
    IF p_email IS NULL OR length(trim(p_email)) < 3 THEN
        RAISE EXCEPTION 'El correo electrónico no es válido.';
    END IF;

    IF p_password IS NULL OR length(p_password) < 6 THEN
        RAISE EXCEPTION 'La contraseña debe tener al menos 6 caracteres.';
    END IF;

    -- Verificar si el usuario ya existe en auth.users
    SELECT id INTO v_existing_user_id FROM auth.users WHERE lower(email) = lower(trim(p_email));

    IF v_existing_user_id IS NOT NULL THEN
        -- El usuario ya existe en Auth, verificar si ya es miembro de este negocio
        SELECT id INTO v_member_id FROM public.business_members 
        WHERE business_id = p_business_id AND user_id = v_existing_user_id;

        IF v_member_id IS NOT NULL THEN
            -- Reactivar si estaba inactivo y actualizar rol
            UPDATE public.business_members 
            SET is_active = TRUE, role = p_role, updated_at = timezone('utc', now())
            WHERE id = v_member_id;

            -- Actualizar contraseña si se solicitó
            v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));
            UPDATE auth.users 
            SET encrypted_password = v_encrypted_pw, 
                updated_at = timezone('utc', now())
            WHERE id = v_existing_user_id;

            RETURN jsonb_build_object(
                'success', true,
                'user_id', v_existing_user_id,
                'member_id', v_member_id,
                'message', 'Vendedor vinculado y activado exitosamente.'
            );
        ELSE
            -- Asignar a este negocio
            INSERT INTO public.business_members (business_id, user_id, role, is_active)
            VALUES (p_business_id, v_existing_user_id, p_role, TRUE)
            RETURNING id INTO v_member_id;

            -- Actualizar nombre y contraseña
            v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));
            UPDATE auth.users 
            SET encrypted_password = v_encrypted_pw, 
                raw_user_meta_data = jsonb_build_object('full_name', p_full_name, 'phone', p_phone),
                updated_at = timezone('utc', now())
            WHERE id = v_existing_user_id;

            UPDATE public.profiles
            SET full_name = p_full_name
            WHERE id = v_existing_user_id;

            RETURN jsonb_build_object(
                'success', true,
                'user_id', v_existing_user_id,
                'member_id', v_member_id,
                'message', 'Vendedor registrado exitosamente en el negocio.'
            );
        END IF;
    ELSE
        -- Crear nuevo usuario en auth.users
        v_new_user_id := gen_random_uuid();
        v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));

        INSERT INTO auth.users (
            instance_id,
            id,
            aud,
            role,
            email,
            encrypted_password,
            email_confirmed_at,
            raw_app_meta_data,
            raw_user_meta_data,
            is_super_admin,
            created_at,
            updated_at
        )
        VALUES (
            '00000000-0000-0000-0000-000000000000',
            v_new_user_id,
            'authenticated',
            'authenticated',
            lower(trim(p_email)),
            v_encrypted_pw,
            timezone('utc', now()),
            '{"provider":"email","providers":["email"]}'::jsonb,
            jsonb_build_object('full_name', p_full_name, 'phone', p_phone),
            FALSE,
            timezone('utc', now()),
            timezone('utc', now())
        );

        -- Crear identidad para login por email
        INSERT INTO auth.identities (
            id,
            user_id,
            identity_data,
            provider,
            last_sign_in_at,
            created_at,
            updated_at
        )
        VALUES (
            v_new_user_id,
            v_new_user_id,
            jsonb_build_object('sub', v_new_user_id, 'email', lower(trim(p_email))),
            'email',
            timezone('utc', now()),
            timezone('utc', now()),
            timezone('utc', now())
        );

        -- Asegurar perfil
        INSERT INTO public.profiles (id, full_name, email, is_super_admin)
        VALUES (v_new_user_id, p_full_name, lower(trim(p_email)), FALSE)
        ON CONFLICT (id) DO UPDATE 
        SET full_name = EXCLUDED.full_name, email = EXCLUDED.email;

        -- Asignar miembro al negocio
        INSERT INTO public.business_members (business_id, user_id, role, is_active)
        VALUES (p_business_id, v_new_user_id, p_role, TRUE)
        RETURNING id INTO v_member_id;

        RETURN jsonb_build_object(
            'success', true,
            'user_id', v_new_user_id,
            'member_id', v_member_id,
            'message', 'Usuario y vendedor creado exitosamente.'
        );
    END IF;
END;
$$;

CREATE OR REPLACE FUNCTION public.toggle_business_member_status(
    p_member_id UUID,
    p_is_active BOOLEAN
)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    v_calling_user_id UUID;
    v_business_id UUID;
    v_is_owner_or_admin BOOLEAN;
BEGIN
    v_calling_user_id := auth.uid();
    IF v_calling_user_id IS NULL THEN
        RAISE EXCEPTION 'No autorizado.';
    END IF;

    SELECT business_id INTO v_business_id FROM public.business_members WHERE id = p_member_id;
    IF v_business_id IS NULL THEN
        RAISE EXCEPTION 'Miembro no encontrado.';
    END IF;

    v_is_owner_or_admin := public.check_is_super_admin(v_calling_user_id) 
        OR public.user_has_business_role(v_business_id, v_calling_user_id, ARRAY['owner', 'admin']);

    IF NOT v_is_owner_or_admin THEN
        RAISE EXCEPTION 'No tienes permisos para modificar miembros.';
    END IF;

    UPDATE public.business_members 
    SET is_active = p_is_active, updated_at = timezone('utc', now())
    WHERE id = p_member_id;

    RETURN TRUE;
END;
$$;
