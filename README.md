# Line Number

[![](https://vsmarketplacebadges.dev/version-short/SatoshiYamamoto.vscode-line-number.png)](https://marketplace.visualstudio.com/items?itemName=SatoshiYamamoto.vscode-line-number)
[![](https://vsmarketplacebadges.dev/installs-short/SatoshiYamamoto.vscode-line-number.png)](https://marketplace.visualstudio.com/items?itemName=SatoshiYamamoto.vscode-line-number)
[![](https://vsmarketplacebadges.dev/rating-short/SatoshiYamamoto.vscode-line-number.png)](https://marketplace.visualstudio.com/items?itemName=SatoshiYamamoto.vscode-line-number)
[![](https://img.shields.io/github/license/standard-software/vscode-date-time-calendar.png)](https://github.com/standard-software/vscode-date-time-calendar/blob/main/LICENSE)

This extension has the following functions.
- You can insert line numbers at the beginning of lines of text.
- You can specify line numbers by file line number or by input value.
- You can delete line numbers from text.
- You can remove blank lines from text containing line numbers.
- You can remove indentation from text containing line numbers.

## Attention Information

Since v3.0.0, this extension no longer has the ability to add line numbers and copy them to the clipboard.

If you need that functionality, please use the following extension

- Copy Format Code - Visual Studio Marketplace
https://marketplace.visualstudio.com/items?itemName=SatoshiYamamoto.vscode-copy-format-code

Copy Format Code is more versatile and easier to use, so please migrate to it for the ability to add file line numbers and copy them.

## Install

https://marketplace.visualstudio.com/items?itemName=SatoshiYamamoto.vscode-line-number

## Usage

Following commands are available:

```
- Line Number : Insert File Line Number : No Format
- Line Number : Insert File Line Number : Delete Indent
- Line Number : Insert Input Start : No Format
- Line Number : Insert Input Start : Delete Indent
- Line Number : Delete Line Number
- Line Number : Edit Line Number Text : Delete Blank Line
- Line Number : Edit Line Number Text : Delete Indent
```

Or Select Function

```
- Line Number : Select Function >>
  - Insert File Line Number >>
    - No Format
    - Delete Indent
  - Insert Input Start Number >>
    - No Format
    - Delete Indent
  - Delete Line Number
  - Edit Line Number Text >>
    - Delete Blank Line
    - Delete Indent
```

<!--
## Setting

settings.json

```json
{
  "LineNumber.subMenuMark": ">>",
  :
}
```
-->

## License

Released under the [MIT License][license].

## author

```
  Satoshi Yamamoto
  standard.software.net@gmail.com
```
