const vscode = require(`vscode`);
const {
  isUndefined,
  isNull,
  _trimFirst,
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

const getIndent = (line) => {
  return line.length - _trimFirst(line, [` `, `\t`]).length;
};

const getMinIndent = (editor) => {
  let minIndent = Infinity;
  loopSelectionsLines(editor, i => {
    const {text} = editor.document.lineAt(i);
    if (_trim(text) === ``) { return; }
    const indent = getIndent(text);
    if (indent < minIndent) {
      minIndent = indent;
    }
  });
  if (minIndent === Infinity) { minIndent = 0; }
  return minIndent;
};

const getMinIndentExcludeLineNumber = (editor) => {
  let minIndent = Infinity;
  loopSelectionsLines(editor, i => {
    const {text} = editor.document.lineAt(i);
    if (_trim(text) === ``) { return; }
    if (isNull(_trim(text).match(/^\d+:+.*$/))) { return; }
    const colonAfterText = _subLastDelimFirst(text, `: `);
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

const setTextLineNumberNoFormat = (editor) => {
  const delimiter = `: `;
  editor.edit(editBuilder => {
    const numberDigit = getMaxFileLineNumberDigit(editor);
    loopSelectionsLines(editor, i => {
      const lineNumber = (i + 1).toString().padStart(numberDigit, `0`);
      editBuilder.insert(new vscode.Position(i, 0), `${lineNumber}${delimiter}`);
    });
  });
};

const setTextLineNumberDeleteIndent = (editor) => {
  const delimiter = `: `;
  editor.edit(editBuilder => {
    const numberDigit = getMaxFileLineNumberDigit(editor);
    const minIndent = getMinIndent(editor);
    loopSelectionsLines(editor, i => {
      const { text } = getLineTextInfo(editor, i);
      const subText = _subLength(text, minIndent);
      const lineNumber = (i + 1).toString().padStart(numberDigit, `0`);
      const range = new vscode.Range(
        i, 0, i, text.length,
      );
      editBuilder.replace(range, `${lineNumber}${delimiter}${subText}`);
    });
  });
};

const setTextInputNumberNoFormat = (editor, inputNumber) => {
  const delimiter = `: `;
  editor.edit(editBuilder => {
    const numberDigit = getInputLineNumberDigit(editor, inputNumber);
    loopSelectionsLines(editor, i => {
      const lineNumber = inputNumber.toString().padStart(numberDigit, `0`);
      editBuilder.insert(new vscode.Position(i, 0), `${lineNumber}${delimiter}`);
      inputNumber += 1;
    });
  });
};

const setTextInputNumberDeleteIndent = (editor, inputNumber) => {
  const delimiter = `: `;
  editor.edit(editBuilder => {
    const numberDigit = getInputLineNumberDigit(editor, inputNumber);
    const minIndent = getMinIndent(editor);
    loopSelectionsLines(editor, i => {
      const { text } = getLineTextInfo(editor, i);
      const subText = _subLength(text, minIndent);
      const lineNumber = inputNumber.toString().padStart(numberDigit, `0`);
      const range = new vscode.Range(
        i, 0, i, text.length,
      );
      editBuilder.replace(range, `${lineNumber}${delimiter}${subText}`);
      inputNumber += 1;
    });
  });
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

  // const mark = vscode.workspace.getConfiguration(`LineNumber`).get(`subMenuMark`);
  // const mark = `▸`;
  const mark = `>>`;

  registerCommand(`LineNumber.SelectFunction`, () => {

    commandQuickPick([
      [`Insert File Line Number`,   `${mark}`,  () => { commandQuickPick([
        [`No Format`,               ``,         () => {
          mainEditInsertLineNumber({format: `NoFormat`});
        }],
        [`Delete Indent`,           ``,         () => {
          mainEditInsertLineNumber({format: `DeleteIndent`});
        }],
      ], `Line Number : Insert File Line Number`); }],
      [`Insert Input Start Number`, `${mark}`,  () => { commandQuickPick([
        [`No Format`,               ``,         () => {
          mainEditInsertInputNumber({format: `NoFormat`});
        }],
        [`Delete Indent`,           ``,         () => {
          mainEditInsertInputNumber({format: `DeleteIndent`});
        }],
      ], `Line Number : Insert Input Start Number`); }],
      [`Delete Line Number`,        ``,         () => {
        mainEdit(`DeleteLineNumber`);
      }],
      [`Edit Line Number Text`,     `${mark}`,  () => { commandQuickPick([
        [`Delete Blank Line`,       ``,         () => {
          mainEdit(`DeleteBlankLine`);
        }],
        [`Delete Indent`,           ``,         () => {
          mainEdit(`DeleteIndent`);
        }],
      ], `Line Number : Edit Line Number Text`); }],


    ], `Line Number : Select Function`);

  });

  const mainEdit = (commandName) => {
    if (![
      `InsertNoFormat`, `InsertDeleteIndent`,
      `InputNoFormat`, `InputDeleteIndent`,
      `DeleteLineNumber`, `DeleteBlankLine`, `DeleteIndent`,
    ].includes(commandName)) {
      throw new Error(`mainEdit args commandName:${commandName}`);
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage(`No editor is active`);
      return;
    }

    switch (commandName) {

    case `InsertNoFormat`: {
      const delimiter = `: `;
      editor.edit(editBuilder => {
        const numberDigit = getMaxFileLineNumberDigit(editor);
        loopSelectionsLines(editor, i => {
          const lineNumberText = (i + 1).toString().padStart(numberDigit, `0`);
          editBuilder.insert(new vscode.Position(i, 0), `${lineNumberText}${delimiter}`);
        });
      });
    } break;

    case `InsertDeleteIndent`: {
      const delimiter = `: `;
      editor.edit(editBuilder => {
        const numberDigit = getMaxFileLineNumberDigit(editor);
        const minIndent = getMinIndent(editor);
        loopSelectionsLines(editor, i => {
          const { text } = getLineTextInfo(editor, i);
          const subText = _subLength(text, minIndent);
          const lineNumberText = (i + 1).toString().padStart(numberDigit, `0`);
          const range = new vscode.Range(
            i, 0, i, text.length,
          );
          editBuilder.replace(range, `${lineNumberText}${delimiter}${subText}`);
        });
      });
    } break;

    case `InputNoFormat`:
    case `InputDeleteIndent`: {

      vscode.window.showInputBox({
        ignoreFocusOut: true,
        placeHolder: ``,
        prompt: `Input String`,
        value: `1`,
      }).then(inputString => {
        const inputInteger = _stringToIntegerDefault(inputString);
        if (isUndefined(inputInteger)) { return; }

        switch (commandName) {

        case `InputNoFormat`: {
          const delimiter = `: `;
          editor.edit(editBuilder => {
            let lineNumber = inputInteger;
            const numberDigit = getInputLineNumberDigit(editor, lineNumber);
            loopSelectionsLines(editor, i => {
              const lineNumberText = lineNumber.toString().padStart(numberDigit, `0`);
              editBuilder.insert(new vscode.Position(i, 0), `${lineNumberText}${delimiter}`);
              lineNumber += 1;
            });
          });
        } break;

        case `InputDeleteIndent`: {
          const delimiter = `: `;
          editor.edit(editBuilder => {
            let lineNumber = inputInteger;
            const numberDigit = getInputLineNumberDigit(editor, lineNumber);
            const minIndent = getMinIndent(editor);
            loopSelectionsLines(editor, i => {
              const { text } = getLineTextInfo(editor, i);
              const subText = _subLength(text, minIndent);
              const lineNumberText = lineNumber.toString().padStart(numberDigit, `0`);
              const range = new vscode.Range(
                i, 0, i, text.length,
              );
              editBuilder.replace(range, `${lineNumberText}${delimiter}${subText}`);
              lineNumber += 1;
            });
          });
        } break;

        }

      });

    } break;

    case `DeleteLineNumber`: {
      const delimiter = `: `;
      const trimDelimiter = _trim(delimiter);
      editor.edit(editBuilder => {
        loopSelectionsLines(editor, i => {
          const { text } = getLineTextInfo(editor, i);
          if (isNull(_trim(text).match(`^\\d+${trimDelimiter}+.*$`))) { return; }
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
      const delimiter = `: `;
      const trimDelimiter = _trim(delimiter);
      editor.edit(editBuilder => {
        loopSelectionsLines(editor, i => {
          const { text } = getLineTextInfo(editor, i);
          if (isNull(_trim(text).match(`^\\d+${trimDelimiter}+.*$`))) { return; }
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
      const delimiter = `: `;
      const trimDelimiter = _trim(delimiter);
      editor.edit(editBuilder => {
        const minIndent = getMinIndentExcludeLineNumber(editor);
        loopSelectionsLines(editor, i => {
          const { text } = getLineTextInfo(editor, i);
          if (isNull(_trim(text).match(`^\\d+${trimDelimiter}+.*$`))) { return; }
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

  const mainEditInsertLineNumber = ({format}) => {
    if (![
      `NoFormat`, `DeleteIndent`,
    ].includes(format)) {
      throw new Error(`mainEditInsertLineNumber args format:${format}`);
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage(`No editor is active`);
      return;
    }

    switch (format) {
    case `NoFormat`: {
      setTextLineNumberNoFormat(editor);
    }; break;
    case `DeleteIndent`: {
      setTextLineNumberDeleteIndent(editor);
    }; break;
    }
  };

  const mainEditInsertInputNumber = ({format}) => {
    if (![
      `NoFormat`, `DeleteIndent`,
    ].includes(format)) {
      throw new Error(`mainEditInsertInputNumber args format:${format}`);
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage(`No editor is active`);
      return;
    }

    vscode.window.showInputBox({
      ignoreFocusOut: true,
      placeHolder: ``,
      prompt: `Input String`,
      value: `1`,
    }).then(inputString => {
      const inputInteger = _stringToIntegerDefault(inputString);
      if (isUndefined(inputInteger)) { return; }

      switch (format) {
      case `NoFormat`: {
        setTextInputNumberNoFormat(editor, inputInteger);
      }; break;
      case `DeleteIndent`: {
        setTextInputNumberDeleteIndent(editor, inputInteger);
      }; break;
      }
    });

  };

  registerCommand(`LineNumber.EditInsertFileLineNumberNoFormat`, () => {
    mainEdit(`InsertNoFormat`);
  });

  registerCommand(`LineNumber.EditInsertFileLineNumberDeleteIndent`, () => {
    mainEdit(`InsertDeleteIndent`);
  });

  registerCommand(`LineNumber.EditInsertInputStartNoFormat`, () => {
    mainEdit(`InputNoFormat`);
  });

  registerCommand(`LineNumber.EditInsertInputStartDeleteIndent`, () => {
    mainEdit(`InputDeleteIndent`);
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
