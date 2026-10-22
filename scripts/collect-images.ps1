param(
    [switch]$MetadataOnly,
    [switch]$Publish,
    [int[]]$Numbers = @(),
    [string[]]$ResearchCategories = @(),
    [string]$ResearchPath = '',
    [string]$ResearchSearch = ''
)

# Operational media collector. It never invokes the application or a test runner.
# Add manually identified Commons file titles to data/media-sources.json first.
$ErrorActionPreference = 'Stop'
if ($MetadataOnly -and $Publish) {
    throw 'MetadataOnly and Publish cannot be combined. Inspect metadata first, then publish in a separate media collection run.'
}
Add-Type -AssemblyName System.Net.Http
Add-Type -AssemblyName System.Drawing
$baseDir = Split-Path -Parent $PSScriptRoot
$sourcesPath = Join-Path $baseDir 'data/media-sources.json'
$utf8 = [System.Text.UTF8Encoding]::new($false)
$client = [System.Net.Http.HttpClient]::new()
$client.Timeout = [TimeSpan]::FromSeconds(60)
$client.DefaultRequestHeaders.UserAgent.ParseAdd('KarakalpakTourismMediaCurator/1.0 (manually matched Wikimedia Commons photographs)')

function Set-Field($Object, [string]$Name, $Value) {
    $Object | Add-Member -NotePropertyName $Name -NotePropertyValue $Value -Force
}
function Save-Json([string]$Path, $Value) {
    $temp = $Path + '.media-tmp'
    [IO.File]::WriteAllText($temp, ($Value | ConvertTo-Json -Depth 30), $utf8)
    Move-Item -LiteralPath $temp -Destination $Path -Force
}
function Plain($Value) {
    if (-not $Value) { return '' }
    return [Net.WebUtility]::HtmlDecode(([string]$Value -replace '<[^>]+>', ' ')) -replace '\s+', ' '
}
function Read-Https([string]$Url) {
    $uri = [Uri]$Url
    if ($uri.Scheme -ne 'https' -or $uri.Host -notin @('commons.wikimedia.org', 'upload.wikimedia.org', 'thumb.wikimedia.org')) {
        throw 'Only Wikimedia HTTPS sources are accepted.'
    }
    for ($attempt = 0; $attempt -lt 3; $attempt++) {
        $response = $client.GetAsync($uri).GetAwaiter().GetResult()
        if ([int]$response.StatusCode -in @(429,503) -and $attempt -lt 2) {
            $response.Dispose()
            Start-Sleep -Seconds (3 * ($attempt + 1))
            continue
        }
        $response.EnsureSuccessStatusCode() | Out-Null
        break
    }
    if ($response.RequestMessage.RequestUri.Scheme -ne 'https') { throw 'Non-HTTPS redirect rejected.' }
    return $response
}
function Get-CommonsInfo([string]$Title) {
    if ($script:metadataCache.ContainsKey($Title)) { return $script:metadataCache[$Title] }
    if ($script:metadataBatchAttempted) { throw ('Commons file not found in metadata batch: ' + $Title) }
    $query = 'https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url%7Csize%7Cextmetadata&iiurlwidth=1200&format=json&formatversion=2&redirects=1&titles=' + [Uri]::EscapeDataString('File:' + $Title)
    $response = Read-Https $query
    try { $payload = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json }
    finally { $response.Dispose() }
    $page = @($payload.query.pages)[0]
    if (-not $page.imageinfo) { throw ('Commons file not found: ' + $Title) }
    return $page.imageinfo[0]
}
function Free-License($Metadata) {
    $label = (Plain $Metadata.LicenseShortName.value).Trim()
    $url = (Plain $Metadata.LicenseUrl.value).Trim() -replace '^http:', 'https:'
    if ($label -match '(?i)(noncommercial|no derivatives|BY-NC|BY-ND|BY-SA-NC)') { return $false }
    if ($label -match '^(?i)(CC0|Public domain|PD)' -or $url -match '^https://creativecommons.org/publicdomain/(zero|mark)/') { return $true }
    return $label -match '^(?i)CC BY(-SA)?( [0-9.]+)?$' -and $url -match '^https://creativecommons.org/licenses/by(-sa)?/[0-9.]+(/|$)'
}
function Write-ScaledJpeg([Drawing.Image]$Image, [string]$Destination, [int]$MaxWidth, [long]$Quality) {
    $scale = [Math]::Min(1.0, $MaxWidth / [double]$Image.Width)
    $width = [Math]::Max(1, [int][Math]::Round($Image.Width * $scale))
    $height = [Math]::Max(1, [int][Math]::Round($Image.Height * $scale))
    $bitmap = [Drawing.Bitmap]::new($width, $height)
    $graphics = [Drawing.Graphics]::FromImage($bitmap)
    try {
        $graphics.Clear([Drawing.Color]::White)
        $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.DrawImage($Image, 0, 0, $width, $height)
        $codec = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
        $parameters = [Drawing.Imaging.EncoderParameters]::new(1)
        $parameters.Param[0] = [Drawing.Imaging.EncoderParameter]::new([Drawing.Imaging.Encoder]::Quality, $Quality)
        $temporary = $Destination + '.media-tmp'
        [IO.Directory]::CreateDirectory((Split-Path -Parent $Destination)) | Out-Null
        $bitmap.Save($temporary, $codec, $parameters)
        Move-Item -LiteralPath $temporary -Destination $Destination -Force
        $parameters.Dispose()
    } finally { $graphics.Dispose(); $bitmap.Dispose() }
}

