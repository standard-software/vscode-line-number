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

const getIndent = (line) => {
  return line.length - _trimFirst(line, [` `, `\t`]).length;
};

const getMinIndent = (editor) => {
  let minIndent = Infinity;
  for (let { start, end } of editor.selections) {
    for (let i = start.line; i <= end.line; i += 1) {
      const {text} = editor.document.lineAt(i);
      if (_trim(text) === ``) { continue; }
      const indent = getIndent(text);
      if (indent < minIndent) {
        minIndent = indent;
      }
    }
  };
  if (minIndent === Infinity) { minIndent = 0; }
  return minIndent;
};

const getMinIndentExcludeLineNumber = (editor) => {
  let minIndent = Infinity;
  for (let { start, end } of editor.selections) {
    for (let i = start.line; i <= end.line; i += 1) {
      const {text} = editor.document.lineAt(i);
      if (_trim(text) === ``) { continue; }
      if (isNull(_trim(text).match(/^\d+:+.*$/))) { continue; }
      const colonAfterText = _subLastDelimFirst(text, `: `);
      if (_trim(colonAfterText) === ``) { continue; }
      const indent = getIndent(colonAfterText);
      if (indent < minIndent) {
        minIndent = indent;
      }
    }
  };
  if (minIndent === Infinity) { minIndent = 0; }
  return minIndent;
};

const getMaxNumberDigit = (editor) => {
  let result = 0;
  for (let { end } of editor.selections) {
    result = Math.max(result, end.line.toString().length);
  }
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
  let result = ``;
  const numberDigit = getMaxNumberDigit(editor);
  for (let { start, end } of editor.selections) {
    for (let i = start.line; i <= end.line; i += 1) {
      const { textIncludeLineBreak } = getLineTextInfo(editor, i);
      const lineNumber = (i + 1).toString().padStart(numberDigit, `0`);
      result += `${lineNumber}: ${textIncludeLineBreak}`;
    }
  };
  return result;
};

