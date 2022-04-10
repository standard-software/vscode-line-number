const vscode = require(`vscode`);
const {
  isUndefined,
  isNull,
  _trimFirst,
  _trim,
  _includeCount,
  _indexOfFirst, _indexOfLast,
  _subIndex, _subLength,
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

const getDefaultLineBreak = (editor) => {
  let text = ``;
  for (let selection of editor.selections) {
    const range = new vscode.Range(
      selection.start.line,
      0,
      selection.end.line,
      getLineTextInfo(
        editor, selection.end.line
      ).textIncludeLineBreak.length
    );
    text += editor.document.getText(range);
  }

  const crlf = _includeCount(text, `\r\n`);
  const cr = _includeCount(text, `\r`);
  const lf = _includeCount(text, `\n`);
  let most = ``;
  if (crlf < cr) {
    most = `cr`;
    if (cr < lf) {
      most = `lf`;
    }
  } else {
    most = `crlf`;
    if (crlf < lf) {
      most = `lf`;
    }
  }

  if (most === `crlf`) {
    return `\r\n`;
  } else if (most === `cr`) {
    return `\r`;
  } else if (most === `lf`) {
    return `\n`;
  } else {
    throw new Error(`getDefaultLineBreak`);
  }
};

const getPathFileName = (editor) => {
  let delimiterIndex = _indexOfLast(editor.document.fileName, `\\`);
  if (delimiterIndex === -1) {
    delimiterIndex = _indexOfLast(editor.document.fileName, `/`);
  }

  let path = ``;
  let filename = ``;
  if ([-1, 0].includes(delimiterIndex)) {
    filename = editor.document.fileName;
  } else {
    path = _subIndex(editor.document.fileName, 0, delimiterIndex);
    filename = _subLength(editor.document.fileName, delimiterIndex + 1);
  }
  return {
    path, filename
  };
};

const lineNumberTextNoFormat = (editor) => {
  const delimiter = `: `;
  let result = ``;
  const numberDigit = getMaxFileLineNumberDigit(editor);
  loopSelectionsLines(editor, i => {
    const { textIncludeLineBreak } = getLineTextInfo(editor, i);
    const lineNumber = (i + 1).toString().padStart(numberDigit, `0`);
    result += `${lineNumber}${delimiter}${textIncludeLineBreak}`;
  });
  return result;
};

const lineNumberTextDeleteIndent = (editor) => {
  const delimiter = `: `;
  let result = ``;
  const numberDigit = getMaxFileLineNumberDigit(editor);
  const minIndent = getMinIndent(editor);
  loopSelectionsLines(editor, i => {
    const { text, lineBreak } = getLineTextInfo(editor, i);
    const lineNumber = (i + 1).toString().padStart(numberDigit, `0`);
    result += `${lineNumber}${delimiter}${_subLength(text, minIndent)}${lineBreak}`;
  });
  return result;
};

const lineNumberTextDeleteLineNumber = (editor) => {
  const delimiter = `: `;
  const trimDelimiter = _trim(delimiter);
  let result = ``;
  loopSelectionsLines(editor, i => {
    const { text, lineBreak } = getLineTextInfo(editor, i);
    if (isNull(_trim(text).match(`^\\d+${trimDelimiter}+.*$`))) {
      result += text + lineBreak;
      return;
    }
    let colonIndex = _indexOfFirst(text, delimiter);
    if (colonIndex !== -1) {
      result += _subLastDelimFirst(text, delimiter) + lineBreak;
    } else {
      colonIndex = _indexOfFirst(text, trimDelimiter);
      if (colonIndex !== -1) {
        result += _subLastDelimFirst(text, trimDelimiter) + lineBreak;
      }
    }
  });
  return result;
};

const copyTextHeaderFullPath = (editor) => {
  const lineBreak = getDefaultLineBreak(editor);
  const { path, filename } = getPathFileName(editor);
  return (
    (path !== `` ? path + lineBreak + filename : filename) +
    lineBreak
  );
};

// const copyTextHeaderRelativePath = (editor) => {
//   const lineBreak = getDefaultLineBreak(editor);

//   const uri = editor.document.uri;
//   const relativePath = vscode.workspace.asRelativePath(
//     uri
//   ).replaceAll(`\\`, `/`);
//   return (
//     relativePath +
//     lineBreak
//   );
// };

const copyTextHeaderFilename = (editor) => {
  const lineBreak = getDefaultLineBreak(editor);
  const { filename } = getPathFileName(editor);
  return (
    filename +
    lineBreak
  );
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

  const subMenuChar = vscode.workspace.getConfiguration(`LineNumber`).get(`subMenuChar`);

  registerCommand(`LineNumber.SelectFunction`, () => {

    let select1Edit, select1Copy;
    commandQuickPick([
      [`Edit ${subMenuChar}`,   ``, () => { select1Edit(); }],
      [`Copy ${subMenuChar}`,   ``, () => { select1Copy(); }],
    ], `Line Number | Select Function`);

    select1Edit = () => {
      let
        select2EditInsertLineNumber,
        select2EditInsertInputStart,
        select2EditLineNumberText;
      commandQuickPick([
        [`Insert File Line Number ${subMenuChar}`,    ``, () => { select2EditInsertLineNumber(); }],
        [`Insert Input Start Number ${subMenuChar}`,  ``, () => { select2EditInsertInputStart(); }],
        [`Delete Line Number`,                        ``, () => { mainEdit(`DeleteLineNumber`); }],
        [`Edit Line Number Text ${subMenuChar}`,      ``, () => { select2EditLineNumberText(); }],
      ], `Line Number | Edit`);

      select2EditInsertLineNumber = () => {
        commandQuickPick([
          [`No Format`,       ``, () => { mainEdit(`InsertNoFormat`); }],
          [`Delete Indent`,   ``, () => { mainEdit(`InsertDeleteIndent`); }],
        ], `Line Number | Edit | Insert File Line Number`);
      };

      select2EditInsertInputStart = () => {
        commandQuickPick([
          [`No Format`,       ``, () => { mainEdit(`InputNoFormat`); }],
          [`Delete Indent`,   ``, () => { mainEdit(`InputDeleteIndent`); }],
        ], `Line Number | Edit | Insert Input Start`);
      };

      select2EditLineNumberText = () => {
        commandQuickPick([
          [`Delete Blank Line`, ``, () => { mainEdit(`DeleteBlankLine`); }],
          [`Delete Indent`,     ``, () => { mainEdit(`DeleteIndent`); }],
        ], `Line Number | Edit | Edit Line Number Text`);
      };

    };

    select1Copy = () => {
      let
        select2CopyWithoutPath,
        select2CopyWithFullPath,
        // select2CopyRelativePath,
        select2CopyWithFilename;
      commandQuickPick([
        [`Copy Without Path ${subMenuChar}`,                      ``, () => { select2CopyWithoutPath(); }],
        [`Copy With FullPath/Filename ${subMenuChar}`,            ``, () => { select2CopyWithFullPath(); }],
        // [`Copy With RelativePath ${subMenuChar}`, ``, () => { select2CopyRelativePath(); }],
        [`Copy With Filename ${subMenuChar}`,     ``, () => { select2CopyWithFilename(); }],
        [`Copy Delete Line Number`,                               ``, () => { mainCopy(`CopyDeleteLineNumber`); }],
      ], `Line Number | Copy`);

      select2CopyWithoutPath = () => {
        commandQuickPick([
          [`Original`,            ``, () => { mainCopy(`CopyWithoutPathNoFormat`); }],
          [`Delete Indent`,       ``, () => { mainCopy(`CopyWithoutPathDeleteIndent`); }],
        ], `Line Number | Copy | Without Path`);
      };

      select2CopyWithFullPath = () => {
        commandQuickPick([
          [`Original`,            ``, () => { mainCopy(`CopyWithFullPathNoFormat`); }],
          [`Delete Indent`,       ``, () => { mainCopy(`CopyWithFullPathDeleteIndent`); }],
        ], `Line Number | Copy | With FullPath/Filename`);
      };

      // select2CopyRelativePath = () => {
      //   commandQuickPick([
      //     [`Original`,               ``, () => { mainCopy(`CopyWithRelativePathNoFormat`); }],
      //     [`Delete Indent`,          ``, () => { mainCopy(`CopyWithRelativePathDeleteIndent`); }],
      //   ], `Line Number | Copy | With RelativePath`);
      // };

      select2CopyWithFilename = () => {
        commandQuickPick([
          [`Original`,            ``, () => { mainCopy(`CopyWithFilenameNoFormat`); }],
          [`Delete Indent`,       ``, () => { mainCopy(`CopyWithFilenameDeleteIndent`); }],
        ], `Line Number | Copy | With Filename`);
      };

    };

  });

  const mainEdit = (commandName) => {
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

  const mainCopy = (commandName) => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage(`No editor is active`);
      return;
    }

    switch (commandName) {

    case `CopyWithoutPathNoFormat`: {
      const copyText = lineNumberTextNoFormat(editor);
      vscode.env.clipboard.writeText(copyText);
    } break;

    case `CopyWithoutPathDeleteIndent`: {
      const copyText = lineNumberTextDeleteIndent(editor);
      vscode.env.clipboard.writeText(copyText);
    } break;

    case `CopyWithFullPathNoFormat`: {
      const copyText =
        copyTextHeaderFullPath(editor) +
        lineNumberTextNoFormat(editor);
      vscode.env.clipboard.writeText(copyText);
    } break;

    case `CopyWithFullPathDeleteIndent`: {
      const copyText =
        copyTextHeaderFullPath(editor) +
        lineNumberTextDeleteIndent(editor);
      vscode.env.clipboard.writeText(copyText);
    } break;

    // case `CopyWithRelativePathNoFormat`: {
    //   const copyText =
    //     copyTextHeaderRelativePath(editor) +
    //     lineNumberTextNoFormat(editor);
    //   vscode.env.clipboard.writeText(copyText);
    // } break;

    // case `CopyWithRelativePathDeleteIndent`: {
    //   const copyText =
    //     copyTextHeaderRelativePath(editor) +
    //     lineNumberTextDeleteIndent(editor);
    //   vscode.env.clipboard.writeText(copyText);
    // } break;

    case `CopyWithFilenameNoFormat`: {
      const copyText =
        copyTextHeaderFilename(editor) +
        lineNumberTextNoFormat(editor);
      vscode.env.clipboard.writeText(copyText);
    } break;

    case `CopyWithFilenameDeleteIndent`: {
      const copyText =
        copyTextHeaderFilename(editor) +
        lineNumberTextDeleteIndent(editor);
      vscode.env.clipboard.writeText(copyText);
    } break;

    case `CopyDeleteLineNumber`: {
      const copyText =
        lineNumberTextDeleteLineNumber(editor);
      vscode.env.clipboard.writeText(copyText);
    } break;

    }

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

  registerCommand(`LineNumber.CopyWithoutPathNoFormat`, () => {
    mainCopy(`CopyWithoutPathNoFormat`);
  });

  registerCommand(`LineNumber.CopyWithoutPathDeleteIndent`, () => {
    mainCopy(`CopyWithoutPathDeleteIndent`);
  });

  registerCommand(`LineNumber.CopyWithFullPathFilenameNoFormat`, () => {
    mainCopy(`CopyWithFullPathNoFormat`);
  });

  registerCommand(`LineNumber.CopyWithFullPathFilenameDeleteIndent`, () => {
    mainCopy(`CopyWithFullPathDeleteIndent`);
  });

  registerCommand(`LineNumber.CopyWithFilenameNoFormat`, () => {
    mainCopy(`CopyWithFilenameNoFormat`);
  });

  registerCommand(`LineNumber.CopyWithFilenameDeleteIndent`, () => {
    mainCopy(`CopyWithFilenameDeleteIndent`);
  });

  registerCommand(`LineNumber.CopyDeleteLineNumber`, () => {
    mainCopy(`CopyDeleteLineNumber`);
  });

}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
