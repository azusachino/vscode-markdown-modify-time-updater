// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as yaml from "js-yaml";
import * as vscode from "vscode";
import dayjs = require("dayjs");

export function activate(context: vscode.ExtensionContext) {
  let disposable = vscode.commands.registerCommand(
    "extension.markdown-yaml-property-updater",
    () => {
      const editor = vscode.window.activeTextEditor;
      if (!editor) {
        vscode.window.showInformationMessage("No active editor found!");
        return;
      }

      const document = editor.document;
      if (document.languageId !== "markdown") {
        vscode.window.showInformationMessage("only works for Markdown files.");
        return;
      }

      const text = document.getText();
      const yamlFrontMatterMatch = text.match(/^---\r\n([\s\S]*?)\r\n---/);
      if (!yamlFrontMatterMatch) {
        vscode.window.showInformationMessage("No YAML front matter found.");
        return;
      }

      const yamlFrontMatter = yamlFrontMatterMatch[1];
      let yamlData: any;
      try {
        yamlData = yaml.load(yamlFrontMatter);
      } catch (e) {
        vscode.window.showErrorMessage("Failed to parse YAML front matter.");
        return;
      }

      yamlData.modified = dayjs().format("YYYY-MM-DD HH:mm:ss");

      // the final result in markdown always had a ', had no idea why
      const updatedYamlFrontMatter = yaml.dump(yamlData, {
        noRefs: true,
        quotingType: '"',
      });
      const updatedText = text.replace(
        yamlFrontMatterMatch[0],
        `---\n${updatedYamlFrontMatter}---`
      );

      const edit = new vscode.WorkspaceEdit();
      const fullRange = new vscode.Range(
        document.positionAt(0),
        document.positionAt(text.length)
      );
      edit.replace(document.uri, fullRange, updatedText);

      return vscode.workspace.applyEdit(edit).then((success) => {
        if (success) {
          vscode.window.showInformationMessage(
            "Updated the modified property in YAML front matter."
          );
        } else {
          vscode.window.showErrorMessage(
            "Failed to update the modified property."
          );
        }
      });
    }
  );

  context.subscriptions.push(disposable);
}

export function deactivate() {}
