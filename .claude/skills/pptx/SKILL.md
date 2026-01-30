---
name: pptx
description: "Presentation creation, editing, and analysis. When Claude needs to work with presentations (.pptx files) for: (1) Creating new presentations, (2) Modifying or editing content, (3) Working with layouts, (4) Adding comments or speaker notes, or any other presentation tasks"
---

# PPTX creation, editing, and analysis

## Overview

A user may ask you to create, edit, or analyze the contents of a .pptx file. A .pptx file is essentially a ZIP archive containing XML files and other resources that you can read or edit. You have different tools and workflows available for different tasks.

## Reading and analyzing content

### Text extraction
If you just need to read the text contents of a presentation, you should convert the document to markdown:

```bash
# Convert document to markdown
python -m markitdown path-to-file.pptx
```

### Raw XML access
You need raw XML access for: comments, speaker notes, slide layouts, animations, design elements, and complex formatting. For any of these features, you'll need to unpack a presentation and read its raw XML contents.

#### Unpacking a file
```bash
python ooxml/scripts/unpack.py <office_file> <output_dir>
```

#### Key file structures
* `ppt/presentation.xml` - Main presentation metadata and slide references
* `ppt/slides/slide{N}.xml` - Individual slide contents (slide1.xml, slide2.xml, etc.)
* `ppt/notesSlides/notesSlide{N}.xml` - Speaker notes for each slide
* `ppt/comments/modernComment_*.xml` - Comments for specific slides
* `ppt/slideLayouts/` - Layout templates for slides
* `ppt/slideMasters/` - Master slide templates
* `ppt/theme/` - Theme and styling information
* `ppt/media/` - Images and other media files

#### Typography and color extraction
**When given an example design to emulate**: Always analyze the presentation's typography and colors first:
1. **Read theme file**: Check `ppt/theme/theme1.xml` for colors (`<a:clrScheme>`) and fonts (`<a:fontScheme>`)
2. **Sample slide content**: Examine `ppt/slides/slide1.xml` for actual font usage (`<a:rPr>`) and colors
3. **Search for patterns**: Use grep to find color (`<a:solidFill>`, `<a:srgbClr>`) and font references across all XML files

## Creating a new PowerPoint presentation **without a template**

When creating a new PowerPoint presentation from scratch, use the **html2pptx** workflow to convert HTML slides to PowerPoint with accurate positioning.

### Design Principles

**CRITICAL**: Before creating any presentation, analyze the content and choose appropriate design elements:
1. **Consider the subject matter**: What is this presentation about? What tone, industry, or mood does it suggest?
2. **Check for branding**: If the user mentions a company/organization, consider their brand colors and identity
3. **Match palette to content**: Select colors that reflect the subject
4. **State your approach**: Explain your design choices before writing code

**Requirements**:
- ✅ State your content-informed design approach BEFORE writing code
- ✅ Use web-safe fonts only: Arial, Helvetica, Times New Roman, Georgia, Courier New, Verdana, Tahoma, Trebuchet MS, Impact
- ✅ Create clear visual hierarchy through size, weight, and color
- ✅ Ensure readability: strong contrast, appropriately sized text, clean alignment
- ✅ Be consistent: repeat patterns, spacing, and visual language across slides

#### Color Palette Selection

**Choosing colors creatively**:
- **Think beyond defaults**: What colors genuinely match this specific topic?
- **Consider multiple angles**: Topic, industry, mood, energy level, target audience, brand identity
- **Be adventurous**: Try unexpected combinations
- **Build your palette**: Pick 3-5 colors that work together
- **Ensure contrast**: Text must be clearly readable on backgrounds

**Example color palettes**:

