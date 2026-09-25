# Block Movement Specification

## 1. Core principle

`Alt+ArrowUp/Down` moves the **contiguous structural sequence covered by the selection**.

It never swaps selected nodes, shuffles them, or extracts arbitrary text.

The movement unit keeps:

- Its original order.
- Its internal hierarchy.
- Its node types.
- Its descendants.

The movement unit is moved as a subtree. Its parent container may change when
the destination accepts it, but the subtree itself is not split or rewritten.

---

## 2. Selection normalization

### Selection inside one container

Find the closest container that contains the selection and resolve the
selection to the direct child blocks covered by it.

Examples:

- Cursor in a paragraph inside a quote → that paragraph.
- Selection across quote paragraphs → those paragraphs.
- Cursor in a list item → that list item.
- Selection across list items → those list items.

### Selection across containers

Find the lowest common ancestor containing both selection endpoints. Resolve the
selection to the **contiguous direct-child range** between the first and last
selected branches.

All structural siblings between them are included, even if their text was not
directly selected.

```text
List
Paragraph B
Quote
```

If the selection starts in the list and ends in the quote, the movement unit is:

```text
[List, Paragraph B, Quote]
```

This sequence moves together and keeps its order.

---

## 3. Movement within a container

For a movement unit inside its current parent:

- `Alt+ArrowUp` moves it before the previous sibling.
- `Alt+ArrowDown` moves it after the next sibling.

The movement unit remains contiguous and ordered.

```text
A
B
C
D
```

Selecting `B` and `C` produces:

- Up → `B C A D`
- Down → `A D B C`

---

## 4. Valid destinations

A destination is valid when:

- It is in the requested direction.
- Its container accepts the movement unit.
- It is not the movement unit or one of its descendants.
- Inserting the unit keeps the resulting tree structurally valid.
- The complete subtree of the movement unit remains attached to it.

When a destination requires a child container:

- Reuse an existing compatible container when possible.
- Create a compatible container when necessary.
- Preserve the source container's relevant type when creating one.
- Do not merge incompatible container types.

For example, a list item may move into a compatible nested list in another
list item. An ordered list must not be merged into an unordered list merely to
make the move possible.

---

## 5. Edge promotion

If the movement unit is already at the requested edge of its parent:

1. Search for a valid destination in a neighboring compatible container.
2. If one exists, reparent the movement unit there.
3. Otherwise, promote the current parent container into the movement unit.
4. Retry movement in the parent container.
5. Continue outward recursively until movement is possible.
6. If no destination exists, do nothing.

```text
Before
Quote:
  Paragraph 1
  Paragraph 2
  Paragraph 3
After
```

- Moving `Paragraph 2` up → reorder inside the quote.
- Moving `Paragraph 1` up → promote the quote and move the whole quote before `Before`.
- Moving `Paragraph 3` down → promote the quote and move the whole quote after `After`.

The same rule applies to lists, quotes, and future container types.

---

## 6. Nested structures

Nested content follows the same hierarchical rules recursively:

1. Try to move the unit among siblings in its current container.
2. If that is not possible, try a valid destination in a neighboring compatible container.
3. If no such destination exists, promote the current container.
4. Retry at the parent level.
5. Continue until a valid destination is found or the root boundary is reached.

A nested list is one example of this general process:

- A middle list item moves inside its current list.
- An edge item may move into a compatible nested list owned by a neighboring parent item.
- If no compatible destination exists, its containing list is promoted.
- Promotion continues outward until a valid destination is found.

The same process applies to nested quotes and future block containers. The
container type determines which child units and destinations are compatible;
the movement algorithm does not need a separate movement operation for each
node type.

---

## 7. Mixed content

Mixed content is normalized structurally, not by node type:

```text
raw selection
→ lowest common ancestor
→ contiguous direct-child range
→ movement unit
```

Every node between the normalized first and last direct siblings is part of
the group, even when its text was not directly selected.

```text
Heading
List
Paragraph B
Quote
Paragraph C
```

If the selection starts inside the list and ends inside the quote, the movement
unit is:

```text
[List, Paragraph B, Quote]
```

`Heading` and `Paragraph C` are outside the unit. The group moves as one unit
and is never partially moved, exchanged, or reordered internally.

---

## 8. Boundaries

If the final movement unit has no valid destination in the requested direction:

- The document remains unchanged.
- The selection remains unchanged.
- The keyboard event is not considered handled.

---

## 9. Structural safety

Movement must never:

- Split a block unnecessarily.
- Extract arbitrary text from a container.
- Flatten lists or quotes.
- Reorder nodes inside the movement unit.
- Move only part of a container after that container has been promoted.
- Produce a non-contiguous movement group.

Movement may change the parent of the movement unit when a valid destination
requires reparenting. It must preserve the movement unit's complete subtree:

- Descendants remain attached to the movement unit.
- The movement unit remains structurally valid after insertion.
- The source container may become empty and be removed.
- A compatible target container may be reused or created.
- Incompatible containers must not be merged.

After a successful move, empty source containers may be cleaned up. Cleanup
must not remove non-empty ancestors or the root, and must not run after a
failed or boundary move.

---

## 10. Selection preservation

After movement:

- A collapsed cursor follows its original content.
- A range selection remains attached to the moved content.
- The scrolling listener only scrolls the resulting selection into view.
- Selection correctness belongs to the movement operation, not the scroll listener.

---

## 11. System architecture

The implementation should have one movement pipeline:

```text
Lexical selection
→ normalize to a contiguous structural movement unit
→ resolve a valid destination
→ reparent when a compatible destination exists
→ promote the container when necessary
→ apply one movement
→ clean empty source containers
→ preserve selection
```

The executor should be generic. Node/container-specific behavior belongs only
in:

- Structural normalization.
- Sibling and parent traversal.
- Edge promotion.
- Destination compatibility and insertion rules.
- Source-container cleanup.

Node/container-specific behavior must resolve the movement unit and its valid
destination rather than introduce separate movement operations for each node
type.

This specification is the basis for implementation.