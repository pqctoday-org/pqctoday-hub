---
description: How to safely generate 4-quadrant learning module infographics ensuring consistency across Gemini and Claude
---

# Visual Generation Pipeline: 4-Quadrant UI Graphics

This workflow outlines the exact pipeline to achieve 100% aesthetic and layout consistency when generating cybersecurity infographics for the UI. Generative AI struggles with structural grids and text hallucinations; this workflow mathematically enforces consistency.

## Prerequisites
1. **Locate the Master Seed**: You must anchor all generations to the repository's pristine seed image to enforce the grid. Use `/public/images/infographics/quantum-threats.png` or `pqc-101.png` as your reference.
2. **Use Native Image Tools**: Pass the master seed's absolute path directly into your available image generation tool (e.g., the `ImagePaths` parameter for Gemini's `generate_image`). Claude users using external tools must also pass this seed image explicitly.

## Generation Execution

You MUST use the exact prompt structure provided below. Do not deviate from the format, do not add creative descriptions of the layout, and **never remove the CRITICAL RULE constraint**.

**Standardized Prompt Structure**:
```text
[Use the provided reference image as the stylistic and structural seed]. Create a 4-quadrant infographic matching the EXACT typography size, cyan/amber glowing 3D vector aesthetic, and dark navy background of the reference image.
CRITICAL RULE: NEVER print my visual instructions on the image.

Quadrant 1 Large Title: '[TITLE]'. (Draw an illustration). Generate a brief, distinct cybersecurity subtitle below it.
Quadrant 2 Large Title: '[TITLE]'. (Draw an illustration). Generate a brief, distinct cybersecurity subtitle below it.
Quadrant 3 Large Title: '[TITLE]'. (Draw an illustration). Generate a brief, distinct cybersecurity subtitle below it.
Quadrant 4 Large Title: '[TITLE]'. (Draw an illustration). Generate a brief, distinct cybersecurity subtitle below it.
```

## Post-Generation
Once your UI graphic is generated, rename it to the `gcp_` prefix (e.g. `gcp_module-name.png`) and drop it perfectly inside `/public/images/infographics/`. The React components dynamically fetch the `gcp_` scoped visual.
