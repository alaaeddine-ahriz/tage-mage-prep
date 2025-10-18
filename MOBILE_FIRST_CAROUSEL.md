# Interface Mobile-First avec Carrousel et Formulaires

## Vue d'ensemble

L'application utilise maintenant une approche mobile-first avec:
- **Carrousel plein écran** pour la révision des notions et erreurs sur mobile
- **Formulaires plein écran** pour l'ajout de notions, erreurs et tests sur mobile
- Tout en conservant les dialogues classiques sur desktop

## Composants créés

### 1. `MobileCarousel` (`components/ui/mobile-carousel.tsx`)

Composant réutilisable pour afficher des items en mode carrousel plein écran avec:
- **Navigation par swipe**: Balayez à gauche/droite pour naviguer entre les items
- **Navigation par boutons**: Boutons précédent/suivant sur desktop
- **Navigation par clavier**: Flèches gauche/droite et Escape
- **Indicateurs de position**: Points de pagination en bas (mobile uniquement)
- **Zones tactiles latérales**: Tapez sur les côtés pour naviguer (mobile)
- **Header fixe**: Affiche la position actuelle (ex: "1 / 5")

#### Fonctionnalités de swipe
- Détecte les gestes tactiles horizontaux
- Distance minimale de swipe: 50px
- Swipe gauche = item suivant
- Swipe droite = item précédent

### 2. `MobileFormSheet` (`components/ui/mobile-form-sheet.tsx`)

Composant réutilisable pour afficher des formulaires:
- **Desktop**: Dialogue modal classique
- **Mobile**: Vue plein écran optimisée
- Header avec bouton de fermeture
- Support du défilement pour les longs formulaires
- Empêche le scroll du body quand ouvert

#### Utilisation
```tsx
<MobileFormSheet
  open={isFormOpen}
  onOpenChange={setIsFormOpen}
  title="Nouvelle notion"
  trigger={<Button>Ajouter</Button>}
>
  <AddNotionForm onSuccess={handleFormSuccess} />
</MobileFormSheet>
```

### 3. `useIsMobile` Hook (`lib/hooks/useIsMobile.ts`)

Hook personnalisé pour détecter si l'utilisateur est sur mobile:
- Breakpoint par défaut: 768px (tablette)
- Écoute les changements de taille d'écran
- Se met à jour dynamiquement lors du redimensionnement

## Pages adaptées

### Page des Notions (`app/(dashboard)/notions/page.tsx`)

#### Formulaire d'ajout
**Desktop (≥768px)**:
- Dialogue modal centré (max-width: 448px)
- Affichage compact du formulaire

**Mobile (<768px)**:
- Formulaire plein écran
- Header fixe avec bouton de fermeture
- Champs de formulaire bien espacés
- Clavier optimisé pour chaque champ

#### Révision des notions
**Desktop (≥768px)**:
- Dialogue modal classique centré
- Affichage compact des informations
- Boutons "Oublié" / "Je sais"

**Mobile (<768px)**:
- Vue plein écran avec carrousel
- Navigation fluide entre les notions
- Interface optimisée pour le tactile
- Boutons d'action fixes en bas
- Emojis dans les boutons pour plus de clarté 😕 🎯

**Données affichées en mode mobile**:
- Badge du sous-test
- Statut "À réviser" si dû
- Titre en grand format
- Description dans une card dédiée
- Stats de maîtrise avec barre de progression
- Nombre de révisions avec dernière date
- Date de prochaine révision formatée en français
- Boutons d'action fixes en bas de l'écran

### Page des Erreurs (`app/(dashboard)/errors/page.tsx`)

#### Formulaire d'ajout
**Desktop (≥768px)**:
- Dialogue modal (max-width: 448px)
- Upload de photo
- Champs de formulaire compacts

**Mobile (<768px)**:
- Formulaire plein écran
- Bouton photo optimisé pour la caméra mobile
- Prévisualisation de l'image en grand
- Support du `capture="environment"` pour la caméra arrière

#### Révision des erreurs
**Desktop (≥768px)**:
- Dialogue modal classique
- Image affichée si disponible
- Explication et statistiques

**Mobile (<768px)**:
- Vue plein écran avec carrousel
- Image en grande taille (50vh) si disponible
- Navigation tactile entre les erreurs
- Interface optimisée pour la révision
- Badges de statut (À réviser, Maîtrisée)

**Données affichées en mode mobile**:
- Badge du sous-test
- Statuts "À réviser" et "Maîtrisée"
- Image de l'erreur en grand format si disponible
- Explication dans une card dédiée
- Stats de maîtrise avec barre de progression
- Nombre de révisions avec dernière date
- Date de prochaine révision
- Boutons d'action fixes en bas

### Page des Tests (`app/(dashboard)/tests/page.tsx`)

#### Formulaire d'ajout
**Desktop (≥768px)**:
- Dialogue modal (max-width: 448px)
- Formulaire compact

**Mobile (<768px)**:
- Formulaire plein écran
- Sélecteurs de type (TD/Blanc) en boutons larges
- Input date natif optimisé pour mobile
- Champs bien espacés pour une saisie facile

