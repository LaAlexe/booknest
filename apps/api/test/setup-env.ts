process.env.DATABASE_URL ??=
  'postgresql://booknest:booknest@localhost:5432/booknest?schema=public';
process.env.AWS_REGION ??= 'eu-central-1';
process.env.S3_BUCKET_NAME ??= 'booknest-test-covers';
