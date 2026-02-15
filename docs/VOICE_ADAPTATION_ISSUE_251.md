# Voice Adaptation: Build frontend UI for voice sample management

**Source:** [automate-my-blog-backend#251](https://github.com/Automate-My-Blog/automate-my-blog-backend/issues/251)

**Related:** [VOICE_ADAPTATION_FRONTEND_HANDOFF.md](./VOICE_ADAPTATION_FRONTEND_HANDOFF.md) (API contracts, auth, polling, voice comparison).

---

## Overview

Create frontend interface at **`/settings/voice-adaptation`** for uploading, managing, and viewing voice samples and aggregated profiles.

---

## Components Needed

### 1. Upload Section

- Drag-and-drop file upload component (react-dropzone or similar)
- Source type selector dropdown (`blog_post`, `whitepaper`, `email`, `newsletter`, `social_post`, `call_summary`, `other_document`)
- Bulk upload support (up to 10 files at once)
- File format guidance and validation (`.txt`, `.md`, `.html`, `.csv`, `.pdf`, `.docx`, `.json`, `.eml`)
- Progress indicators during upload
- Success/error notifications

### 2. Samples List Table

- Display all uploaded samples with columns:
  - Source Type (with icon)
  - Title/Filename
  - Word Count
  - Quality Score (badge with color coding)
  - Status (pending/processing/completed/failed)
  - Upload Date
  - Actions (View Details, Deactivate, Re-analyze, Delete)
- Filter by source type
- Sort by date, quality score, status
- Search by title/filename

### 3. Voice Profile Dashboard

- Confidence Score gauge (0–100% with color coding)
- Sample count and total words analyzed
- Visual charts:
  - Sentence length distribution (bar chart)
  - Formality level (gauge/slider)
  - Paragraph length (histogram)
  - Common phrases (word cloud or tag cloud)
- Profile Last Updated timestamp
- Export profile option (JSON download)

### 4. Settings Panel

- Enable/Disable voice adaptation toggle
- Adaptation strength slider (Subtle / Moderate / Strong)
- Min samples required input (default: 3)
- Auto-update on new samples checkbox
- Reset profile button (with confirmation modal)

### 5. Blog Generation Integration

- Voice Profile indicator badge on generation page
- Show: Active (e.g. 85% confidence) or No Voice Profile
- Link to upload samples if not active
- Optional: Side-by-side preview comparison (your voice vs generic)

---

## API Integration

- `POST /api/v1/voice-samples/upload`
- `GET /api/v1/voice-samples/:organizationId`
- `GET /api/v1/voice-samples/:organizationId/profile`
- `DELETE /api/v1/voice-samples/:sampleId`
- `POST /api/v1/voice-samples/:sampleId/reanalyze`

*(Full request/response shapes and auth: see VOICE_ADAPTATION_FRONTEND_HANDOFF.md.)*

---

## Acceptance Criteria

- [ ] All components implemented and styled
- [ ] File upload working with validation
- [ ] Samples list with all features (filter, sort, search, actions)
- [ ] Voice profile dashboard with visualizations
- [ ] Settings panel functional
- [ ] API integration complete
- [ ] Responsive design
- [ ] Error handling with user-friendly messages
- [ ] Loading states for async operations

---

## Implementation note

- **Settings panel** (enable/disable, strength, min samples, auto-update, reset): confirm with backend whether these are persisted API settings or frontend-only preferences; handoff doc does not yet define endpoints for them.
- **View Details** action: handoff doc does not define a “sample detail” endpoint; can show inline expansion or modal with existing sample fields until/unless backend adds one.
- **Deactivate** maps to `DELETE /api/v1/voice-samples/:sampleId` (soft delete; handoff §3.4).
