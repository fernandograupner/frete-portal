# Importa schema.sql usando o cliente mysql (.exe).
# Uso (PowerShell, na pasta database):
#   .\importar-schema.ps1
# Ou com usuário/host:
#   .\importar-schema.ps1 -Usuario root -Host 127.0.0.1

param(
  [string]$Usuario = "root",
  [string]$Host = "127.0.0.1"
)

$ErroAoExecutar = $false
$MysqlExe = $null

$Cmd = Get-Command mysql.exe -ErrorAction SilentlyContinue
if ($Cmd) {
  $MysqlExe = $Cmd.Source
}

if (-not $MysqlExe) {
  $Candidatos = @(
    "C:\xampp\mysql\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql9.1.0\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql8.4.0\bin\mysql.exe",
    "C:\wamp64\bin\mysql\mysql8.0.37\bin\mysql.exe",
    "C:\laragon\bin\mysql\mysql-8.4.3\bin\mysql.exe",
    "${env:ProgramFiles}\MySQL\MySQL Server 8.4\bin\mysql.exe",
    "${env:ProgramFiles}\MySQL\MySQL Server 8.0\bin\mysql.exe",
    "${env:ProgramFiles(x86)}\MySQL\MySQL Server 8.0\bin\mysql.exe"
  )
  foreach ($P in $Candidatos) {
    if ($P -and (Test-Path -LiteralPath $P)) {
      $MysqlExe = $P
      break
    }
  }
}

if (-not $MysqlExe) {
  Write-Host ""
  Write-Host "Cliente MySQL (mysql.exe) nao encontrado no PATH nem nas pastas comuns." -ForegroundColor Red
  Write-Host ""
  Write-Host "Opcoes:"
  Write-Host "  1) Adicione a pasta BIN do MySQL ao PATH do Windows e rode este script de novo."
  Write-Host "  2) XAMPP: normalmente em C:\xampp\mysql\bin\mysql.exe"
  Write-Host "  3) Use Docker na raiz do projeto: docker compose up -d"
  Write-Host ""
  Write-Host "No Workbench: File -> Open SQL Script -> schema.sql -> executar." -ForegroundColor Cyan
  exit 1
}

$SchemaPath = Join-Path $PSScriptRoot "schema.sql"
if (-not (Test-Path -LiteralPath $SchemaPath)) {
  Write-Error "Arquivo nao encontrado: $SchemaPath"
  exit 1
}

Write-Host "Usando: $MysqlExe" -ForegroundColor Green
Write-Host "Schema: $SchemaPath"
Write-Host "Conectando em $Usuario@$Host (vai pedir a senha)..." -ForegroundColor Yellow
Write-Host ""

Get-Content -LiteralPath $SchemaPath -Encoding UTF8 -Raw | & $MysqlExe -h $Host -u $Usuario -p
if ($LASTEXITCODE -ne 0) {
  Write-Host ""
  Write-Host "mysql terminou com codigo $LASTEXITCODE. Confira usuario/senha e se o servidor MySQL esta rodando." -ForegroundColor Red
  exit $LASTEXITCODE
}

Write-Host ""
Write-Host "Schema importado com sucesso." -ForegroundColor Green
