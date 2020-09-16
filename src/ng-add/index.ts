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
import { addPackageJsonDependency, NodeDependency, NodeDependencyType } from '@schematics/angular/utility/dependencies';
import { Schema } from './schema';
import { tailwindcssDependencies } from './utils';

/** Rule factory: returns a rule (function) */
export default function (options: Schema): Rule {
  // this is a rule (function). It takes a `tree` and returns updated `tree`.
  return (tree: Tree, context: SchematicContext) => {
    console.log('schematic works', options);
    // Read `angular.json` as buffer
    const workspaceConfigBuffer = tree.read('angular.json');
    if (!workspaceConfigBuffer) {
      throw new SchematicsException('Could not find an Angular workspace configuration');
    }
    // parse config only when not null
    const workspaceConfig: workspace.WorkspaceSchema = JSON.parse(workspaceConfigBuffer.toString());
    // // if project is not passed (--project), use default project name
    if (!options.project && workspaceConfig.defaultProject) {
      options.project = workspaceConfig.defaultProject;
    }
    const projectName = options.project as string;
    // // select project from projects array in `angular.json` file
    const project: workspace.WorkspaceProject = workspaceConfig.projects[projectName];
    if (!project) {
      throw new SchematicsException(`Project ${projectName} is not defined in this workspace.`);
    }
    // const projectType = project.projectType === 'application' ? 'app' : 'lib';
    // Path to create the file
    // const defaultPath = `${project.sourceRoot}/${projectType}`;
    // compose all rules using chain Rule.
    return chain([addDependencies(options), addTemplateFiles(options)])(tree, context);
  };
}

/**
 * Add required dependencies to package.json file.
 */
function addDependencies(options: Schema): Rule {
  const deps = [...tailwindcssDependencies];

  if (options.cssType !== 'css') {
    deps.push(`postcss-${options.cssType}`);
  }
  return (tree: Tree, context: SchematicContext) => {
    deps.map((dependencyName: string) => {
      const nodeDependency: NodeDependency = nodeDependencyFactory(dependencyName, options);
      addPackageJsonDependency(tree, nodeDependency);
      context.logger.info(`✅️ Added ${nodeDependency.name}@${nodeDependency.version} to ${nodeDependency.type}`);
      return tree;
    });
  };
}

// Install dependencies
// function install(): Rule {
//   return (tree: Tree, context: SchematicContext) => {
//     // Install the dependency
//     context.addTask(new NodePackageInstallTask());
//     context.logger.info('✅️ Installed dependencies');
//     return tree;
//   };
// }

function addTemplateFiles(options: Schema): Rule {
  return (tree: Tree, context: SchematicContext) => {
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
        cssType: options.cssType,
      }),
      // move file to resolved path
      move(normalize('./')),
    ]);
    return mergeWith(sourceParamteterizedTemplates)(tree, context);
  };
}

function nodeDependencyFactory(dependencyName: string, options: Schema): NodeDependency {
  // default version : latest
  let version = 'latest';
  if (dependencyName === 'tailwindcss' && options.tailwindcssVersion) {
    version = options.tailwindcssVersion;
  }
  return {
    type: NodeDependencyType.Dev,
    name: dependencyName,
    version: version,
    overwrite: false,
  };
}
