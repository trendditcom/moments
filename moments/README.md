# Moments Folder

This folder contains automatically generated moment files saved by the Moments application.

## Structure

- Each moment is saved as a markdown file with YAML frontmatter metadata
- Filenames follow the pattern: `YYYY-MM-DD-{type}-{title}-{id}.md`
- Files are automatically created when moments are analyzed
- Files can be manually edited and will be loaded back into the app

## File Format

```markdown
---
id: unique-moment-id
title: "Moment Title"
description: "Brief description"
extractedAt: "2024-01-01T00:00:00.000Z"
source:
  type: company | technology
  name: "Source Name"
  # ... other metadata
classification:
  microFactors: [...]
  macroFactors: [...]
  # ... other classification data
impact:
  score: 0-100
  reasoning: "Why this score"
# ... other metadata
---

# Moment Title

Content and analysis...
```

## Configuration

Moment file persistence is configured in `config.yml`:

```yaml
catalogs:
  moments:
    auto_save: true # Automatically save analyzed moments
    sync_mode: "bidirectional" # Load from files on startup
```