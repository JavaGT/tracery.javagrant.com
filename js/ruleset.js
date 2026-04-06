// Tracery Ruleset - manages rule selection strategies

export class Ruleset {
  constructor(rules) {
    if (Array.isArray(rules)) {
      this.rules = rules;
    } else if (typeof rules === 'string') {
      this.rules = [rules];
    } else {
      this.rules = [];
    }
    this.usedIndices = [];
  }

  selectRule(rng) {
    if (!this.rules || this.rules.length === 0) return '(empty)';
    if (this.rules.length === 1) return this.rules[0];
    const idx = Math.floor((rng || Math.random)() * this.rules.length);
    return this.rules[idx];
  }

  getRule(rng) {
    return this.selectRule(rng);
  }
}
