# 🔄 에이전트 프롬프트 동기화 스크립트 (Skill -> Docs)
# [교수님 노트] 이 스크립트는 실시간으로 작동하는 에이전트의 '두뇌(.agent/skills)'와 
# 학생이 보기 편한 '설명서(./docs)'를 똑같이 맞춰주는 역할을 합니다.

$skillsPath = "e:\GPS-Cruise-Tour-AudioGuideNo-Wifi-1\.agent\skills"
$docsPath = "e:\GPS-Cruise-Tour-AudioGuideNo-Wifi-1\docs"

if (-not (Test-Path $docsPath)) {
    New-Item -ItemType Directory -Path $docsPath
}

$skills = Get-ChildItem -Path $skillsPath -Directory

foreach ($skill in $skills) {
    $promptFile = Join-Path $skill.FullName "PROMPT.md"
    if (Test-Path $promptFile) {
        $destFileName = "agent_prompt_$($skill.Name).md"
        $destPath = Join-Path $docsPath $destFileName
        
        Copy-Item -Path $promptFile -Destination $destPath -Force
        Write-Host "✅ Synced: $($skill.Name) -> $destFileName"
    } else {
        Write-Host "⚠️ Skipped: $($skill.Name) (PROMPT.md not found)"
    }
}

Write-Host "`n🚀 모든 프롬프트가 docs 폴더로 동기화되었습니다!"
