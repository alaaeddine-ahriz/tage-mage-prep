// Constantes pour les sous-tests du Tage Mage

export const SUBTESTS = [
  { value: 'all', label: 'Tous' },
  { value: 'comprehension', label: 'CDT' },
  { value: 'calcul', label: 'Calcul' },
  { value: 'argumentation', label: 'R&A' },
  { value: 'conditions', label: 'Conditions minimales' },
  { value: 'expression', label: 'Expression' },
  { value: 'logique', label: 'Logique' },
]

export const SUBTEST_LABELS: Record<string, string> = {
  'comprehension': 'CDT',
  'calcul': 'Calcul',
  'argumentation': 'R&A',
  'conditions': 'Conditions minimales',
  'expression': 'Expression',
  'logique': 'Logique',
}

// Pour les formulaires (sans "Tous")
export const SUBTEST_OPTIONS = [
  { value: 'comprehension', label: 'CDT' },
  { value: 'calcul', label: 'Calcul' },
  { value: 'argumentation', label: 'R&A' },
  { value: 'conditions', label: 'Conditions minimales' },
  { value: 'expression', label: 'Expression' },
  { value: 'logique', label: 'Logique' },
]

