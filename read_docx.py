import sys
import os

def check_and_install():
    try:
        import docx
    except ImportError:
        import subprocess
        print("Installing python-docx...")
        subprocess.check_call([sys.executable, "-m", "pip", "install", "python-docx"])
        import docx
    return docx

def docx_to_md(input_path, output_path):
    docx = check_and_install()
    doc = docx.Document(input_path)
    
    md_content = []
    
    for para in doc.paragraphs:
        style = para.style.name if para.style else ""
        text = para.text.strip()
        
        if not text:
            md_content.append("")
            continue
            
        if "Heading 1" in style:
            md_content.append(f"# {text}\n")
        elif "Heading 2" in style:
            md_content.append(f"## {text}\n")
        elif "Heading 3" in style:
            md_content.append(f"### {text}\n")
        elif "Heading 4" in style:
            md_content.append(f"#### {text}\n")
        else:
            md_content.append(f"{text}\n")
            
    # Handle tables (simplified)
    # Note: This basic script just extracts paragraphs. Tables might need special handling.
    # For a full conversion, we would need to iterate through the document body.
    
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(md_content))
    
    print(f"Markdown file generated at: {output_path}")

if __name__ == "__main__":
    input_file = r"C:\Users\云\Desktop\电厂数字孪生\需求报告\乌江渡水电站数字孪生管理平台详细需求报告.docx"
    output_file = r"c:\Users\云\Documents\trae_projects\aicaotu\temp_report.md"
    
    if os.path.exists(input_file):
        docx_to_md(input_file, output_file)
    else:
        print(f"File not found: {input_file}")
