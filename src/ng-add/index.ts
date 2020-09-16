import { strings } from '@angular-devkit/core';
import {
  apply,
  mergeWith,
  Rule,
  SchematicContext,
  SchematicsException,
  template,
  Tree,
  url,
} from '@angular-devkit/schematics';
import { Schema } from './schema';

/** Rule factory: returns a rule (function) */
export default function (options: Schema): Rule {
  // this is a rule. It takes a `tree` and returns updated `tree`.
  return (tree: Tree, _context: SchematicContext) => {
    if (!options.name) {
      throw new SchematicsException('name option is required.');
    }
    console.log('schematic works', options);
    // get hold of our templates files
    const sourceTemplates = url('./files');
    /**
     * `template` rule processes templates and returns rule.
     * The template helpers like `dasherize` or `classify` are available because we’re spreading `strings` object into the `options` objectand then we’re passing into the template
     */
    const sourceParamteterizedTemplates = apply(sourceTemplates, [
      template({
        ...options,
        ...strings,
      }),
    ]);
    // mergeWith returns a Rule so it can be called with tree and context (not required though)
    // merge our template into tree.
    return mergeWith(sourceParamteterizedTemplates)(tree, _context);
  };
}
