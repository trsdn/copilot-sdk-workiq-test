---
name: docx
description: "Comprehensive document creation, editing, and analysis with support for tracked changes, comments, formatting preservation, and text extraction. When Claude needs to work with professional documents (.docx files) for: (1) Creating new documents, (2) Modifying or editing content, (3) Working with tracked changes, (4) Adding comments, or any other document tasks"
---

# DOCX creation, editing, and analysis

## Overview

A user may ask you to create, edit, or analyze the contents of a .docx file. A .docx file is essentially a ZIP archive containing XML files and other resources that you can read or edit. You have different tools and workflows available for different tasks.

## Workflow Decision Tree

### Reading/Analyzing Content
Use "Text extraction" or "Raw XML access" sections below

### Creating New Document
Use "Creating a new Word document" workflow

### Editing Existing Document
- **Your own document + simple changes**: Use "Basic OOXML editing" workflow
- **Someone else's document**: Use **"Redlining workflow"** (recommended default)
- **Legal, academic, business, or government docs**: Use **"Redlining workflow"** (required)

## Reading and analyzing content

### Text extraction
If you just need to read the text contents of a document, convert it to markdown using pandoc:

```bash
# Convert document to markdown with tracked changes
pandoc --track-changes=all path-to-file.docx -o output.md
# Options: --track-changes=accept/reject/all
```

### Raw XML access
You need raw XML access for: comments, complex formatting, document structure, embedded media, and metadata.

#### Unpacking a file
```bash
python ooxml/scripts/unpack.py <office_file> <output_directory>
```

#### Key file structures
* `word/document.xml` - Main document contents
* `word/comments.xml` - Comments referenced in document.xml
* `word/media/` - Embedded images and media files
* Tracked changes use `<w:ins>` (insertions) and `<w:del>` (deletions) tags

## Creating a new Word document

When creating a new Word document from scratch, use **docx-js** (JavaScript/TypeScript).

### Workflow
1. Create a JavaScript/TypeScript file using Document, Paragraph, TextRun components
2. Export as .docx using Packer.toBuffer()

### Example

```javascript
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from 'docx';
import * as fs from 'fs';

const doc = new Document({
  sections: [{
    properties: {},
    children: [
      new Paragraph({
        text: "Document Title",
        heading: HeadingLevel.HEADING_1,
      }),
      new Paragraph({
        children: [
          new TextRun("Hello World! "),
          new TextRun({
            text: "Bold text",
            bold: true,
          }),
        ],
      }),
    ],
  }],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync("output.docx", buffer);
});
```

## Editing an existing Word document

When editing an existing Word document, use the OOXML workflow.

### Workflow
1. Unpack the document: `python ooxml/scripts/unpack.py <office_file> <output_directory>`
2. Create and run a Python script to modify the XML
3. Pack the final document: `python ooxml/scripts/pack.py <input_directory> <office_file>`

## Redlining workflow for document review

This workflow allows you to plan comprehensive tracked changes using markdown before implementing them in OOXML.

**Batching Strategy**: Group related changes into batches of 3-10 changes. Test each batch before moving to the next.

**Principle: Minimal, Precise Edits**
When implementing tracked changes, only mark text that actually changes. Break replacements into: [unchanged text] + [deletion] + [insertion] + [unchanged text].

### Tracked changes workflow

1. **Get markdown representation**:
   ```bash
   pandoc --track-changes=all path-to-file.docx -o current.md
   ```

2. **Identify and group changes**: Organize ALL changes into logical batches by section or type

3. **Unpack the document**:
   ```bash
   python ooxml/scripts/unpack.py <file.docx> <dir>
   ```

4. **Implement changes in batches**: Use `get_node` to find nodes, implement changes, then save

5. **Pack the document**:
   ```bash
   python ooxml/scripts/pack.py unpacked reviewed-document.docx
   ```

6. **Final verification**:
   ```bash
   pandoc --track-changes=all reviewed-document.docx -o verification.md
   grep "original phrase" verification.md  # Should NOT find it
   grep "replacement phrase" verification.md  # Should find it
   ```

## Converting Documents to Images

1. **Convert DOCX to PDF**:
   ```bash
   soffice --headless --convert-to pdf document.docx
   ```

2. **Convert PDF pages to JPEG**:
   ```bash
   pdftoppm -jpeg -r 150 document.pdf page
   ```

Options:
- `-r 150`: Sets resolution to 150 DPI
- `-f N`: First page to convert
- `-l N`: Last page to convert

## Dependencies

Required dependencies:

- **pandoc**: `sudo apt-get install pandoc` (for text extraction)
- **docx**: `npm install -g docx` (for creating new documents)
- **LibreOffice**: `sudo apt-get install libreoffice` (for PDF conversion)
- **Poppler**: `sudo apt-get install poppler-utils` (for pdftoppm)
- **defusedxml**: `pip install defusedxml` (for secure XML parsing)
