const vscode = require(`vscode`);
const {
  isUndefined,
  isNull,
  // isBoolean,
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

const copyTextHeaderRelativePath = (editor) => {
  const lineBreak = getDefaultLineBreak(editor);

  const uri = editor.document.uri;
  const relativePath = vscode.workspace.asRelativePath(
    uri
  );
  return (
    relativePath +
    lineBreak
  );
};

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

  const mark = vscode.workspace.getConfiguration(`LineNumber`).get(`subMenuChar`);

  registerCommand(`LineNumber.SelectFunction`, () => {

    commandQuickPick([
      [`Edit`, `${mark}`, () => { commandQuickPick([
        [`Insert File Line Number`,   `${mark}`,  () => { commandQuickPick([
          [`No Format`,               ``,         () => { mainEdit(`InsertNoFormat`); }],
          [`Delete Indent`,           ``,         () => { mainEdit(`InsertDeleteIndent`); }],
        ], `Line Number | Edit | Insert File Line Number`); }],
        [`Insert Input Start Number`, `${mark}`,  () => { commandQuickPick([
          [`No Format`,               ``,         () => { mainEdit(`InputNoFormat`); }],
          [`Delete Indent`,           ``,         () => { mainEdit(`InputDeleteIndent`); }],
        ], `Line Number | Edit | Insert Input Start`); }],
        [`Delete Line Number`,        ``,         () => { mainEdit(`DeleteLineNumber`); }],
        [`Edit Line Number Text`,     `${mark}`,  () => { commandQuickPick([
          [`Delete Blank Line`,       ``,         () => { mainEdit(`DeleteBlankLine`); }],
          [`Delete Indent`,           ``,         () => { mainEdit(`DeleteIndent`); }],
        ], `Line Number | Edit | Edit Line Number Text`); }],
      ], `Line Number | Edit`); }],

      [`Copy With LineNumber`, `${mark}`, () => { commandQuickPick([
        [`Copy No Header`,                    `${mark}`,  () => { commandQuickPick([
          [`No Format`,                       ``,         () => { mainCopyWithLineNumber({header:`None`, format:`NoFormat`}); }],
          [`Delete Indent`,                   ``,         () => { mainCopyWithLineNumber({header:`None`, format:`DeleteIndent`}); }],
        ], `Line Number | Copy | Without Path`); }],
        [`Copy Header FileName`,              `${mark}`,  () => { commandQuickPick([
          [`No Format`,                       ``,         () => { mainCopyWithLineNumber({header:`FileName`, format:`NoFormat`}); }],
          [`Delete Indent`,                   ``,         () => { mainCopyWithLineNumber({header:`FileName`, format:`DeleteIndent`}); }],
        ], `Line Number | Copy | With Filename`); }],
        [`Copy Header FullPath/FileName`,     `${mark}`,  () => { commandQuickPick([
          [`No Format`,                       ``,         () => { mainCopyWithLineNumber({header:`FullPath`, format:`NoFormat`}); }],
          [`Delete Indent`,                   ``,         () => { mainCopyWithLineNumber({header:`FullPath`, format:`DeleteIndent`}); }],
        ], `Line Number | Copy | With FullPath/Filename`); }],
        [`Copy Header RelativePath/FileName`, `${mark}`,  () => { commandQuickPick([
          [`No Format`,                       ``,         () => { mainCopyWithLineNumber({header:`RelativePath`, format:`NoFormat`}); }],
          [`Delete Indent`,                   ``,         () => { mainCopyWithLineNumber({header:`RelativePath`, format:`DeleteIndent`}); }],
        ], `Line Number | Copy | With RelativePath`); }],
      ], `Line Number | Copy With LineNumber`); }],

      [`Copy Delete Line Number`,           ``,         () => { mainCopyDeleteLineNumber(); }],

    ], `Line Number | Select Function`);

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

  const mainCopyDeleteLineNumber = () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage(`No editor is active`);
      return;
    }

    const copyText =
      lineNumberTextDeleteLineNumber(editor);
    vscode.env.clipboard.writeText(copyText);
  };

  const mainCopyWithLineNumber = ({header, format}) => {
    if (![
      `None`, `FileName`, `FullPath`, `RelativePath`
    ].includes(header)) {
      throw new Error(`mainCopy args header:${header}`);
    }
    if (![
      `NoFormat`, `DeleteIndent`, `DeleteBlankLine`, `DeleteIndentBlankLine`
    ].includes(format)) {
      throw new Error(`mainCopy args format:${format}`);
    }

    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage(`No editor is active`);
      return;
    }

    let headerText = ``;
    switch (header) {
    case `None`: {
      headerText = ``;
    } break;
    case `FileName`: {
      headerText = copyTextHeaderFilename(editor);
    } break;
    case `FullPath`: {
      headerText = copyTextHeaderFullPath(editor);
    } break;
    case `RelativePath`: {
      headerText = copyTextHeaderRelativePath(editor);
    } break;
    }

    switch (format) {
    case `NoFormat`: {
      const copyText = headerText + lineNumberTextNoFormat(editor);
      vscode.env.clipboard.writeText(copyText);
    }; break;
    case `DeleteIndent`: {
      const copyText = headerText + lineNumberTextDeleteIndent(editor);
      vscode.env.clipboard.writeText(copyText);
    }; break;
    case `DeleteBlankLine`: {

    }; break;
    case `DeleteIndentBlankLine`: {

    }; break;

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

  registerCommand(`LineNumber.CopyNoHeaderNoFormat`, () => {
    mainCopyWithLineNumber({header:`None`, format:`NoFormat`});
  });

  registerCommand(`LineNumber.CopyNoHeaderDeleteIndent`, () => {
    mainCopyWithLineNumber({header:`None`, format:`DeleteIndent`});
  });

  registerCommand(`LineNumber.CopyFileNameNoFormat`, () => {
    mainCopyWithLineNumber({header:`FileName`, format:`NoFormat`});
  });

  registerCommand(`LineNumber.CopyFileNameDeleteIndent`, () => {
    mainCopyWithLineNumber({header:`FileName`, format:`DeleteIndent`});
  });

  registerCommand(`LineNumber.CopyFullPathNoFormat`, () => {
    mainCopyWithLineNumber({header:`FullPath`, format:`NoFormat`});
  });

  registerCommand(`LineNumber.CopyFullPathDeleteIndent`, () => {
    mainCopyWithLineNumber({header:`FullPath`, format:`DeleteIndent`});
  });

  registerCommand(`LineNumber.CopyWithRelativePathFilenameNoFormat`, () => {
    mainCopyWithLineNumber({header:`RelativePath`, format:`NoFormat`});
  });

  registerCommand(`LineNumber.CopyWithRelativePathFilenameDeleteIndent`, () => {
    mainCopyWithLineNumber({header:`RelativePath`, format:`DeleteIndent`});
  });

  registerCommand(`LineNumber.CopyDeleteLineNumber`, () => {
    mainCopyDeleteLineNumber();
  });

}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
