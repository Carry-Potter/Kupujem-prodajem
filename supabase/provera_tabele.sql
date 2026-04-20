-- Pokreni u SQL Editoru POSLE schema.sql.
-- Očekuješ 4 reda u prvom upitu i sve kolone ispod.

-- 1) Da li postoje tabele u šemi public?
select table_name
from information_schema.tables
where table_schema = 'public'
  and table_name in ('users', 'alerts', 'ads', 'matches')
order by table_name;

-- 2) Sve kolone po tabeli (redosled kao u kodu aplikacije)
select
  c.table_name,
  c.column_name,
  c.data_type,
  c.is_nullable,
  c.column_default
from information_schema.columns c
where c.table_schema = 'public'
  and c.table_name in ('users', 'alerts', 'ads', 'matches')
order by c.table_name, c.ordinal_position;
