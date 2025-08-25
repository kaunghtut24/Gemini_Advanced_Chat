# Import/Export Functionality Guide

## Overview

The Gemini Advanced Chat now provides robust import/export functionality with enhanced context preservation and session management.

## Key Improvements

### 🔧 **Issues Fixed:**

1. **Current Session Preservation**: 
   - App now warns before overwriting current unsaved sessions
   - Current active sessions remain saved when importing
   - No accidental loss of work

2. **Context Awareness**: 
   - Imported conversations maintain full context for follow-up questions
   - Proper role mapping ensures AI understands conversation history
   - Message validation and cleanup during import

3. **Enhanced Export Format**: 
   - Includes metadata for better compatibility
   - Version information for future-proofing
   - Context validation data

4. **Visual Feedback**: 
   - Import indicator (📥) shows imported conversations
   - Context status visible in the UI
   - Better user messaging during import/export

## Export Functionality

### Enhanced Export Format

```json
{
  "version": "1.0",
  "exportedAt": "2025-08-25T10:30:00.000Z",
  "title": "My Conversation",
  "id": "session_1693123456789",
  "createdAt": 1693123456789,
  "messages": [
    {
      "role": "user",
      "content": "Hello, my name is John",
      "sources": []
    },
    {
      "role": "assistant", 
      "content": "Hi John! How can I help you today?",
      "sources": []
    }
  ],
  "totalMessages": 2,
  "contextInfo": {
    "hasUserMessages": true,
    "hasAssistantMessages": true,
    "conversationStarted": true
  }
}
```

### Export Features

- **Rich Metadata**: Includes timestamps, version info, and context data
- **Better Filenames**: Uses conversation title and timestamp
- **Context Validation**: Verifies conversation has proper structure

## Import Functionality

### Import Process

1. **Validation**: Checks file format and message structure
2. **Role Mapping**: Converts various role formats to standard format
3. **Content Cleanup**: Removes empty messages and fixes formatting
4. **Context Preservation**: Ensures conversation context is maintained
5. **Session Management**: Handles current session preservation

### Supported Import Formats

#### New Enhanced Format
```json
{
  "version": "1.0",
  "title": "Chat Title",
  "messages": [...]
}
```

#### Legacy Simple Format
```json
{
  "title": "Chat Title",
  "messages": [...]
}
```

#### Role Compatibility
The import function automatically handles various role formats:
- `"user"` → `Role.USER`
- `"assistant"` → `Role.ASSISTANT` 
- `"model"` → `Role.ASSISTANT`
- `"human"` → `Role.USER` (auto-corrected)
- `"ai"` → `Role.ASSISTANT` (auto-corrected)
- Unknown roles → Auto-assigned based on message position

### Import Validation

- **Message Structure**: Validates each message has role and content
- **Content Fields**: Supports both `content` and `text` fields
- **Empty Message Filtering**: Removes messages with no content
- **Context Verification**: Ensures conversation has proper flow

## Context Preservation

### How Context is Maintained

1. **Message History**: Complete conversation history is preserved
2. **Role Mapping**: Proper user/assistant role assignment
3. **Content Integrity**: All message content and sources preserved
4. **Sequential Order**: Message order maintained for context flow

### Visual Indicators

- **🧠 Smart Context**: Shows context management is active
- **📥 Import Indicator**: Appears for imported conversations
- **⚠️ Context Warning**: Shows for very long conversations (50+ messages)

### Context Testing

After import, you can verify context preservation:

```javascript
// Test context awareness
await runImportExportTests()

// Test various import formats
await testImportCompatibility()
```

## Session Management

### Current Session Handling

- **Warning Dialog**: Alerts user if current session has unsaved changes
- **Session Preservation**: Current sessions remain saved
- **Smart Switching**: Automatically switches to imported session
- **No Data Loss**: All existing conversations remain intact

### Session Indicators

- Sessions are clearly labeled in the sidebar
- Imported sessions show import date
- Context status visible for each session

## Usage Instructions

### Exporting a Conversation

1. Open the conversation you want to export
2. Click the export button in the sidebar
3. File will be saved with descriptive filename
4. Contains all context and metadata

### Importing a Conversation

1. Click the import button in the sidebar
2. Select a valid JSON export file
3. Confirm if you have unsaved changes
4. New session will be created and activated
5. Full context will be available immediately

### Verifying Import Success

After importing:
- Check for the import indicator (📥) in the interface
- Try asking a follow-up question referencing earlier content
- Look for context confirmation in browser console

## Testing Functions

### Available Console Commands

```javascript
// Test complete import/export cycle
await runImportExportTests()

// Test compatibility with different formats
await testImportCompatibility() 

// Test specific functionality
const exportData = testExportFunction()
const importResult = testImportFunction(exportData)
const contextOk = testContextPreservation(importResult.messages)
```

### What Gets Tested

1. **Export Functionality**: Verifies export format and content
2. **Import Validation**: Tests message parsing and validation
3. **Context Preservation**: Confirms conversation context is maintained
4. **Format Compatibility**: Tests various input formats
5. **Role Mapping**: Verifies proper role conversion

## Best Practices

### For Best Results

1. **Regular Exports**: Export important conversations regularly
2. **Descriptive Titles**: Use clear conversation titles for easy identification
3. **Context Verification**: Test follow-up questions after import
4. **File Management**: Organize exported files with clear naming

### Troubleshooting

#### Import Issues
- **Invalid File**: Ensure file is valid JSON from Gemini Chat export
- **Missing Messages**: Check that file contains message array
- **Context Problems**: Verify messages have proper role assignments

#### Context Issues
- **No Follow-up**: Wait a moment after import before asking questions
- **Mixed Context**: Imported conversations have separate context from current session
- **Long Conversations**: Very long imports may have context window management

## Error Handling

### Import Errors
- **File Format**: Clear error messages for invalid files
- **Data Validation**: Specific feedback on what's wrong
- **Recovery**: Graceful handling of partial failures

### Export Errors
- **No Session**: Warning if no active session to export
- **Empty Session**: Prevents export of empty conversations
- **Browser Issues**: Handles browser compatibility for downloads

## Future Enhancements

### Planned Features
1. **Bulk Import/Export**: Handle multiple conversations
2. **Selective Export**: Choose specific message ranges
3. **Cross-Platform**: Support for other chat formats
4. **Cloud Sync**: Optional cloud storage integration

This enhanced import/export system ensures that your conversations are properly preserved with full context awareness, making it easy to continue complex discussions across sessions.
