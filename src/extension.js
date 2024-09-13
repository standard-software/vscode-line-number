const vscode = require(`vscode`);
const {
  isUndefined,
  isNull,
  _trimFirst,
  _trimLast,
  _trim,
  _indexOfFirst,
  _subLength,
  _stringToIntegerDefault,
  _subLastDelimFirst,
} = require(`./parts/parts.js`);

const loopSelectionsLines = (editor, func) => {
  for (const { start, end } of editor.selections) {
    for (let i = start.line; i <= end.line; i += 1) {
      if (
        start.line !== end.line &&
        i === end.line &&
        end.character === 0
      ) {
        break;
      }
      func(i);
    }
  }
};

const escapeRegExp = (value) => {
  return value.replace(/[\\\*\+\.\?\{\}\(\)\[\]\^\$\-\|\/]/g, `\\$&`);
};

const getIndent = (line) => {
  return line.length - _trimFirst(line, [` `, `\t`]).length;
};

const getMinIndentExcludeLineNumber = (editor, delimiter) => {
  const trimDelimiter = _trimLast(delimiter);
  const trimDelimiterEsc = escapeRegExp(trimDelimiter);
  let minIndent = Infinity;
  loopSelectionsLines(editor, i => {
    const {text} = editor.document.lineAt(i);
    if (_trim(text) === ``) { return; }
    if (isNull(_trim(text).match(`^\\d+${trimDelimiterEsc}+.*$`))) { return; }
    const colonAfterText = _subLastDelimFirst(text, delimiter);
    if (_trim(colonAfterText) === ``) { return; }
    const indent = getIndent(colonAfterText);
    if (indent < minIndent) {
      minIndent = indent;
    }
  });
  if (minIndent === Infinity) { minIndent = 0; }
  return minIndent;
};

const getMaxFileLineNumberDigit = (editor) => {
  let result = 0;
  loopSelectionsLines(editor, i => {
    result = Math.max(result, i.toString().length);
  });
  return result;
};

const getInputLineNumberDigit = (editor, lineNumber) => {
  let result = 0;
  loopSelectionsLines(editor, () => {
    result = Math.max(result, lineNumber.toString().length);
    lineNumber += 1;
  });
  return result;
};

const getLineTextInfo = (editor, lineIndex) => {
  const lineAt = editor.document.lineAt(lineIndex);
  const { text } = lineAt;
  const textIncludeLineBreak = editor.document.getText(
    lineAt.rangeIncludingLineBreak
  );
  const lineBreak = _subLength(textIncludeLineBreak, text.length);
  return {
    text, textIncludeLineBreak, lineBreak
  };
};

