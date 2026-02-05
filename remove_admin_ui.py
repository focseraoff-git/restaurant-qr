#!/usr/bin/env python3
"""
Script to remove the admin UI section from KitchenDashboard.tsx
This removes lines 374-1127 which contain the manager mode ternary and all admin tabs.
"""

def remove_admin_ui():
    file_path = r"frontend\src\pages\KitchenDashboard.tsx"
    
    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    # Remove lines 374-1127 (0-indexed: 373-1126)
    # Keep lines 0-373 and lines 1127-end
    new_lines = lines[:373] + lines[1127:]
    
    # Write back
    with open(file_path, 'w', encoding='utf-8') as f:
        f.writelines(new_lines)
    
    print(f"✅ Removed {1127-373} lines from KitchenDashboard.tsx")
    print(f"   Original: {len(lines)} lines")
    print(f"   New: {len(new_lines)} lines")

if __name__ == "__main__":
    remove_admin_ui()