const lineNumberTextDeleteIndent = (editor) => {
  let result = ``;
  const numberDigit = getMaxNumberDigit(editor);
  const minIndent = getMinIndent(editor);
  for (let { start, end } of editor.selections) {
    for (let i = start.line; i <= end.line; i += 1) {
      const { text, lineBreak } = getLineTextInfo(editor, i);
      const lineNumber = (i + 1).toString().padStart(numberDigit, `0`);
      result += `${lineNumber}: ${_subLength(text, minIndent)}${lineBreak}`;
    }
  };
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

  registerCommand(`LineNumber.SelectFunction`, () => {

    let select1Edit, select1Copy;
    const commands = [
      [`Edit`,  ``, () => { select1Edit(); }],
      [`Copy`,  ``, () => { select1Copy(); }],
    ].map(c => ({label:c[0], description:c[1], func:c[2]}));
    vscode.window.showQuickPick(
      commands.map(({label, description}) => ({label, description})),
      {
        canPickMany: false,
        placeHolder: `Line Number | Select Function`
      }
    ).then((item) => {
      if (!item) { return; }
      commands.find(({label}) => label === item.label).func();
    });

    select1Edit = () => {
      let
        select2EditInsertLineNumber,
        select2EditInsertInputStart,
        select2EditLineNumberText;
      const commands = [
        [`Insert File Line Number`, ``, () => { select2EditInsertLineNumber(); }],
        [`Insert Input Start`,      ``, () => { select2EditInsertInputStart(); }],
        [`Delete Line Number`,      ``, () => { mainEdit(`DeleteLineNumber`); }],
        [`Edit Line Number Text`,   ``, () => { select2EditLineNumberText(); }],
      ].map(c => ({label:c[0], description:c[1], func:c[2]}));
      vscode.window.showQuickPick(
        commands.map(({label, description}) => ({label, description})),
        {
          canPickMany: false,
          placeHolder: `Line Number | Edit`,
        }
      ).then((item) => {
        if (!item) { return; }
        commands.find(({label}) => label === item.label).func();
      });

      select2EditInsertLineNumber = () => {
        const commands = [
          [`No Format`,       ``, () => { mainEdit(`InsertNoFormat`); }],
          [`Delete Indent`,   ``, () => { mainEdit(`InsertDeleteIndent`); }],
        ].map(c => ({label:c[0], description:c[1], func:c[2]}));
        vscode.window.showQuickPick(
          commands.map(({label, description}) => ({label, description})),
          {
            canPickMany: false,
            placeHolder: `Line Number | Edit | Insert File Line Number`,
          }
        ).then((item) => {
          if (!item) { return; }
          commands.find(({label}) => label === item.label).func();
        });
      };

      select2EditInsertInputStart = () => {
        const commands = [
          [`No Format`,       ``, () => { mainEdit(`InputNoFormat`); }],
          [`Delete Indent`,   ``, () => { mainEdit(`InputDeleteIndent`); }],
        ].map(c => ({label:c[0], description:c[1], func:c[2]}));
        vscode.window.showQuickPick(
          commands.map(({label, description}) => ({label, description})),
          {
            canPickMany: false,
            placeHolder: `Line Number | Edit | Insert Input Start`,
          }
        ).then((item) => {
          if (!item) { return; }
          commands.find(({label}) => label === item.label).func();
        });
      };

      select2EditLineNumberText = () => {
        const commands = [
          [`Delete Brank Line`, ``, () => { mainEdit(`DeleteBrankLine`); }],
          [`Delete Indent`,     ``, () => { mainEdit(`DeleteIndent`); }],
        ].map(c => ({label:c[0], description:c[1], func:c[2]}));
        vscode.window.showQuickPick(
          commands.map(({label, description}) => ({label, description})),
          {
            canPickMany: false,
            placeHolder: `Line Number | Edit | Edit Line Number Text`,
          }
        ).then((item) => {
          if (!item) { return; }
          commands.find(({label}) => label === item.label).func();
        });
      };

    };

    select1Copy = () => {
      let
        select2CopyWithoutPath,
        select2CopyWithFullPath,
        // select2CopyRelativePath,
        select2CopyWithFilename;
      const commands = [
        [`Without Path`,                ``, () => { select2CopyWithoutPath(); }],
        [`With FullPath/Filename`,      ``, () => { select2CopyWithFullPath(); }],
        // [`With RelativePath/Filename`,  ``, () => { select2CopyRelativePath(); }],
        [`With Filename`,               ``, () => { select2CopyWithFilename(); }],
      ].map(c => ({label:c[0], description:c[1], func:c[2]}));
      vscode.window.showQuickPick(
        commands.map(({label, description}) => ({label, description})),
        {
          canPickMany: false,
          placeHolder: `Line Number | Copy`,
        }
      ).then((item) => {
        if (!item) { return; }
        commands.find(({label}) => label === item.label).func();
      });

      select2CopyWithoutPath = () => {
        const commands = [
          [`No Format`,       ``, () => { mainCopy(`WithoutPathNoFormat`); }],
          [`Delete Indent`,   ``, () => { mainCopy(`WithoutPathDeleteIndent`); }],
        ].map(c => ({label:c[0], description:c[1], func:c[2]}));
        vscode.window.showQuickPick(
          commands.map(({label, description}) => ({label, description})),
          {
            canPickMany: false,
            placeHolder: `Line Number | Copy | Without Path`,
          }
        ).then((item) => {
          if (!item) { return; }
          commands.find(({label}) => label === item.label).func();
        });
      };

      select2CopyWithFullPath = () => {
        const commands = [
          [`No Format`,       ``, () => { mainCopy(`WithFullPathNoFormat`); }],
          [`Delete Indent`,   ``, () => { mainCopy(`WithFullPathDeleteIndent`); }],
        ].map(c => ({label:c[0], description:c[1], func:c[2]}));
        vscode.window.showQuickPick(
          commands.map(({label, description}) => ({label, description})),
          {
            canPickMany: false,
            placeHolder: `Line Number | Copy | With FullPath/Filename`,
          }
        ).then((item) => {
          if (!item) { return; }
          commands.find(({label}) => label === item.label).func();
        });
      };

      // select2CopyRelativePath = () => {
      //   const commands = [
      //     [`No Format`,       ``, () => { mainCopy(`WithRelativePathNoFormat`) }],
      //     [`Delete Indent`,   ``, () => { mainCopy(`WithRelativePathDeleteIndent`) }],
      //   ].map(c => ({label:c[0], description:c[1], func:c[2]}));
      //   vscode.window.showQuickPick(
      //     commands.map(({label, description}) => ({label, description})),
      //     {
      //       canPickMany: false,
      //       placeHolder: `Line Number | Copy | With RelativePath/Filename`,
      //     }
      //   ).then((item) => {
      //     if (!item) { return; }
      //     commands.find(({label}) => label === item.label).func();
      //   });
      // }

      select2CopyWithFilename = () => {
        const commands = [
          [`No Format`,       ``, () => { mainCopy(`WithFilenameNoFormat`); }],
          [`Delete Indent`,   ``, () => { mainCopy(`WithFilenameDeleteIndent`); }],
        ].map(c => ({label:c[0], description:c[1], func:c[2]}));
        vscode.window.showQuickPick(
          commands.map(({label, description}) => ({label, description})),
          {
            canPickMany: false,
            placeHolder: `Line Number | Copy | With Filename`,
          }
        ).then((item) => {
          if (!item) { return; }
          commands.find(({label}) => label === item.label).func();
        });
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
      editor.edit(editBuilder => {
        const numberDigit = getMaxNumberDigit(editor);
        for (let { start, end } of editor.selections) {
          for (let i = start.line; i <= end.line; i += 1) {
            const lineNumberText = (i + 1).toString().padStart(numberDigit, `0`);
            editBuilder.insert(new vscode.Position(i, 0), `${lineNumberText}: `);
          }
        };
      });
    } break;

    case `InsertDeleteIndent`: {
      editor.edit(editBuilder => {
        const numberDigit = getMaxNumberDigit(editor);
        const minIndent = getMinIndent(editor);
        for (let { start, end } of editor.selections) {
          for (let i = start.line; i <= end.line; i += 1) {
            const { text } = getLineTextInfo(editor, i);
            const subText = _subLength(text, minIndent);
            const lineNumberText = (i + 1).toString().padStart(numberDigit, `0`);
            const range = new vscode.Range(
              i, 0, i, text.length,
            );
            editBuilder.replace(range, `${lineNumberText}: ${subText}`);
          }
        };
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
          editor.edit(editBuilder => {
            let lineNumber = inputInteger;
            const numberDigit = getMaxNumberDigit(editor);
            for (let { start, end } of editor.selections) {
              for (let i = start.line; i <= end.line; i += 1) {
                const lineNumberText = lineNumber.toString().padStart(numberDigit, `0`);
                editBuilder.insert(new vscode.Position(i, 0), `${lineNumberText}: `);
                lineNumber += 1;
              }
            };
          });
        } break;

        case `InputDeleteIndent`: {
          editor.edit(editBuilder => {
            let lineNumber = inputInteger;
            const numberDigit = getMaxNumberDigit(editor);
            const minIndent = getMinIndent(editor);
            for (let { start, end } of editor.selections) {
              for (let i = start.line; i <= end.line; i += 1) {
                const { text } = getLineTextInfo(editor, i);
                const subText = _subLength(text, minIndent);
                const lineNumberText = lineNumber.toString().padStart(numberDigit, `0`);
                const range = new vscode.Range(
                  i, 0, i, text.length,
                );
                editBuilder.replace(range, `${lineNumberText}: ${subText}`);
                lineNumber += 1;
              }
            };
          });
        } break;

        }

      });

    } break;

    case `DeleteLineNumber`: {
      const delimiter = `: `;
      editor.edit(editBuilder => {
        for (let { start, end } of editor.selections) {
          for (let i = start.line; i <= end.line; i += 1) {
            const { text } = getLineTextInfo(editor, i);
            if (!text.match(/^.*\d:\s.*$/)) { continue; }
            const colonIndex = _indexOfFirst(text, delimiter);
            const range = new vscode.Range(
              i, 0, i, colonIndex + delimiter.length,
            );
            editBuilder.delete(range);
          }
        };
      });
    } break;

    case `DeleteBrankLine`: {
      editor.edit(editBuilder => {
        for (let { start, end } of editor.selections) {
          for (let i = end.line; start.line <= i; i -= 1) {
            const { text } = getLineTextInfo(editor, i);
            console.log({text}, _trim(text).match(/^\d+:+.*$/), _subLastDelimFirst(text, `:`));
            if (isNull(_trim(text).match(/^\d+:+.*$/))) { continue; }
            if (_trim(_subLastDelimFirst(text, `:`)) === ``) {
              const range = new vscode.Range(
                i, 0, i + 1, 0,
              );
              editBuilder.delete(range);
            }
          }
        };

      });
    } break;

    case `DeleteIndent`: {
      editor.edit(editBuilder => {
        const minIndent = getMinIndentExcludeLineNumber(editor);
        for (let { start, end } of editor.selections) {
          for (let i = start.line; i <= end.line; i += 1) {
            const { text } = getLineTextInfo(editor, i);
            if (isNull(_trim(text).match(/^\d+:+.*$/))) { continue; }

            const colonAfterText = _subLastDelimFirst(text, `:`);
            if (minIndent < colonAfterText.length) {
              const range = new vscode.Range(
                i, text.length - colonAfterText.length,
                i, text.length - colonAfterText.length + minIndent,
              );
              editBuilder.delete(range);
            }
          }
        };

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

    case `WithoutPathNoFormat`: {
      const copyText = lineNumberTextNoFormat(editor);
      vscode.env.clipboard.writeText(copyText);
    } break;

    case `WithoutPathDeleteIndent`: {
      const copyText = lineNumberTextDeleteIndent(editor);
      vscode.env.clipboard.writeText(copyText);
    } break;

    case `WithFullPathNoFormat`: {
      const copyText =
        copyTextHeaderFullPath(editor) +
        lineNumberTextNoFormat(editor);
      vscode.env.clipboard.writeText(copyText);
    } break;

    case `WithFullPathDeleteIndent`: {
      const copyText =
        copyTextHeaderFullPath(editor) +
        lineNumberTextDeleteIndent(editor);
      vscode.env.clipboard.writeText(copyText);
    } break;

    // case `WithRelativePathNoFormat`: {
    //   const copyText =
    //     copyTextHeaderRelativePath(editor) +
    //     lineNumberTextNoFormat(editor);
    //   vscode.env.clipboard.writeText(copyText);
    // } break;

    // case `WithRelativePathDeleteIndent`: {
    //   const copyText =
    //     copyTextHeaderRelativePath(editor) +
    //     lineNumberTextDeleteIndent(editor);
    //   vscode.env.clipboard.writeText(copyText);
    // } break;

    case `WithFilenameNoFormat`: {
      const copyText =
        copyTextHeaderFilename(editor) +
        lineNumberTextNoFormat(editor);
      vscode.env.clipboard.writeText(copyText);
    } break;

    case `WithFilenameDeleteIndent`: {
      const copyText =
        copyTextHeaderFilename(editor) +
        lineNumberTextDeleteIndent(editor);
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

  registerCommand(`LineNumber.EditLineNumberTextDeleteBrankLine`, () => {
    mainEdit(`DeleteBrankLine`);
  });

  registerCommand(`LineNumber.EditLineNumberTextDeleteIndent`, () => {
    mainEdit(`DeleteIndent`);
  });

  registerCommand(`LineNumber.CopyWithoutPathNoFormat`, () => {
    mainCopy(`WithoutPathNoFormat`);
  });

  registerCommand(`LineNumber.CopyWithoutPathDeleteIndent`, () => {
    mainCopy(`WithoutPathDeleteIndent`);
  });

  registerCommand(`LineNumber.CopyWithFullPathFilenameNoFormat`, () => {
    mainCopy(`WithFullPathNoFormat`);
  });

  registerCommand(`LineNumber.CopyWithFullPathFilenameDeleteIndent`, () => {
    mainCopy(`WithFullPathDeleteIndent`);
  });

  registerCommand(`LineNumber.CopyWithFilenameNoFormat`, () => {
    mainCopy(`WithFilenameNoFormat`);
  });

  registerCommand(`LineNumber.CopyWithFilenameDeleteIndent`, () => {
    mainCopy(`WithFilenameDeleteIndent`);
  });

}

function deactivate() {}

module.exports = {
  activate,
  deactivate,
};
