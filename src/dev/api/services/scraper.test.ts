import { describe, expect, it } from "vitest";
import { extractCardsGallerySection } from "./scraper.js";

describe("extractCardsGallerySection", () => {
	it("extracts Cards gallery section with h2 heading", () => {
		const mockHtml = `
				<html>
					<body>
						<h1>Some Other Section</h1>
						<p>Some content</p>

						<h2><span class="mw-headline" id="Cards_gallery">Cards gallery</span></h2>
						<h3>Kingdom cards</h3>
						<p>Card gallery content here</p>
						<div class="cardcost">Card images</div>

						<h2><span class="mw-headline" id="Impact">Impact</span></h2>
						<p>Next section content</p>
					</body>
				</html>
			`;

		const result = extractCardsGallerySection(mockHtml);

		expect(result).toContain("Cards gallery");
		expect(result).toContain("Kingdom cards");
		expect(result).toContain("Card gallery content here");
		expect(result).not.toContain("Impact");
		expect(result).not.toContain("Next section content");
	});

	it("extracts Cards gallery section with h3 heading", () => {
		const mockHtml = `
				<html>
					<body>
						<h2>Main Section</h2>
						<h3><span class="mw-headline" id="Cards_gallery">Cards gallery</span></h3>
						<p>Gallery content</p>
						<h4>Subsection</h4>
						<p>Subsection content</p>
						<h3><span class="mw-headline" id="Next_section">Next section</span></h3>
						<p>Should not be included</p>
					</body>
				</html>
			`;

		const result = extractCardsGallerySection(mockHtml);

		expect(result).toContain("Cards gallery");
		expect(result).toContain("Gallery content");
		expect(result).toContain("Subsection");
		expect(result).toContain("Subsection content");
		expect(result).not.toContain("Next section");
		expect(result).not.toContain("Should not be included");
	});

	it('handles variant spelling "Card gallery"', () => {
		const mockHtml = `
				<html>
					<body>
						<h2><span class="mw-headline">Card gallery</span></h2>
						<p>Gallery content</p>
						<h2>Next section</h2>
					</body>
				</html>
			`;

		const result = extractCardsGallerySection(mockHtml);

		expect(result).toContain("Card gallery");
		expect(result).toContain("Gallery content");
		expect(result).not.toContain("Next section");
	});

	it("includes all subsections within the Cards gallery", () => {
		const mockHtml = `
				<html>
					<body>
						<h2>Cards gallery</h2>
						<h3>Kingdom cards</h3>
						<p>Kingdom content</p>
						<h3>Knights</h3>
						<p>Knights content</p>
						<h3>Ruins</h3>
						<p>Ruins content</p>
						<h3>Shelters</h3>
						<p>Shelters content</p>
						<h2>Impact</h2>
						<p>Should not be included</p>
					</body>
				</html>
			`;

		const result = extractCardsGallerySection(mockHtml);

		expect(result).toContain("Kingdom cards");
		expect(result).toContain("Kingdom content");
		expect(result).toContain("Knights");
		expect(result).toContain("Knights content");
		expect(result).toContain("Ruins");
		expect(result).toContain("Ruins content");
		expect(result).toContain("Shelters");
		expect(result).toContain("Shelters content");
		expect(result).not.toContain("Impact");
		expect(result).not.toContain("Should not be included");
	});

	it("wraps extracted content in proper HTML structure", () => {
		const mockHtml = `
				<html>
					<body>
						<h2>Cards gallery</h2>
						<p>Content</p>
						<h2>Next</h2>
					</body>
				</html>
			`;

		const result = extractCardsGallerySection(mockHtml);

		expect(result).toContain("<!DOCTYPE html>");
		expect(result).toContain("<html>");
		expect(result).toContain("<head>");
		expect(result).toContain("<title>Cards Gallery</title>");
		expect(result).toContain("<body>");
		expect(result).toContain("</body>");
		expect(result).toContain("</html>");
	});

	it("includes basic HTML structure without inline styles", () => {
		const mockHtml = `
				<html>
					<body>
						<h2>Cards gallery</h2>
						<p>Content</p>
					</body>
				</html>
			`;

		const result = extractCardsGallerySection(mockHtml);
		expect(result).toContain("<!DOCTYPE html>");
		expect(result).toContain("<title>Cards Gallery</title>");
		expect(result).not.toContain("<style>");
	});

	it("handles case where gallery is at end of document", () => {
		const mockHtml = `
				<html>
					<body>
						<h1>Other content</h1>
						<h2>Cards gallery</h2>
						<p>Gallery content</p>
						<h3>Subsection</h3>
						<p>More content</p>
					</body>
				</html>
			`;

		const result = extractCardsGallerySection(mockHtml);

		expect(result).toContain("Cards gallery");
		expect(result).toContain("Gallery content");
		expect(result).toContain("Subsection");
		expect(result).toContain("More content");
	});

	it("throws error when Cards gallery section is not found", () => {
		const mockHtml = `
				<html>
					<body>
						<h1>Some Section</h1>
						<p>Content</p>
						<h2>Another Section</h2>
						<p>More content</p>
					</body>
				</html>
			`;

		expect(() => {
			extractCardsGallerySection(mockHtml);
		}).toThrow("Cards gallery section not found in wiki page");
	});

	it("preserves card image HTML structure", () => {
		const mockHtml = `
				<html>
					<body>
						<h2>Cards gallery</h2>
						<h3>Kingdom cards</h3>
						<p>
							<span class="cardcost cost$06">
								<span typeof="mw:File">
									<a href="/index.php/Altar" title="Altar">
										<img alt="" src="/images/thumb/b/b3/Altar.jpg/200px-Altar.jpg" width="200" height="320" />
									</a>
								</span>
							</span>
							<span class="cardcost cost$04">
								<span typeof="mw:File">
									<a href="/index.php/Armory" title="Armory">
										<img alt="" src="/images/thumb/a/a7/Armory.jpg/200px-Armory.jpg" width="200" height="320" />
									</a>
								</span>
							</span>
						</p>
						<h2>Next section</h2>
					</body>
				</html>
			`;

		const result = extractCardsGallerySection(mockHtml);

		expect(result).toContain("cardcost cost$06");
		expect(result).toContain("cardcost cost$04");
		expect(result).toContain('href="https://wiki.dominionstrategy.com/index.php/Altar"');
		expect(result).toContain('href="https://wiki.dominionstrategy.com/index.php/Armory"');
		expect(result).toContain('src="/images/thumb/b/b3/Altar.jpg/200px-Altar.jpg"');
		expect(result).toContain('src="/images/thumb/a/a7/Armory.jpg/200px-Armory.jpg"');
		expect(result).toContain("Altar.jpg");
		expect(result).toContain("Armory.jpg");
		expect(result).not.toContain("Next section");
	});

	it("handles complex nested structure with multiple heading levels", () => {
		const mockHtml = `
				<html>
					<body>
						<h1>Main Title</h1>
						<h2>Cards gallery</h2>
						<h3>Kingdom cards</h3>
						<p>Kingdom content</p>
						<h4>Sorting options</h4>
						<p>Sort controls</p>
						<h3>Knights</h3>
						<p>Knights content</p>
						<h4>Individual knights</h4>
						<p>Knight details</p>
						<h2>Impact</h2>
						<p>Should not be included</p>
					</body>
				</html>
			`;

		const result = extractCardsGallerySection(mockHtml);

		expect(result).toContain("Cards gallery");
		expect(result).toContain("Kingdom cards");
		expect(result).toContain("Kingdom content");
		expect(result).toContain("Sorting options");
		expect(result).toContain("Sort controls");
		expect(result).toContain("Knights");
		expect(result).toContain("Knights content");
		expect(result).toContain("Individual knights");
		expect(result).toContain("Knight details");
		expect(result).not.toContain("Impact");
		expect(result).not.toContain("Should not be included");
	});
});
