import re
import os

about_file = "src/components/About/AboutView.tsx"
out_dir = "src/components/About/sections"

with open(about_file, "r") as f:
    content = f.read()

# I want to extract the Bio Section text specifically without typing it all out!
bio_match = re.search(r"\{\/\* Bio Section \/ Mission Statement \*\/}(.*?)\{\/\* Transparency & Disclaimer Section \*\/}", content, re.DOTALL)
if bio_match:
    bio_content = bio_match.group(1)
    # We will write this out to a temp file so I can easily wrap it in a component.
    with open("src/components/About/sections/temp_bio.tsx", "w") as out:
        out.write(bio_content)

trans_match = re.search(r"\{\/\* Transparency & Disclaimer Section \*\/}(.*?)\{\/\* Google Drive Sync", content, re.DOTALL)
if trans_match:
    with open("src/components/About/sections/temp_trans.tsx", "w") as out:
        out.write(trans_match.group(1))

# Write a script to dump EVERYTHING between `{/* ... */}` markers into temp files!
matches = re.finditer(r"\{\/\* (.*?) \*\/}", content)
marker_positions = [(m.group(1), m.start(), m.end()) for m in matches]

for i in range(len(marker_positions)):
    title, start_offset, end_offset = marker_positions[i]
    if "Section" in title or "Card" in title:
        # Find next marker
        next_pos = len(content)
        for j in range(i+1, len(marker_positions)):
            if "Section" in marker_positions[j][0] or "Card" in marker_positions[j][0] or "Link to Us" in marker_positions[j][0] or "Terms" in marker_positions[j][0]:
                next_pos = marker_positions[j][1]
                break
        
        section_content = content[end_offset:next_pos].strip()
        safe_title = title.replace("/", "_").replace(" ", "_")
        with open(f"src/components/About/sections/temp_{safe_title}.tsx", "w") as out:
            out.write(section_content)

print("Saved sections to temp files in", out_dir)
