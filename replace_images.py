
import os

filename = 'poster_v2.html'
try:
    with open(filename, 'r') as f:
        lines = f.readlines()

    # Check line 189 (index 188)
    if 'data:image/png;base64' in lines[188]:
        print(f"Replacing line 189 in {filename}")
        lines[188] = '            <img src="Screenshots/copilot-report.png" alt="Patient report analysis">\n'
    else:
        print(f"Line 189 does not match expected base64 pattern: {lines[188][:50]}...")

    # Check line 190 (index 189)
    # Note: If I replace line 188, line 189 is still the same index in the original list
    if 'data:image/png;base64' in lines[189]:
        print(f"Replacing line 190 in {filename}")
        lines[189] = '            <img src="Screenshots/copilot-tables.png" alt="Tabular data extraction">\n'
    else:
        print(f"Line 190 does not match expected base64 pattern: {lines[189][:50]}...")
        
    with open(filename, 'w') as f:
        f.writelines(lines)
        print("File updated successfully.")

except Exception as e:
    print(f"Error: {e}")
