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
- `Line Number | Edit | Edit Line Number Text | Delete Brank Line`
- `Line Number | Edit | Edit Line Number Text | Delete Indent`
---
- `Line Number | Copy | Without Path | No Format`
- `Line Number | Copy | Without Path | Delete Indent`
- `Line Number | Copy | With FullPath/Filename | No Format`
- `Line Number | Copy | With FullPath/Filename | Delete Indent`
- `Line Number | Copy | With Filename | No Format`
- `Line Number | Copy | With Filename | Delete Indent`

---

Or Select Function

- `Line Number | Select Function`
  - `Edit`
    - `Insert File Line Number`
      - `No Format`
      - `Delete Indent`
    - `Insert Input Start`
      - `No Format`
      - `Delete Indent`
    - `Delete Line Number`
    - `Edit Line Number Text`
      - `Delete Brank Line`
      - `Delete Indent`

  - `Copy`
    - `Without Path`
      - `No Format`
      - `Delete Indent`
    - `With FullPath/Filename`
      - `No Format`
      - `Delete Indent`
    - `With Filename`
      - `No Format`
      - `Delete Indent`

## License

Released under the [MIT License][license].

[version-badge]: https://vsmarketplacebadge.apphb.com/version/SatoshiYamamoto.vscode-line-number.svg
[ratings-badge]: https://vsmarketplacebadge.apphb.com/rating/SatoshiYamamoto.vscode-line-number.svg
[installs-badge]: https://vsmarketplacebadge.apphb.com/installs/SatoshiYamamoto.vscode-line-number.svg
[license-badge]: https://img.shields.io/github/license/standard-software/vscode-line-number.svg

[marketplace]: https://marketplace.visualstudio.com/items?itemName=SatoshiYamamoto.vscode-line-number
[marketplace-ratings]: https://marketplace.visualstudio.com/items?itemName=SatoshiYamamoto.vscode-line-number#review-details
[license]: https://github.com/standard-software/vscode-line-number/blob/master/LICENSE

## Version

### 2.1.0
- update fix Select Range endLine
- update fix Input LineNumber Digit
- update fix Delete LineNumber logic
- add Copy Delete Line Number
- Refactoring

### 2.0.1
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
