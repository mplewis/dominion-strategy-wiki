# Dominion Strategy Wiki Dev Tools

A development environment for the [common.js](https://wiki.dominionstrategy.com/index.php/MediaWiki:Common.js) file on the Dominion Strategy Wiki. This repo makes it easier to develop, test, and deploy changes to the wiki's JavaScript functionality.

The common.js file contains JavaScript code that runs on every page of the wiki, providing features like card popups, sorting, and other interactive elements to make browsing the wiki more user-friendly. This is a big file with lots of complicated functionality, and it's automatically compiled from the TypeScript source files in [src/wiki](src/wiki).

## Getting Started

Install [Node.js](https://nodejs.org/) locally, then:

```bash
# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The dev server will:

- Start a local development environment
- Watch for changes to your code
- Automatically reload when you make changes (hot reload)
- Show you a preview of how your changes will look on the wiki

This makes development much faster than manually uploading changes to the wiki each time.

## Project Structure

- `src/wiki/` - Source code for the MediaWiki common.js file
- `src/dev/` - Development server and tooling that helps you test changes locally
- `src/scripts/` - Build and deployment scripts that package and upload code to the wiki

## TypeScript

This project uses TypeScript, which is JavaScript with type annotations. If you're new to TypeScript:

- Strong typing helps catch errors before your code runs
- High-quality tooling provides better autocomplete and documentation in your editor
- The syntax is very similar to JavaScript - you can often write regular JavaScript and it will work

If you're new to TypeScript, it's easy to learn! Check out the [TypeScript documentation](https://www.typescriptlang.org/docs/) to get started.

## Pull Requests

To get your code onto the wiki, you'll submit a **pull request** (PR) to this repo. Someone will review, approve, and merge it once everything looks good.

Before submitting your PR:

1. **Test locally**: Use the dev server (`pnpm dev`) to test your changes and make sure they work as expected
2. **Format your code**: Run `pnpm tidy` to automatically format your code according to project standards
3. **Run tests**: Run `pnpm test` to make sure your changes don't break existing functionality

### What happens next?

Once your PR is reviewed and merged into the `main` branch, our automated system will:

- Build the common.js file from your changes
- Deploy it directly to the Dominion Strategy Wiki
- Make your changes live for all wiki users

This means you don't need to manually upload anything to the wiki - the deployment is completely automated!
