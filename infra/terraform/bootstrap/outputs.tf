output "state_bucket_name" {
  value       = aws_s3_bucket.state.id
  description = "S3 bucket name — use as `bucket` in every other stack's backend block."
}

output "lock_table_name" {
  value       = aws_dynamodb_table.lock.name
  description = "DynamoDB table name — use as `dynamodb_table` in every backend block."
}

output "state_kms_key_arn" {
  value       = aws_kms_key.state.arn
  description = "KMS key encrypting the state bucket."
}
