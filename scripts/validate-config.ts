import { siteConfigSchema, siteConfigValues } from '../config/site';

const result = siteConfigSchema.safeParse(siteConfigValues);

if (!result.success) {
  console.error('Configuration validation failed for config/site.ts');
  for (const issue of result.error.issues) {
    const path = issue.path.join('.') || '(root)';
    console.error(`- ${path}: ${issue.message}`);
  }
  process.exit(1);
}

console.log('Configuration validation passed.');
