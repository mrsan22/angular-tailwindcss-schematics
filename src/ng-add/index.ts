import { Rule, SchematicContext, SchematicsException, Tree } from '@angular-devkit/schematics';
import { Schema } from './schema';

/** Rule factory: returns a rule (function) */
export default function (options: Schema): Rule {
  // this is a rule. It takes a `tree` and returns updated `tree`.
  return (tree: Tree, _context: SchematicContext) => {
    if (!options.name) {
      throw new SchematicsException('name option is required.');
    }
    console.log('schematic works', options);
    // tree.create(_options.name || 'hello.ts', 'world');
    const { name } = options;
    tree.create('hello.ts', `console.log("Hello, ${name}")`);
    return tree;
  };
}
