# Code Review: common.js

This document outlines style issues and modernization opportunities in the
`common.js` file for the Dominion Strategy Wiki.

## Overview

The code is functional but uses outdated JavaScript patterns and practices. It
was written by a previous contributor and needs modernization to improve
maintainability, readability, and follow current best practices.

## Issues by Severity

### 🔴 HIGH SEVERITY - Immediate Action Needed

#### 1. String Concatenation Instead of Template Literals

**Frequency**: Very High (20+ instances) **Lines**: 15, 43-48, 109-115, 117-118,
137-144, 146-147, 172, 184-193, 215-218, 257-262, 300, 368, 412, 420, 451,
512-513, 531-536

**Current**:

```javascript
document.cookie =
  "cardbordersize=" + curVal + "; expires=" + CookieDate.toUTCString() + ";";

optionLi.innerHTML =
  '<label for="' +
  optionId +
  '" style="cursor:pointer; user-select:none">' +
  optionText +
  '&nbsp;</label><input style="height:8px" type="checkbox" id="' +
  optionId +
  '" ' +
  checked +
  ">";
```

**Should be**:

```javascript
document.cookie = `cardbordersize=${curVal}; expires=${CookieDate.toUTCString()};`;

optionLi.innerHTML = `<label for="${optionId}" style="cursor:pointer; user-select:none">
  ${optionText}&nbsp;</label><input style="height:8px" type="checkbox" id="${optionId}" ${checked}>`;
```

**Impact**: Significantly improves readability, reduces concatenation errors,
makes complex string building much cleaner.

#### 2. Loose Equality (==) Instead of Strict Equality (===)

**Frequency**: High (15+ instances) **Lines**: 20, 23, 104, 107, 116, 136, 145,
175, 251, 272, 274, 279, 382, 414, 422, 480, 482, 486, 525, 546, 548, 552, 566,
571

**Current**:

```javascript
if (c.charAt(0) == " ")
if (curVal == "")
if (sortby == "sortbyname")
```

**Should be**:

```javascript
if (c.charAt(0) === " ")
if (curVal === "")
if (sortby === "sortbyname")
```

**Impact**: Prevents type coercion bugs, makes comparisons explicit and
predictable.

### 🟡 MEDIUM SEVERITY - Important Improvements

#### 3. Variable Hoisting with var Instead of let/const

**Frequency**: Very High (30+ instances) **Lines**: Throughout the file

**Current**:

```javascript
var name = cname + "=";
var decodedCookie = decodeURIComponent(document.cookie);
for (var i = 0; i < ca.length; i++) {
```

**Should be**:

```javascript
const name = cname + "=";
const decodedCookie = decodeURIComponent(document.cookie);
for (let i = 0; i < ca.length; i++) {
```

**Impact**: Prevents accidental reassignment, provides block scoping, makes
intent clearer.

#### 4. Redundant Boolean Comparisons

**Frequency**: Medium (3 instances) **Lines**: 251, 525, 571

**Current**:

```javascript
if (optionInput.checked == true)
if (clickedThings == false)
```

**Should be**:

```javascript
if (optionInput.checked)
if (!clickedThings)
```

**Impact**: Cleaner, more idiomatic JavaScript.

#### 5. Magic Numbers Without Constants

**Frequency**: Medium (10+ instances) **Lines**: 39, 61-87, 218, 220

**Current**:

```javascript
curVal = 11;
case 75: newSize = 4; break;
case 100: newSize = 5; break;
```

**Should be**:

```javascript
const BORDER_SIZE_ENABLED = 11;
const SIZE_MAPPINGS = {
  75: 4,
  100: 5,
  120: 6,
  150: 8,
  160: 9,
  200: 11,
  320: 11,
  375: 21,
  800: 21,
};
```

**Impact**: Makes code self-documenting, easier to maintain and modify.

### 🟢 LOW SEVERITY - Code Quality Improvements

#### 6. Inconsistent Variable Naming

**Frequency**: Low (5 instances) **Lines**: 41, 255, 510, 529

**Current**:

```javascript
var CookieDate = new Date(); // PascalCase
```

**Should be**:

```javascript
const cookieDate = new Date(); // camelCase
```

**Impact**: Consistency with JavaScript naming conventions.

#### 7. DOM Query Repetition

**Frequency**: Medium **Lines**: 172, 182, 195, 249, 296, etc.

**Current**:

```javascript
var optionInput = document.querySelector("#cardBorderChanger");
// ... later ...
var optionInput = document.querySelector("#cardBorderChanger");
```

**Should consider**:

```javascript
const optionInput = document.querySelector("#cardBorderChanger");
// Cache and reuse
```

**Impact**: Minor performance improvement, reduces DOM queries.

#### 8. Function Style Consistency

**Current**: Mix of function declarations **Consider**: Arrow functions for
callbacks, consistent style

## Modernization Opportunities

### Template Literals for Complex HTML

The HTML generation in `addSiteOption` and similar functions would be much
cleaner with template literals and proper formatting.

### Object Destructuring

Some parameter handling could benefit from destructuring patterns.

### Modern Array Methods

Consider using `forEach`, `map`, `filter` where appropriate instead of
traditional for loops.

### Const for Immutable Values

Many variables that never change could be `const` declarations.

## Recommended Action Plan

### Phase 1 (High Priority)

1. Replace all string concatenation with template literals
2. Change all `==` to `===` comparisons
3. Fix redundant boolean comparisons

### Phase 2 (Medium Priority)

1. Replace `var` with `let`/`const` appropriately
2. Extract magic numbers to named constants
3. Standardize variable naming

### Phase 3 (Low Priority)

1. Cache repeated DOM queries
2. Consider modernizing function styles
3. Add any missing semicolons/formatting

## Testing Considerations

After each phase, thoroughly test:

- All checkbox preferences save/load correctly
- Card border functionality works
- Card sorting operates properly
- Popup positioning functions correctly
- Expansion link visibility toggles work

The functionality should remain identical after refactoring - this is purely a
code quality and maintainability improvement.
