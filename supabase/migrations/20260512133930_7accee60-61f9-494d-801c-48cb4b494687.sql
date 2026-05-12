
INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'super_admin'::app_role
FROM auth.users u
WHERE LOWER(u.email) = 'adamsproject91@gmail.com'
ON CONFLICT DO NOTHING;

INSERT INTO public.user_roles (user_id, role)
SELECT u.id, 'content_admin'::app_role
FROM auth.users u
WHERE LOWER(u.email) = 'jihadnasr042@gmail.com'
ON CONFLICT DO NOTHING;