**Note**: La page des tests n'a pas de carrousel de révision, uniquement un formulaire d'ajout et des statistiques.

## Expérience utilisateur

### Formulaires mobile
1. **Ouvrir un formulaire**: Cliquer sur le bouton "Ajouter"
2. **Remplir**: Interface plein écran dédiée
3. **Soumettre**: Bouton fixe en bas du formulaire
4. **Fermer**: Bouton X en haut à gauche

### Navigation mobile (carrousel)
1. **Ouvrir une notion/erreur**: Cliquer sur le bouton œil
2. **Naviguer**: 
   - Swipe gauche/droite
   - Taper sur les côtés de l'écran
   - Utiliser les points de pagination en bas
3. **Réviser**: Utiliser les boutons fixes en bas
4. **Fermer**: Bouton X en haut à gauche

### Avantages de l'interface mobile
**Carrousel de révision:**
- ✅ Navigation fluide et intuitive
- ✅ Pas besoin de fermer et rouvrir pour chaque item
- ✅ Meilleure utilisation de l'espace écran
- ✅ Gestes naturels (swipe)
- ✅ Révision plus rapide et efficace
- ✅ Expérience immersive plein écran

**Formulaires plein écran:**
- ✅ Plus d'espace pour les champs de saisie
- ✅ Meilleure visibilité du clavier virtuel
- ✅ Upload de photos optimisé
- ✅ Navigation claire et intuitive
- ✅ Moins de distractions
- ✅ Saisie plus confortable

### Comportement après action
**Révision:**
- **Desktop**: Le dialogue se ferme automatiquement
- **Mobile**: Reste sur le carrousel (permet de réviser plusieurs items d'affilée)

**Formulaire:**
- **Desktop**: Le dialogue se ferme après soumission réussie
- **Mobile**: Le formulaire plein écran se ferme et retourne à la liste

## Personnalisation

### Changer le breakpoint mobile
Modifier le hook dans les pages:
```typescript
const isMobile = useIsMobile(1024) // Utiliser 1024px au lieu de 768px
```

### Personnaliser la distance de swipe
Dans `mobile-carousel.tsx`:
```typescript
const minSwipeDistance = 50 // Modifier cette valeur (en pixels)
```

## Compatibilité

- ✅ iOS Safari
- ✅ Android Chrome
- ✅ Desktop (Chrome, Firefox, Safari, Edge)
- ✅ Mode sombre
- ✅ Responsive (s'adapte automatiquement)

## Notes techniques

### MobileCarousel
1. **Prévention du scroll du body**: Le scroll de la page est désactivé quand le carrousel est ouvert
2. **Navigation clavier**: Fonctionne même sur mobile si un clavier physique est connecté
3. **Performance**: Les gestes tactiles sont optimisés pour ne pas impacter les performances
4. **Accessibilité**: Labels ARIA sur tous les boutons interactifs

### MobileFormSheet
1. **Détection automatique**: Utilise `useIsMobile()` pour basculer entre Dialog et plein écran
2. **Prévention du scroll**: Le body ne défile pas quand le formulaire est ouvert
3. **Gestion du state**: Le state `isFormOpen` est géré par le parent pour plus de contrôle
4. **Compatibilité**: Réutilise les composants Dialog pour desktop (cohérence UI)

### Conversion Client-Side
- La page `tests/page.tsx` a été convertie de Server Component à Client Component
- Permet l'utilisation des hooks (`useState`, `useEffect`)
- Maintient les mêmes fonctionnalités avec un pattern client-side classique

## Résumé des changements

### Fichiers créés
- ✅ `components/ui/mobile-carousel.tsx` - Carrousel plein écran
- ✅ `components/ui/mobile-form-sheet.tsx` - Formulaires adaptatifs
- ✅ `lib/hooks/useIsMobile.ts` - Hook de détection mobile

### Fichiers modifiés
- ✅ `app/(dashboard)/notions/page.tsx` - Carrousel + formulaire mobile
- ✅ `app/(dashboard)/errors/page.tsx` - Carrousel + formulaire mobile
- ✅ `app/(dashboard)/tests/page.tsx` - Converti en client + formulaire mobile

### Impact utilisateur
- **Mobile**: Expérience optimisée, plein écran, gestes intuitifs
- **Desktop**: Aucun changement, comportement identique
- **Performance**: Pas d'impact, détection à la volée
- **Compatibilité**: 100% rétrocompatible

## Future améliorations possibles

### Carrousel
- [ ] Animations de transition entre les items
- [ ] Support du pinch-to-zoom sur les images
- [ ] Raccourcis clavier supplémentaires (ex: Espace pour "Je sais")
- [ ] Feedback haptique sur les gestes (si supporté par le navigateur)
- [ ] Mode "révision rapide" avec auto-navigation après validation

### Formulaires
- [ ] Validation en temps réel avec feedback visuel
- [ ] Sauvegarde automatique en brouillon
- [ ] Animation de soumission du formulaire
- [ ] Support de la dictée vocale pour les descriptions
- [ ] Mode "ajout rapide" avec valeurs par défaut

