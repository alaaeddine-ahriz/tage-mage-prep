# Correction du bounce sur mobile après fermeture de modale

## 🐛 Problème

Après avoir ouvert et fermé une modale en format mobile, l'effet de bounce (overscroll) revenait, même s'il avait été désactivé auparavant. Ce comportement indésirable se produisait car :

1. Les modales manipulaient uniquement `document.body.style.overflow`
2. Elles ne géraient pas `overscrollBehavior`, qui contrôle l'effet de bounce
3. À la fermeture, `overflow` était restauré mais `overscrollBehavior` n'était pas maintenu

## ✅ Solution

La correction a été appliquée en trois parties :

### 1. CSS global permanent (`app/globals.css`)

Ajout de `overscroll-behavior-y: none` de façon permanente sur `html` et `body` :

```css
@layer base {
  body {
    @apply bg-background text-foreground;
    overscroll-behavior-y: none;
  }
  html {
    overscroll-behavior-y: none;
  }
}
```

**Pourquoi ?** Cela désactive l'effet de bounce de façon permanente sur toute l'application, indépendamment des manipulations JavaScript.

### 2. Gestion dans les composants Radix UI (`Dialog` et `Sheet`)

Modification des composants de base de Radix UI pour préserver `overscrollBehavior` :

#### `components/ui/dialog.tsx`
```typescript
function Dialog({ ...props }: React.ComponentProps<typeof DialogPrimitive.Root>) {
  const { open } = props
  
  // Preserve overscroll-behavior when Dialog opens/closes
  React.useEffect(() => {
    if (open) {
      document.body.style.overscrollBehavior = 'none'
    }
    // Don't reset on close - let it stay as 'none'
  }, [open])
  
  return <DialogPrimitive.Root data-slot="dialog" {...props} />
}
```

#### `components/ui/sheet.tsx`
```typescript
function Sheet({ ...props }: React.ComponentProps<typeof SheetPrimitive.Root>) {
  const { open } = props
  
  // Preserve overscroll-behavior when Sheet opens/closes
  React.useEffect(() => {
    if (open) {
      document.body.style.overscrollBehavior = 'none'
    }
    // Don't reset on close - let it stay as 'none'
  }, [open])
  
  return <SheetPrimitive.Root data-slot="sheet" {...props} />
}
```

**Pourquoi ?** Radix UI bloque automatiquement `overflow` mais ne gère pas `overscrollBehavior`. Ces composants de base sont utilisés par tous les Dialog/Sheet de l'application, donc la correction s'applique partout.

### 3. Gestion dans les modales custom

Modification de tous les composants qui manipulent le scroll du body pour également gérer `overscrollBehavior` :

#### Fichiers modifiés :

1. **`components/ui/mobile-form-sheet.tsx`**
2. **`components/ui/mobile-carousel.tsx`**
3. **`components/dashboard/TestAttemptsModal.tsx`**
4. **`components/dashboard/FullTestAttemptsModal.tsx`**
5. **`components/ui/fullscreen-image-viewer.tsx`** (dans `tage-mage-tracker/`)
6. **`components/ui/fullscreen-image-viewer.tsx`** (dans le dossier racine)

#### Pattern appliqué :

**Avant :**
```typescript
useEffect(() => {
  if (isMobile && open) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
  return () => {
    document.body.style.overflow = ''
  }
}, [isMobile, open])
```

**Après :**
```typescript
useEffect(() => {
  if (isMobile && open) {
    document.body.style.overflow = 'hidden'
    document.body.style.overscrollBehavior = 'none'  // ✅ Ajouté
  } else {
    document.body.style.overflow = ''
    document.body.style.overscrollBehavior = ''       // ✅ Ajouté
  }
  return () => {
    document.body.style.overflow = ''
    document.body.style.overscrollBehavior = ''       // ✅ Ajouté
  }
}, [isMobile, open])
```

**Pour le fullscreen-image-viewer :**
```typescript
useEffect(() => {
  const originalOverflow = document.body.style.overflow
  const originalOverscroll = document.body.style.overscrollBehavior  // ✅ Ajouté
  document.body.style.overflow = 'hidden'
  document.body.style.overscrollBehavior = 'none'                    // ✅ Ajouté

  // ... gestion des événements ...

  return () => {
    document.body.style.overflow = originalOverflow
    document.body.style.overscrollBehavior = originalOverscroll      // ✅ Ajouté
    // ... cleanup ...
  }
}, [onClose])
```

## 🔍 Points clés

### Pourquoi deux approches ?

1. **CSS permanent** : Assure que l'overscroll est toujours désactivé, même si le JavaScript échoue ou qu'une modale oublie de restaurer la propriété.

2. **JavaScript dans les modales** : Permet une gestion explicite et prévisible de l'état lors de l'ouverture/fermeture des modales.

### Layout principal

Le layout principal (`app/(dashboard)/layout.tsx`) **ne doit PAS** avoir de scroll propre :

```tsx
// ✅ Correct - Pas de overflow-y-auto sur main
<div className="min-h-screen bg-background flex flex-col">
  <Header user={user} />
  <DashboardDataProvider>
    <main className="flex-1 pb-24 md:pb-16">
      <div className="mx-auto w-full max-w-5xl px-4 pt-8 pb-6 sm:px-6 lg:px-8 md:pt-24">
        {children}
      </div>
    </main>
  </DashboardDataProvider>
  <BottomNav />
  <OfflineIndicator />
</div>

// ❌ Incorrect - Créerait un double scroll
<main className="flex-1 pb-24 md:pb-16 overflow-y-auto">
```

**Pourquoi ?** Le scroll doit se faire sur le `body`, pas sur une div interne. Cela évite :
- Le double scroll (bounce sur body ET sur main)
- Les problèmes de position fixed (navbar)
- Les conflits de z-index avec les modales

## 🎯 Résultat

- ✅ Bounce désactivé de façon permanente (CSS global)
- ✅ Pas de réapparition après fermeture de modale (Dialog/Sheet/Custom)
- ✅ Comportement cohérent sur tous les composants
- ✅ Scroll uniquement sur le body, pas sur les containers internes
- ✅ Barres de scroll invisibles (scrollbar-width: none)
- ✅ Build réussie sans erreurs

## 🧪 Tests recommandés

1. **Modales de formulaire** : Ajouter test, notion, erreur → vérifier pas de bounce
2. **Carousel de notions** : Naviguer entre plusieurs notions → vérifier pas de bounce
3. **Image en plein écran** : Ouvrir/fermer → vérifier pas de bounce
4. **Modale de tentatives** : Tests individuels et complets → vérifier pas de bounce
5. **Préférences de retake** : Ouvrir depuis Header ou Dashboard → vérifier pas de bounce
6. **Dialog de confirmation** : Supprimer une erreur/notion → vérifier pas de bounce

Sur iOS Safari (le plus sensible au bounce) :
- Essayer de "tirer" l'écran vers le bas/haut
- Le contenu ne devrait pas bouger au-delà de ses limites
- Pas d'effet "élastique" visible

