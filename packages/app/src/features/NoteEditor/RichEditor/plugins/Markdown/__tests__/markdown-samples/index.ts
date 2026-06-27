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
