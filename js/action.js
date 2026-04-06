// Tracery Action - handles [symbol:rule] push/pop actions

export class Action {
  constructor(grammar, src) {
    this.grammar = grammar;
    this.src = src;
    this.activated = false;
    this.rulePushed = null;

    // Parse action: [key:value] or [key:POP]
    const colonIdx = src.indexOf(':');
    if (colonIdx >= 0) {
      this.type = 'push';
      this.key = src.slice(0, colonIdx).trim();
      const valStr = src.slice(colonIdx + 1).trim();
      if (valStr === 'POP') {
        this.type = 'pop';
      } else {
        // value may be a comma-separated list
        this.ruleText = valStr;
      }
    } else {
      this.type = 'unknown';
      this.key = src;
    }
  }

  activate(node) {
    if (this.type === 'push') {
      // Expand the rule value before pushing
      const expandedVal = this.grammar.flatten(this.ruleText);
      this.rulePushed = { key: this.key, rule: expandedVal };
      this.grammar.pushRules(this.key, [expandedVal]);
    } else if (this.type === 'pop') {
      this.grammar.popRules(this.key);
    }
    this.activated = true;
  }

  deactivate() {
    if (this.type === 'push' && this.activated && this.rulePushed) {
      this.grammar.popRules(this.key);
    }
    this.activated = false;
  }
}
