# Testing rules

Follow these rules whenever you add, change, move, or review tests.

## Before writing a test

- Read the code being tested and its relevant specification or documentation.
- Inspect nearby tests first. Search for the same behavior across the relevant test suites, including suites with different environments or render helpers.
- Do not add a test that checks behavior already adequately covered. A different fixture or test file does not automatically make a scenario new.
- Identify the behavior a user or caller can observe. Test that behavior instead of translating implementation branches into tests.
- For a bug fix, state the broken behavior and the expected behavior before writing the test. Prefer a regression test that would fail before the fix.
- If the expected behavior is unclear, ask for clarification instead of making the test choose a new product behavior.

## Choose the test scope and environment

Choose the environment based on the behavior the test must prove. Do not choose JSDOM just because it can render the component.

### Node unit tests

- Use a plain `.test.ts` test for logic or state transformations that can run without a DOM.
- For Lexical state behavior, create or update Lexical state directly and assert the resulting state.
- Do not render React or simulate user input unless the component or input handling is part of the contract.

### JSDOM tests

- Use a `.dom.test.ts` test to mount the real React Lexical editor and its plugins when the behavior depends on their composition or wiring.
- Treat JSDOM tests as tests of editor or component state, not as tests of user interaction.
- Assert the resulting Lexical state, document structure, serialized content, or a public callback when that is the contract.
- Do not add a JSDOM test to prove that a user can successfully use a button, click, keyboard shortcut, selection, caret, focus, or other UI interaction. Test user interactions in a browser test.
- Synthetic clicks or keyboard events may be used only to establish test setup, such as focusing the editor or arranging state required by the test. Do not claim that the synthetic interaction itself works as the result.
- Set up Lexical state directly through the editor when practical. If a synthetic event is needed only for setup, make that reason clear.
- Do not use JSDOM assertions about layout, visual appearance, scrolling, native selection, or browser-specific event behavior.

JSDOM creates a DOM tree for React, but it does not provide Chromium’s layout, painting, or native input behavior. A passing JSDOM interaction test does not prove that the interaction works in Electron or Chrome.

### Browser tests

- Use a `.browser.test.ts` test when the contract is that a user can perform an action and get the expected result in the app.
- Use browser tests for clicks, keyboard shortcuts, focus, selection, caret movement, contenteditable behavior, pointer behavior, layout, scrolling, and browser APIs.
- Assert the user-visible result of the interaction, such as the changed document, ordering, focus, selection, or accessible state.

### Avoid duplicate coverage

- Do not test the same interaction in both JSDOM and the browser just to have a faster copy.
- Keep tests in different environments only when they prove distinct contracts: JSDOM for React/editor state composition; browser tests for real user interaction.
- If you cannot clearly state what additional risk a second test covers, do not add it.
- Use the smallest reliable scope. Do not replace a useful integration test with a unit test that only verifies a mock was called.
- Prefer real collaborators for behavior under test. Mock external systems or boundaries when needed; do not mock the behavior the test is meant to prove.
- Use an integration test when the contract crosses multiple real components or services.
- Follow project naming conventions: `.test.ts` for Node tests, `.dom.test.ts` for JSDOM tests, and `.browser.test.ts` for Vitest browser tests.

## Design each test as a readable scenario

- Give each test one clear purpose: one user or caller scenario and its important outcome.
- Name the test for the action or condition and the expected result. A reader should understand the purpose from the name without first reading the body.
- Keep a test’s setup, action, and outcome easy to distinguish. Use a short fixture, perform the relevant action, then assert the result.
- Keep each test independent. Do not make one test depend on changes made by another test.
- Do not combine separate scenarios into a sequence just to reduce repeated setup. For example, test moving up and moving down separately when each direction is an independently meaningful behavior.
- Use parameterized tests only when the cases are genuinely the same scenario with different data and the same meaning. Use separate named tests when the action or expected outcome differs.
- Avoid tests with unrelated assertions. Multiple assertions are appropriate when they jointly prove the same outcome, such as content order and preservation of its parent.
- Do not enforce “one assertion per test” as a goal. Enforce one understandable behavior per test.