function activate(context) {

  const registerCommand = (commandName, func) => {
    context.subscriptions.push(
      vscode.commands.registerCommand(
        commandName, func
      )
    );
  };

  const commandQuickPick = (commandsArray, placeHolder) => {
    const commands = commandsArray.map(c => ({label:c[0], description:c[1], func:c[2]}));
    vscode.window.showQuickPick(
      commands.map(({label, description}) => ({label, description})),
      {
        canPickMany: false,
        placeHolder
      }
    ).then((item) => {
      if (!item) { return; }
      commands.find(({label}) => label === item.label).func();
    });
  };


  registerCommand(`LineNumber.SelectFunction`, () => {

    commandQuickPick([
      [`Insert File Line Number`,   ``, () => {
        mainEdit(`InsertNoFormat`);
      }],
      [`Insert Input Start Number`, ``, () => {
        mainEdit(`InputNoFormat`);
      }],
      [`Delete Line Number`,        ``, () => {
        mainEdit(`DeleteLineNumber`);
      }],
      [`Edit Line Number Text : Delete Blank Line`, ``, () => {
        mainEdit(`DeleteBlankLine`);
      }],
      [`Edit Line Number Text : Delete Indent`,     ``, () => {
        mainEdit(`DeleteIndent`);
      }],
    ], `Line Number : Select Function`);

  });

  const mainEdit = (commandName) => {
    if (![
      `InsertNoFormat`, `InputNoFormat`,
      `DeleteLineNumber`, `DeleteBlankLine`, `DeleteIndent`,
    ].includes(commandName)) {
      throw new Error(`mainEdit args commandName:${commandName}`);
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage(`No editor is active`);
      return;
    }

    const delimiter = vscode.workspace
      .getConfiguration(`LineNumber`).get(`delimiter`);

    if (_trim(delimiter) === ``) {
      vscode.window.showInformationMessage(`The delimiter must contain non-whitespace characters`);
      return;
    }

    switch (commandName) {

    case `InsertNoFormat`: {
      editor.edit(editBuilder => {
        const numberDigit = getMaxFileLineNumberDigit(editor);
        loopSelectionsLines(editor, i => {
          const lineNumberText = (i + 1).toString().padStart(numberDigit, `0`);
          editBuilder.insert(new vscode.Position(i, 0), `${lineNumberText}${delimiter}`);
        });
      });
    } break;

    case `InputNoFormat`: {
      vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: ``,
        prompt: `Input String`,
        value: `1`,
      }).then(inputString => {
        const inputInteger = _stringToIntegerDefault(inputString);
        if (isUndefined(inputInteger)) { return; }

        editor.edit(editBuilder => {
          let lineNumber = inputInteger;
          const numberDigit = getInputLineNumberDigit(editor, lineNumber);
          loopSelectionsLines(editor, i => {
            const lineNumberText = lineNumber.toString().padStart(numberDigit, `0`);
            editBuilder.insert(new vscode.Position(i, 0), `${lineNumberText}${delimiter}`);
            lineNumber += 1;
          });
        });
      });

    } break;

    case `DeleteLineNumber`: {
      const trimDelimiter = _trimLast(delimiter);
      const trimDelimiterEsc = escapeRegExp(trimDelimiter);
      editor.edit(editBuilder => {
        loopSelectionsLines(editor, i => {
          const { text } = getLineTextInfo(editor, i);
          if (isNull(_trim(text).match(`^\\d+${trimDelimiterEsc}+.*$`))) { return; }
          let colonIndex = _indexOfFirst(text, delimiter);
          if (colonIndex !== -1) {
            const range = new vscode.Range(
              i, 0, i, colonIndex + delimiter.length,
            );
            editBuilder.delete(range);
          } else {
            colonIndex = _indexOfFirst(text, trimDelimiter);
            if (colonIndex !== -1) {
              const range = new vscode.Range(
                i, 0, i, colonIndex + trimDelimiter.length,
              );
              editBuilder.delete(range);
            }
          }
        });
      });
    } break;

    case `DeleteBlankLine`: {
      const trimDelimiter = _trimLast(delimiter);
      const trimDelimiterEsc = escapeRegExp(trimDelimiter);
      editor.edit(editBuilder => {
        loopSelectionsLines(editor, i => {
          const { text } = getLineTextInfo(editor, i);
          if (isNull(_trim(text).match(`^\\d+${trimDelimiterEsc}+.*$`))) { return; }
          if (_trim(_subLastDelimFirst(text, trimDelimiter)) === ``) {
            const range = new vscode.Range(
              i, 0, i + 1, 0,
            );
            editBuilder.delete(range);
          }
        });
      });
    } break;

    case `DeleteIndent`: {
      const trimDelimiter = _trimLast(delimiter);
      const trimDelimiterEsc = escapeRegExp(trimDelimiter);
      editor.edit(editBuilder => {
        const minIndent = getMinIndentExcludeLineNumber(editor, delimiter);
        loopSelectionsLines(editor, i => {
          const { text } = getLineTextInfo(editor, i);
          if (isNull(_trim(text).match(`^\\d+${trimDelimiterEsc}+.*$`))) { return; }
          const colonAfterText = _subLastDelimFirst(text, trimDelimiter);
          if (minIndent < colonAfterText.length) {
            const range = new vscode.Range(
              i, text.length - colonAfterText.length,
              i, text.length - colonAfterText.length + minIndent,
            );
            editBuilder.delete(range);
          }
        });

      });
    } break;

    }

  };

  registerCommand(`LineNumber.EditInsertFileLineNumberNoFormat`, () => {
    mainEdit(`InsertNoFormat`);
  });

  registerCommand(`LineNumber.EditInsertInputStartNoFormat`, () => {
    mainEdit(`InputNoFormat`);
  });

  registerCommand(`LineNumber.EditDeleteLineNumber`, () => {
    mainEdit(`DeleteLineNumber`);
  });

  registerCommand(`LineNumber.EditLineNumberTextDeleteBlankLine`, () => {
    mainEdit(`DeleteBlankLine`);
  });

  registerCommand(`LineNumber.EditLineNumberTextDeleteIndent`, () => {
    mainEdit(`DeleteIndent`);
  });

}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
