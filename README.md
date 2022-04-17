# vscode-line-number

[![Version][version-badge]][marketplace]
[![Ratings][ratings-badge]][marketplace-ratings]
[![Installs][installs-badge]][marketplace]
[![License][license-badge]][license]

This extension has the following functions.
- Get a Copy Clipboard with file path and line number.
- Insert file line numbers with indentation removed.
- Inserting line numbers by entering a starting number.
- Line numbers can be deleted.
- Removes blank lines from line number insertion text.
- Deleting indentations in line number insertion text.

## Install

https://marketplace.visualstudio.com/items?itemName=SatoshiYamamoto.vscode-line-number

## Usage

Following commands are available:

- `Line Number | Edit | Insert File Line Number | No Format`
- `Line Number | Edit | Insert File Line Number | Delete Indent`
- `Line Number | Edit | Insert Input Start | No Format`
- `Line Number | Edit | Insert Input Start | Delete Indent`
- `Line Number | Edit | Delete Line Number`
- `Line Number | Edit | Edit Line Number Text | Delete Blank Line`
- `Line Number | Edit | Edit Line Number Text | Delete Indent`
---
- `Line Number | Copy With LineNumber | No Header | No Format`
- `Line Number | Copy With LineNumber | No Header | Delete Indent`
- `Line Number | Copy With LineNumber | Header Filename | No Format`
- `Line Number | Copy With LineNumber | Header Filename | Delete Indent`
- `Line Number | Copy With LineNumber | Header FullPath/Filename | No Format`
- `Line Number | Copy With LineNumber | Header FullPath/Filename | Delete Indent`
- `Line Number | Copy With LineNumber | Header RelativePath/Filename | No Format`
- `Line Number | Copy With LineNumber | Header RelativePath/Filename | Delete Indent`


- `Line Number | Copy Delete LineNumber | Header RelativePath/Filename | Delete Indent`

---

Or Select Function

- `Line Number | Select Function >>`
  - `Edit >>`
    - `Insert File Line Number >>`
      - `No Format`
      - `Delete Indent`
    - `Insert Input Start Number >>`
      - `No Format`
      - `Delete Indent`
    - `Delete Line Number`
    - `Edit Line Number Text >>`
      - `Delete Blank Line`
      - `Delete Indent`

  - `Copy With LineNumber >>`
    - `No Header >>`
      - `No Format`
      - `Delete Indent`
    - `Header Filename >>`
      - `No Format`
      - `Delete Indent`
    - `Header FullPath/Filename >>`
      - `No Format`
      - `Delete Indent`
    - `Header RelativePath/Filename >>`
      - `No Format`
      - `Delete Indent`

  - `Copy Delete Line Number`

## Setting

settings.json

```json
{
  "LineNumber.subMenuChar": ">>",
  :
}
```

## License

Released under the [MIT License][license].

[version-badge]: https://vsmarketplacebadge.apphb.com/version/SatoshiYamamoto.vscode-line-number.svg
[ratings-badge]: https://vsmarketplacebadge.apphb.com/rating/SatoshiYamamoto.vscode-line-number.svg
[installs-badge]: https://vsmarketplacebadge.apphb.com/installs/SatoshiYamamoto.vscode-line-number.svg
[license-badge]: https://img.shields.io/github/license/standard-software/vscode-line-number.svg

[marketplace]: https://marketplace.visualstudio.com/items?itemName=SatoshiYamamoto.vscode-line-number
[marketplace-ratings]: https://marketplace.visualstudio.com/items?itemName=SatoshiYamamoto.vscode-line-number#review-details
[license]: https://github.com/standard-software/vscode-line-number/blob/master/LICENSE

## author
    Satoshi Yamamoto  
    standard.software.net@gmail.com

## Version

### 3.0.0
2022/04/17(Sun)
- Add Copy Function
  - Delete BlankLine
  - Delete Indent and BlankLine
- Refactoring

### 2.2.0
2022/04/17(Sun)
- Sub Menu Char "▸"
  - Changeable in the settings
  - show it in the description
- Add Copy Header RelativePath/FileName

### 2.1.1
2022/02/01(Tue)
- brank -> blank  
  Misspelling.A little embarrassing.  
  But I'm not a native English speaker, so forgive me.
- Mark hierarchical menus with "▶"
  (If you have a request for a different symbol, please email me or issue)

### 2.1.0
2021/12/15(Wed) 00:00
- update fix Select Range endLine
- update fix Input LineNumber Digit
- update fix Delete LineNumber logic
- add Copy Delete Line Number
- Refactoring

### 2.0.1
2021/12/03(Fri)
- update README

### 2.0.0
2021/12/02(Thu)
- Refactored and rebuilt anew.
- Added Delete Line Number feature.
- Added Delete blank lines in the line number insertion text.
- Added Delete the indent for the line number insertion text.

### 1.1.0 (Insert Line Number And Copy : vscode-insert-line-number-and-copy)
2021/11/28(Sun)
- Change the clipboard implementation
  - Discard clipboardy
  - use vscode.env.clipboard.writeTex

### 1.0.0 (Insert Line Number And Copy : vscode-insert-line-number-and-copy)
2021/10/13(Wed)
- publish
