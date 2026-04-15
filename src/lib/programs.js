// Display metadata for the benefit programs the wizard evaluates. Kept
// in one place so EligibilityStep, PacketStep, and the PDF generator can
// share the same icon glyphs and human-readable names.

export const PROGRAM_NAMES = {
  calfresh: 'CalFresh (SNAP)',
  erap: 'Emergency Rental Assistance',
  wic: 'WIC',
  liheap: 'LIHEAP Energy Assistance',
  school_meals: 'Free & Reduced-Price School Meals',
}

export const PROGRAM_ICONS = {
  calfresh: '🛒',
  erap: '🏠',
  wic: '🍼',
  liheap: '💡',
  school_meals: '🎓',
}
