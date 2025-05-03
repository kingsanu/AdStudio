# Canva-Editor Project Documentation

## Table of Contents
1. [Project Overview](#project-overview)
2. [Architecture](#architecture)
3. [Frontend Routes](#frontend-routes)
4. [Backend API Routes](#backend-api-routes)
5. [Core Components](#core-components)
6. [Custom Hooks](#custom-hooks)
7. [State Management](#state-management)
8. [Data Flow](#data-flow)
9. [Authentication](#authentication)
10. [Template Management](#template-management)
11. [Image Management](#image-management)
12. [WhatsApp Integration](#whatsapp-integration)
13. [Video Processing](#video-processing)
14. [Best Practices Analysis](#best-practices-analysis)
15. [Improvement Recommendations](#improvement-recommendations)

## Project Overview

The Canva-Editor project is a web-based design tool similar to Canva, allowing users to create, edit, and save design templates. It features a rich editor interface with support for text, images, shapes, and other design elements. The application includes template management, image uploads, WhatsApp integration for campaigns, and video processing capabilities.

Key features include:
- Template creation and editing with a drag-and-drop interface
- Text template creation for quick text-based designs
- Public and private template libraries
- Image upload and management
- Background removal for images
- WhatsApp campaign integration
- Video generation from templates
- User authentication
- Favorites/saved templates

The project is built using React for the frontend and Node.js/Express for the backend, with MongoDB for data storage and Azure Blob Storage for file storage.

## Architecture

The project follows a client-server architecture:

### Frontend
- Built with React + TypeScript + Vite
- Uses React Router for routing
- Employs a custom editor package (`packages/editor`) for the core editing functionality
- Uses Shadcn UI components for the interface
- Implements context-based state management

### Backend
- Node.js with Express
- MongoDB for database storage
- Azure Blob Storage for file storage
- RESTful API endpoints for template and image management
- Integration with external services (WhatsApp API, image processing)

### Project Structure
```
canva-editor/
├── .git/                  # Git repository
├── .swc/                  # SWC compiler cache
├── api/                   # Backend API code
│   ├── config/            # Configuration files
│   ├── controllers/       # API controllers
│   ├── data/              # Static data
│   ├── json/              # JSON data files
│   ├── models/            # MongoDB models
│   ├── routes/            # API routes
│   ├── temp/              # Temporary files
│   ├── utils/             # Utility functions
│   └── app.js             # Main Express application
├── dist/                  # Build output
├── node_modules/          # Dependencies
├── packages/              # Custom packages
│   └── editor/            # Core editor package
│       ├── src/           # Editor source code
│       │   ├── components/ # Editor components
│       │   ├── hooks/      # Custom hooks
│       │   ├── layout/     # Layout components
│       │   ├── types/      # TypeScript types
│       │   └── utils/      # Utility functions
├── public/                # Static assets
├── src/                   # Frontend application code
│   ├── components/        # UI components
│   ├── constants/         # Constants
│   ├── contexts/          # React contexts
│   ├── lib/               # Library code
│   ├── models/            # Data models
│   ├── pages/             # Page components
│   ├── services/          # API services
│   └── utils/             # Utility functions
├── deploy scripts         # Deployment scripts
└── configuration files    # Various config files
```

## Frontend Routes

The application defines the following routes in `src/App.tsx`:

| Route | Component | Description | Protection |
|-------|-----------|-------------|------------|
| `/` | `Home` | Landing page | Public |
| `/auth` | `PhoneAuth` | Authentication page | Public |
| `/editor` | `Editor` | Main editor interface | Protected |
| `/new-text` | `TextTemplateEditor` | Text template editor | Protected |
| `/dashboard` | `Dashboard` | User dashboard | Protected |
| `/favorites` | `Favorites` | User's favorite templates | Protected |
| `*` | `NotFound` | 404 page | Public |

## Backend API Routes

The backend API (`api/app.js`) defines the following route groups:

| Route Group | File | Description |
|-------------|------|-------------|
| `/api` | `templates.js` | Template management (CRUD operations) |
| `/api` | `textTemplates.js` | Text template management |
| `/api` | `uploadedImages.js` | Image upload and management |
| `/api` | `imageProcessing.js` | Image processing (background removal) |
| `/api` | `videoProcessing.js` | Video generation from templates |
| `/api` | `whatsappSettings.js` | WhatsApp integration settings |

### Key API Endpoints

#### Template Management
- `POST /api/upload-template` - Save a new template
- `PUT /api/upload-template/:id` - Update an existing template
- `GET /api/templates` - Get all templates with filtering options
- `GET /api/templates/:id` - Get a specific template by ID
- `DELETE /api/templates/:id` - Delete a template

#### Image Management
- `POST /api/upload-image` - Upload a new image
- `GET /api/user-images` - Get user's uploaded images
- `GET /api/public-images` - Get public images

#### WhatsApp Integration
- `GET /api/whatsapp/session/qr/{USERNAME}/image` - Get QR code for WhatsApp login
- `POST /api/whatsapp/client/sendMessage/{USERNAME}` - Send WhatsApp message
- `GET /api/whatsapp/session/status/{USERNAME}` - Check WhatsApp session status
- `POST /api/whatsapp/session/restart/{USERNAME}` - Restart WhatsApp session

#### Other Endpoints
- Various search endpoints for templates, images, shapes, etc.
- Font management endpoints
- Video processing endpoints

## Core Components

### Editor Components
The core editor functionality is implemented in the `packages/editor` package:

- `CanvaEditor` (`packages/editor/src/components/editor/CanvaEditor.tsx`) - Main editor component
- `DesignFrame` (`packages/editor/src/components/editor/DesignFrame.tsx`) - Frame for design elements
- `DesignPage` (`packages/editor/src/components/editor/DesignPage.tsx`) - Page component
- `SaveTemplateDialog` (`packages/editor/src/components/editor/SaveTemplateDialog.tsx`) - Dialog for saving templates
- `SaveTextTemplateDialog` (`packages/editor/src/components/editor/SaveTextTemplateDialog.tsx`) - Dialog for saving text templates
- `CampaignDialog` (`packages/editor/src/components/editor/CampaignDialog.tsx`) - Dialog for creating WhatsApp campaigns
- `AnimationPanel` (`packages/editor/src/components/editor/AnimationPanel.tsx`) - Panel for animations
- `TransitionPanel` (`packages/editor/src/components/editor/TransitionPanel.tsx`) - Panel for transitions

### Frontend Components
- `Editor` (`src/Editor.tsx`) - Container for the CanvaEditor
- `TextTemplateEditor` (`src/TextTemplateEditor.tsx`) - Container for text template editing
- `Dashboard` (`src/pages/Editor/Dashboard.tsx`) - Dashboard page
- `Favorites` (`src/pages/Favorites.tsx`) - Favorites page
- Various UI components in `src/components/`

## Custom Hooks

The project uses several custom hooks for state management and functionality:

### Editor Hooks
- `useEditor` (`packages/editor/src/hooks/useEditor.ts`) - Access editor state and actions
- `useEditorStore` (`packages/editor/src/hooks/useEditorStore.ts`) - Core editor state management
- `useLayer` (`packages/editor/src/hooks/useLayer.ts`) - Layer management
- `useSelectedLayers` (`packages/editor/src/hooks/useSelectedLayers.ts`) - Selected layers management
- `useSelectLayer` (`packages/editor/src/hooks/useSelectLayer.ts`) - Layer selection
- `useResizeLayer` (`packages/editor/src/hooks/useResizeLayer.ts`) - Layer resizing
- `useRotateLayer` (`packages/editor/src/hooks/useRotateLayer.ts`) - Layer rotation
- `useDragLayer` (`packages/editor/src/hooks/useDragLayer.ts`) - Layer dragging
- `useZoomPage` (`packages/editor/src/hooks/useZoomPage.ts`) - Page zooming
- `useSyncService` (`packages/editor/src/hooks/useSyncService.ts`) - Synchronization service

### Utility Hooks
- `useClickOutside` (`packages/editor/src/hooks/useClickOutside.tsx`) - Detect clicks outside elements
- `useDebouncedEffect` (`packages/editor/src/hooks/useDebouncedEffect.tsx`) - Debounced effects
- `useForwardedRef` (`packages/editor/src/hooks/useForwardedRef.ts`) - Forward refs
- `useLinkedRef` (`packages/editor/src/hooks/useLinkedRef.ts`) - Link refs
- `useMobileDetect` (`packages/editor/src/hooks/useMobileDetect.ts`) - Mobile detection
- `useShortcut` (`packages/editor/src/hooks/useShortcut.ts`) - Keyboard shortcuts

## State Management

The project uses a combination of React Context and custom state management:

### Editor State
- Managed by `useEditorStore` hook
- Uses Immer for immutable state updates
- Implements history management (undo/redo)
- Tracks selected layers, hover state, and other editor state

### Authentication State
- Managed by `AuthContext` (`src/contexts/AuthContext.tsx`)
- Handles user authentication and session management

### Template State
- Managed by `templateService` (`src/services/templateService.ts`)
- Handles template loading, saving, and management

## Data Flow

### Template Saving Flow
1. User creates/edits a design in the editor
2. User clicks "Save as Template" button
3. `SaveTemplateDialog` component opens
4. User enters template details (name, description, tags, visibility)
5. On save:
   - Editor state is serialized using `query.serialize()`
   - Data is minified/packed using `pack()` function
   - Preview image is generated using `domToPng`
   - Template data and preview are sent to the server via API
   - Server saves template metadata to MongoDB
   - Template data and preview image are stored in Azure Blob Storage

### Template Loading Flow
1. User selects a template from the dashboard
2. Template ID is passed to the editor via URL parameter
3. Editor loads the template using `templateService.getTemplateById()`
4. Template data is fetched from the server
5. If it's another user's template, a copy is created
6. Template data is loaded into the editor

## Authentication

The application uses a phone-based authentication system:

- `PhoneAuth` component (`src/pages/auth/PhoneAuth.tsx`) handles authentication
- `AuthContext` (`src/contexts/AuthContext.tsx`) provides authentication state
- `ProtectedRoute` component (`src/components/auth/ProtectedRoute.tsx`) protects routes
- Authentication token is stored in cookies/localStorage

## Template Management

Templates are managed through the `templateService` (`src/services/templateService.ts`):

### Template Data Structure
```typescript
interface Template {
  _id: string;
  title: string;
  description: string;
  templateUrl: string;
  thumbnailUrl: string;
  tags: string[];
  createdAt: string;
  userId: string;
  pages?: number;
  isPublic: boolean;
}
```

### Template Storage
- Template metadata is stored in MongoDB
- Template data (JSON) is stored in Azure Blob Storage
- Template previews (PNG) are stored in Azure Blob Storage

### Favorites System
- Favorites are stored in localStorage
- `templateService` provides methods for managing favorites

## Image Management

Images are managed through the `uploadedImage` model and API:

### Image Data Structure
```typescript
interface UploadedImage {
  _id: string;
  userId: string;
  url: string;
  filename: string;
  createdAt: string;
}
```

### Image Storage
- Image metadata is stored in MongoDB
- Image files are stored in Azure Blob Storage
- Background removal is handled by a separate API endpoint

## WhatsApp Integration

The application integrates with WhatsApp for campaign management:

- `CampaignDialog` component handles campaign creation
- WhatsApp API endpoints handle session management and message sending
- QR code authentication for WhatsApp login

## Video Processing

The application supports video generation from templates:

- Templates can be converted to slideshows
- Animations and transitions can be applied
- Video processing is handled by the backend

## Best Practices Analysis

### Strengths
1. **Modular Architecture**: The project is well-organized with clear separation of concerns.
2. **Reusable Components**: The editor package is designed to be reusable.
3. **Type Safety**: TypeScript is used throughout the project.
4. **Error Handling**: Comprehensive error handling in API calls and UI.
5. **Modern UI**: Uses Shadcn UI components for a consistent look and feel.
6. **Responsive Design**: The UI adapts to different screen sizes.

### Areas for Improvement

#### Code Organization
1. **Inconsistent File Structure**: Some components are in the root `src` directory while others are in subdirectories.
2. **Duplicate Code**: There's some duplication between `Editor.tsx` and `TextTemplateEditor.tsx`.
3. **Large Components**: Some components like `SaveTemplateDialog.tsx` are quite large and could be broken down.

#### State Management
1. **Mixed State Management**: The project uses a mix of context, custom hooks, and local state.
2. **Global State**: Some state that should be global is managed locally.

#### Performance
1. **Large Bundle Size**: The editor package is quite large and could benefit from code splitting.
2. **Inefficient Data Loading**: Templates are loaded all at once instead of using pagination.

#### Security
1. **Client-Side Authentication**: Some authentication logic is handled on the client side.
2. **Exposed API Endpoints**: Some API endpoints don't properly validate user permissions.

#### Code Quality
1. **ESLint Disabling**: Many files have ESLint rules disabled at the top.
2. **Any Types**: There's frequent use of `any` type in TypeScript.
3. **Console Logs**: Many console.log statements are left in production code.

## Improvement Recommendations

### Code Organization
1. **Standardize File Structure**: Move all page components to the `pages` directory.
2. **Create Feature Folders**: Organize code by feature rather than type.
3. **Extract Common Logic**: Create shared utilities for template handling.

### State Management
1. **Centralize State**: Use a more consistent state management approach.
2. **Implement Context Providers**: Create context providers for different features.

### Performance
1. **Implement Code Splitting**: Use dynamic imports for large components.
2. **Add Pagination**: Implement proper pagination for template loading.
3. **Optimize Image Loading**: Use lazy loading and responsive images.

### Security
1. **Server-Side Validation**: Ensure all user inputs are validated on the server.
2. **Proper Authentication**: Implement proper JWT-based authentication.
3. **API Security**: Add rate limiting and proper permission checks.

### Code Quality
1. **Enforce ESLint Rules**: Remove ESLint disabling directives.
2. **Improve Type Safety**: Replace `any` types with proper interfaces.
3. **Clean Up Console Logs**: Remove or replace with proper logging.
4. **Add Unit Tests**: Implement comprehensive unit tests.

### Feature Enhancements
1. **Offline Support**: Add offline editing capabilities.
2. **Collaborative Editing**: Implement real-time collaborative editing.
3. **Template Categories**: Add categories for better organization.
4. **Advanced Analytics**: Add usage analytics for templates and campaigns.
5. **AI Features**: Integrate AI for design suggestions and content generation.

## Conclusion

The Canva-Editor project is a comprehensive design tool with a rich feature set. While there are areas for improvement in code organization, state management, and performance, the overall architecture is solid and provides a good foundation for future development. By addressing the recommendations outlined above, the project can be made more maintainable, performant, and secure.
