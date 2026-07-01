export const simpleFormatting = `
Text may be **bold**, *italic*, ~~strikethrough~~.
`.trim();

export const richFormatting = `
*All text can be italic, something additionally can be **bold**, ~~strikethrough~~, or **~~bold AND strikethrough~~***
`.trim();

export const mixedList = `
- level 1-1
  - [x] level 2-1
  - [x] level 2-2
    1. level 3-1
    2. level 3-2
       1. level 4-1
       2. level 4-2
       3. level 4-3
    3. level 3-3
  - [ ] level 2-3
- level 1-2
`.trim();

export const postWithHeaders = `
# The title

A few lines
In one paragraph.

Another paragraph.

## Another section

Introduction

---

Text after a separator

## Header with no space
Text under header

## Yet another section

Section content
`.trim();

export const simpleCode = `
\`\`\`js
const x = 42;
console.log("Your number is", x ** x);
\`\`\`
`.trim();

export const formattedLine = `
**That** is a ***formatted*** *line*.
`.trim();

export const simpleQuote = `
> The quote
`.trim();

export const nestedQuote = `
> The quote
>
>
>
> > Quote inside another quote
> >
> >
> > With some spaces
`.trim();

export const simpleTable = `
| Name | Value |
| ---- | ----- |
| One  | 1     |
| Two  | 2     |
| Three | 3    |
`.trim();

export const detailsWithSummary = `
<details open>
<summary>Shopping list</summary>

* Vegetables
* Fruits
* Fish

</details>
`.trim();

export const unsupportedFeatures = `
<button>Some button</button>
`.trim();
