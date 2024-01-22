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

const splitPathFolderFileName = path => {
  let delimiterIndex = _indexOfLast(path, `\\`);
  if (delimiterIndex === -1) {
    delimiterIndex = _indexOfLast(path, `/`);
  }

  let folderPath = ``;
  let fileName = ``;
  if (delimiterIndex === -1) {
    fileName = path;
  } else {
    folderPath = _subIndex(path, 0, delimiterIndex);
    fileName = _subLength(path, delimiterIndex + 1);
  }
  return { folderPath, fileName };
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

const getTextLineNumberNoFormat = (editor) => {
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

const getTextLineNumberDeleteIndent = (editor) => {
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

const getTextLineNumberDeleteBlankLine = (editor) => {
  const delimiter = `: `;
  let result = ``;
  const numberDigit = getMaxFileLineNumberDigit(editor);
  loopSelectionsLines(editor, i => {
    const { text, textIncludeLineBreak } = getLineTextInfo(editor, i);
    if (_trim(text) === ``) { return; }
    const lineNumber = (i + 1).toString().padStart(numberDigit, `0`);
    result += `${lineNumber}${delimiter}${textIncludeLineBreak}`;
  });
  return result;
};

const getTextLineNumberDeleteIndentBlankLine = (editor) => {
  const delimiter = `: `;
  let result = ``;
  const numberDigit = getMaxFileLineNumberDigit(editor);
  const minIndent = getMinIndent(editor);
  loopSelectionsLines(editor, i => {
    const { text, lineBreak } = getLineTextInfo(editor, i);
    if (_trim(text) === ``) { return; }
    const lineNumber = (i + 1).toString().padStart(numberDigit, `0`);
    result += `${lineNumber}${delimiter}${_subLength(text, minIndent)}${lineBreak}`;
  });
  return result;
};

const getTextNoLineNumberNoFormat = (editor) => {
  let result = ``;
  loopSelectionsLines(editor, i => {
    const { textIncludeLineBreak } = getLineTextInfo(editor, i);
    result += `${textIncludeLineBreak}`;
  });
  return result;
};

const getTextNoLineNumberDeleteIndent = (editor) => {
  let result = ``;
  const minIndent = getMinIndent(editor);
  loopSelectionsLines(editor, i => {
    const { text, lineBreak } = getLineTextInfo(editor, i);
    result += `${_subLength(text, minIndent)}${lineBreak}`;
  });
  return result;
};

const getTextNoLineNumberDeleteBlankLine = (editor) => {
  let result = ``;
  loopSelectionsLines(editor, i => {
    const { text, textIncludeLineBreak } = getLineTextInfo(editor, i);
    if (_trim(text) === ``) { return; }
    result += `${textIncludeLineBreak}`;
  });
  return result;
};

const getTextNoLineNumberDeleteIndentBlankLine = (editor) => {
  let result = ``;
  const minIndent = getMinIndent(editor);
  loopSelectionsLines(editor, i => {
    const { text, lineBreak } = getLineTextInfo(editor, i);
    if (_trim(text) === ``) { return; }
    result += `${_subLength(text, minIndent)}${lineBreak}`;
  });
  return result;
};

const getTextDeleteLineNumber = (editor) => {
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

const getHeaderFullPath = (editor) => {
  const lineBreak = getDefaultLineBreak(editor);
  const { folderPath, fileName } = splitPathFolderFileName(
    editor.document.fileName
  );
  return ((
    folderPath !== ``
      ? folderPath + lineBreak + fileName
      : fileName
  ) + lineBreak );
};

const getHeaderRelativePath = (editor) => {
  const lineBreak = getDefaultLineBreak(editor);
  const relativePath = vscode.workspace.asRelativePath(
    editor.document.uri.fsPath
  );
  const { folderPath, fileName } = splitPathFolderFileName(
    relativePath
  );
  return ((
    folderPath !== ``
      ? folderPath + lineBreak + fileName
      : fileName
  ) + lineBreak );
};

const getHeaderFileName = (editor) => {
  const lineBreak = getDefaultLineBreak(editor);
  const { fileName } = splitPathFolderFileName(
    editor.document.fileName
  );
  return (
    fileName +
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

  const mark = vscode.workspace.getConfiguration(`LineNumber`).get(`subMenuMark`);

  registerCommand(`LineNumber.SelectFunction`, () => {

    commandQuickPick([
      [`Edit`, `${mark}`, () => { commandQuickPick([
        [`Insert File Line Number`,   `${mark}`,  () => { commandQuickPick([
          [`No Format`,               ``,         () => {
            mainEditInsertLineNumber({format: `NoFormat`});
          }],
          [`Delete Indent`,           ``,         () => {
            mainEditInsertLineNumber({format: `DeleteIndent`});
          }],
        ], `Line Number | Edit | Insert File Line Number`); }],
        [`Insert Input Start Number`, `${mark}`,  () => { commandQuickPick([
          [`No Format`,               ``,         () => {
            mainEditInsertInputNumber({format: `NoFormat`});
          }],
          [`Delete Indent`,           ``,         () => {
            mainEditInsertInputNumber({format: `DeleteIndent`});
          }],
        ], `Line Number | Edit | Insert Input Start Number`); }],
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
        ], `Line Number | Edit | Edit Line Number Text`); }],
      ], `Line Number | Edit`); }],

      [`Copy With LineNumber`, `${mark}`, () => { commandQuickPick([
        [`Copy No Header`,                    `${mark}`,  () => { commandQuickPick([
          [`No Format`,                       ``,         () => {
            mainCopyWithLineNumber({header:`None`, format:`NoFormat`});
          }],
          [`Delete Indent`,                   ``,         () => {
            mainCopyWithLineNumber({header:`None`, format:`DeleteIndent`});
          }],
          [`Delete BlankLine`,                ``,         () => {
            mainCopyWithLineNumber({header:`None`, format:`DeleteBlankLine`});
          }],
          [`Delete Indent and BlankLine`,     ``,         () => {
            mainCopyWithLineNumber({header:`None`, format:`DeleteIndentBlankLine`});
          }],
        ], `Line Number | Copy With LineNumber | No Header`); }],
        [`Copy Header FileName`,              `${mark}`,  () => { commandQuickPick([
          [`No Format`,                       ``,         () => {
            mainCopyWithLineNumber({header:`FileName`, format:`NoFormat`});
          }],
          [`Delete Indent`,                   ``,         () => {
            mainCopyWithLineNumber({header:`FileName`, format:`DeleteIndent`});
          }],
          [`Delete BlankLine`,                ``,         () => {
            mainCopyWithLineNumber({header:`FileName`, format:`DeleteBlankLine`});
          }],
          [`Delete Indent and BlankLine`,     ``,         () => {
            mainCopyWithLineNumber({header:`FileName`, format:`DeleteIndentBlankLine`});
          }],
        ], `Line Number | Copy With LineNumber | Header FileName`); }],
        [`Copy Header FullPath/FileName`,     `${mark}`,  () => { commandQuickPick([
          [`No Format`,                       ``,         () => {
            mainCopyWithLineNumber({header:`FullPath`, format:`NoFormat`});
          }],
          [`Delete Indent`,                   ``,         () => {
            mainCopyWithLineNumber({header:`FullPath`, format:`DeleteIndent`});
          }],
          [`Delete BlankLine`,                ``,         () => {
            mainCopyWithLineNumber({header:`FullPath`, format:`DeleteBlankLine`});
          }],
          [`Delete Indent and BlankLine`,     ``,         () => {
            mainCopyWithLineNumber({header:`FullPath`, format:`DeleteIndentBlankLine`});
          }],
        ], `Line Number | Copy With LineNumber | Header FullPath/FileName`); }],
        [`Copy Header RelativePath/FileName`, `${mark}`,  () => { commandQuickPick([
          [`No Format`,                       ``,         () => {
            mainCopyWithLineNumber({header:`RelativePath`, format:`NoFormat`});
          }],
          [`Delete Indent`,                   ``,         () => {
            mainCopyWithLineNumber({header:`RelativePath`, format:`DeleteIndent`});
          }],
          [`Delete BlankLine`,                ``,         () => {
            mainCopyWithLineNumber({header:`RelativePath`, format:`DeleteBlankLine`});
          }],
          [`Delete Indent and BlankLine`,     ``,         () => {
            mainCopyWithLineNumber({header:`RelativePath`, format:`DeleteIndentBlankLine`});
          }],
        ], `Line Number | Copy With LineNumber | Header RelativePath/FileName`); }],
      ], `Line Number | Copy With LineNumber`); }],

      [`Copy No LineNumber`, `${mark}`, () => { commandQuickPick([
        [`Copy No Header`,                    `${mark}`,  () => { commandQuickPick([
          [`No Format`,                       ``,         () => {
            mainCopyNoLineNumber({header:`None`, format:`NoFormat`});
          }],
          [`Delete Indent`,                   ``,         () => {
            mainCopyNoLineNumber({header:`None`, format:`DeleteIndent`});
          }],
          [`Delete BlankLine`,                ``,         () => {
            mainCopyNoLineNumber({header:`None`, format:`DeleteBlankLine`});
          }],
          [`Delete Indent and BlankLine`,     ``,         () => {
            mainCopyNoLineNumber({header:`None`, format:`DeleteIndentBlankLine`});
          }],
        ], `Line Number | Copy No LineNumber | No Header`); }],
        [`Copy Header FileName`,              `${mark}`,  () => { commandQuickPick([
          [`No Format`,                       ``,         () => {
            mainCopyNoLineNumber({header:`FileName`, format:`NoFormat`});
          }],
          [`Delete Indent`,                   ``,         () => {
            mainCopyNoLineNumber({header:`FileName`, format:`DeleteIndent`});
          }],
          [`Delete BlankLine`,                ``,         () => {
            mainCopyNoLineNumber({header:`FileName`, format:`DeleteBlankLine`});
          }],
          [`Delete Indent and BlankLine`,     ``,         () => {
            mainCopyNoLineNumber({header:`FileName`, format:`DeleteIndentBlankLine`});
          }],
        ], `Line Number | Copy No LineNumber | Header FileName`); }],
        [`Copy Header FullPath/FileName`,     `${mark}`,  () => { commandQuickPick([
          [`No Format`,                       ``,         () => {
            mainCopyNoLineNumber({header:`FullPath`, format:`NoFormat`});
          }],
          [`Delete Indent`,                   ``,         () => {
            mainCopyNoLineNumber({header:`FullPath`, format:`DeleteIndent`});
          }],
          [`Delete BlankLine`,                ``,         () => {
            mainCopyNoLineNumber({header:`FullPath`, format:`DeleteBlankLine`});
          }],
          [`Delete Indent and BlankLine`,     ``,         () => {
            mainCopyNoLineNumber({header:`FullPath`, format:`DeleteIndentBlankLine`});
          }],
        ], `Line Number | Copy No LineNumber | Header FullPath/FileName`); }],
        [`Copy Header RelativePath/FileName`, `${mark}`,  () => { commandQuickPick([
          [`No Format`,                       ``,         () => {
            mainCopyNoLineNumber({header:`RelativePath`, format:`NoFormat`});
          }],
          [`Delete Indent`,                   ``,         () => {
            mainCopyNoLineNumber({header:`RelativePath`, format:`DeleteIndent`});
          }],
          [`Delete BlankLine`,                ``,         () => {
            mainCopyNoLineNumber({header:`RelativePath`, format:`DeleteBlankLine`});
          }],
          [`Delete Indent and BlankLine`,     ``,         () => {
            mainCopyNoLineNumber({header:`RelativePath`, format:`DeleteIndentBlankLine`});
          }],
        ], `Line Number | Copy No LineNumber | Header RelativePath/FileName`); }],
      ], `Line Number | Copy No LineNumber`); }],

      [`Copy Delete Line Number`,           ``,         () => { mainCopyDeleteLineNumber(); }],

    ], `Line Number | Select Function`);

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

  const mainCopyWithLineNumber = ({header, format}) => {
    if (![
      `None`, `FileName`, `FullPath`, `RelativePath`
    ].includes(header)) {
      throw new Error(`mainCopyWithLineNumber args header:${header}`);
    }
    if (![
      `NoFormat`, `DeleteIndent`, `DeleteBlankLine`, `DeleteIndentBlankLine`
    ].includes(format)) {
      throw new Error(`mainCopyWithLineNumber args format:${format}`);
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
      headerText = getHeaderFileName(editor);
    } break;
    case `FullPath`: {
      headerText = getHeaderFullPath(editor);
    } break;
    case `RelativePath`: {
      headerText = getHeaderRelativePath(editor);
    } break;
    }

    switch (format) {
    case `NoFormat`: {
      const copyText = headerText + getTextLineNumberNoFormat(editor);
      vscode.env.clipboard.writeText(copyText);
    }; break;
    case `DeleteIndent`: {
      const copyText = headerText + getTextLineNumberDeleteIndent(editor);
      vscode.env.clipboard.writeText(copyText);
    }; break;
    case `DeleteBlankLine`: {
      const copyText = headerText + getTextLineNumberDeleteBlankLine(editor);
      vscode.env.clipboard.writeText(copyText);
    }; break;
    case `DeleteIndentBlankLine`: {
      const copyText = headerText + getTextLineNumberDeleteIndentBlankLine(editor);
      vscode.env.clipboard.writeText(copyText);
    }; break;
    }

  };

  const mainCopyNoLineNumber = ({header, format}) => {
    if (![
      `None`, `FileName`, `FullPath`, `RelativePath`
    ].includes(header)) {
      throw new Error(`mainCopyWithLineNumber args header:${header}`);
    }
    if (![
      `NoFormat`, `DeleteIndent`, `DeleteBlankLine`, `DeleteIndentBlankLine`
    ].includes(format)) {
      throw new Error(`mainCopyWithLineNumber args format:${format}`);
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
      headerText = getHeaderFileName(editor);
    } break;
    case `FullPath`: {
      headerText = getHeaderFullPath(editor);
    } break;
    case `RelativePath`: {
      headerText = getHeaderRelativePath(editor);
    } break;
    }

    switch (format) {
    case `NoFormat`: {
      const copyText = headerText + getTextNoLineNumberNoFormat(editor);
      vscode.env.clipboard.writeText(copyText);
    }; break;
    case `DeleteIndent`: {
      const copyText = headerText + getTextNoLineNumberDeleteIndent(editor);
      vscode.env.clipboard.writeText(copyText);
    }; break;
    case `DeleteBlankLine`: {
      const copyText = headerText + getTextNoLineNumberDeleteBlankLine(editor);
      vscode.env.clipboard.writeText(copyText);
    }; break;
    case `DeleteIndentBlankLine`: {
      const copyText = headerText + getTextNoLineNumberDeleteIndentBlankLine(editor);
      vscode.env.clipboard.writeText(copyText);
    }; break;
    }

  };

  const mainCopyDeleteLineNumber = () => {
    const editor = vscode.window.activeTextEditor;
    if (!editor) {
      vscode.window.showInformationMessage(`No editor is active`);
      return;
    }

    const copyText =
      getTextDeleteLineNumber(editor);
    vscode.env.clipboard.writeText(copyText);
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

  registerCommand(`LineNumber.CopyLineNumberNoHeaderNoFormat`, () => {
    mainCopyWithLineNumber({header:`None`, format:`NoFormat`});
  });

  registerCommand(`LineNumber.CopyLineNumberNoHeaderDeleteIndent`, () => {
    mainCopyWithLineNumber({header:`None`, format:`DeleteIndent`});
  });

  registerCommand(`LineNumber.CopyLineNumberNoHeaderDeleteBlankLine`, () => {
    mainCopyWithLineNumber({header:`None`, format:`DeleteBlankLine`});
  });

  registerCommand(`LineNumber.CopyLineNumberNoHeaderDeleteIndentBlankLine`, () => {
    mainCopyWithLineNumber({header:`None`, format:`DeleteIndentBlankLine`});
  });

  registerCommand(`LineNumber.CopyLineNumberFileNameNoFormat`, () => {
    mainCopyWithLineNumber({header:`FileName`, format:`NoFormat`});
  });

  registerCommand(`LineNumber.CopyLineNumberFileNameDeleteIndent`, () => {
    mainCopyWithLineNumber({header:`FileName`, format:`DeleteIndent`});
  });

  registerCommand(`LineNumber.CopyLineNumberFileNameDeleteBlankLine`, () => {
    mainCopyWithLineNumber({header:`FileName`, format:`DeleteBlankLine`});
  });

  registerCommand(`LineNumber.CopyLineNumberFileNameDeleteIndentBlankLine`, () => {
    mainCopyWithLineNumber({header:`FileName`, format:`DeleteIndentBlankLine`});
  });

  registerCommand(`LineNumber.CopyLineNumberFullPathNoFormat`, () => {
    mainCopyWithLineNumber({header:`FullPath`, format:`NoFormat`});
  });

  registerCommand(`LineNumber.CopyLineNumberFullPathDeleteIndent`, () => {
    mainCopyWithLineNumber({header:`FullPath`, format:`DeleteIndent`});
  });

  registerCommand(`LineNumber.CopyLineNumberFullPathDeleteBlankLine`, () => {
    mainCopyWithLineNumber({header:`FullPath`, format:`DeleteBlankLine`});
  });

  registerCommand(`LineNumber.CopyLineNumberFullPathDeleteIndentBlankLine`, () => {
    mainCopyWithLineNumber({header:`FullPath`, format:`DeleteIndentBlankLine`});
  });

  registerCommand(`LineNumber.CopyLineNumberRelativePathNoFormat`, () => {
    mainCopyWithLineNumber({header:`RelativePath`, format:`NoFormat`});
  });

  registerCommand(`LineNumber.CopyLineNumberRelativePathDeleteIndent`, () => {
    mainCopyWithLineNumber({header:`RelativePath`, format:`DeleteIndent`});
  });

  registerCommand(`LineNumber.CopyLineNumberRelativePathDeleteBlankLine`, () => {
    mainCopyWithLineNumber({header:`RelativePath`, format:`DeleteBlankLine`});
  });

  registerCommand(`LineNumber.CopyLineNumberRelativePathDeleteIndentBlankLine`, () => {
    mainCopyWithLineNumber({header:`RelativePath`, format:`DeleteIndentBlankLine`});
  });

  registerCommand(`LineNumber.CopyNoLineNumberNoHeaderNoFormat`, () => {
    mainCopyNoLineNumber({header:`None`, format:`NoFormat`});
  });

  registerCommand(`LineNumber.CopyNoLineNumberNoHeaderDeleteIndent`, () => {
    mainCopyNoLineNumber({header:`None`, format:`DeleteIndent`});
  });

  registerCommand(`LineNumber.CopyNoLineNumberNoHeaderDeleteBlankLine`, () => {
    mainCopyNoLineNumber({header:`None`, format:`DeleteBlankLine`});
  });

  registerCommand(`LineNumber.CopyNoLineNumberNoHeaderDeleteIndentBlankLine`, () => {
    mainCopyNoLineNumber({header:`None`, format:`DeleteIndentBlankLine`});
  });

  registerCommand(`LineNumber.CopyNoLineNumberFileNameNoFormat`, () => {
    mainCopyNoLineNumber({header:`FileName`, format:`NoFormat`});
  });

  registerCommand(`LineNumber.CopyNoLineNumberFileNameDeleteIndent`, () => {
    mainCopyNoLineNumber({header:`FileName`, format:`DeleteIndent`});
  });

  registerCommand(`LineNumber.CopyNoLineNumberFileNameDeleteBlankLine`, () => {
    mainCopyNoLineNumber({header:`FileName`, format:`DeleteBlankLine`});
  });

  registerCommand(`LineNumber.CopyNoLineNumberFileNameDeleteIndentBlankLine`, () => {
    mainCopyNoLineNumber({header:`FileName`, format:`DeleteIndentBlankLine`});
  });

  registerCommand(`LineNumber.CopyNoLineNumberFullPathNoFormat`, () => {
    mainCopyNoLineNumber({header:`FullPath`, format:`NoFormat`});
  });

  registerCommand(`LineNumber.CopyNoLineNumberFullPathDeleteIndent`, () => {
    mainCopyNoLineNumber({header:`FullPath`, format:`DeleteIndent`});
  });

  registerCommand(`LineNumber.CopyNoLineNumberFullPathDeleteBlankLine`, () => {
    mainCopyNoLineNumber({header:`FullPath`, format:`DeleteBlankLine`});
  });

  registerCommand(`LineNumber.CopyNoLineNumberFullPathDeleteIndentBlankLine`, () => {
    mainCopyNoLineNumber({header:`FullPath`, format:`DeleteIndentBlankLine`});
  });

  registerCommand(`LineNumber.CopyNoLineNumberRelativePathNoFormat`, () => {
    mainCopyNoLineNumber({header:`RelativePath`, format:`NoFormat`});
  });

  registerCommand(`LineNumber.CopyNoLineNumberRelativePathDeleteIndent`, () => {
    mainCopyNoLineNumber({header:`RelativePath`, format:`DeleteIndent`});
  });

  registerCommand(`LineNumber.CopyNoLineNumberRelativePathDeleteBlankLine`, () => {
    mainCopyNoLineNumber({header:`RelativePath`, format:`DeleteBlankLine`});
  });

  registerCommand(`LineNumber.CopyNoLineNumberRelativePathDeleteIndentBlankLine`, () => {
    mainCopyNoLineNumber({header:`RelativePath`, format:`DeleteIndentBlankLine`});
  });

  registerCommand(`LineNumber.CopyLineNumberDeleteLineNumber`, () => {
    mainCopyDeleteLineNumber();
  });

}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
