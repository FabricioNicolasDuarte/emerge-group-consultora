-- Fix: vistas de anuncios deben usar security_invoker para que auth.uid() funcione en filtros por rol
-- Ejecutar en Supabase SQL Editor si los anuncios no aparecen para alumnos/docentes

alter view if exists public.campus_announcements set (security_invoker = true);
alter view if exists public.public_announcements set (security_invoker = true);