$records = Get-Content -LiteralPath $sourcesPath -Encoding UTF8 -Raw | ConvertFrom-Json
$script:metadataCache = @{}
$script:metadataBatchAttempted = $false
try {
    if ($ResearchSearch) {
        if (-not $ResearchPath) { throw 'ResearchPath is required for search research.' }
        $query = 'https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrnamespace=6&gsrlimit=50&prop=imageinfo&iiprop=url%7Csize%7Cextmetadata&iiurlwidth=1200&format=json&formatversion=2&gsrsearch=' + [Uri]::EscapeDataString($ResearchSearch)
        $response = Read-Https $query
        try { $payload = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json }
        finally { $response.Dispose() }
        Save-Json $ResearchPath $payload
        Write-Output ('Search returned ' + @($payload.query.pages).Count + ' candidate files; inspect before selecting.')
        return
    }
    if ($ResearchCategories.Count -gt 0) {
        if (-not $ResearchPath) { throw 'ResearchPath is required for category research.' }
        $research = [ordered]@{}
        foreach ($category in $ResearchCategories) {
            $query = 'https://commons.wikimedia.org/w/api.php?action=query&generator=categorymembers&gcmtype=file&gcmlimit=50&prop=imageinfo&iiprop=url%7Csize%7Cextmetadata&iiurlwidth=1200&format=json&formatversion=2&gcmtitle=' + [Uri]::EscapeDataString('Category:' + $category)
            $response = Read-Https $query
            try { $payload = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json }
            finally { $response.Dispose() }
            $research[$category] = $payload.query.pages
            Write-Output ('Category ' + $category + ': ' + @($payload.query.pages).Count + ' files.')
            Save-Json $ResearchPath $research
            Start-Sleep -Milliseconds 1500
        }
        return
    }
    $pendingTitles = @($records | Where-Object { (-not $_.metadata -or $_.status -eq 'metadata_pending') -and ($Numbers.Count -eq 0 -or [int]$_.number -in $Numbers) } | ForEach-Object title | Select-Object -Unique)
    for ($offset = 0; $offset -lt $pendingTitles.Count; $offset += 50) {
        $last = [Math]::Min($offset + 49, $pendingTitles.Count - 1)
        $titles = ($pendingTitles[$offset..$last] | ForEach-Object { 'File:' + $_ }) -join '|'
        $query = 'https://commons.wikimedia.org/w/api.php?action=query&prop=imageinfo&iiprop=url%7Csize%7Cextmetadata&iiurlwidth=1200&format=json&formatversion=2&redirects=1&titles=' + [Uri]::EscapeDataString($titles)
        $response = Read-Https $query
        try { $payload = $response.Content.ReadAsStringAsync().GetAwaiter().GetResult() | ConvertFrom-Json }
        finally { $response.Dispose() }
        foreach ($page in $payload.query.pages) {
            if ($page.imageinfo) { $script:metadataCache[($page.title -replace '^File:','')] = $page.imageinfo[0] }
        }
        foreach ($redirect in $payload.query.redirects) {
            $resolved = $redirect.to -replace '^File:',''
            if ($script:metadataCache.ContainsKey($resolved)) { $script:metadataCache[($redirect.from -replace '^File:','')] = $script:metadataCache[$resolved] }
        }
        Write-Output ('Retrieved metadata for ' + $script:metadataCache.Count + ' Commons files.')
        Start-Sleep -Milliseconds 1100
    }
    $script:metadataBatchAttempted = $true
    foreach ($record in $records) {
        if ($Numbers.Count -gt 0 -and [int]$record.number -notin $Numbers) { continue }
        # Non-Commons sources have separately reviewed publisher grants. Do not
        # demote them or reinterpret a custom licence using the Commons parser.
        if ($record.sourceType -and $record.sourceType -ne 'wikimedia_commons') { continue }
        if (-not $MetadataOnly -and $record.status -eq 'ready' -and $record.thumbnail -and (Test-Path -LiteralPath (Join-Path $baseDir $record.thumbnail))) { continue }
        try {
            if (-not $record.metadata -or $record.status -eq 'metadata_pending') {
                $info = Get-CommonsInfo $record.title
                $md = $info.extmetadata
                Set-Field $record 'metadata' ([pscustomobject]@{
                    author = (Plain $md.Artist.value).Trim()
                    credit = (Plain $md.Credit.value).Trim()
                    license = (Plain $md.LicenseShortName.value).Trim()
                    licenseUrl = ((Plain $md.LicenseUrl.value).Trim() -replace '^http:', 'https:')
                    sourceUrl = $info.descriptionurl
                    description = (Plain $md.ImageDescription.value).Trim()
                    categories = $md.Categories.value
                    latitude = $md.GPSLatitude.value
                    longitude = $md.GPSLongitude.value
                    width = $info.width
                    height = $info.height
                    downloadUrl = $(if ($info.thumburl) { $info.thumburl } else { $info.url })
                    licenseVerified = [bool](Free-License $md)
                    retrievedAt = [DateTime]::UtcNow.ToString('o')
                })
            }
            if ($record.metadata) {
                $mdForLicense = [pscustomobject]@{LicenseShortName=[pscustomobject]@{value=$record.metadata.license};LicenseUrl=[pscustomobject]@{value=$record.metadata.licenseUrl}}
                Set-Field $record.metadata 'licenseVerified' ([bool](Free-License $mdForLicense))
            }
            if (-not $record.metadata.licenseVerified) {
                Set-Field $record 'status' 'license_review_required'
                continue
            }
            if ($MetadataOnly) {
                # Metadata review must not demote an already downloaded, successful image.
                if ($record.status -ne 'ready') { Set-Field $record 'status' 'metadata_verified' }
                continue
            }
            $local = Join-Path $baseDir $record.src
            if (-not (Test-Path -LiteralPath $local)) {
                $response = Read-Https $record.metadata.downloadUrl
                try {
                    if (-not $response.Content.Headers.ContentType.MediaType.StartsWith('image/')) { throw 'Response is not an image.' }
                    $bytes = $response.Content.ReadAsByteArrayAsync().GetAwaiter().GetResult()
                } finally { $response.Dispose() }
                if ($bytes.Length -gt 35MB) { throw 'Image exceeds 35 MiB.' }
                $stream = [IO.MemoryStream]::new($bytes, $false)
                $image = [Drawing.Image]::FromStream($stream, $true, $true)
                try {
                    if ($image.Width -lt 180 -or $image.Height -lt 180) { throw 'Image dimensions require manual review.' }
                    Write-ScaledJpeg $image $local 1200 88
                } finally { $image.Dispose(); $stream.Dispose() }
                Start-Sleep -Milliseconds 1200
            }
            $image = [Drawing.Image]::FromFile($local)
            try {
                $stem = [IO.Path]::GetFileNameWithoutExtension($local)
                $thumbnail = 'assets/images/destinations/thumbnails/' + $stem + '-480.jpg'
                Write-ScaledJpeg $image (Join-Path $baseDir $thumbnail) 480 83
                Set-Field $record 'thumbnail' $thumbnail
                Set-Field $record 'width' $image.Width
                Set-Field $record 'height' $image.Height
            } finally { $image.Dispose() }
            Set-Field $record 'status' 'ready'
            Set-Field $record 'error' $null
            Write-Output ('Ready [' + $record.number + ']: ' + $record.title)
        } catch {
            Set-Field $record 'error' $_.Exception.Message
            if ($record.status -ne 'ready') { Set-Field $record 'status' 'retry_pending' }
            Write-Warning ('Preserved [' + $record.number + ']: ' + $_.Exception.Message)
        }
        Save-Json $sourcesPath $records
    }
    Save-Json $sourcesPath $records
    if ($Publish) {
        $destinationsPath = Join-Path $baseDir 'data/destinations.json'
        $destinations = Get-Content -LiteralPath $destinationsPath -Encoding UTF8 -Raw | ConvertFrom-Json
        $attributions = [ordered]@{}
        foreach ($destination in $destinations) {
            $selected = @($records | Where-Object { $_.destinationId -eq $destination.id -and $_.status -eq 'ready' -and $_.subjectVerified -and $_.metadata.licenseVerified } | Sort-Object @{Expression={ if ($_.preferred) { 0 } elseif ($_.kind -eq 'overview') { 2 } else { 1 } }})
            # Keep successful media that was not part of this collection request.
            # A failed request or an incomplete manifest must not erase the active gallery.
            $selectedPaths = @($selected | ForEach-Object src)
            $photos = @($destination.photos | Where-Object {
                $previousPhoto = $_
                $rejected = @($records | Where-Object {
                    $_.destinationId -eq $destination.id -and $_.src -eq $previousPhoto.src -and
                    ($_.subjectVerified -eq $false -or ($_.metadata -and $_.metadata.licenseVerified -eq $false -and $previousPhoto.publicationRequested -ne $true))
                }).Count -gt 0
                $previousPhoto.subjectVerified -eq $true -and
                (($previousPhoto.verified -eq $true -and $previousPhoto.licenseVerified -eq $true) -or $previousPhoto.publicationRequested -eq $true) -and
                $previousPhoto.src -notin $selectedPaths -and -not $rejected
            })
            foreach ($record in $selected) {
                $priorPhoto = $destination.photos | Where-Object src -eq $record.src | Select-Object -First 1
                if ($record.sourceType -and $record.sourceType -ne 'wikimedia_commons') {
                    # Their dated captions, custom grant and provenance belong to
                    # the separately reviewed publisher, not the Commons importer.
                    if ($priorPhoto) { $photos += $priorPhoto }
                    continue
                }
                $suffix = if ($record.kind -eq 'overview') { @{uz=" — hududning yuqoridan ko‘rinishi";kaa=" — aymaqtıń joqarıdan kórinisi";ru=" — обзор территории сверху";en=" — overview of the area"} } else { @{uz='';kaa='';ru='';en=''} }
                $caption = [ordered]@{}
                foreach ($locale in @('uz','kaa','ru','en')) { $caption[$locale] = if ($record.caption.$locale) { $record.caption.$locale } else { $destination.name.$locale + $suffix[$locale] } }
                $freshPhoto = [pscustomobject]@{
                    src=$record.src;thumbnail=$record.thumbnail;sourceUrl=$record.metadata.sourceUrl
                    author=$record.metadata.author;license=$record.metadata.license;licenseUrl=$record.metadata.licenseUrl
                    caption=$caption;kind=$record.kind;verified=$true;driveFileId=$priorPhoto.driveFileId
                    sourceTitle=$record.title;credit=$record.metadata.credit;width=$record.width;height=$record.height
                    sourceImageUrl=$record.metadata.downloadUrl
                    licenseVerified=$true;subjectVerified=$true
                    modifications='Resized JPEG and thumbnail for web display; archive files retained separately.'
                }
                if ($priorPhoto) {
                    foreach ($field in $priorPhoto.PSObject.Properties) {
                        if ($field.Name -notin $freshPhoto.PSObject.Properties.Name) {
                            Set-Field $freshPhoto $field.Name $field.Value
                        }
                    }
                }
                $photos += $freshPhoto
            }
            Set-Field $destination 'photos' $photos
            Set-Field $destination 'images' @($photos | ForEach-Object src)
            $aggregate = [pscustomobject]@{
                verified=($photos.Count -gt 0 -and @($photos | Where-Object verified -ne $true).Count -eq 0)
                subjectVerified=($photos.Count -gt 0);author=(@($photos.author | Select-Object -Unique) -join '; ')
                license=(@($photos.license | Select-Object -Unique) -join '; ');source='reviewed-public-sources'
                photoCount=$photos.Count
            }
            if ($photos.Count -eq 0) { Set-Field $aggregate 'note' @{uz="Mos va litsenziyasi tasdiqlangan surat hali topilmadi";kaa="Sáykes hám licenziyası tastıyıqlanǵan súwret ele tabılmadı";ru="Подходящий снимок с подтвержденной лицензией пока не найден";en="A matching photograph with verified licensing has not yet been found"} }
            Set-Field $destination 'photoAttribution' $aggregate
            if ($photos.Count -gt 0) { $attributions[$destination.id] = [ordered]@{hasRealPhoto=(@($photos | Where-Object kind -eq 'photo').Count -gt 0);sourceType='reviewed-public-sources';photos=@($photos.src);author=$aggregate.author;license=$aggregate.license;perPhoto=$photos} }
        }
        Save-Json $destinationsPath $destinations
        Save-Json (Join-Path $baseDir 'data/photo_attribution.json') $attributions
        Write-Output ('Published ' + @($destinations | Where-Object { $_.photos.Count -gt 0 }).Count + ' destinations and ' + @($destinations.photos).Count + ' media records.')
    }
} finally { $client.Dispose() }
