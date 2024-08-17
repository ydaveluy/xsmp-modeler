
import * as vscode from 'vscode';
import * as path from 'path';
import * as fs from 'fs';
import * as os from 'os';

const adocToolId = 'adoc',
    esaCdkLegacyProfileId = 'esa-cdk-legacy',
    esaCdkProfileId = 'esa-cdk',
    pythonToolId = 'python',
    smpToolId = 'smp',
    xsmpSdkProfileId = 'xsmp-sdk';

export async function createProjectWizard() {

    const destinationFolders = await vscode.window.showOpenDialog({
        canSelectFiles: false,
        canSelectFolders: true,
        canSelectMany: false,
        title: 'Root directory containing the new project.',
        openLabel: 'Select the root directory containing the new project.'
    });

    if (!destinationFolders || destinationFolders.length === 0) { return; }

    const destinationFolder = destinationFolders[0].fsPath;

    // Project name input
    let projectName: string | undefined;
    while (true) {
        projectName = await vscode.window.showInputBox({
            prompt: 'Enter project name'
        });
        if (!projectName) { return; }

        if (/^[a-zA-Z][a-zA-Z0-9_.-]*$/.test(projectName)) {
            break;
        } else {
            vscode.window.showErrorMessage('Project name must follow the format [a-zA-Z][a-zA-Z0-9_.-]\\w*');
        }
    }

    // Select profile
    const profiles = [
        { id: xsmpSdkProfileId, label: 'XSMP-SDK Profile' },
        { id: esaCdkProfileId, label: 'ESA-CDK Profile' },
    ],

        profile = await vscode.window.showQuickPick(profiles, {
            placeHolder: 'Select a profile'
        });

    if (!profile) { return; } // If user cancels selection

    // Select tools
    const tools = [
        { id: smpToolId, label: 'SMP Tool', 'picked': true },
        { id: pythonToolId, label: 'Python Wrapper', 'picked': profile.id === xsmpSdkProfileId },
        { id: adocToolId, label: 'AsciiDoc generator', 'picked': true }
    ],

        selectedTools = await vscode.window.showQuickPick(tools, {
            canPickMany: true,
            placeHolder: 'Select tools to enable'
        });

    if (!selectedTools) { return; } // If user cancels selection

    // Create specific files
    const projectFolderPath = path.join(destinationFolder, projectName);

    createTemplateProject(projectName, projectFolderPath, profile, selectedTools);

    // Add project to workspace
    const addToWorkspace = await vscode.window.showQuickPick(
        [
            { label: 'Yes', addToWorkspace: true },
            { label: 'No', addToWorkspace: false }
        ],
        {
            placeHolder: 'Add project to workspace?'
        }
    ),

        uri = vscode.Uri.file(projectFolderPath);
    if (!vscode.workspace.workspaceFolders?.some(folder => uri.fsPath.startsWith(folder.uri.fsPath))) {
        if (addToWorkspace?.addToWorkspace) {
            vscode.workspace.updateWorkspaceFolders(vscode.workspace.workspaceFolders ? vscode.workspace.workspaceFolders.length : 0, null, { uri });
        }
    }
    const xsmpcatFilePath = path.join(projectFolderPath, 'smdl', `${projectName}.xsmpcat`),
        xsmpcatDocument = await vscode.workspace.openTextDocument(xsmpcatFilePath);
    await vscode.window.showTextDocument(xsmpcatDocument);
}

