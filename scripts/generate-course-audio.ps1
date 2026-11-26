param([Parameter(Mandatory = $true)][string]$JobsPath)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$folder = Split-Path -LiteralPath $JobsPath
$records = Get-Content -LiteralPath $JobsPath -Encoding UTF8 -Raw | ConvertFrom-Json
$speaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
try {
    $installed = $speaker.GetInstalledVoices() | Where-Object { $_.Enabled -and $_.VoiceInfo.Culture.Name -eq 'en-US' }
    $previousVoice = ''
    foreach ($entry in $records) {
        if ($previousVoice -ne $entry.voice) {
            $voice = $installed | Where-Object { $_.VoiceInfo.Name -like ('*' + $entry.voice + '*') } | Select-Object -First 1
            if (-not $voice) { throw ('Install the Microsoft ' + $entry.voice + ' US English desktop voice to generate the course recordings.') }
            $speaker.SelectVoice($voice.VoiceInfo.Name)
            $previousVoice = $entry.voice
        }
        $speaker.Rate = -1
        $speaker.Volume = 100
        $speaker.SetOutputToWaveFile((Join-Path $folder ($entry.stem + '.wav')))
        $speaker.Speak([string]$entry.spoken)
        $speaker.SetOutputToNull()
    }
} finally {
    $speaker.Dispose()
}