## Make setup easy to scan

- Use the smallest fixture that still demonstrates the behavior.
- Make important relationships visible in the fixture: ownership, nesting, ordering, state, and boundaries should be apparent without mentally decoding the setup.
- For multiline or hierarchical data, format it so its structure can be read directly. Use the project’s established fixture style.
- Prefer meaningful test data over generic values like `foo`, `item1`, and `item2` when names clarify the scenario.
- Include only data relevant to the behavior. Remove unrelated paragraphs, items, options, and setup.
- Set up the state the action requires explicitly. For example, create a collapsed cursor when testing a cursor action and a range selection when testing a group action.
- Avoid setup assertions that merely repeat the fixture. Assert the outcome that matters.
- Do not add comments that narrate obvious setup or repeat the test name. Add a comment only when the reason for unusual setup or an expectation is not clear from the code.

## Keep test code direct

- Use existing test utilities when they make the action clearer or remove real duplication.
- Do not create a helper for a one-off action. Do not add a generic test framework or scenario builder to avoid a few understandable lines.
- Create a shared helper only when multiple tests repeat the same meaningful operation or assertion and the helper makes those tests easier to read.
- Keep focused helpers beside the tests that use them. Put a helper in a broader shared test utility only when unrelated test groups use it too.
- Avoid unnecessary variables. Inline a locator used once when the expression remains readable.
- Name a value when it is reused, when it represents meaningful state, or when a helper needs it. Do not replace a long inline expression with several single-use aliases.
- Use accessible roles and user-visible text for rendered UI where practical. Use lower-level DOM details only when they are necessary to verify the contract.
- Do not assert private methods, internal node keys, incidental DOM layout, exact implementation steps, or other details that can change without changing behavior.

## Assert meaningful outcomes

- Assert the observable result that establishes the test’s purpose: output, state transition, rendered content, ordering, ownership, or user-visible effect.
- Assert both what changed and what must remain unchanged when preservation is part of the behavior.
- For no-op or boundary behavior, verify the relevant state is unchanged. A callback not firing is insufficient unless that is itself the contract.
- Prefer precise assertions over broad snapshots. A snapshot may supplement a test but must not be its only meaningful assertion.
- Do not assert exact serialized output unless serialization is part of the contract or is the clearest reliable way to verify the resulting structure.
- When exact output is asserted, make the expected value readable. Avoid hiding a complex expected result in generated data or opaque helpers.
- Avoid redundant assertions that all prove the same fact without adding confidence.

## Keep tests reliable

- Await asynchronous user actions and asynchronous assertions.
- Use the project’s waiting or polling utilities for eventual behavior. Do not add arbitrary sleeps or timing assumptions.
- Do not rely on test execution order, shared mutable state, the current clock, random values, or network availability unless the test controls them.
- Keep test doubles deterministic. Assert only the interaction with a mock that is part of the tested contract.
- Clean up resources created by the test using the project’s established lifecycle utilities.
- Do not make a failing test pass by weakening its expectation, adding retries, or increasing timeouts without understanding the cause.
- If a test is flaky, identify and correct the source of nondeterminism; do not hide it.

## Organize tests for maintenance

- Put tests near the code or feature they describe, following the existing project structure.
- Group files by meaningful behavior or responsibility. Split a large test file when separate groups can be found and understood more quickly in separate files.
- Do not create a new directory or helper file for a single test unless it gives the project a clear, reusable structure.
- Use filenames that identify the feature and test environment, following established suffixes such as `.dom.test.ts` and `.browser.test.ts`.
- Keep one authoritative test for each behavior. If moving or reorganizing tests, preserve coverage and remove the old copy so both do not continue to run.

## Validate changes

- Run the narrowest relevant test first. Then run the broader relevant suite when practical.
- For app browser tests, run from `packages/app` with `npm test <file-path>` or use `npm test .browser` for the browser suite.
- Run the relevant lint or type checks when test changes could affect imports, types, or formatting.
- Report which checks actually ran and whether they passed. Do not claim a test passed if it was not run.
- If a check cannot be run, explain why and review the changed files for obvious issues.