# 00 - Cleanup Plan

## 📋 **Overview**

This document outlines a comprehensive cleanup plan for the 3DP Commander repository. The plan focuses on removing unused files, consolidating duplicates, and optimizing the codebase without breaking existing functionality.

## 🗑️ **Unused Files**

### Legacy Database Files
| File | Reason | Risk Level | Action |
|------|--------|------------|--------|
| `lib/local-db.ts` | Replaced by Supabase | High | Remove after full migration |
| `scripts/setup-local-db.js` | SQLite setup script | High | Remove after full migration |
| `scripts/create-components-tables.js` | SQLite table creation | High | Remove after full migration |
| `scripts/test-finished-goods.js` | SQLite testing script | High | Remove after full migration |
| `app/api/local-db/*` | Legacy SQLite API routes | High | Remove after full migration |

### Legacy Electron Files
| File | Reason | Risk Level | Action |
|------|--------|------------|--------|
| `electron/main.js` | Desktop app main process | Medium | Remove if no desktop app needed |
| `electron/preload.js` | Desktop app preload script | Medium | Remove if no desktop app needed |
| `installer.nsh` | Electron installer script | Medium | Remove if no desktop app needed |
| `public/icon.ico` | Desktop app icon | Low | Remove if no desktop app needed |

### Legacy Documentation
| File | Reason | Risk Level | Action |
|------|--------|------------|--------|
| `DESKTOP_CHANGES.md` | Desktop app changes | Low | Remove if no desktop app needed |
| `DESKTOP_SETUP.md` | Desktop app setup | Low | Remove if no desktop app needed |
| `FINISHED_GOODS_INVENTORY.md` | Legacy feature docs | Low | Remove if feature not used |

## 🔄 **Duplicate Components**

### Mobile Detection Hooks
| File | Reason | Risk Level | Action |
|------|--------|------------|--------|
| `hooks/use-mobile.tsx` | SSR-unsafe implementation | Medium | Replace with SSR-safe version |
| `components/ui/use-mobile.tsx` | Duplicate implementation | Medium | Consolidate into single hook |

### Toast/Notification Systems
| File | Reason | Risk Level | Action |
|------|--------|------------|--------|
| `hooks/use-toast.ts` | Custom toast implementation | Low | Consider using Sonner consistently |
| `components/ui/toast.tsx` | Radix toast component | Low | Standardize on one toast system |

## 🧹 **Dead Code**

### Unused Imports
| File | Issue | Risk Level | Action |
|------|-------|------------|--------|
| Multiple components | Unused React imports | Low | Remove unused imports |
| API routes | Unused SQLite imports | Medium | Remove after migration |
| Context files | Unused state variables | Low | Clean up unused state |

### Unused Functions
| File | Issue | Risk Level | Action |
|------|-------|------------|--------|
| `lib/utils.ts` | Unused utility functions | Low | Remove unused functions |
| `lib/auth.ts` | Legacy SQLite imports | Medium | Clean up after migration |
| Various components | Unused helper functions | Low | Remove unused functions |

## 📦 **Unused Dependencies**

### Legacy Dependencies
| Package | Reason | Risk Level | Action |
|---------|--------|------------|--------|
| `sqlite3` | Replaced by Supabase | High | Remove after migration |
| `better-sqlite3` | Replaced by Supabase | High | Remove after migration |
| `electron` | No desktop app needed | Medium | Remove if confirmed |
| `electron-builder` | No desktop app needed | Medium | Remove if confirmed |
| `concurrently` | No desktop app needed | Low | Remove if confirmed |
| `wait-on` | No desktop app needed | Low | Remove if confirmed |

### Duplicate Dependencies
| Package | Issue | Risk Level | Action |
|---------|-------|------------|--------|
| `@types/node` | Multiple versions | Medium | Consolidate to single version |
| `@types/react` | Multiple versions | Medium | Consolidate to single version |
| `@types/react-dom` | Multiple versions | Medium | Consolidate to single version |

## 🔧 **Configuration Cleanup**

### Package.json
| Issue | Risk Level | Action |
|-------|------------|--------|
| Legacy scripts | Medium | Remove electron scripts |
| Legacy build config | Medium | Remove electron build config |
| Duplicate dependencies | Medium | Consolidate dependencies |

### Next.js Config
| Issue | Risk Level | Action |
|-------|------------|--------|
| Unused webpack config | Low | Clean up webpack config |
| Deprecated options | Low | Update to current options |

## 📁 **File Organization**

### Suggested Structure
```
app/
├── api/           # API routes
├── (auth)/        # Auth pages
├── (dashboard)/   # Dashboard pages
├── globals.css    # Global styles
├── layout.tsx     # Root layout
└── page.tsx       # Home page

components/
├── ui/            # Base UI components
├── forms/         # Form components
├── pages/         # Page components
└── modals/        # Modal components

lib/
├── supabase/      # Supabase utilities
├── auth/          # Authentication utilities
├── utils/         # General utilities
└── types/         # TypeScript types

hooks/
├── use-auth.ts    # Authentication hooks
├── use-supabase.ts # Supabase hooks
└── use-utils.ts   # Utility hooks
```

