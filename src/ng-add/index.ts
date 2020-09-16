import { normalize, strings } from '@angular-devkit/core';
import { workspace } from '@angular-devkit/core/src/experimental';
import {
  apply,
  chain,
  mergeWith,
  move,
  Rule,
  SchematicContext,
  SchematicsException,
  template,
  Tree,
  url,
} from '@angular-devkit/schematics';
import { Schema } from './schema';

/** Rule factory: returns a rule (function) */
export default function (options: Schema): Rule | any {
  // this is a rule (function). It takes a `tree` and returns updated `tree`.
  return async (tree: Tree, _context: SchematicContext) => {
    console.log('schematic works', options);
    // Read `angular.json` as buffer
    const workspaceConfigBuffer = tree.read('angular.json');
    if (!workspaceConfigBuffer) {
      throw new SchematicsException('Could not find an Angular workspace configuration');
    }
    // parse config only when not null
    const workspaceConfig: workspace.WorkspaceSchema = JSON.parse(workspaceConfigBuffer.toString());
    // if project is not passed (--project), use default project name
    if (!options.project && workspaceConfig.defaultProject) {
      options.project = workspaceConfig.defaultProject;
    }
    const projectName = options.project as string;
    // select project from projects array in `angular.json` file
    const project: workspace.WorkspaceProject = workspaceConfig.projects[projectName];
    const projectType = project.projectType === 'application' ? 'app' : 'lib';
    // Path to create the file
    const defaultPath = `${project.sourceRoot}/${projectType}`;

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
        name: options.name,
      }),
      // move file to resolved path
      move(normalize(defaultPath as string)),
    ]);
    // mergeWith returns a Rule so it can be called with tree and context (not required though)
    // merge our template into tree.
    return chain([mergeWith(sourceParamteterizedTemplates)]);
  };
}
