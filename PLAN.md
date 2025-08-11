# TypeScript Migration Plan: Dominion Strategy Wiki

This document outlines the plan for migrating the Dominion Strategy Wiki JavaScript codebase to TypeScript.

## Overview

The current codebase consists of a single `common.js` file that provides interactive functionality for the MediaWiki-based Dominion Strategy Wiki. This includes card border management, sorting systems, popup positioning, sidebar navigation, and user preference management.

## Migration Goals

- **Type Safety**: Add comprehensive type definitions to prevent runtime errors
- **Better IDE Support**: Enable better autocomplete, refactoring, and error detection
- **Maintainability**: Make the codebase easier to understand and modify
- **Documentation**: Replace JSDoc comments with TypeScript interfaces and types
- **Modern JavaScript**: Leverage TypeScript's modern features while maintaining compatibility

## Phase 1: Setup and Configuration

### 1.1 TypeScript Environment Setup
- [ ] Add TypeScript as a development dependency
- [ ] Configure `tsconfig.json` for MediaWiki/browser environment
- [ ] Set up build process to compile TypeScript to JavaScript
- [ ] Configure source maps for debugging

### 1.2 Build Integration
- [ ] Create build script to compile TypeScript
- [ ] Set up file watching for development
- [ ] Ensure output JavaScript maintains MediaWiki compatibility
- [ ] Configure output to match current file structure

## Phase 2: Type Definitions

### 2.1 External Type Definitions
- [ ] Install DOM type definitions (`@types/dom`)
- [ ] Add MediaWiki type definitions or create custom declarations
- [ ] Create type definitions for jQuery (used in fallback)

### 2.2 Core Interfaces and Types
- [ ] Define `CookieOptions` interface for cookie management
- [ ] Create `SizeMapping` type for image width to border size mappings
- [ ] Define `SiteOptionConfig` interface for user preference options
- [ ] Create `SortMethod` union type ('sortbyname' | 'sortbycost')
- [ ] Define `CardElement` interface for card DOM elements

## Phase 3: File Migration

### 3.1 Rename and Initial Conversion
- [ ] Rename `common.js` to `common.ts`
- [ ] Fix immediate TypeScript errors (mostly type annotations)
- [ ] Add basic type annotations to function parameters

### 3.2 Function-by-Function Conversion

#### Cookie Management Functions
- [ ] Add types to `getCookie(cname: string): string`
- [ ] Type the cookie setting functions with proper parameter types

#### Border Management Functions  
- [ ] Add types to `getNewSize(width: number): number`
- [ ] Type `setBlackBorder(bSize: number): void`
- [ ] Add proper DOM element types throughout

#### Site Option Functions
- [ ] Create comprehensive interface for `addSiteOption` parameters
- [ ] Type all the option handler functions
- [ ] Add proper event handler types

#### Sorting Functions
- [ ] Add types to `sortSortables` function parameters
- [ ] Type the card sorting logic with proper interfaces
- [ ] Add types to sort button handlers

#### Navigation Functions
- [ ] Type the expansion link functions
- [ ] Add proper DOM manipulation types

## Phase 4: Advanced TypeScript Features

### 4.1 Generic Types and Utilities
- [ ] Create generic types for DOM query selectors
- [ ] Add utility types for common patterns
- [ ] Implement proper error handling with typed exceptions

### 4.2 Enum Definitions
- [ ] Convert magic strings to enums (e.g., cookie names, CSS classes)
- [ ] Create enums for expansion names and IDs
- [ ] Define enums for sorting methods and display states

### 4.3 Module Organization
- [ ] Consider splitting large functions into smaller modules
- [ ] Create separate modules for distinct functionality areas
- [ ] Implement proper module exports and imports

## Phase 5: Testing and Validation

### 5.1 Type Checking
- [ ] Ensure all TypeScript strict mode checks pass
- [ ] Validate all function signatures and return types
- [ ] Check DOM manipulation code for type safety

### 5.2 Compiled Output Validation
- [ ] Compare compiled JavaScript output to original JavaScript
- [ ] Ensure function signatures match exactly
- [ ] Verify variable declarations and scoping remain identical
- [ ] Confirm no TypeScript-specific runtime code is included
- [ ] Validate that compiled JS maintains same behavior patterns

## Phase 6: Documentation and Cleanup

### 6.1 Type Documentation
- [ ] Replace JSDoc comments with TypeScript interfaces
- [ ] Add comprehensive type documentation
- [ ] Document any complex type relationships

### 6.2 Code Quality
- [ ] Remove redundant type annotations
- [ ] Optimize type definitions for clarity
- [ ] Add TODO comments for future improvements

## Implementation Strategy

### Incremental Approach
1. Start with basic type annotations
2. Add interfaces for complex objects
3. Gradually increase strictness
4. Refactor for better type safety

### Risk Mitigation
- Keep original JavaScript as backup during migration
- Test thoroughly at each phase
- Maintain compatibility with existing MediaWiki setup
- Document any breaking changes

## Success Criteria

- [ ] All TypeScript compilation errors resolved
- [ ] Compiled JavaScript output functionally identical to original
- [ ] Comprehensive type coverage (>90%)
- [ ] No TypeScript-specific runtime artifacts in compiled output
- [ ] Improved developer experience with IDE support
- [ ] Maintainable and well-documented type definitions

## Timeline Estimate

- **Phase 1**: 1-2 days (Setup)
- **Phase 2**: 2-3 days (Type definitions)
- **Phase 3**: 3-4 days (Core migration)
- **Phase 4**: 2-3 days (Advanced features)
- **Phase 5**: 2-3 days (Testing)
- **Phase 6**: 1-2 days (Documentation)

**Total Estimated Time**: 11-17 days

## Notes

- This migration maintains the current architecture and functionality
- The focus is on adding type safety, not refactoring the core logic
- Output JavaScript should be functionally identical to the original
- Consider this a foundation for future TypeScript development