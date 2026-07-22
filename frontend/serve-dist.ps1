$ErrorActionPreference = 'Stop'

$root = Join-Path $PSScriptRoot 'dist'
$prefixes = @('http://127.0.0.1:5173/', 'http://localhost:5173/')
$apiBase = 'http://localhost:8080'

if (-not (Test-Path $root)) {
  throw "dist directory not found. Run npm run build first."
}

function Get-MimeType([string]$path) {
  switch ([System.IO.Path]::GetExtension($path).ToLowerInvariant()) {
    '.html' { 'text/html; charset=utf-8' }
    '.js' { 'text/javascript; charset=utf-8' }
    '.css' { 'text/css; charset=utf-8' }
    '.json' { 'application/json; charset=utf-8' }
    '.svg' { 'image/svg+xml' }
    '.png' { 'image/png' }
    '.jpg' { 'image/jpeg' }
    '.jpeg' { 'image/jpeg' }
    '.ico' { 'image/x-icon' }
    default { 'application/octet-stream' }
  }
}

$listener = [System.Net.HttpListener]::new()
foreach ($prefix in $prefixes) {
  $listener.Prefixes.Add($prefix)
}
$listener.Start()
Write-Host "GIS frontend server listening at http://localhost:5173"

$client = [System.Net.Http.HttpClient]::new()

try {
  while ($listener.IsListening) {
    $context = $listener.GetContext()
    $request = $context.Request
    $response = $context.Response

    try {
      if ($request.Url.AbsolutePath.StartsWith('/api/')) {
        $target = $apiBase + $request.Url.PathAndQuery
        $message = [System.Net.Http.HttpRequestMessage]::new([System.Net.Http.HttpMethod]::new($request.HttpMethod), $target)

        foreach ($key in $request.Headers.AllKeys) {
          if ($key -notin @('Host', 'Content-Length')) {
            [void]$message.Headers.TryAddWithoutValidation($key, $request.Headers[$key])
          }
        }

        if ($request.HasEntityBody) {
          $body = [System.IO.MemoryStream]::new()
          $request.InputStream.CopyTo($body)
          $body.Position = 0
          $message.Content = [System.Net.Http.StreamContent]::new($body)
          if ($request.ContentType) {
            $message.Content.Headers.TryAddWithoutValidation('Content-Type', $request.ContentType) | Out-Null
          }
        }

        $apiResponse = $client.SendAsync($message).Result
        $response.StatusCode = [int]$apiResponse.StatusCode
        foreach ($header in $apiResponse.Headers) {
          $response.Headers[$header.Key] = [string]::Join(',', $header.Value)
        }
        foreach ($header in $apiResponse.Content.Headers) {
          if ($header.Key -ne 'Content-Length') {
            $response.Headers[$header.Key] = [string]::Join(',', $header.Value)
          }
        }
        $bytes = $apiResponse.Content.ReadAsByteArrayAsync().Result
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
      } else {
        $relative = [System.Web.HttpUtility]::UrlDecode($request.Url.AbsolutePath.TrimStart('/'))
        if ([string]::IsNullOrWhiteSpace($relative)) {
          $relative = 'index.html'
        }
        $file = Join-Path $root $relative
        if (-not (Test-Path $file) -or (Get-Item $file).PSIsContainer) {
          $file = Join-Path $root 'index.html'
        }

        $bytes = [System.IO.File]::ReadAllBytes($file)
        $response.ContentType = Get-MimeType $file
        $response.ContentLength64 = $bytes.Length
        $response.OutputStream.Write($bytes, 0, $bytes.Length)
      }
    } catch {
      $payload = [System.Text.Encoding]::UTF8.GetBytes($_.Exception.Message)
      $response.StatusCode = 500
      $response.ContentType = 'text/plain; charset=utf-8'
      $response.OutputStream.Write($payload, 0, $payload.Length)
    } finally {
      $response.OutputStream.Close()
    }
  }
} finally {
  $client.Dispose()
  $listener.Stop()
}
