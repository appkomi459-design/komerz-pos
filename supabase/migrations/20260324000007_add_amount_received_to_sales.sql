-- Migration: Add amount_received and change_given to sales
ALTER TABLE public.sales 
ADD COLUMN IF NOT EXISTS amount_received NUMERIC(12,2) DEFAULT NULL,
ADD COLUMN IF NOT EXISTS change_given NUMERIC(12,2) DEFAULT NULL;
