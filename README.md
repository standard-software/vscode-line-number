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

Since v3.0.0, this extension no longer has the ability to copy to the clipboard.

If you need that functionality, please use the following extension

- Copy Format Code - Visual Studio Marketplace  
https://marketplace.visualstudio.com/items?itemName=SatoshiYamamoto.vscode-copy-format-code

The Copy Format Code extension is more versatile and easier to use than previous versions of this extension. Please use the Copy Format Code Extension.

## Install

https://marketplace.visualstudio.com/items?itemName=SatoshiYamamoto.vscode-line-number

## Usage

Following commands are available:

```
- Line Number : Insert File Line Number
- Line Number : Insert Input Start
- Line Number : Delete Line Number
- Line Number : Edit Line Number Text : Delete Blank Line
- Line Number : Edit Line Number Text : Delete Indent
```

Or Select Function

```
- Line Number : Select Function ...
  - Insert File Line Number
  - Insert Input Start Number
  - Delete Line Number
  - Edit Line Number Text : Delete Blank Line
  - Edit Line Number Text : Delete Indent
```

## Operation

### Line Number : Insert File Line Number

```
ABC
DEF
GHI
```
↓
```
1: ABC
2: DEF
3: GHI
```

### Line Number : Insert Input Start

```
ABC
DEF
GHI
```
↓ Input [99]
```
099: ABC
100: DEF
101: GHI
```

### Line Number : Delete Line Number

```
1: ABC
2: DEF
3: GHI
```
↓
```
ABC
DEF
GHI
```

### Line Number : Edit Line Number Text : Delete Blank Line

_ = Space

```
099:_ABC
100: 
101:____DEF
102: 
103:_______GHI
```
↓
```
099:_ABC
101:____DEF
103:_______GHI
```

### Line Number : Edit Line Number Text : Delete Indent

_ = Space

```
099:____ABC
100:_
101:____DEF
102:_
103:_______GHI
```
↓
```
099:_ABC
100:_
101:_DEF
102:_
103:____GHI
```

## Setting

default: settings.json
```json
{
  "LineNumber.delimiter": ": ",
}
```

The delimiter must contain non-whitespace characters. All spaces and all tabs cannot be specified.

## Contact

Please contact me if you have any requests.

```
Satoshi Yamamoto
standard.software.net@gmail.com  
Japanese / English
```
