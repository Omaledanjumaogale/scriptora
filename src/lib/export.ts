import JSZip from 'jszip';
import type { Book } from './types';

function esc(s: string) {
	return s
		.replace(/&/g, '&amp;')
		.replace(/</g, '&lt;')
		.replace(/>/g, '&gt;')
		.replace(/"/g, '&quot;');
}

export function mdToHtml(md: string): string {
	const lines = md.split(/\r?\n/);
	const out: string[] = [];
	let para: string[] = [];
	const flush = () => {
		if (para.length) {
			out.push(`<p>${esc(para.join(' ')).replace(/&quot;/g, '"')}</p>`);
			para = [];
		}
	};
	for (const raw of lines) {
		const line = raw.trim();
		if (!line) {
			flush();
			continue;
		}
		if (line.startsWith('### ')) {
			flush();
			out.push(`<h3>${esc(line.slice(4))}</h3>`);
		} else if (line.startsWith('## ')) {
			flush();
			out.push(`<h2>${esc(line.slice(3))}</h2>`);
		} else if (line.startsWith('# ')) {
			flush();
			out.push(`<h1>${esc(line.slice(2))}</h1>`);
		} else if (line.startsWith('> ')) {
			flush();
			out.push(`<blockquote>${esc(line.slice(2))}</blockquote>`);
		} else {
			para.push(line);
		}
	}
	flush();
	return out.join('\n');
}

export function frontMatterHtml(book: Book) {
	const year = new Date().getFullYear();
	return `<section class="frontmatter">
  <div class="title-page">
    <p class="imprint">${esc(book.cover.imprint)}</p>
    <h1>${esc(book.title)}</h1>
    <p class="subtitle">${esc(book.subtitle)}</p>
    <p class="author">${esc(book.author)}</p>
  </div>
  <div class="copyright">
    <p>${esc(book.title)}</p>
    <p>Copyright © ${year} ${esc(book.author)}. All rights reserved.</p>
    <p>This is a work of ${/fiction|novel|essays/i.test(book.genre) ? 'fiction. Names, characters, places and incidents are products of the author’s imagination or are used fictitiously.' : 'nonfiction. The author has made every effort to ensure the accuracy of the information herein.'}</p>
    <p>Cover design and interior production: ${esc(book.cover.imprint)}. Produced with Scriptora.</p>
    ${book.isbn ? `<p>ISBN ${esc(book.isbn)}</p>` : ''}
    <p>First edition · ${year}</p>
  </div>
  ${
		book.themes.length
			? `<div class="dedication"><p>For everyone who has ever been told the record is complete.</p><p class="small">${esc(book.themes[0])}</p></div>`
			: ''
	}
  <div class="epigraph"><blockquote>“Every institution keeps a second record. This is a story about the people who keep it.”</blockquote></div>
</section>`;
}

export function backMatterHtml(book: Book) {
	return `<section class="backmatter">
  <h2>Acknowledgements</h2>
  <p>Every book is a collaboration. This one is for the editors who asked the difficult question, the readers who read the difficult answer, and the people who kept the lights on while the work was finished.</p>
  <h2>About the author</h2>
  <p>${esc(book.author)} writes ${esc(book.genre.toLowerCase())} about memory, institutions, and the private cost of public decisions. ${esc(book.author)} lives and works in a city with too many archives and not enough time.</p>
  <h2>Also by ${esc(book.author)}</h2>
  <p>${book.series ? esc(book.series) + ' · Book ' + book.volume : 'The Long Inventory'} — available in ebook and print.</p>
  <h2>A note on process</h2>
  <p>This edition was produced in Scriptora using a locked story bible, genre-routed craft protocols, and a human-approved editorial pass. Every chapter was checked against canon before release.</p>
  <div class="colophon"><p>${esc(book.cover.imprint)}</p><p class="small">Set in Fraunces &amp; Source Serif. ${esc(book.trimSize)} · ${esc(book.language)}</p></div>
</section>`;
}

export function manuscriptHtml(book: Book, opts: { includeFrontMatter?: boolean; includeBackMatter?: boolean } = {}) {
	const fm = opts.includeFrontMatter ?? true;
	const bm = opts.includeBackMatter ?? true;
	return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"/>
<title>${esc(book.title)} — ${esc(book.author)}</title>
<style>
  @page { size: 6in 9in; margin: 0.8in 0.7in; }
  body { font-family: Georgia, 'Times New Roman', serif; font-size: 11.5pt; line-height: 1.75; color: #171512; max-width: 42rem; margin: 0 auto; padding: 3rem 1.5rem; }
  h1 { font-size: 2.2rem; font-weight: 500; margin: 0 0 .4rem; line-height: 1.15; }
  h2 { font-size: 1.25rem; font-weight: 500; margin: 2.4rem 0 .8rem; }
  h3 { font-size: 1rem; font-weight: 600; margin: 1.8rem 0 .6rem; }
  p { margin: 0 0 1em; text-align: justify; }
  blockquote { border-left: 2px solid #b98f4a; margin: 1.5rem 0; padding-left: 1rem; font-style: italic; color: #555; }
  .title-page { text-align: center; padding: 25vh 0 30vh; page-break-after: always; }
  .title-page .subtitle { font-style: italic; font-size: 1.1rem; color: #444; }
  .title-page .author { margin-top: 3rem; letter-spacing: .18em; text-transform: uppercase; font-size: .8rem; }
  .imprint { letter-spacing: .24em; text-transform: uppercase; font-size: .65rem; color: #8a6a2e; }
  .copyright { font-size: .78rem; color: #555; page-break-before: always; padding-top: 35vh; }
  .dedication { text-align: center; font-style: italic; page-break-before: always; padding-top: 35vh; }
  .epigraph { text-align: center; page-break-before: always; padding-top: 35vh; font-style: italic; }
  .chapter { page-break-before: always; }
  .chapter h1 { font-size: 1.8rem; margin-top: 12vh; margin-bottom: 2.5rem; text-align: center; }
  .chapter p:first-of-type::first-letter { float: left; font-size: 3.2em; line-height: .82; padding: .06em .12em 0 0; color: #b98f4a; }
  .backmatter { page-break-before: always; }
  .colophon { margin-top: 4rem; text-align: center; font-size: .75rem; color: #777; }
  .small { font-size: .75rem; color: #777; }
  @media print { body { padding: 0; max-width: none; } }
</style></head>
<body>
${fm ? frontMatterHtml(book) : ''}
${book.chapters
	.filter((c) => c.content.trim())
	.map(
		(c) => `<section class="chapter"><h1>${esc(c.title)}</h1>${mdToHtml(c.content.replace(/^# .*$/m, ''))}</section>`
	)
	.join('\n')}
${bm ? backMatterHtml(book) : ''}
</body></html>`;
}

export function buildMarkdown(book: Book) {
	return `# ${book.title}\n\n_${book.subtitle}_\n\n**${book.author}**\n\n---\n\n${book.description}\n\n## Table of contents\n\n${book.chapters
		.map((c) => `${c.number}. ${c.title}`)
		.join('\n')}\n\n---\n\n${book.chapters
		.map((c) => `# ${c.title}\n\n${c.content.trim() || '_Not yet drafted._'}`)
		.join('\n\n---\n\n')}\n\n---\n\n© ${new Date().getFullYear()} ${book.author}. Produced with Scriptora.\n`;
}

function xhtmlPage(title: string, body: string) {
	return `<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en">
<head><meta charset="utf-8"/><title>${esc(title)}</title><link rel="stylesheet" href="style.css" type="text/css"/></head>
<body>${body}</body></html>`;
}

export async function buildEpub(book: Book): Promise<Blob> {
	const zip = new JSZip();
	zip.file('mimetype', 'application/epub+zip', { compression: 'STORE' });
	zip.file(
		'META-INF/container.xml',
		`<?xml version="1.0" encoding="UTF-8"?>
<container version="1.0" xmlns="urn:oasis:names:tc:opendocument:xmlns:container">
  <rootfiles><rootfile full-path="OEBPS/content.opf" media-type="application/oebps-package+xml"/></rootfiles>
</container>`
	);

	const css = `body{font-family:Georgia,serif;line-height:1.7;color:#171512;margin:5%}
h1{font-size:2em;font-weight:500;line-height:1.2;text-align:center;margin:15% 0 2em}
h2{font-size:1.25em;margin-top:2em}
p{margin:0 0 1em;text-align:justify}
blockquote{border-left:2px solid #b98f4a;padding-left:1em;font-style:italic;color:#555}
.title-page{text-align:center;padding-top:25vh}
.subtitle{font-style:italic;color:#555}
.author{margin-top:3em;letter-spacing:.18em;text-transform:uppercase;font-size:.8em}
.imprint{letter-spacing:.24em;text-transform:uppercase;font-size:.65em;color:#8a6a2e}
.copyright,.dedication,.epigraph{font-size:.85em;color:#555;margin-top:30vh;text-align:center}
.cover{display:flex;flex-direction:column;justify-content:space-between;height:90vh;padding:8%;background:#10141d;color:#ece9e2;text-align:center}
.cover h1{font-size:2.6em;margin:0;color:#e0b872}
.cover .author{color:#ece9e2}
.cover .imprint{color:#e0b872}
.backmatter{margin-top:20%}
.small{font-size:.75em;color:#777}
`;
	zip.file('OEBPS/style.css', css);

	zip.file(
		'OEBPS/cover.xhtml',
		xhtmlPage(
			book.title,
			`<div class="cover"><p class="imprint">${esc(book.cover.imprint)}</p><div><h1>${esc(book.title)}</h1><p class="subtitle">${esc(book.subtitle)}</p></div><p class="author">${esc(book.author)}</p></div>`
		)
	);

	const chapters = book.chapters.filter((c) => c.content.trim());
	chapters.forEach((c) => {
		zip.file(
			`OEBPS/ch${c.number}.xhtml`,
			xhtmlPage(
				c.title,
				`<section><h1>${esc(c.title)}</h1>${mdToHtml(c.content.replace(/^# .*$/m, ''))}</section>`
			)
		);
	});

	zip.file(
		'OEBPS/front.xhtml',
		xhtmlPage('Front matter', frontMatterHtml(book).replace(/<section class="frontmatter">/, '<section>'))
	);
	zip.file(
		'OEBPS/back.xhtml',
		xhtmlPage('Back matter', backMatterHtml(book).replace(/<section class="backmatter">/, '<section>'))
	);

	const navItems = [
		['cover.xhtml', 'Cover'],
		['front.xhtml', 'Title page'],
		...chapters.map((c) => [`ch${c.number}.xhtml`, `Chapter ${c.number} · ${c.title}`]),
		['back.xhtml', 'Acknowledgements']
	];
	zip.file(
		'OEBPS/nav.xhtml',
		`<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE html>
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:epub="http://www.idpf.org/2007/ops" lang="en">
<head><meta charset="utf-8"/><title>Contents</title><link rel="stylesheet" href="style.css"/></head>
<body><nav epub:type="toc" id="toc"><h1>Contents</h1><ol>
${navItems.map(([href, label]) => `<li><a href="${href}">${esc(label)}</a></li>`).join('\n')}
</ol></nav></body></html>`
	);

	const manifest = [
		'<item id="nav" href="nav.xhtml" media-type="application/xhtml+xml" properties="nav"/>',
		'<item id="css" href="style.css" media-type="text/css"/>',
		'<item id="cover" href="cover.xhtml" media-type="application/xhtml+xml"/>',
		'<item id="front" href="front.xhtml" media-type="application/xhtml+xml"/>',
		'<item id="back" href="back.xhtml" media-type="application/xhtml+xml"/>',
		...chapters.map(
			(c) => `<item id="ch${c.number}" href="ch${c.number}.xhtml" media-type="application/xhtml+xml"/>`
		)
	].join('\n    ');
	const spine = [
		'<itemref idref="cover"/>',
		'<itemref idref="front"/>',
		...chapters.map((c) => `<itemref idref="ch${c.number}"/>`),
		'<itemref idref="back"/>'
	].join('\n    ');

	zip.file(
		'OEBPS/content.opf',
		`<?xml version="1.0" encoding="utf-8"?>
<package xmlns="http://www.idpf.org/2007/opf" version="3.0" unique-identifier="bookid">
  <metadata xmlns:dc="http://purl.org/dc/elements/1.1/">
    <dc:identifier id="bookid">urn:uuid:${book.id}-${Date.now()}</dc:identifier>
    <dc:title>${esc(book.title)}</dc:title>
    <dc:creator>${esc(book.author)}</dc:creator>
    <dc:language>${book.language.slice(0, 2).toLowerCase()}</dc:language>
    <dc:description>${esc(book.description)}</dc:description>
    <dc:publisher>${esc(book.cover.imprint)}</dc:publisher>
    <dc:subject>${esc(book.genre)}</dc:subject>
    <meta property="dcterms:modified">${new Date().toISOString().replace(/\.\d+Z$/, 'Z')}</meta>
  </metadata>
  <manifest>
    ${manifest}
  </manifest>
  <spine>
    ${spine}
  </spine>
</package>`
	);

	return zip.generateAsync({ type: 'blob', mimeType: 'application/epub+zip' });
}

export function download(filename: string, content: Blob | string, type = 'text/plain') {
	const blob = typeof content === 'string' ? new Blob([content], { type }) : content;
	const url = URL.createObjectURL(blob);
	const a = document.createElement('a');
	a.href = url;
	a.download = filename;
	document.body.appendChild(a);
	a.click();
	a.remove();
	setTimeout(() => URL.revokeObjectURL(url), 2000);
}

export function printBook(book: Book) {
	const w = window.open('', '_blank');
	if (!w) return false;
	w.document.write(manuscriptHtml(book));
	w.document.close();
	w.focus();
	setTimeout(() => w.print(), 500);
	return true;
}
