
file_path = r"c:\Users\Lenovo\Documents\Testing AntiGravity 112425\expense-analyzer\src\components\TransactionAnalyzer.tsx"

with open(file_path, 'r', encoding='utf-8') as f:
    lines = f.readlines()

stack = []
for i, line in enumerate(lines):
    for j, char in enumerate(line):
        if char == '{':
            stack.append((i + 1, j + 1))
        elif char == '}':
            if not stack:
                print(f"Error: Unexpected closing brace at line {i + 1}, col {j + 1}")
            else:
                stack.pop()

if stack:
    print("Error: Unclosed braces at:")
    for item in stack:
        print(f"  Line {item[0]}, Col {item[1]}")
else:
    print("Braces are balanced.")
