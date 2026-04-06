// Tracery Grammar - core expansion engine ES module

import { Ruleset } from './ruleset.js';
import { Action } from './action.js';
import { modifiers } from './utilities.js';

const MAX_DEPTH = 15;

class Symbol {
  constructor(grammar, key, rawRules) {
    this.grammar = grammar;
    this.key = key;
    this.stack = [new Ruleset(rawRules)];
  }

  selectRule() {
    if (this.stack.length === 0) return `(no rule: ${this.key})`;
    return this.stack[this.stack.length - 1].getRule(this.grammar.rng);
  }

  push(rawRules) {
    this.stack.push(new Ruleset(rawRules));
  }

  pop() {
    if (this.stack.length > 1) this.stack.pop();
  }
}

export class Grammar {
  constructor(raw) {
    this.symbols = {};
    this.rng = Math.random.bind(Math);
    this.errors = [];
    this.modifiers = { ...modifiers };

    if (raw) this.loadFromRaw(raw);
  }

  loadFromRaw(raw) {
    this.symbols = {};
    this.errors = [];
    for (const [key, val] of Object.entries(raw)) {
      if (!key.startsWith('_')) {
        this.symbols[key] = new Symbol(this, key, val);
      }
    }
  }

  pushRules(key, rules) {
    if (!this.symbols[key]) {
      this.symbols[key] = new Symbol(this, key, []);
    }
    this.symbols[key].push(rules);
  }

  popRules(key) {
    if (this.symbols[key]) this.symbols[key].pop();
  }

  flatten(rule, depth = 0) {
    if (depth > MAX_DEPTH) return '[max depth]';
    if (typeof rule !== 'string') return String(rule ?? '');

    let result = '';
    let i = 0;

    while (i < rule.length) {
      if (rule[i] === '\\' && i + 1 < rule.length) {
        result += rule[i + 1];
        i += 2;
        continue;
      }

      // Action block [key:value]
      if (rule[i] === '[') {
        const end = this._findClose(rule, i, '[', ']');
        if (end === -1) { result += rule[i]; i++; continue; }
        const inner = rule.slice(i + 1, end);
        const action = new Action(this, inner);
        action.activate(null);
        // Actions don't produce output, they modify state
        i = end + 1;
        continue;
      }

      // Symbol/tag expansion #symbol.modifier#
      if (rule[i] === '#') {
        const end = rule.indexOf('#', i + 1);
        if (end === -1) { result += rule[i]; i++; continue; }
        const inner = rule.slice(i + 1, end);
        result += this._expandTag(inner, depth + 1);
        i = end + 1;
        continue;
      }

      result += rule[i];
      i++;
    }

    return result;
  }

  _findClose(str, start, open, close) {
    let depth = 0;
    for (let i = start; i < str.length; i++) {
      if (str[i] === open) depth++;
      if (str[i] === close) { depth--; if (depth === 0) return i; }
    }
    return -1;
  }

  _expandTag(tag, depth) {
    // Actions within tag (pre-actions)
    // Parse: [action]symbol.mod.mod
    const actions = [];
    let remaining = tag;

    // Extract leading actions
    while (remaining.startsWith('[')) {
      const end = this._findClose(remaining, 0, '[', ']');
      if (end === -1) break;
      const actionStr = remaining.slice(1, end);
      actions.push(new Action(this, actionStr));
      remaining = remaining.slice(end + 1);
    }

    // Activate pre-actions
    actions.forEach(a => a.activate(null));

    // Parse symbol.modifier1.modifier2
    const parts = remaining.split('.');
    const symbolKey = parts[0];
    const mods = parts.slice(1);

    let val = '';
    if (this.symbols[symbolKey]) {
      const rule = this.symbols[symbolKey].selectRule();
      val = this.flatten(rule, depth);
    } else {
      val = `(unknown: ${symbolKey})`;
      this.errors.push(`Unknown symbol: ${symbolKey}`);
    }

    // Apply modifiers
    for (const mod of mods) {
      if (this.modifiers[mod]) {
        val = this.modifiers[mod](val);
      }
    }

    // Deactivate pre-actions
    actions.forEach(a => a.deactivate());

    return val;
  }

  generate(origin = 'origin') {
    this.errors = [];
    if (!this.symbols[origin]) {
      return `(no symbol: ${origin})`;
    }
    const rule = this.symbols[origin].selectRule();
    return this.flatten(rule);
  }
}

export function createGrammar(raw) {
  return new Grammar(raw);
}
