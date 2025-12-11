import re

def check_structure(filepath):
    try:
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()

        # Remove comments (simple regex for // and /* */)
        # This isn't perfect for strings containing // but good enough for code structure
        content_no_comments = re.sub(r'//.*', '', content)
        content_no_comments = re.sub(r'/\*.*?\*/', '', content_no_comments, flags=re.DOTALL)
        
        # Remove strings
        content_clean = re.sub(r'([\'"`])(?:(?=(\\?))\2.)*?\1', '', content_no_comments)

        print(f"Checking {filepath}...")
        stack = []
        lines = content.split('\n')
        
        # We process the original content line by line for error reporting,
        # but logical checks would ideally run on cleaned content.
        # Let's just run simple brace count on cleaned content for now.
        
        braces = 0
        brackets = 0
        parens = 0
        
        for char in content_clean:
            if char == '{': braces += 1
            elif char == '}': braces -= 1
            elif char == '[': brackets += 1
            elif char == ']': brackets -= 1
            elif char == '(': parens += 1
            elif char == ')': parens -= 1
            
            if braces < 0: return "Failed: Extra closing }"
            if brackets < 0: return "Failed: Extra closing ]"
            if parens < 0: return "Failed: Extra closing )"

        if braces > 0: return f"Failed: {braces} unclosed {{ (missing }})"
        if brackets > 0: return f"Failed: {brackets} unclosed [ (missing ])"
        if parens > 0: return f"Failed: {parens} unclosed ( (missing ))"

        return "Success: Structure looks balanced."

    except Exception as e:
        return f"Error: {str(e)}"

print(check_structure(r"c:\Users\rwsan\Documents\projects\D&D Vault\components\calendar.js"))
