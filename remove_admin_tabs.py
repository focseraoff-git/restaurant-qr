#!/usr/bin/env python3
"""
Script to remove admin tab content sections from KitchenDashboard.tsx
This removes the waiters, settlement, payments, and info tab content sections.
"""

def find_matching_brace(lines, start_line):
    """Find the matching closing brace for an opening brace."""
    brace_count = 0
    in_jsx = False
    
    for i in range(start_line, len(lines)):
        line = lines[i]
        
        # Count braces
        for char in line:
            if char == '{':
                brace_count += 1
            elif char == '}':
                brace_count -= 1
                if brace_count == 0:
                    return i
    
    return -1

def remove_admin_tabs():
    file_path = r"frontend\src\pages\KitchenDashboard.tsx"
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    print(f"Original file: {len(lines)} lines")
    
    # Find admin tab sections (working backwards to preserve line numbers)
    sections_to_remove = []
    
    # Find each section
    for i, line in enumerate(lines):
        if "{activeTab === 'waiters' &&" in line:
            end = find_matching_brace(lines, i)
            if end != -1:
                sections_to_remove.append((i, end + 1, "waiters"))
                print(f"Found waiters section: lines {i+1}-{end+1}")
        
        elif "{activeTab === 'settlement' &&" in line:
            end = find_matching_brace(lines, i)
            if end != -1:
                sections_to_remove.append((i, end + 1, "settlement"))
                print(f"Found settlement section: lines {i+1}-{end+1}")
        
        elif "{activeTab === 'payments' &&" in line:
            end = find_matching_brace(lines, i)
            if end != -1:
                sections_to_remove.append((i, end + 1, "payments"))
                print(f"Found payments section: lines {i+1}-{end+1}")
        
        elif "{activeTab === 'info' &&" in line:
            end = find_matching_brace(lines, i)
            if end != -1:
                sections_to_remove.append((i, end + 1, "info"))
                print(f"Found info section: lines {i+1}-{end+1}")
    
    # Sort by start line (descending) to remove from bottom to top
    sections_to_remove.sort(reverse=True)
    
    # Remove sections
    for start, end, name in sections_to_remove:
        print(f"Removing {name} section: lines {start+1}-{end}")
        del lines[start:end]
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(lines)
    
    print(f"✅ Removed {len(sections_to_remove)} admin tab sections")
    print(f"   Original: {len(lines) + sum(end - start for start, end, _ in sections_to_remove)} lines")
    print(f"   New: {len(lines)} lines")

if __name__ == "__main__":
    remove_admin_tabs()
