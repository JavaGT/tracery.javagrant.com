/**
 * @author Kate Compton
 */

import Action from "./action.js";
import { parseRule, parseTag } from "./utilities.js";

let nodeCount = 0;

class BaseNode {
    constructor() {
        this.depth = 0;
        this.id = nodeCount;
        nodeCount += 1;
        this.childText = "[[UNEXPANDED]]";
    }

    setParent(parent) {
        if (parent) {
            this.depth = parent.depth + 1;
            this.parent = parent;
            this.grammar = parent.grammar;
        }
    }

    expand() {
        return "???";
    }

    expandChildren() {
        if (this.children) {
            this.childText = "";
            for (let i = 0; i < this.children.length; i++) {
                this.children[i].expand();
                this.childText += this.children[i].finalText;
            }
            this.finalText = this.childText;
        }
    }

    createChildrenFromSections(sections) {
        const root = this;
        this.children = sections.map(function (section) {
            if (typeof section == "string" || section instanceof String) {
                return new TextNode(root, section);
            }
            if (section && section.type === 'action') {
                return new ActionNode(root, section.raw);
            }
            return new TagNode(root, section);
        });
    }
}

class RootNode extends BaseNode {
    constructor(grammar, rawRule) {
        super();
        this.grammar = grammar;
        this.parsedRule = parseRule(rawRule);
    }

    expand() {
        this.createChildrenFromSections(this.parsedRule);
        this.expandChildren();
    }
}

class TagNode extends BaseNode {
    constructor(parent, parsedTag) {
        super();

        if (!(parsedTag !== null && typeof parsedTag === "object")) {
            if (typeof parsedTag == "string" || parsedTag instanceof String) {
                console.warn("Can't make tagNode from unparsed string!");
                parsedTag = parseTag(parsedTag);
            } else {
                console.log("Unknown tagNode input: ", parsedTag);
                throw ("Can't make tagNode from strange tag!");
            }
        }

        this.setParent(parent);
        Object.assign(this, parsedTag);

        this.preActions = this.preActions || [];
        this.postActions = this.postActions || [];
        this.mods = this.mods || [];
    }

    expand() {
        this.rule = this.grammar.getRule(this.symbol);

        if (this.rule.error) {
            this.error = this.rule.error;
            if (globalThis.tracery && typeof globalThis.tracery.addError === "function") {
                globalThis.tracery.addError(this.error);
            }
        }

        this.actions = [];
        this.createChildrenFromSections(this.rule.getParsed());

        for (let i = 0; i < this.preActions.length; i++) {
            const action = new Action(this, this.preActions[i]);
            action.activate();
        }

        this.expandChildren();

        for (let i = 0; i < this.actions.length; i++) {
            this.actions[i].deactivate();
        }

        this.finalText = this.childText;
        for (let i = 0; i < this.mods.length; i++) {
            this.finalText = this.grammar.applyMod(this.mods[i], this.finalText);
        }
    }

    toLabel() {
        return this.symbol;
    }

    toString() {
        return "TagNode '" + this.symbol + "' mods:" + this.mods + ", preactions:" + this.preActions + ", postactions" + this.postActions;
    }
}

class TextNode extends BaseNode {
    constructor(parent, text) {
        super();
        this.isLeaf = true;
        this.setParent(parent);
        this.text = text;
        this.finalText = text;
    }

    expand() {
    }

    toLabel() {
        return this.text;
    }
}

// ActionNode handles standalone [key:value] push/pop sections produced by parseRule.
// It contributes no text to the output but mutates the grammar's rule stack.
class ActionNode extends BaseNode {
    constructor(parent, raw) {
        super();
        this.setParent(parent);
        this.raw = raw;
        this.finalText = '';
    }

    expand() {
        // Expand any embedded tags inside the action content (e.g. "pet:#animal#" → "pet:fox")
        const amended = this.grammar.flatten(this.raw);
        const colonIdx = amended.indexOf(':');
        if (colonIdx >= 0) {
            const key = amended.slice(0, colonIdx).trim();
            const val = amended.slice(colonIdx + 1).trim();
            if (val === 'POP') {
                this.grammar.popRules(key);
            } else {
                this.grammar.pushRules(key, [val]);
            }
        }
        this.finalText = '';
    }

    toLabel() {
        return '[' + this.raw + ']';
    }
}

export default RootNode;
