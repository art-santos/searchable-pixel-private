import type { Config } from 'drizzle-kit';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

export default {
  schema: './src/lib/db/schema.ts',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    connectionString: process.env.NEXT_PUBLIC_SUPABASE_URL!,
  },
} satisfies Config;