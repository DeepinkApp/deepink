When we delete some UI with text permanently, we may do not remove the text from locale files, and log the key paths here instead.

This approach is introduced to prevent the noise in pull requests, and to decrease the cost of AI translation, since locales update script will translate whole namespace file for each locale when will find any changes.

We will change source locales in batch mode once enough changes will be collected.

## The keys to remove