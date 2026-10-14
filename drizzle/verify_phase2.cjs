require('dotenv').config({ path: '.env.local' });
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

(async () => {
  const cols = await sql.query("select column_name, data_type, udt_name from information_schema.columns where table_schema='public' and table_name='properties' order by ordinal_position");
  const idx = await sql.query("select indexname, indexdef from pg_indexes where schemaname='public' and tablename='properties' order by indexname");
  const cons = await sql.query("select conname, pg_get_constraintdef(oid) as def from pg_constraint where conrelid = 'public.properties'::regclass order by conname");
  const enums = await sql.query("select t.typname as enum_name, e.enumlabel as value from pg_type t join pg_enum e on t.oid=e.enumtypid join pg_namespace n on n.oid=t.typnamespace where n.nspname='public' and t.typname in ('property_source','property_kind','publish_status','development_stage') order by t.typname, e.enumsortorder");
  console.log(JSON.stringify({ cols, idx, cons, enums }, null, 2));
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