async function createTemplateProject(projectName: string, dirPath: string,
    profile: { label: string, id: string }, tools: Array<{ label: string, id: string }>) {
    fs.mkdirSync(dirPath); // Create project directory

    const smdlPath = path.join(dirPath, 'smdl');
    fs.mkdirSync(smdlPath);

    // Create the catalog file
    const creator = os.userInfo().username,
        currentDate = new Date(Date.now()).toISOString(),
        catalogueName = projectName.replace(/[.-]/, '_');

    await fs.promises.writeFile(path.join(smdlPath, `${projectName}.xsmpcat`), `// Copyright \${year} \${user}. All rights reserved.
//
// YOUR NOTICE
//
// Generation date:  \${date} \${time}
                
/**
 * Catalogue ${projectName}
 * 
 * @creator ${creator}
 * @date ${currentDate}
 */
catalogue ${catalogueName}

namespace ${catalogueName}
{
    
} // namespace ${catalogueName}

`);

    if (profile.id === xsmpSdkProfileId) {
        await fs.promises.writeFile(path.join(dirPath, 'CMakeLists.txt'), `
cmake_minimum_required(VERSION 3.14)

project(
    ${projectName}
#   VERSION 1.0.0
#   DESCRIPTION ""
#   HOMEPAGE_URL ""
    LANGUAGES CXX)

include(FetchContent)
FetchContent_Declare(
    xsmp-sdk
    GIT_REPOSITORY https://github.com/ThalesGroup/xsmp-sdk.git
    GIT_TAG        main # replace with a specific tag
)
FetchContent_MakeAvailable(xsmp-sdk)
list(APPEND CMAKE_MODULE_PATH "\${xsmp-sdk_SOURCE_DIR}/cmake")

# add python directory to PYTHONPATH
include(PathUtils)
python_path_prepend("python")

file(GLOB_RECURSE SRC CONFIGURE_DEPENDS src/*.cpp src-gen/*.cpp)

add_library(${projectName} SHARED \${SRC})
target_include_directories(${projectName} PUBLIC src src-gen)
target_link_libraries(${projectName} PUBLIC Xsmp::Cdk)

# --------------------------------------------------------------------

if(CMAKE_PROJECT_NAME STREQUAL PROJECT_NAME)
    include(CTest)
endif()

if(CMAKE_PROJECT_NAME STREQUAL PROJECT_NAME AND BUILD_TESTING)
    include(Pytest)
    pytest_discover_tests()
endif()
`);
        await fs.promises.writeFile(path.join(dirPath, 'README.md'), `
# ${projectName}

Project description.

## System Requirements

Check [xsmp-sdk system requirements](https://thalesgroup.github.io/xsmp-sdk/requirements.html).

## How to Build

\`\`\`bash
cmake -B ./build -DCMAKE_BUILD_TYPE=Release
cmake --build ./build --config Release
\`\`\`

## How to Test

\`\`\`bash
cd build && ctest -C Release --output-on-failure
\`\`\`

`);
    }
    else if (profile.id === esaCdkProfileId || profile.id === esaCdkLegacyProfileId) {
        await fs.promises.writeFile(path.join(dirPath, 'CMakeLists.txt'), `
file(GLOB_RECURSE SRC CONFIGURE_DEPENDS src/*.cpp src-gen/*.cpp)

simulus_library(
    MAIN
    SOURCES
        \${SRC}
    LIBRARIES
        esa.ecss.smp.cdk
)
target_include_directories(${projectName} PUBLIC src src-gen)
`);
    }

    if (tools.some(t => t.id === pythonToolId)) {
        const py_path = path.join(dirPath, 'python');
        fs.mkdirSync(py_path);
        await fs.promises.writeFile(path.join(dirPath, 'pytest.ini'), `
# pytest.ini
[pytest]
testpaths = python`);

        const py_projectPath = path.join(py_path, catalogueName);
        fs.mkdirSync(py_projectPath);
        await fs.promises.writeFile(path.join(py_projectPath, `test_${catalogueName}.py`), `
import ecss_smp
import xsmp
import ${catalogueName}

class Test${catalogueName}(xsmp.unittest.TestCase):
    try:
        sim: ${catalogueName}._test_${catalogueName}.Simulator
    except AttributeError:
        pass
    
    def loadAssembly(self, sim: ecss_smp.Smp.ISimulator):
        sim.LoadLibrary("${catalogueName}")
        #TODO create instances, configuration, connections, ...

    def test_${catalogueName}(self):
        # TODO write unit-test
        pass`);
    }

    if (tools.some(t => t.id === adocToolId)) {
        const adoc_path = path.join(dirPath, 'doc');
        fs.mkdirSync(adoc_path);
        await fs.promises.writeFile(path.join(adoc_path, `${catalogueName}.adoc`), `
:doctype: book
:toc:
:pdf-themesdir: {docdir}

= Catalogue document

include::${catalogueName}-gen.adoc[]
        `);

        const adoc_themepath = path.join(dirPath, 'doc', 'themes');
        fs.mkdirSync(adoc_themepath);
        await fs.promises.writeFile(path.join(adoc_themepath, 'default.yml'), `
extends: default
page:
  margin: [1.5in, 0.75in]
  numbering:
    start_at: title
base:
  font-family: Helvetica
running_content:
  start_at: title
header:
  height: 1.25in
  border-width: 0.25
  border-color: #DDDDDD
  recto:
    center:
      content: '{testvar}'
    right:
      content: |
        *Date:* {localdatetime} +
        *Page:* {page-number}/{page-count}
  verso:
    center:
      content: $header-recto-center-content
    right:
      content: $header-recto-right-content
footer:
  height: 0.85in
  font-size: 9
  recto:
    left:
      content: ''
    center:
      content: |
        *XSMP* +
        This document has been automatically generated using the Adoc tool from XSMP Modeler. +
        © {localyear}, All Rights Reserved
    right:
      content: ''
  verso:
    left:
      content: $footer-recto-left-content
    center:
      content: $footer-recto-center-content
    right:
      content: $footer-recto-right-content
        `);
    }

    // Create the project file

    let content = `
/**
 * XSMP Project configuration for ${projectName}
 */
project "${projectName}"

// project relative path(s) containing modeling file(s)
source "smdl"

`;

    if (profile) {
        content += `
// use ${profile.label}
profile "${profile.id}"

`;
    }
    for (const tool of tools) {
        content += `
// use ${tool.label}
tool "${tool.id}"

`;
    }

    content += `
// If your project needs types from outside sources,
// you can include them by adding project dependencies.
// For example: dependency "otherProject"
//              dependency "otherProject2"

`;

    await fs.promises.writeFile(path.join(dirPath, 'xsmp.project'), content);
}
