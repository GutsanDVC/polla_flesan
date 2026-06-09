-- 004_add_payment_fields.sql
-- Agrega campos de pago y comprobante para auditoría de inscripciones
-- Ejecutar DESPUÉS de 003_alter_matches.sql

ALTER TABLE users
    ADD COLUMN IF NOT EXISTS payment_status VARCHAR(50) DEFAULT 'UNPAID',
    ADD COLUMN IF NOT EXISTS payment_receipt_url TEXT;