## 🚀 **Implementation Strategy**

### Phase 1: Safe Cleanup (Week 1)
1. **Remove unused imports**
   - Scan all files for unused imports
   - Remove unused React imports
   - Clean up unused utility imports

2. **Consolidate duplicate hooks**
   - Create SSR-safe mobile hook
   - Standardize toast system
   - Consolidate utility functions

3. **Clean up configuration**
   - Update ESLint config
   - Consolidate TypeScript types
   - Clean up package.json scripts

### Phase 2: Migration Cleanup (Week 2-3)
1. **Remove SQLite dependencies**
   - Remove SQLite packages
   - Remove SQLite scripts
   - Remove SQLite API routes

2. **Remove Electron dependencies**
   - Remove Electron packages
   - Remove Electron files
   - Remove Electron scripts

3. **Clean up legacy files**
   - Remove legacy documentation
   - Remove unused assets
   - Clean up build configuration

### Phase 3: Optimization (Week 4)
1. **Bundle optimization**
   - Analyze bundle size
   - Remove unused dependencies
   - Optimize imports

2. **Code organization**
   - Reorganize file structure
   - Standardize naming conventions
   - Improve code documentation

## ⚠️ **Risk Assessment**

### High Risk (Requires Careful Testing)
- **SQLite removal:** Must ensure full Supabase migration
- **Electron removal:** Must confirm no desktop app needed
- **API route changes:** Must test all functionality

### Medium Risk (Requires Testing)
- **Hook consolidation:** Must test mobile detection
- **Toast system changes:** Must test notifications
- **Import cleanup:** Must test build process

### Low Risk (Safe to Proceed)
- **Unused imports:** No functional impact
- **Documentation removal:** No code impact
- **Configuration cleanup:** No runtime impact

## 📋 **Cleanup Checklist**

### Phase 1: Safe Cleanup
- [ ] Remove unused React imports
- [ ] Remove unused utility imports
- [ ] Consolidate mobile detection hooks
- [ ] Standardize toast system
- [ ] Update ESLint configuration
- [ ] Consolidate TypeScript types
- [ ] Clean up package.json scripts

### Phase 2: Migration Cleanup
- [ ] Remove SQLite dependencies
- [ ] Remove SQLite scripts
- [ ] Remove SQLite API routes
- [ ] Remove Electron dependencies
- [ ] Remove Electron files
- [ ] Remove legacy documentation
- [ ] Remove unused assets

### Phase 3: Optimization
- [ ] Analyze bundle size
- [ ] Remove unused dependencies
- [ ] Optimize imports
- [ ] Reorganize file structure
- [ ] Standardize naming conventions
- [ ] Improve documentation

## 🎯 **Success Metrics**

### Code Quality
- **Unused imports:** 0 unused imports
- **Duplicate code:** 0 duplicate implementations
- **Dead code:** 0 dead code blocks
- **Bundle size:** Reduced by 20-30%

### Maintenance
- **Dependencies:** Reduced by 15-20%
- **File count:** Reduced by 10-15%
- **Build time:** Improved by 10-15%
- **Development speed:** Improved by 20-30%

### Performance
- **Initial load time:** Improved by 15-20%
- **Bundle size:** Reduced by 25-35%
- **Memory usage:** Reduced by 10-15%
- **Build performance:** Improved by 20-25%

## ⚠️ **Rollback Plan**

### Emergency Rollback
1. **Git revert:** Revert to previous commit
2. **Dependency restore:** Reinstall removed dependencies
3. **Configuration restore:** Restore original configuration
4. **Testing:** Verify all functionality works

### Partial Rollback
1. **Selective revert:** Revert specific changes
2. **Dependency check:** Verify required dependencies
3. **Functionality test:** Test affected features
4. **Documentation update:** Update affected documentation

## 📊 **Cleanup Impact Summary**

### Files to Remove: ~25 files
- Legacy SQLite files: 8 files
- Legacy Electron files: 5 files
- Legacy documentation: 3 files
- Unused assets: 4 files
- Duplicate implementations: 5 files

### Dependencies to Remove: ~8 packages
- SQLite packages: 2 packages
- Electron packages: 5 packages
- Build tools: 1 package

### Code to Clean: ~500 lines
- Unused imports: ~200 lines
- Dead code: ~150 lines
- Duplicate code: ~100 lines
- Configuration cleanup: ~50 lines

### Expected Benefits
- **Bundle size reduction:** 25-35%
- **Build time improvement:** 20-25%
- **Development speed:** 20-30%
- **Maintenance overhead:** 15-20%
