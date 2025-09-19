// lib/bracketEditor.ts
import { 
  Bracket, 
  BracketCategory, 
  BracketSaint, 
  BracketEditAction,
  Saint 
} from '@/types';
import { assertFirestore } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { BracketGenerator } from './bracketGenerator';

export class BracketEditor {
  private bracket: Bracket;
  private allSaints: Saint[] = [];

  constructor(bracket: Bracket) {
    this.bracket = bracket;
  }

  async initialize(): Promise<void> {
    // Load all saints for editing operations
    const db = assertFirestore();
    const saintsRef = collection(db, 'saints');
    const snapshot = await getDocs(saintsRef);
    
    this.allSaints = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Saint));
  }

  async applyEdit(action: BracketEditAction): Promise<Bracket> {
    await this.initialize();

    switch (action.type) {
      case 'swap-category':
        return this.swapCategory(action.categoryId!, action.newCategoryKey!);
      
      case 'swap-saint':
        return this.swapSaint(action.categoryId!, action.saintId!, action.newSaintId!);
      
      case 'regenerate-category':
        return this.regenerateCategory(action.categoryId!);
      
      default:
        throw new Error(`Unknown edit action: ${action.type}`);
    }
  }

  private async swapCategory(categoryId: string, newCategoryKey: keyof Saint): Promise<Bracket> {
    const categoryIndex = this.bracket.categories.findIndex(cat => cat.id === categoryId);
    if (categoryIndex === -1) {
      throw new Error(`Category ${categoryId} not found`);
    }

    const currentCategory = this.bracket.categories[categoryIndex];
    
    // Generate new saints for the new category
    const newSaints = await this.selectSaintsForCategory(newCategoryKey);
    
    // Create updated category
    const updatedCategory: BracketCategory = {
      ...currentCategory,
      id: `${this.bracket.year}-${newCategoryKey}`,
      name: this.getCategoryDisplayName(newCategoryKey),
      categoryKey: newCategoryKey,
      saints: newSaints
    };

    // Update the bracket
    const updatedBracket = { ...this.bracket };
    updatedBracket.categories[categoryIndex] = updatedCategory;
    
    // Regenerate Round 1 matches for this category
    this.updateRound1MatchesForCategory(updatedBracket, categoryIndex, newSaints);
    
    return updatedBracket;
  }

  private async swapSaint(categoryId: string, saintId: string, newSaintId: string): Promise<Bracket> {
    const categoryIndex = this.bracket.categories.findIndex(cat => cat.id === categoryId);
    if (categoryIndex === -1) {
      throw new Error(`Category ${categoryId} not found`);
    }

    const category = this.bracket.categories[categoryIndex];
    const saintIndex = category.saints.findIndex(s => s.saintId === saintId);
    if (saintIndex === -1) {
      throw new Error(`Saint ${saintId} not found in category`);
    }

    // Get the new saint data
    const newSaint = this.allSaints.find(s => s.id === newSaintId);
    if (!newSaint) {
      throw new Error(`New saint ${newSaintId} not found`);
    }

    // Verify the new saint matches the category
    if (!newSaint[category.categoryKey]) {
      throw new Error(`Saint ${newSaint.name} is not in category ${category.name}`);
    }

    // Create updated bracket
    const updatedBracket = { ...this.bracket };
    const updatedCategory = { ...category };
    const updatedSaints = [...category.saints];
    
    // Replace the saint
    updatedSaints[saintIndex] = {
      saintId: newSaint.id,
      name: newSaint.name,
      seed: updatedSaints[saintIndex].seed, // Keep the same seed position
      imageUrl: newSaint.imageUrl,
      eliminated: false
    };

    updatedCategory.saints = updatedSaints;
    updatedBracket.categories[categoryIndex] = updatedCategory;
    
    // Update Round 1 matches that involve this saint
    this.updateRound1MatchesForSaint(updatedBracket, saintId, newSaint);
    
    return updatedBracket;
  }

  private async regenerateCategory(categoryId: string): Promise<Bracket> {
    const categoryIndex = this.bracket.categories.findIndex(cat => cat.id === categoryId);
    if (categoryIndex === -1) {
      throw new Error(`Category ${categoryId} not found`);
    }

    const currentCategory = this.bracket.categories[categoryIndex];
    
    // Generate new saints for the same category
    const newSaints = await this.selectSaintsForCategory(currentCategory.categoryKey);
    
    // Create updated category
    const updatedCategory: BracketCategory = {
      ...currentCategory,
      saints: newSaints
    };

    // Update the bracket
    const updatedBracket = { ...this.bracket };
    updatedBracket.categories[categoryIndex] = updatedCategory;
    
    // Regenerate Round 1 matches for this category
    this.updateRound1MatchesForCategory(updatedBracket, categoryIndex, newSaints);
    
    return updatedBracket;
  }

  private async selectSaintsForCategory(categoryKey: keyof Saint): Promise<BracketSaint[]> {
    // Get saints currently used in the bracket to avoid duplicates
    const usedSaintIds = new Set(
      this.bracket.categories.flatMap(cat => cat.saints.map(s => s.saintId))
    );

    // Filter saints by category and exclude those already in the bracket
    const eligibleSaints = this.allSaints.filter(saint => {
      if (!saint[categoryKey]) return false;
      if (usedSaintIds.has(saint.id)) return false;
      
      // Exclude recently used saints
      if (saint.lastUsedYear) {
        const yearsSinceLastUsed = this.bracket.year - saint.lastUsedYear;
        if (yearsSinceLastUsed < 2) return false;
      }
      
      return true;
    });

    if (eligibleSaints.length < 8) {
      throw new Error(`Not enough eligible saints for category ${categoryKey}. Found ${eligibleSaints.length}, need 8.`);
    }

    // Randomly select 8 saints
    const shuffled = [...eligibleSaints].sort(() => Math.random() - 0.5);
    const selected = shuffled.slice(0, 8);

    return selected.map((saint, index) => ({
      saintId: saint.id,
      name: saint.name,
      seed: index + 1,
      imageUrl: saint.imageUrl,
      eliminated: false
    }));
  }

  private updateRound1MatchesForCategory(bracket: Bracket, categoryIndex: number, newSaints: BracketSaint[]): void {
    // Find Round 1
    const round1 = bracket.rounds.find(r => r.roundNumber === 1);
    if (!round1) return;

    // Calculate which matches belong to this category
    const matchesPerCategory = 4; // 8 saints = 4 matches per category
    const startIndex = categoryIndex * matchesPerCategory;
    const endIndex = startIndex + matchesPerCategory;

    // Update the matches
    for (let i = 0; i < matchesPerCategory; i++) {
      const matchIndex = startIndex + i;
      if (matchIndex < round1.matches.length) {
        const saint1 = newSaints[i * 2];
        const saint2 = newSaints[i * 2 + 1];
        
        round1.matches[matchIndex] = {
          ...round1.matches[matchIndex],
          saint1Id: saint1.saintId,
          saint2Id: saint2.saintId,
          saint1Name: saint1.name,
          saint2Name: saint2.name,
          votesForSaint1: 0,
          votesForSaint2: 0
        };
      }
    }
  }

  private updateRound1MatchesForSaint(bracket: Bracket, oldSaintId: string, newSaint: Saint): void {
    const round1 = bracket.rounds.find(r => r.roundNumber === 1);
    if (!round1) return;

    // Find and update matches that involve the old saint
    round1.matches.forEach(match => {
      if (match.saint1Id === oldSaintId) {
        match.saint1Id = newSaint.id;
        match.saint1Name = newSaint.name;
        match.votesForSaint1 = 0; // Reset votes
      } else if (match.saint2Id === oldSaintId) {
        match.saint2Id = newSaint.id;
        match.saint2Name = newSaint.name;
        match.votesForSaint2 = 0; // Reset votes
      }
    });
  }

  private getCategoryDisplayName(categoryKey: keyof Saint): string {
    type CategoryKey = 'martyrs' | 'confessors' | 'doctorsofthechurch' | 'mystic' | 'missionary' | 'religious' | 'royalty' | 'bishop' | 'pope' | 'apostle' | 'abbotabbess' | 'hermit';

    const mappings: Record<CategoryKey, string> = {
      martyrs: 'Martyrs',
      confessors: 'Confessors',
      doctorsofthechurch: 'Doctors of the Church',
      mystic: 'Mystics',
      missionary: 'Missionaries',
      religious: 'Religious',
      royalty: 'Royalty',
      bishop: 'Bishops',
      pope: 'Popes',
      apostle: 'Apostles',
      abbotabbess: 'Abbots & Abbesses',
      hermit: 'Hermits'
    } as const;

    return mappings[categoryKey as CategoryKey] || String(categoryKey);
  }

  // Get available saints for a category (for UI dropdowns)
  async getAvailableSaintsForCategory(categoryKey: keyof Saint): Promise<Saint[]> {
    await this.initialize();
    
    const usedSaintIds = new Set(
      this.bracket.categories.flatMap(cat => cat.saints.map(s => s.saintId))
    );

    return this.allSaints.filter(saint => {
      if (!saint[categoryKey]) return false;
      if (usedSaintIds.has(saint.id)) return false;
      
      if (saint.lastUsedYear) {
        const yearsSinceLastUsed = this.bracket.year - saint.lastUsedYear;
        if (yearsSinceLastUsed < 2) return false;
      }
      
      return true;
    });
  }
}

// Helper function to create an editor instance
export function createBracketEditor(bracket: Bracket): BracketEditor {
  return new BracketEditor(bracket);
}