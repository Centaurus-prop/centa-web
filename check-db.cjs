const { neon } = require('@neondatabase/serverless');
const sql = neon('postgresql://neondb_owner:npg_IJR70WzwgFqe@ep-soft-dew-anjf2w84-pooler.c-6.us-east-1.aws.neon.tech/neondb?channel_binding=require&sslmode=require');
(async () => {
  const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
  console.log('Tables:', tables.map(x => x.table_name).join(', '));
  const users = await sql`SELECT email, role FROM users LIMIT 5`;
  console.log('Users:', JSON.stringify(users));
})().catch(e => console.log('Error:', e.message));
