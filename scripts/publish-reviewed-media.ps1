param(
    [string[]]$EvidenceFiles = @('data/media-research-2026-10.json', 'data/media-research-additional-2026-10.json', 'data/media-research-shrines-2026-10.json'),
    [switch]$IncludeRequestedRights
)

# Manual media maintenance only. Does not launch the website or contact a provider.
# Research records require a prior human/source review; downloading is not verification.
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$projectDir = [IO.Path]::GetFullPath((Split-Path -Parent $PSScriptRoot))
$utf8 = [Text.UTF8Encoding]::new($false)
$webChanges = [pscustomobject]@{
    uz = "Veb uchun JPEG nusxa va eni 480 px gacha kichik ko‘rinish tayyorlandi; tasvir mazmuni o‘zgartirilmagan."
    kaa = "Veb ushın JPEG nusqa hám eni 480 px ge shekem kishkene kórinis tayarlandı; súwret mazmunı ózgertilmegen."
    ru = "Подготовлены веб-копия JPEG и миниатюра шириной до 480 px; содержание изображения не изменено."
    en = 'Prepared a web JPEG and a preview up to 480 px wide; image content is unchanged.'
}

function Project-Path([string]$Relative) {
    $resolved = [IO.Path]::GetFullPath((Join-Path $projectDir $Relative))
    if (-not $resolved.StartsWith($projectDir + [IO.Path]::DirectorySeparatorChar, [StringComparison]::OrdinalIgnoreCase)) {
        throw 'Media paths must remain inside the project.'
    }
    return $resolved
}
function Set-Value($Object, [string]$Name, $Value) {
    $Object | Add-Member -NotePropertyName $Name -NotePropertyValue $Value -Force
}
function Write-Json([string]$Relative, $Data) {
    $target = Project-Path $Relative
    $temporary = $target + '.media-tmp'
    [IO.File]::WriteAllText($temporary, ($Data | ConvertTo-Json -Depth 40), $utf8)
    Move-Item -LiteralPath $temporary -Destination $target -Force
}
function Require-Https([string]$Value) {
    $url = $null
    if (-not [Uri]::TryCreate($Value, [UriKind]::Absolute, [ref]$url) -or
        $url.Scheme -ne 'https' -or $url.UserInfo) {
        throw ('A public HTTPS source/license URL is required: ' + $Value)
    }
}
function Write-WebJpeg($Image, [string]$Relative, [int]$MaxWidth, [long]$Quality) {
    # Both arguments must be doubles: an integer first argument selects the
    # Int32 overload in Windows PowerShell and can collapse a preview to 1 px.
    $factor = [Math]::Min(1.0, $MaxWidth / [double]$Image.Width)
    $width = [Math]::Max(1, [int][Math]::Round($Image.Width * $factor))
    $height = [Math]::Max(1, [int][Math]::Round($Image.Height * $factor))
    $bitmap = [Drawing.Bitmap]::new($width, $height)
    $graphics = [Drawing.Graphics]::FromImage($bitmap)
    $parameters = [Drawing.Imaging.EncoderParameters]::new(1)
    try {
        $graphics.InterpolationMode = [Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
        $graphics.DrawImage($Image, 0, 0, $width, $height)
        $encoder = [Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object MimeType -eq 'image/jpeg'
        $parameters.Param[0] = [Drawing.Imaging.EncoderParameter]::new([Drawing.Imaging.Encoder]::Quality, $Quality)
        $target = Project-Path $Relative
        [IO.Directory]::CreateDirectory((Split-Path -Parent $target)) | Out-Null
        $temporary = $target + '.media-tmp'
        $bitmap.Save($temporary, $encoder, $parameters)
        Move-Item -LiteralPath $temporary -Destination $target -Force
    } finally { $parameters.Dispose(); $graphics.Dispose(); $bitmap.Dispose() }
    return @{ width = $width; height = $height }
}

$destinations = Get-Content -LiteralPath (Project-Path 'data/destinations.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$sources = Get-Content -LiteralPath (Project-Path 'data/media-sources.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$candidateIndex = Get-Content -LiteralPath (Project-Path 'data/media-candidates.json') -Raw -Encoding UTF8 | ConvertFrom-Json
$evidence = @($EvidenceFiles | ForEach-Object {
    Get-Content -LiteralPath (Project-Path $_) -Raw -Encoding UTF8 | ConvertFrom-Json
})
$added = 0
foreach ($document in $evidence) {
    $reviewDate = if ($document.reviewedOn) { $document.reviewedOn } else { $document.researchDate }
    if ($reviewDate -notmatch '^\d{4}-\d{2}-\d{2}$') { throw 'A dated source review is required.' }
    foreach ($record in $document.records) {
        $destination = $destinations | Where-Object id -eq $record.destinationId | Select-Object -First 1
        if (-not $destination) { throw ('Unknown stable destination ID: ' + $record.destinationId) }
        $researchUrl = $record.sourceUrl
        if (-not $researchUrl) {
            $researchUrl = @($record.candidates | Where-Object sourceUrl | Select-Object -First 1)[0].sourceUrl
        }
        if ($researchUrl) {
            Require-Https $researchUrl
            Set-Value $destination 'photoResearch' ([pscustomobject]@{
                sourceUrl = $researchUrl; status = $record.status; reviewedOn = $reviewDate
            })
        }
        foreach ($candidate in @($record.photos)) {
            if (-not $candidate -or $candidate.preferred -ne $true) { continue }
            $reuseApproved = $candidate.licenseVerified -eq $true -and $candidate.reuseVerified -eq $true
            $requestedUse = $IncludeRequestedRights -and $candidate.publicationRequested -eq $true
            $nonCommercialOnly = $candidate.nonCommercialOnly -eq $true -or $candidate.license -match '(?i)\bBY-NC\b'
            if ($candidate.subjectVerified -ne $true -or (-not $reuseApproved -and -not $requestedUse)) {
                throw ('Preferred media still needs subject and rights review: ' + $record.destinationId)
            }
            if ($candidate.kind -notin @('photo', 'overview') -or -not $candidate.author -or -not $candidate.license) {
                throw ('Incomplete media attribution: ' + $record.destinationId)
            }
            $sourceUrl = if ($candidate.sourceUrl) { $candidate.sourceUrl } else { $record.sourceUrl }
            Require-Https $sourceUrl
            Require-Https $candidate.sourceImageUrl
            Require-Https $candidate.licenseUrl
            $original = Project-Path $candidate.localFile
            $hash = (Get-FileHash -LiteralPath $original -Algorithm SHA256).Hash.ToLowerInvariant()
            if (-not $candidate.sha256 -or $candidate.sha256 -notmatch '^[a-fA-F0-9]{64}$' -or $hash -ne $candidate.sha256.ToLowerInvariant()) {
                throw ('Downloaded media differs from its reviewed hash: ' + $candidate.localFile)
            }
            $stem = [IO.Path]::GetFileNameWithoutExtension($original) -replace '-candidate$', ''
            $src = 'assets/images/destinations/' + $stem + '.jpg'
            $thumbnail = 'assets/images/destinations/thumbnails/' + $stem + '-480.jpg'
            $duplicate = @($destination.photos | Where-Object {
                $_.sourceImageUrl -eq $candidate.sourceImageUrl -or ($_.originalSha256 -and $_.originalSha256 -eq $hash)
            })
            $sourceType = if ($candidate.sourceType) { $candidate.sourceType } elseif ($record.sourceType) { $record.sourceType } else { 'reviewed-external' }
            if ($duplicate.Count) {
                # Corrected credits and review dates must reach the active catalogue
                # without replacing image bytes, successful local paths or Drive IDs.
                foreach ($prior in $duplicate) {
                    foreach ($field in @('author', 'license', 'licenseUrl', 'caption', 'kind')) {
                        if ($null -ne $candidate.$field) { Set-Value $prior $field $candidate.$field }
                    }
                    Set-Value $prior 'sourceUrl' $sourceUrl
                    Set-Value $prior 'sourceType' $sourceType
                    Set-Value $prior 'verified' $reuseApproved
                    Set-Value $prior 'licenseVerified' ($candidate.licenseVerified -eq $true)
                    Set-Value $prior 'reuseVerified' $reuseApproved
                    Set-Value $prior 'publicationRequested' ([bool]$requestedUse)
                    Set-Value $prior 'nonCommercialOnly' ([bool]$nonCommercialOnly)
                    Set-Value $prior 'provenance' ([pscustomobject]@{ reviewedOn = $reviewDate; subjectEvidence = $record.identityNote })
                    foreach ($field in @('rightsStatus', 'rightsEvidenceUrl', 'requiredAttribution', 'captureDate', 'sourcePublishedOn', 'bounds', 'sourceResolutionMeters')) {
                        if ($null -ne $candidate.$field) { Set-Value $prior $field $candidate.$field }
                    }
                    foreach ($source in @($sources | Where-Object src -eq $prior.src)) {
                        Set-Value $source 'sourceType' $sourceType
                        Set-Value $source 'caption' $prior.caption
                        Set-Value $source 'status' $(if ($reuseApproved) { 'ready' } else { 'requested-with-source-rights' })
                        foreach ($field in @('author', 'license', 'licenseUrl', 'sourceUrl', 'licenseVerified', 'reuseVerified', 'publicationRequested')) {
                            Set-Value $source.metadata $field $prior.$field
                        }
                        Set-Value $source 'rightsReview' ([pscustomobject]@{ date = $reviewDate; sourceUrl = $prior.licenseUrl })
                    }
                }
                continue
            }
            $image = [Drawing.Image]::FromFile($original)
            try {
                $dimensions = Write-WebJpeg $image $src 1200 87
                $null = Write-WebJpeg $image $thumbnail 480 82
            } finally { $image.Dispose() }
            $captions = [ordered]@{}
            foreach ($locale in @('uz', 'kaa', 'ru', 'en')) {
                $captions[$locale] = if ($candidate.caption -isnot [string] -and $candidate.caption.$locale) {
                    $candidate.caption.$locale
                } else { $destination.name.$locale }
            }
            $changes = [pscustomobject]@{
                uz = "Veb uchun JPEG nusxa va eni 480 px gacha kichik ko‘rinish tayyorlandi; tasvir mazmuni o‘zgartirilmagan."
                kaa = "Veb ushın JPEG nusqa hám eni 480 px ge shekem kishkene kórinis tayarlandı; súwret mazmunı ózgertilmegen."
                ru = "Подготовлены веб-копия JPEG и миниатюра шириной до 480 px; содержание изображения не изменено."
                en = "Prepared a web JPEG and a preview up to 480 px wide; image content is unchanged."
            }
            $photo = [pscustomobject]@{
                src = $src; thumbnail = $thumbnail; sourceUrl = $sourceUrl
                sourceImageUrl = $candidate.sourceImageUrl
                sourceTitle = $(if ($candidate.sourceTitle) { $candidate.sourceTitle } elseif ($candidate.caption -is [string]) { $candidate.caption } else { $candidate.caption.en })
                sourceType = $sourceType; author = $candidate.author
                license = $candidate.license; licenseUrl = $candidate.licenseUrl
                caption = [pscustomobject]$captions; kind = $candidate.kind
                verified = $reuseApproved; subjectVerified = $true; licenseVerified = ($candidate.licenseVerified -eq $true)
                reuseVerified = $reuseApproved; publicationRequested = [bool]$requestedUse
                width = $dimensions.width; height = $dimensions.height
                modifications = 'Resized/re-encoded as JPEG and a thumbnail up to 480 px wide. No content generation or reconstruction.'
                modificationsText = $changes; originalSha256 = $hash
                provenance = [pscustomobject]@{ reviewedOn = $reviewDate; subjectEvidence = $record.identityNote }
                nonCommercialOnly = [bool]$nonCommercialOnly
            }
            if ($candidate.captureDate) { Set-Value $photo 'captureDate' $candidate.captureDate }
            if ($candidate.dateTaken) { Set-Value $photo 'captureDate' $candidate.dateTaken }
            if ($candidate.bounds) { Set-Value $photo 'bounds' $candidate.bounds }
            if ($candidate.sourceResolutionMeters) { Set-Value $photo 'sourceResolutionMeters' $candidate.sourceResolutionMeters }
            if ($candidate.sourcePublishedOn) { Set-Value $photo 'sourcePublishedOn' $candidate.sourcePublishedOn }
            if ($candidate.requiredAttribution) { Set-Value $photo 'requiredAttribution' @($candidate.requiredAttribution) }
            if ($candidate.rightsStatus) { Set-Value $photo 'rightsStatus' $candidate.rightsStatus }
            if ($candidate.rightsEvidenceUrl) { Set-Value $photo 'rightsEvidenceUrl' $candidate.rightsEvidenceUrl }
            Set-Value $destination 'photos' (@($destination.photos) + $photo)
            $metadata = [pscustomobject]@{
                author = $photo.author; license = $photo.license; licenseUrl = $photo.licenseUrl
                sourceUrl = $photo.sourceUrl; downloadUrl = $photo.sourceImageUrl
                licenseVerified = $photo.licenseVerified; reuseVerified = $reuseApproved; publicationRequested = [bool]$requestedUse
                retrievedAt = [DateTime]::UtcNow.ToString('o')
                width = $candidate.width; height = $candidate.height
            }
            $sources += [pscustomobject]@{
                destinationId = $destination.id; number = $destination.number; title = $stem
                sourceType = $sourceType; src = $src; thumbnail = $thumbnail
                kind = $photo.kind; subjectVerified = $true; status = $(if ($reuseApproved) { 'ready' } else { 'requested-with-source-rights' }); metadata = $metadata
                caption = $photo.caption
                width = $photo.width; height = $photo.height; error = $null
                rightsReview = [pscustomobject]@{ date = $reviewDate; sourceUrl = $photo.licenseUrl }
            }
            $added++
        }
    }
}

$attributions = [ordered]@{}
foreach ($destination in $destinations) {
    $photos = @($destination.photos)
    foreach ($photo in $photos) {
        if ($photo.modificationsText -and @($photo.modificationsText.PSObject.Properties | Where-Object {
            $_.Value -is [string] -and $_.Value.Contains('?')
        }).Count) { Set-Value $photo 'modificationsText' $webChanges }
    }
    Set-Value $destination 'images' @($photos | ForEach-Object src)
    $aggregate = [pscustomobject]@{
        verified = ($photos.Count -gt 0 -and @($photos | Where-Object verified -ne $true).Count -eq 0)
        subjectVerified = ($photos.Count -gt 0); author = (@($photos.author | Select-Object -Unique) -join '; ')
        license = (@($photos.license | Select-Object -Unique) -join '; ')
        source = 'reviewed-public-sources'; photoCount = $photos.Count
    }
    if (-not $photos.Count) { Set-Value $aggregate 'note' $destination.photoAttribution.note }
    Set-Value $destination 'photoAttribution' $aggregate
    if ($photos.Count) {
        $attributions[$destination.id] = [pscustomobject]@{
            hasRealPhoto = (@($photos | Where-Object kind -eq 'photo').Count -gt 0)
            sourceType = 'reviewed-public-sources'; photos = @($photos.src)
            author = $aggregate.author; license = $aggregate.license; perPhoto = $photos
        }
    }
}
$withMedia = @($destinations | Where-Object { @($_.photos).Count -gt 0 }).Count
$twoMedia = @($destinations | Where-Object { @($_.photos).Count -ge 2 }).Count
$twoPhotos = @($destinations | Where-Object { @($_.photos | Where-Object kind -eq 'photo').Count -ge 2 }).Count
$summary = [pscustomobject]@{
    destinations = $destinations.Count; withMedia = $withMedia; withoutMedia = $destinations.Count - $withMedia
    totalMedia = @($destinations.photos).Count; withAtLeastTwoMedia = $twoMedia
    withAtLeastTwoPhotographs = $twoPhotos; overviewCount = @($destinations.photos | Where-Object kind -eq 'overview').Count
    requestedWithSourceRights = @($destinations.photos | Where-Object { $_.publicationRequested -eq $true -and $_.reuseVerified -ne $true }).Count
}
Set-Value $candidateIndex 'summary' $summary
Set-Value $candidateIndex 'reviewDate' '2026-10-21'
foreach ($outstanding in $candidateIndex.outstanding) {
    $destination = $destinations | Where-Object id -eq $outstanding.destinationId | Select-Object -First 1
    if (-not $destination) { continue }
    Set-Value $outstanding 'currentMediaCount' @($destination.photos).Count
    Set-Value $outstanding 'currentPhotographCount' @($destination.photos | Where-Object kind -eq 'photo').Count
    if (@($destination.photos).Count) {
        Set-Value $outstanding 'status' 'reviewed-media-added'
        Set-Value $outstanding 'explanation' 'New reviewed media and primary-source provenance were added in the 2026-10-21 review. Earlier candidates remain as research history.'
    }
}
Write-Json 'data/destinations.json' $destinations
Write-Json 'data/photo_attribution.json' $attributions
Write-Json 'data/media-sources.json' $sources
Write-Json 'data/media-candidates.json' $candidateIndex
Write-Output ('Added ' + $added + ' reviewed media records. ' + ($summary | ConvertTo-Json -Compress))