1. **Classic Blue**: Deep navy (#1C2833), slate gray (#2E4053), silver (#AAB7B8), off-white (#F4F6F6)
2. **Teal & Coral**: Teal (#5EA8A7), deep teal (#277884), coral (#FE4447), white (#FFFFFF)
3. **Bold Red**: Red (#C0392B), bright red (#E74C3C), orange (#F39C12), yellow (#F1C40F)
4. **Warm Blush**: Mauve (#A49393), blush (#EED6D3), rose (#E8B4B8), cream (#FAF7F2)
5. **Burgundy Luxury**: Burgundy (#5D1D2E), crimson (#951233), rust (#C15937), gold (#997929)
6. **Deep Purple & Emerald**: Purple (#B165FB), dark blue (#181B24), emerald (#40695B)
7. **Black & Gold**: Gold (#BF9A4A), black (#000000), cream (#F4F6F6)
8. **Sage & Terracotta**: Sage (#87A96B), terracotta (#E07A5F), cream (#F4F1DE)
9. **Forest Green**: Black (#191A19), green (#4E9F3D), dark green (#1E5128)
10. **Retro Rainbow**: Purple (#722880), pink (#D72D51), orange (#EB5C18), amber (#F08800)

### Layout Tips

**When creating slides with charts or tables:**
- **Two-column layout (PREFERRED)**: Header spanning full width, then two columns below - text/bullets in one column and featured content in the other
- **Full-slide layout**: Let featured content take up entire slide for maximum impact
- **NEVER vertically stack**: Do not place charts/tables below text in a single column

### Workflow
1. Create an HTML file for each slide with proper dimensions (e.g., 720pt × 405pt for 16:9)
2. Use `<p>`, `<h1>`-`<h6>`, `<ul>`, `<ol>` for all text content
3. Use `class="placeholder"` for areas where charts/tables will be added
4. **CRITICAL**: Rasterize gradients and icons as PNG images FIRST, then reference in HTML
5. Create and run a JavaScript file using pptxgenjs to convert HTML slides to PowerPoint
6. **Visual validation**: Generate thumbnails and inspect for layout issues
   - Create thumbnail grid: `python scripts/thumbnail.py output.pptx workspace/thumbnails --cols 4`
   - If issues found, adjust HTML margins/spacing/colors and regenerate

## Editing an existing PowerPoint presentation

When editing slides in an existing PowerPoint presentation, work with the raw Office Open XML (OOXML) format.

### Workflow
1. Unpack the presentation: `python ooxml/scripts/unpack.py <office_file> <output_dir>`
2. Edit the XML files (primarily `ppt/slides/slide{N}.xml`)
3. **CRITICAL**: Validate immediately after each edit: `python ooxml/scripts/validate.py <dir> --original <file>`
4. Pack the final presentation: `python ooxml/scripts/pack.py <input_directory> <office_file>`

## Creating a presentation **using a template**

When creating a presentation that follows an existing template's design:

### Workflow
1. **Extract template text AND create visual thumbnail grid**:
   * Extract text: `python -m markitdown template.pptx > template-content.md`
   * Create thumbnail grids: `python scripts/thumbnail.py template.pptx`

2. **Analyze template and save inventory**: Review thumbnails, identify layouts, create `template-inventory.md`

3. **Create presentation outline**: Choose appropriate templates for each slide

4. **Duplicate, reorder, and delete slides**:
   ```bash
   python scripts/rearrange.py template.pptx working.pptx 0,34,34,50,52
   ```

5. **Extract ALL text using inventory script**:
   ```bash
   python scripts/inventory.py working.pptx text-inventory.json
   ```

6. **Generate replacement text**: Create `replacement-text.json` with new content

7. **Apply replacements**:
   ```bash
   python scripts/replace.py working.pptx replacement-text.json output.pptx
   ```

## Creating Thumbnail Grids

```bash
python scripts/thumbnail.py template.pptx [output_prefix]
```

**Features**:
- Default: 5 columns, max 30 slides per grid (5×6)
- Custom prefix: `python scripts/thumbnail.py template.pptx my-grid`
- Adjust columns: `--cols 4` (range: 3-6)
- Slides are zero-indexed (Slide 0, Slide 1, etc.)

## Converting Slides to Images

1. **Convert PPTX to PDF**:
   ```bash
   soffice --headless --convert-to pdf template.pptx
   ```

2. **Convert PDF pages to JPEG**:
   ```bash
   pdftoppm -jpeg -r 150 template.pdf slide
   ```

## Dependencies

Required dependencies:

- **markitdown**: `pip install "markitdown[pptx]"` (for text extraction)
- **pptxgenjs**: `npm install -g pptxgenjs` (for creating presentations)
- **playwright**: `npm install -g playwright` (for HTML rendering)
- **sharp**: `npm install -g sharp` (for image processing)
- **LibreOffice**: `sudo apt-get install libreoffice` (for PDF conversion)
- **Poppler**: `sudo apt-get install poppler-utils` (for pdftoppm)
- **defusedxml**: `pip install defusedxml` (for secure XML parsing)
