﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿﻿Add-Type -AssemblyName System.IO.Compression.FileSystem

function Convert-DocxToText {
    param([string]$DocxPath, [string]$OutPath)
    $zip = [System.IO.Compression.ZipFile]::OpenRead($DocxPath)
    $entry = $zip.GetEntry("word/document.xml")
    $reader = New-Object System.IO.StreamReader($entry.Open(), [System.Text.Encoding]::UTF8)
    $xml = $reader.ReadToEnd()
    $reader.Close()
    $zip.Dispose()

    $sb = New-Object System.Text.StringBuilder
    $matches = [regex]::Matches($xml, '<w:p[ >].*?</w:p>', 'Singleline')
    foreach ($m in $matches) {
        $p = $m.Value
        $style = ''
        $sm = [regex]::Match($p, '<w:pStyle w:val="([^"]+)"')
        if ($sm.Success) { $style = $sm.Groups[1].Value }
        $tms = [regex]::Matches($p, '<w:t[^>]*>([^<]*)</w:t>')
        $text = ($tms | ForEach-Object { $_.Groups[1].Value }) -join ''
        if ($style -ne '' -or $text.Trim() -ne '') {
            [void]$sb.AppendLine("[$style] " + $text)
        }
    }
    $enc = New-Object System.Text.UTF8Encoding($true)
    [System.IO.File]::WriteAllText($OutPath, $sb.ToString(), $enc)
}

$dir = "C:\Users\云\Documents\trae_projects\plant\_tmp"
if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir | Out-Null }

Convert-DocxToText "C:\Users\云\Desktop\电厂数字孪生\设计报告\数字电站功能模块研发-HSE-目标管理系统详细设计报告.docx" "$dir\hse_template.txt"
Convert-DocxToText "C:\Users\云\Desktop\电厂数字孪生\需求报告\乌江渡水电站数字孪生管理平台详细需求报告.docx" "$dir\wjd_requirements.txt"
Write-Output "DONE"
