# Content Templates Guide

## Overview
The Templates system allows users to customize how AI generates content for different tones and styles. Templates are stored in localStorage and persist across sessions.

## Features

### 1. **Pre-built Templates**
5 default templates are created on first load:
- **Professional** - Business-focused, clear, and authoritative
- **Casual** - Friendly, conversational, and relatable
- **Inspirational** - Motivational and uplifting
- **Question-Based** - Drives engagement through questions
- **Storytelling** - Narrative-driven and engaging

### 2. **Create New Templates**
Users can create custom templates with:
- Template name
- Tone selection (dropdown)
- Description
- LinkedIn template (with placeholders)
- Twitter template (with placeholders)

### 3. **Edit Existing Templates**
- Click the edit icon on any template card
- Modify any field
- Changes are saved to localStorage immediately
- Toast notification confirms save

### 4. **View Template Details**
- Click "View" to see the full template
- Shows both LinkedIn and Twitter formats
- Displays template variables explanation

### 5. **Set Default Template**
- Click the star icon to set/unset default
- Default template is auto-selected in Dashboard
- Only one template can be default at a time

### 6. **Delete Templates**
- Click trash icon to delete
- Cannot delete the default template
- Confirmation dialog prevents accidents

## Template Variables

Templates use placeholders that are replaced during generation:

- `{idea}` - The user's main idea/topic
- `{point1}` - First key point extracted from the idea
- `{point2}` - Second key point extracted from the idea
- `{point3}` - Third key point extracted from the idea

## Example Template

### LinkedIn Template:
```
🚀 {idea}

Here are my key takeaways:
• {point1}
• {point2}
• {point3}

What's your experience with this? Let me know in the comments!

#Business #Professional #Leadership
```

### Twitter Template:
```
{idea}

Key insights:
• {point1}
• {point2}
• {point3}

What do you think?
```

## User Flow

1. **Dashboard**: User selects template from dropdown
2. **Type Idea**: User enters their raw idea
3. **Generate**: AI extracts key points and applies template
4. **Preview**: User sees formatted posts for each platform
5. **Edit**: User can edit template or generated content
6. **Publish**: Final content is ready for social media

## Storage

- **Location**: Browser localStorage
- **Key**: `levercast_templates`
- **Format**: JSON array of Template objects
- **Persistence**: Survives page refreshes, browser restarts

## Template Object Structure

```typescript
interface Template {
  id: string                  // Unique identifier
  name: string               // Display name
  tone: 'professional' | 'casual' | 'inspirational' | 'question-based' | 'storytelling'
  description: string        // Brief description
  linkedinTemplate: string   // LinkedIn format with placeholders
  twitterTemplate: string    // Twitter format with placeholders
  isDefault: boolean        // Whether this is the default template
  createdAt: string         // ISO timestamp
  updatedAt: string         // ISO timestamp
}
```

## Design Mode Notes

In Design Mode, all template operations work fully:
- ✅ Create new templates
- ✅ Edit existing templates
- ✅ Delete templates (except default)
- ✅ Set default template
- ✅ Templates persist across sessions
- ✅ Templates integrate with AI generation

When transitioning to production:
- Replace localStorage with database (Prisma + PostgreSQL)
- Add user authentication (templates per user)
- Add template sharing/marketplace feature
- Add template analytics (usage stats)

## Future Enhancements

- **Import/Export**: Share templates as JSON files
- **Template Library**: Public marketplace of templates
- **AI-Generated Templates**: Let AI create templates based on examples
- **A/B Testing**: Compare template performance
- **Template Analytics**: Track which templates generate best engagement

