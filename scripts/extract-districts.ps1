$ErrorActionPreference = 'Stop'

$files = @(
  'map\\defaults\\parts\\districts-custom.js',
  'map\\defaults\\static-default.js'
)

$districts = @{}

foreach($file in $files){
  if(-not (Test-Path $file)){ continue }
  $lines = Get-Content -LiteralPath $file
  $current = $null
  foreach($line in $lines){
    if($line -match '"id"\s*:\s*"([^"]+)"'){
      $current = $Matches[1]
      if(-not $districts.ContainsKey($current)){
        $districts[$current] = [ordered]@{ id = $current; name = $null; desc = $null; source = (Split-Path $file -Leaf) }
      }
    }
    elseif($line -match '"name"\s*:\s*(null|"([^"]*)")'){
      if($current){
        $val = $Matches[2]
        if($Matches[1] -eq 'null'){ $val = $null }
        $districts[$current]['name'] = $val
      }
    }
    elseif($line -match '"desc"\s*:\s*(null|"([^"]*)")'){
      if($current){
        $val = $Matches[2]
        if($Matches[1] -eq 'null'){ $val = $null }
        $districts[$current]['desc'] = $val
      }
    }
  }
}

# Output to root districts_list.json
$out = @()
foreach($k in ($districts.Keys | Sort-Object)){
  $out += $districts[$k]
}

$json = $out | ConvertTo-Json -Depth 6
Set-Content -LiteralPath 'districts_list.json' -Value $json -Encoding UTF8
Write-Output "Wrote districts_list.json with $($out.Count) entries"

