import os

# [Bug Doctor] 2026-02-22 04:02 - Home.tsx 구문 무결성 진단 스크립트
# 주요 목표: 브레이스({}), 괄호(()), 따옴표('", `)의 쌍이 맞는지 전수 검사

path = r'e:\GPS-Cruise-Tour-AudioGuideNo-Wifi-1\client\src\pages\Home.tsx'

with open(path, 'rb') as f:
    content = f.read().decode('utf-8', errors='ignore')

def count_and_report(char_open, char_close, name):
    open_count = content.count(char_open)
    close_count = content.count(char_close)
    print(f"{name}: {char_open} ({open_count}) vs {char_close} ({close_count})")
    if open_count != close_count:
        print(f"!!! {name} UNBALANCED !!! Diff: {open_count - close_count}")
    return open_count == close_count

print("--- Integrity Report for Home.tsx ---")
count_and_report('{', '}', "Braces")
count_and_report('(', ')', "Parentheses")
count_and_report('[', ']', "Brackets")
count_and_report('<', '>', "Angle Brackets (Note: may include comparison ops)")

# Check for unclosed template literals
# Basic check for even number of backticks
backtick_count = content.count('`')
print(f"Backticks: {backtick_count}")
if backtick_count % 2 != 0:
    print("!!! BACKTICKS UNBALANCED !!!")

# Search for any line that might be causing a sudden stop
lines = content.split('\n')
for i, line in enumerate(lines):
    # Check for non-standard characters that display as '?' but might be something else
    if '\ufffd' in line:
        print(f"Line {i+1}: Contains Replacement Character (U+FFFD)")

print("-------------------------------------")
