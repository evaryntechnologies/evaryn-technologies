$ErrorActionPreference = "Stop"
$schemaPath = Join-Path (Get-Location).Path "prisma\schema.prisma"
if (-not (Test-Path -LiteralPath $schemaPath)) { throw "prisma/schema.prisma missing" }
$schema = [IO.File]::ReadAllText($schemaPath)
if ($schema -notmatch '(?m)^model EmployeeProfile\s*\{' -or $schema -notmatch '(?m)^model WorkTask\s*\{') {throw "Unsupported schema; stop"}
$backup = "$schemaPath.backup-$(Get-Date -Format yyyyMMdd-HHmmss)"
Copy-Item -LiteralPath $schemaPath -Destination $backup
function AddFieldToModel([string]$model,[string]$field,[string]$statement){
  $pattern = '(?m)^(model ' + [regex]::Escape($model) + '\s*\{)'
  if ($script:schema -notmatch '(?m)^\s*' + [regex]::Escape($field) + '\s+') {
    $script:schema = [regex]::Replace($script:schema,$pattern,{param($m) $m.Value + "`n  $statement"},1)
  }
}
AddFieldToModel "EmployeeProfile" "raisedIssues" 'raisedIssues TaskDispute[] @relation("DisputeCreator")'
AddFieldToModel "EmployeeProfile" "resolvedIssues" 'resolvedIssues TaskDispute[] @relation("DisputeResolver")'
AddFieldToModel "EmployeeProfile" "notifications" 'notifications PortalNotification[]'
AddFieldToModel "WorkTask" "disputes" 'disputes TaskDispute[]'
if ($schema -notmatch '(?m)^model TaskDispute\s*\{'){
$schema += @'

model TaskDispute {
  id String @id @default(uuid()) @db.Uuid
  taskId String @db.Uuid
  raisedById String @db.Uuid
  resolvedById String? @db.Uuid
  reason String @db.Text
  resolution String? @db.Text
  status String @default("OPEN")
  createdAt DateTime @default(now())
  resolvedAt DateTime?
  task WorkTask @relation(fields: [taskId], references: [id], onDelete: Restrict)
  raisedBy EmployeeProfile @relation("DisputeCreator", fields: [raisedById], references: [id], onDelete: Restrict)
  resolvedBy EmployeeProfile? @relation("DisputeResolver", fields: [resolvedById], references: [id], onDelete: Restrict)
  @@index([taskId, status])
  @@index([status, createdAt])
}
'@
}
if($schema -notmatch '(?m)^model PortalNotification\s*\{'){
$schema += @'

model PortalNotification {
  id String @id @default(uuid()) @db.Uuid
  recipientId String @db.Uuid
  title String
  body String @db.Text
  href String?
  readAt DateTime?
  createdAt DateTime @default(now())
  recipient EmployeeProfile @relation(fields: [recipientId], references: [id], onDelete: Restrict)
  @@index([recipientId, createdAt])
}
'@
}
$encoding = New-Object System.Text.UTF8Encoding($false)
[IO.File]::WriteAllText($schemaPath,$schema,$encoding)
Write-Host "Schema additions merged. Backup: $backup" -ForegroundColor Green
