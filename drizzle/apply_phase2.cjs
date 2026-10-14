require('dotenv').config({ path: '.env.local' });
const fs = require('fs');
const path = require('path');
const { neon } = require('@neondatabase/serverless');
const sql = neon(process.env.DATABASE_URL);

const raw = fs.readFileSync(path.join(__dirname, '0001_phase2_property_schema.sql'), 'utf8');
const statements = raw
  .split('--> statement-breakpoint')
  .map((s) => s.trim())
  .filter(Boolean);

(async () => {
  for (const statement of statements) {
    console.log('APPLYING:', statement.replace(/\s+/g, ' ').slice(0, 160));
    await sql.query(statement);
  }
  console.log('DONE');
})().catch((e) => {
  console.error('APPLY_FAILED');
  console.error(e);
  process.exit(1);
});
