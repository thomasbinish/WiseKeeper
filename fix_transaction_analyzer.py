
import os

file_path = r"c:\Users\Lenovo\Documents\Testing AntiGravity 112425\expense-analyzer\src\components\TransactionAnalyzer.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

# Part 1: Header and outer component setup (Lines 1-207)
# Index 0 to 206
part1 = lines[:207]

# Part 2: Inner component logic (Lines 404-1161)
# Line 404 in file is index 403.
# We want to start from the inner handleAnalyze definition.
# Line 403 in file is `            const handleAnalyze = async () => {`
start_index = 403
part2 = lines[start_index:]

# Dedent part 2 by 8 spaces
dedented_part2 = []
for line in part2:
    if line.startswith("        "):
        dedented_part2.append(line[8:])
    else:
        # If line is empty or has less than 8 spaces but is just whitespace
        if line.strip() == "":
            dedented_part2.append(line)
        else:
            # Should not happen for valid code in this block, but just in case
            dedented_part2.append(line.lstrip()) 

# Combine
new_content = "".join(part1 + dedented_part2)

with open(file_path, 'w', encoding='utf-8') as f:
    f.write(new_content)

print(f"Fixed file. Total lines: {len(part1) + len(dedented_part2)}")
