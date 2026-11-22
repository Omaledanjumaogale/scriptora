import type {
	Book,
	Chapter,
	CoverDesign,
	CraftReport,
	GenerationConfig,
	MarketResearch,
	StoryBible,
	Scene
} from './types';

/* ------------------------------------------------------------------ */
/* Deterministic pseudo-random helpers                                 */
/* ------------------------------------------------------------------ */

export function hashString(input: string): number {
	let h = 2166136261;
	for (let i = 0; i < input.length; i++) {
		h ^= input.charCodeAt(i);
		h = Math.imul(h, 16777619);
	}
	return h >>> 0;
}

function mulberry32(seed: number) {
	return function () {
		let t = (seed += 0x6d2b79f5);
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

type Rng = () => number;

function pick<T>(rng: Rng, arr: readonly T[]): T {
	return arr[Math.floor(rng() * arr.length) % arr.length];
}

function pickMany<T>(rng: Rng, arr: readonly T[], count: number): T[] {
	const copy = [...arr];
	const out: T[] = [];
	while (out.length < count && copy.length) {
		out.push(copy.splice(Math.floor(rng() * copy.length), 1)[0]);
	}
	return out;
}

function int(rng: Rng, min: number, max: number) {
	return Math.floor(rng() * (max - min + 1)) + min;
}

export function slugify(input: string) {
	return input
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '-')
		.replace(/(^-|-$)/g, '');
}

export function countWords(text: string) {
	const trimmed = text.trim();
	if (!trimmed) return 0;
	return trimmed.split(/\s+/).length;
}

/* ------------------------------------------------------------------ */
/* Concept + outline                                                   */
/* ------------------------------------------------------------------ */

const THEME_BANK = [
	'memory and the stories we edit',
	'inheritance, chosen and refused',
	'the cost of certainty',
	'loneliness inside a crowded life',
	'the ethics of care',
	'what we owe the dead',
	'ambition and its quiet casualties',
	'belonging after displacement',
	'the private life of institutions',
	'love as a practice rather than a feeling',
	'repair, not rescue',
	'the difference between truth and fact'
];

const HOOK_BANK = [
	'A discovery that reframes everything the reader believed on page one.',
	'A central relationship that keeps reversing who holds the power.',
	'A ticking deadline that forces the protagonist to choose between two versions of themselves.',
	'An unreliable document that surfaces at the worst possible moment.',
	'A place so specific the reader can smell it, with rules that quietly tighten.',
	'A question the reader needs answered, withheld just long enough.',
	'A moral dilemma with no clean side, argued by people we love.',
	'A small betrayal that turns out to be the whole architecture.'
];

const USP_BANK = [
	'Continuity-locked story bible: every chapter is checked against canon before it ships.',
	'Craft-engine prompts tuned for voice persistence across a full-length manuscript.',
	'Editorial agents work in sequence, so drafting never outruns quality control.',
	'A genuine production pipeline: cover, front matter, EPUB, print-ready PDF.',
	'Transparent cost tracking per chapter, per agent, per book.',
	'Genre-routed protocols rather than one generic prompt for every book.'
];

const TITLE_NOUNS = [
	'Cartographer',
	'Archivist',
	'Lamplighter',
	'Translator',
	'Ferryman',
	'Collector',
	'Understudy',
	'Correspondent',
	'Widow',
	'Apprentice',
	'Gardener',
	'Surveyor'
];
const TITLE_OF = ['Silence', 'Small Hours', 'Borrowed Light', 'Unmade Maps', 'the Second River', 'Empty Rooms', 'the Long Winter', 'Familiar Strangers', 'the Quiet Ward', 'Salt and Paper'];

export function generateConcept(input: {
	title?: string;
	genre: string;
	audience: string;
	description?: string;
	author?: string;
}): Pick<Book, 'title' | 'subtitle' | 'logline' | 'premise' | 'themes' | 'hooks' | 'usps' | 'keywords' | 'description'> {
	const rng = mulberry32(hashString(input.title + input.genre + input.audience + input.description));
	const title = input.title?.trim() || `The ${pick(rng, TITLE_NOUNS)} of ${pick(rng, TITLE_OF)}`;
	const seeded = input.description?.trim();
	const subtitle =
		input.genre === 'Nonfiction'
			? `A field guide to ${pick(rng, THEME_BANK)}`
			: `A ${input.genre.toLowerCase()} about ${pick(rng, THEME_BANK)}`;
	const premise =
		seeded ||
		`When a ${pick(rng, ['restoration archivist', 'night-shift translator', 'municipal surveyor', 'small-press editor', 'hospice chaplain'])} discovers a ${pick(
			rng,
			['letter that should not exist', 'map of a demolished district', 'recording of a voice they buried', 'ledger of unpaid debts', 'photograph dated next spring']
		)}, the orderly life they have built begins to come apart. What follows is not a chase but an accounting: of the people who helped, the promises that were made, and the price of finally telling the truth in a place that has learned to prefer silence.`;

	const themes = pickMany(rng, THEME_BANK, 4);
	const hooks = pickMany(rng, HOOK_BANK, 4);
	const usps = pickMany(rng, USP_BANK, 3);
	const keywordBase = [...themes.slice(0, 2), input.genre.toLowerCase(), input.audience.toLowerCase()];
	const keywords = Array.from(
		new Set(keywordBase.map((k) => k.replace(/[^a-z0-9 ]/gi, '').trim()).filter(Boolean))
	).slice(0, 6);

	return {
		title,
		subtitle,
		logline: `A ${input.audience.toLowerCase()} ${input.genre.toLowerCase()} about ${themes[0]}, and the one discovery that makes going back impossible.`,
		premise,
		themes,
		hooks,
		usps,
		keywords,
		description: premise.split('. ').slice(0, 2).join('. ') + '.'
	};
}

const CHAPTER_TITLE_A = [
	'The Ledger',
	'A Room With One Window',
	'What the Water Kept',
	'The Long Way Home',
	'An Inventory of Small Betrayals',
	'Night Shift',
	'Borrowed Names',
	'The Second Map',
	'Terms and Conditions',
	'A Public Service',
	'The Quiet Part',
	'After the Rain',
	'What We Carry',
	'The Last Appointment',
	'A Theory of Repair',
	'The Unmarked Door'
];

const CHAPTER_PURPOSE = [
	'Establish the ordinary world and the flaw the story will test.',
	'Introduce the disruption and make the cost of ignoring it visible.',
	'Force the protagonist across a threshold they cannot uncross.',
	'Deepen the central relationship while withholding one essential fact.',
	'Raise the stakes through an external consequence.',
	'Deliver the midpoint reversal that changes what the story is about.',
	'Let the protagonist win something and immediately discover its price.',
	'Break the alliance that made progress possible.',
	'Reveal the wound beneath the plot and complicate the antagonist.',
	'Drive the protagonist to the worst available choice.',
	'Stage the confrontation the whole book has been delaying.',
	'Resolve the external question and answer the internal one.',
	'Demonstrate change through behavior, not narration.',
	'Leave the reader with an earned, unsettled image.'
];

const SCENE_BANK = [
	['The unopened package', 'A routine shift ends with an object that does not belong.'],
	['A conversation in the stairwell', 'Two people discuss the weather and mean something else entirely.'],
	['The archive after hours', 'The protagonist searches for a record that has been quietly moved.'],
	['Dinner with the family', 'A practiced civility cracks under a small, specific question.'],
	['The wrong address', 'A journey to confirm a fact produces a person instead.'],
	['A favor called in', 'An old debt is redeemed at a cost the protagonist had not calculated.'],
	['The official version', 'An institution offers a tidy story that everyone agrees to repeat.'],
	['The missing hour', 'A gap in the record becomes the only reliable evidence.'],
	['At the river', 'A confrontation without an audience, and therefore without a performance.'],
	['The last voicemail', 'A voice from the past reframes a choice made years ago.'],
	['A door left open', 'The protagonist is given access and understands it as a trap.'],
	['The inventory', 'Counting objects becomes a way of counting what was lost.'],
	['An unexpected visitor', 'Someone with nothing to gain tells a version no one wanted told.'],
	['The public meeting', 'Private grief is converted into procedure, and the procedure fails.']
];

export function generateChapters(
	book: Pick<Book, 'title' | 'genre' | 'targetWords' | 'author' | 'bible'>,
	count = 12
): Chapter[] {
	const rng = mulberry32(hashString(book.title + count + book.genre));
	const titles = pickMany(rng, CHAPTER_TITLE_A, Math.min(count, CHAPTER_TITLE_A.length));
	for (let i = titles.length; i < count; i++) titles.push(`Chapter ${i + 1}`);
	const parts = ['Part I — The Ordinary World', 'Part II — The Crossing', 'Part III — The Return'];
	const perPart = Math.ceil(count / 3);
	const povNames = book.bible?.characters?.length
		? book.bible.characters.filter((c) => c.tier === 1).map((c) => c.name)
		: ['the protagonist'];
	const chapters: Chapter[] = [];
	for (let i = 0; i < count; i++) {
		const sceneSet = pickMany(rng, SCENE_BANK, 3);
		const scenes: Scene[] = sceneSet.map((s, j) => ({
			id: `sc-${i + 1}-${j + 1}`,
			title: s[0],
			summary: s[1],
			purpose: j === 1 ? 'Turning point: the scene must end in a different state than it began.' : 'Escalate pressure and reveal character through choice.',
			status: 'planned',
			circuit: {
				you: true,
				need: true,
				go: true,
				search: true,
				find: true,
				take: j > 0,
				return: true,
				change: j > 0
			}
		}));
		chapters.push({
			id: `ch-${i + 1}`,
			number: i + 1,
			part: parts[Math.min(parts.length - 1, Math.floor(i / perPart))],
			title: titles[i],
			summary: `${povNames[0]} ${pick(rng, [
				'follows a discrepancy that the official record cannot explain',
				'is asked to vouch for someone they no longer trust',
				'makes a promise that will require a lie to keep',
				'uncovers the human cost of a decision presented as administrative',
				'tries to repair a relationship without admitting what broke it',
				'is offered the thing they wanted, on terms they cannot accept'
			])}. The chapter ends when ${pick(rng, ['a name is spoken aloud', 'a document changes hands', 'a door is locked from the inside', 'someone decides not to ask the obvious question'])}.`,
			purpose: CHAPTER_PURPOSE[Math.min(i, CHAPTER_PURPOSE.length - 1)],
			pov: book.genre === 'Nonfiction' ? 'Authorial' : 'Third limited',
			status: 'planned',
			wordCount: 0,
			targetWords: Math.round(book.targetWords / count),
			content: '',
			scenes,
			updatedAt: new Date().toISOString()
		});
	}
	return chapters;
}

/* ------------------------------------------------------------------ */
/* Story bible                                                         */
/* ------------------------------------------------------------------ */

const FIRST_NAMES = ['Mara', 'Elias', 'Noor', 'Jonah', 'Ines', 'Tomas', 'Ruth', 'Ade', 'Lena', 'Cass', 'Ivo', 'Sela'];
const LAST_NAMES = ['Venn', 'Okoro', 'Alvarez', 'Hale', 'Marchetti', 'Sato', 'Bell', 'Adeyemi', 'Ferreira', 'Quinn', 'Novak', 'Reyes'];

const WOUNDS = [
	'Was believed once, and it cost someone else everything.',
	'Learned early that being needed is safer than being known.',
	'Left a place they promised to stay, and has been explaining it ever since.',
	'Was the reliable one in a family that rewarded invisibility.',
	'Survived a public failure and has organized a life around never repeating it.',
	'Told a lie to protect someone and has been paying interest on it for years.'
];

const WANTS = [
	'To finish the work and be left alone.',
	'To prove the record is wrong before anyone else notices.',
	'To be chosen, once, without having to ask.',
	'To repair the family name without repeating its methods.',
	'To keep the institution intact and still tell the truth.',
	'To find the person who left, and not need them when they do.'
];

const NEEDS = [
	'To accept that being known is not the same as being judged.',
	'To give up the story that makes their suffering meaningful.',
	'To ask for help before the crisis, not after it.',
	'To forgive the version of themselves that made the original choice.',
	'To choose a future that is not a correction of the past.',
	'To stop confusing loyalty with silence.'
];

export function generateStoryBible(seedTitle: string, genre: string): StoryBible {
	const rng = mulberry32(hashString(seedTitle + genre + 'bible'));
	const names = pickMany(rng, FIRST_NAMES, 6);
	const lasts = pickMany(rng, LAST_NAMES, 6);
	const characters = names.map((name, i) => ({
		id: `char-${i + 1}`,
		name: i === 0 ? `${name} ${lasts[0]}` : `${name} ${lasts[i]}`,
		role: (i === 0 ? 'protagonist' : i === 1 ? 'antagonist' : i === 2 ? 'ally' : i === 3 ? 'mentor' : 'minor') as
			| 'protagonist'
			| 'antagonist'
			| 'ally'
			| 'mentor'
			| 'minor',
		age: `${int(rng, 24, 63)}`,
		occupation: pick(rng, [
			'Municipal archivist',
			'Independent translator',
			'Night editor at a regional paper',
			'Restoration carpenter',
			'Crisis counselor',
			'Registrar at a small museum',
			'Documentary sound recordist',
			'Family-law mediator'
		]),
		want: pick(rng, WANTS),
		need: pick(rng, NEEDS),
		wound: pick(rng, WOUNDS),
		arc: pick(rng, [
			'Moves from control to participation; learns that care is a risk worth taking.',
			'Moves from certainty to inquiry; gives up the comfort of being right.',
			'Moves from performance to honesty; lets one person see the unedited version.',
			'Moves from loyalty to integrity; discovers they can be both, but not for free.',
			'Moves from self-erasure to self-possession; stops auditioning for belonging.'
		]),
		voice: pick(rng, [
			'Spare, precise, allergic to abstraction.',
			'Warm and digressive until the subject becomes personal.',
			'Formal under pressure; jokes when frightened.',
			'Concrete nouns, short sentences, long pauses.',
			'Argumentative, generous, always editing themselves mid-sentence.'
		]),
		tier: (i < 2 ? 1 : i < 4 ? 2 : 3) as 1 | 2 | 3,
		color: ['#e0b872', '#7dd3c0', '#a78bfa', '#f0a0a8', '#93c5fd', '#fbbf24'][i]
	}));

	const world = [
		{
			id: 'w-1',
			category: 'Place' as const,
			name: pick(rng, ['The Northern Archive', 'Bellwether House', 'The Salt District', 'Kestrel Row', 'The Old Registry']),
			description:
				'A working institution with too few staff and too much history. Public rooms are warm and well lit; the upper floors are neither.',
			rules: 'Access is a privilege granted by the registrar. Nothing leaves the building without a signed slip.'
		},
		{
			id: 'w-2',
			category: 'Culture' as const,
			name: 'The annual inventory',
			description:
				'Once a year the district counts what it owns. The ritual is civic, tedious, and quietly sacred; discrepancies are handled informally.',
			rules: 'What is counted publicly cannot be privately denied.'
		},
		{
			id: 'w-3',
			category: 'Faction' as const,
			name: 'The Preservation Board',
			description: 'Five members, three of whom disagree about what preservation means. Meets quarterly, decides more than it admits.',
			rules: 'Minutes record decisions, not conversations.'
		},
		{
			id: 'w-4',
			category: 'Technology' as const,
			name: 'The ledger system',
			description: 'A legacy database migrated twice, with one table nobody fully understands. Its timestamps are trusted more than its people.',
			rules: 'A record with no provenance is still a record, but cannot be introduced as evidence.'
		},
		{
			id: 'w-5',
			category: 'Place' as const,
			name: 'The river path',
			description: 'The unofficial corridor between the archive and the housing estate; a place where difficult conversations happen because no one can leave quickly.',
			rules: 'What is said on the path is not said in the office.'
		},
		{
			id: 'w-6',
			category: 'Timeline' as const,
			name: 'The closure, nine years ago',
			description: 'A facility closed after a fire. Files were moved, people were relocated, and the official account became the only account.',
			rules: 'No document from the closure year may be quoted without context; the context is contested.'
		}
	];

	const canon = [
		{ id: 'c-1', rule: 'The archive never destroys a record; it reclassifies it.', scope: 'World rule', status: 'locked' as const },
		{ id: 'c-2', rule: 'Mara does not lie outright. She omits, reframes, and changes the subject.', scope: 'Protagonist behavior', status: 'locked' as const },
		{ id: 'c-3', rule: 'The closure happened in November, nine years before chapter one.', scope: 'Timeline', status: 'locked' as const },
		{ id: 'c-4', rule: 'No character has read the full closure report; each has one page.', scope: 'Mystery architecture', status: 'locked' as const },
		{ id: 'c-5', rule: 'The river path is the only place two characters speak without a witness.', scope: 'Setting', status: 'flexible' as const },
		{ id: 'c-6', rule: 'Elias never says the name of the person he protected.', scope: 'Voice / reveal discipline', status: 'locked' as const }
	];

	return {
		characters,
		world,
		canon,
		glossary: [
			{ term: 'Provenance', definition: 'The documented chain that establishes where a record came from and whether it can be trusted.' },
			{ term: 'Quiet file', definition: 'Internal shorthand for a file moved without a public entry.' },
			{ term: 'The inventory', definition: 'The annual count that determines what the district officially possesses.' },
			{ term: 'Signature slip', definition: 'The paper that authorizes removal of an item from the archive.' }
		],
		timeline: [
			{ when: 'Nine years ago — November', event: 'The closure and the fire. Official account is finalized within six weeks.' },
			{ when: 'Eight years ago', event: 'Mara is hired as a junior registrar. Elias becomes her mentor.' },
			{ when: 'Three years ago', event: 'The first migration of the ledger system. One table is marked for review and never reviewed.' },
			{ when: 'One month before chapter one', event: 'The Preservation Board approves a digitization grant.' },
			{ when: 'Chapter one', event: 'A delivery arrives addressed to a person who no longer works there.' },
			{ when: 'Chapter twelve', event: 'The public inventory. What has been counted cannot be denied.' }
		],
		styleGuide: {
			pov: genre === 'Nonfiction' ? 'First person, authoritative but conversational' : 'Close third, shifting only between tier-one characters',
			tense: 'Past tense for narrative, present for documents',
			distance: 'Intimate in interiority; cinematic in scenes with more than two characters',
			dialogue: 'No attributions when the speaker is unambiguous. Characters rarely answer the question asked.',
			avoid: 'No thematic summary at chapter ends. No metaphor for weather unless a character would actually think it.'
		}
	};
}

/* ------------------------------------------------------------------ */
/* Chapter prose                                                       */
/* ------------------------------------------------------------------ */

const OPENERS = [
	'The building was already awake when {name} arrived, which was the first thing wrong with the morning.',
	'By the time the call came, {name} had been at the desk for four hours and had accomplished the precise amount of work required to feel innocent.',
	'There are two kinds of silence in an archive: the one that means nobody is there, and the one that means somebody is.',
	'{name} had rehearsed the sentence on the walk from the bus, and by the time the door opened it had become a question.',
	'The package was the wrong shape. That was all. A wrong-shaped package on an ordinary Tuesday, and {name} would spend the next nine weeks explaining it.'
];

const WEATHER = [
	'Rain moved along the windows in slow, deliberate lines, as if it were taking notes.',
	'The heating clicked off at ten and did not come back on. No one mentioned it.',
	'Outside, the district went about its business with the enthusiasm of a place that had been told it was temporary.',
	'Light came through the high windows in bars, which made the room feel like a place where things were kept.',
	'It was the kind of cold that made people stand closer than they meant to.'
];

const INTERIORITY = [
	'{name} had learned to distrust the moment when everything seemed to fit. Comfort was usually an argument someone else had already won.',
	'It was not guilt, exactly. Guilt was a room {name} had furnished years ago and could still find in the dark. This was stranger: the sense of being watched by a version of herself who had made a different choice.',
	'The trouble with doing a thing carefully, {name} thought, was that care could look exactly like complicity from the outside.',
	'There was a version of the story in which this was simple. {name} had stopped believing in simple stories the year the official account became the only account.',
	'What {name} wanted, and would not have said aloud, was to be asked. Not forgiven. Asked.'
];

const DIALOGUE_A = [
	'“You could leave it,” {other} said. “Nobody would know.”',
	'“Nobody would know,” said {other}, and then, because the silence had become a demand: “That was supposed to be reassuring.”',
	'“You keep saying the record is incomplete,” {other} said. “Have you considered that you might be the incompleteness?”',
	'“It’s not a secret,” {other} said. “It’s just not written down.”',
	'“I’m not asking you to lie,” {other} said. “I’m asking you to be careful about the truth.”'
];

const DIALOGUE_B = [
	'“Careful,” {name} said, “is how it started.”',
	'{name} set down the cup. “Say the name.”',
	'“I know what it looks like,” {name} said. “I’m asking what it is.”',
	'“You don’t get to protect me from the thing you did,” {name} said.',
	'“If it’s not written down,” {name} said, “then somebody decided not to write it.”'
];

const DISCOVERY = [
	'The date on the slip was wrong by one day. One day was enough to move a document from the room where it was signed into the room where it was forgotten.',
	'It was not a confession. It was better than a confession: a routine request, initialed, dated, and filed in the ordinary way. The ordinary way was the confession.',
	'On the last page, in the margin, someone had drawn a small square and filled it in. {name} looked at it for a long time before understanding that it was a door.',
	'The name had been typed over. The correction was visible if you held the page to the window. {name} held it to the window.',
	'What {name} found was an absence shaped exactly like a person: a signature removed, a line item zeroed out, a leave of absence approved by someone whose own contract had ended two years earlier.'
];

const COST = [
	'{name} understood then that knowing would not make the next part easier. It would only make it unavoidable.',
	'There was no version in which this stayed private. That was the price, and it had already been paid; the only question was when the bill would arrive.',
	'Louise would not forgive her for this. The thought arrived with the calm of a fact, and {name} found that she could hold it without putting it down.',
	'The truth did not feel like relief. It felt like a room with the furniture rearranged: the same square footage, nothing where it used to be.',
	'{name} had wanted, once, to be the person who did the right thing. It had not occurred to her that the right thing would require so many small wrong ones.'
];

const LONGFORM_TRANSITIONS = [
	'The afternoon unspooled in the ordinary way, which was how the important hours usually arrived.',
	'By the time they returned to the work, the building had settled into its second self: quieter, older, more willing to admit what it was.',
	'The next task was small enough to be finished before it could be questioned.',
	'They moved through the stacks without speaking, each of them carrying a version of the same unfinished sentence.',
	'There was an interval of paperwork, and then another, and the day turned over without announcing itself.',
	'Later, when she tried to remember the order of things, this was the part that refused to stay still.',
	'The corridor smelled of paper and rain and the particular dust that accumulates around decisions.',
	'It took longer than it should have, because neither of them wanted to be the one who stopped.',
	'At some point the lights came on in the east wing, and the building became a place where people worked again.',
	'The work continued. That was the short version. The long version had doors in it, and none of them led where she expected.',
	'They took the stairs because the lift was slow and because neither of them was ready to stand still.',
	'The hour between appointments belonged to nobody, which made it the only honest hour of the day.',
	'Something had changed in the room, though nothing had been moved.',
	'The rain stopped, then started again, as if it had forgotten what it was doing.',
	'She wrote the time in the margin and underlined it, a habit she had picked up from people who expected to be doubted.'
];

const LONGFORM_OBJECTS = [
	'a folder with a broken clasp',
	'a brass key that opened nothing in the building',
	'a photograph with one corner torn away',
	'the inventory ledger, its spine repaired with tape',
	'a cup that had gone cold two hours earlier',
	'a stack of request forms, each one signed in the same hand',
	'the small square of paper that had been folded and unfolded too many times',
	'a box of index cards labeled with years that had not happened yet',
	'a map with a district drawn over another district',
	'the office clock, which was four minutes fast and had been for years',
	'a roll of microfilm that smelled faintly of vinegar',
	'a letter addressed to someone who no longer worked there'
];

const LONGFORM_CLOCKS = [
	'10:14', '11:02', '12:37', '14:19', '15:48', '16:05', '17:33', '18:50', '19:27', '20:11'
];

const LONGFORM_ACTIONS = [
	'She opened {object} on the table between them and did not explain why she had brought it.',
	'They worked through {object} page by page, stopping whenever a name appeared that one of them recognized.',
	'{name} set {object} down and waited for {other} to look at it, which took longer than it should have.',
	'The task was to reconcile {object} with the official record. The task was never only the task.',
	'{other} carried {object} to the window and held it against the light, as if the paper might confess something.',
	'They made a list of what {object} proved and a second list of what it merely suggested. The second list was longer.',
	'{name} copied the relevant lines by hand. The act of copying made the words stranger and more true.',
	'At {clock}, {other} found {object} behind a drawer that was not supposed to open.',
	'They returned {object} to its place, then stood there, unable to leave it alone.',
	'{name} photographed {object} with her phone, knowing the image would be worse than the thing itself.'
];

const CLOSERS = [
	'At the door, {name} turned back. The light was still on in the upper window. She did not wave.',
	'{name} signed the slip, dated it, and wrote the true reason in the box marked Other. Then she went home the long way.',
	'The inventory would be published in nine days. {name} opened the file and began, for the first time, to count.',
	'“I’ll see you tomorrow,” said {other}. It was not a kindness. It was a fact being established in advance.',
	'Somewhere below, a door closed. {name} waited for the sound of footsteps, and when none came, began to read again.',
	'{name} did not look at the river. She had learned that some things become evidence only if you are seen noticing them.'
];

function fill(template: string, vars: Record<string, string>) {
	return template.replace(/\{(\w+)\}/g, (_, k) => vars[k] ?? '');
}

export function generateChapterProse(book: Book, chapter: Chapter): string {
	const bible = book.bible;
	const rng = mulberry32(hashString(book.id + chapter.number + chapter.title + 'prose'));
	const names = bible.characters.length ? bible.characters.map((c) => c.name.split(' ')[0]) : ['Mara'];
	const name = names[0];
	const other = names[1] ?? 'Elias';
	const place = bible.world.find((w) => w.category === 'Place')?.name ?? 'the archive';
	const isNonfiction = /nonfiction|business|self-help|how-to|essay/i.test(book.genre);

	if (isNonfiction) {
		const sections = chapter.scenes.map((s) => s.title);
		const paras: string[] = [];
		paras.push(
			`## ${chapter.title}\n\n${chapter.summary}\n\nThe promise of this chapter is narrow and testable: by the end, you should be able to describe ${chapter.purpose.toLowerCase()} in your own words, and know what to do differently on Monday morning.`
		);
		sections.forEach((section, i) => {
			const frame = pick(rng, [
				'Most teams do not have a knowledge problem; they have a retrieval problem.',
				'The instinct to add process is usually a response to a failure of ownership.',
				'What looks like resistance is often an unspoken constraint that nobody has been allowed to name.',
				'A system that cannot be explained to a new colleague is not a system yet.',
				'Measurement is useful only when it changes a decision.'
			]);
			paras.push(
				`### ${i + 1}. ${section}\n\n${frame} Consider the case of a mid-sized publisher that had spent two years standardizing its editorial workflow. The documents were excellent. Adoption was 31 percent. The problem was not the documents; it was that the workflow required a handoff nobody had authority to make.\n\nA better approach starts with the smallest unit of work that produces a visible result. Map it, name the owner, and define the evidence that the handoff succeeded. Do this once, end to end, before you automate anything.`
			);
		});
		paras.push(
			`## The practice\n\nWrite down the decision this chapter is asking you to make. Put it where the work happens. Then, at the end of the week, answer one question: did the evidence change what you did? If it did not, the system is decoration.\n\nThe next chapter turns from the design of the work to the design of the team that carries it.`
		);
		// Expand the chapter to its commissioned length with field notes and
		// worked examples, while keeping every section tied to the chapter brief.
		const target = chapter.targetWords || 2400;
		const fieldFrames = [
			'The first attempt usually fails for a boring reason: the handoff has no owner.',
			'A process that depends on a heroic individual is not a process; it is a risk concentration.',
			'Teams rarely lack ideas. They lack a shared way to decide which idea gets the next hour.',
			'If the metric can move without changing a decision, it is theatre.',
			'The constraint is almost never where the dashboard says it is.',
			'Adoption follows ownership. Ownership follows a named person and a visible consequence.',
			'Most coordination problems are actually permission problems wearing a process costume.'
		];
		const fieldPractices = [
			'Run a one-week trial with a single team. Name the owner, the handoff and the evidence. Review only those three things.',
			'Draw the workflow on one page. Mark every place where work waits. The longest wait is the real process.',
			'Ask each person to describe the decision they are afraid to make. The answers are your permission map.',
			'Replace the weekly status meeting with a decision log. If nothing was decided, the meeting was a broadcast.',
			'Pick one metric and write the action it would trigger before you collect the data.',
			'Shadow the work for a day. The gap between the documented process and the lived one is the design brief.'
		];
		let note = 0;
		while (countWords(paras.join('\n\n')) < target * 0.92 && note < 22) {
			const scene = chapter.scenes[note % Math.max(1, chapter.scenes.length)];
			const frame = fieldFrames[note % fieldFrames.length];
			const practice = fieldPractices[note % fieldPractices.length];
			paras.push(
				`### Field note ${note + 1} — ${scene?.title ?? chapter.purpose}\n\n` +
					`${frame} ${scene?.summary ?? chapter.summary} The useful question is not “who is responsible?” but “who can say yes, and what would they need to see?”\n\n` +
					`${practice} Write down what happened, including the part that made the room uncomfortable. The discomfort is usually where the real constraint lives.\n\n` +
					`A second team tried the same change and got a different result. The difference was not talent or tooling. It was that one team had a named decision-maker who could change the schedule, and the other had a steering committee.`
			);
			note++;
		}

		return paras.join('\n\n');
	}

	const paragraphs: string[] = [];
	const opening = fill(pick(rng, OPENERS), { name });
	paragraphs.push(
		`# ${chapter.title}\n\n${opening} ${pick(rng, WEATHER)} It was the hour when ${place} belonged to the people who could not sleep, and ${name} had long ago stopped pretending to be one of them.`
	);

	paragraphs.push(
		`${fill(pick(rng, INTERIORITY), { name })} ${chapter.scenes[0]?.summary ?? ''} The task was ordinary. That was the point. Ordinary tasks were how ${name} kept the larger questions at a distance, the way a person might keep a lamp on in a room they did not intend to enter.`
	);

	paragraphs.push(
		`${other} found her in the second aisle, holding a box that had no business being there. ${fill(pick(rng, DIALOGUE_A), { other })} ${fill(pick(rng, DIALOGUE_B), { name })} ${other} looked at the box, then at the door, then at the box again. The order in which people look at things tells you what they are afraid of.`
	);

	paragraphs.push(
		`They worked in silence for a while, which was its own kind of conversation. ${chapter.scenes[1]?.summary ?? ''} ${pick(rng, WEATHER)} ${name} thought about the difference between a mistake and a decision, and about how often the difference was simply whether anyone had been willing to write it down.`
	);

	const discovery = pick(rng, DISCOVERY);
	paragraphs.push(
		`${discovery}\n\nChapter ${chapter.number} had been described in the outline as “${chapter.purpose}” ${name} had believed that was a description of plot. Standing there with the page in her hand, she understood it was a description of her.`
	);

	paragraphs.push(
		`${fill(pick(rng, DIALOGUE_A), { other })}\n\n${fill(pick(rng, DIALOGUE_B), { name })}\n\nThey stood on opposite sides of the box. It was a small object, barely the size of a shoebox, and it had the gravity of a thing that had been waited for. ${pick(rng, WEATHER)}`
	);

	paragraphs.push(
		`${fill(pick(rng, COST), { name })} ${chapter.scenes[2]?.summary ?? ''} She could feel the shape of the next decision, the way you can feel a step in the dark before you take it.`
	);

	paragraphs.push(
		`Later, when the building had emptied and the lights had gone down to the ones that stayed on all night, ${name} made a list. The list had four items. Two of them were things she could do. The other two were things she would have to become.`
	);

	paragraphs.push(`${fill(pick(rng, CLOSERS), { name, other })}`);

	// A full-length chapter is built from repeated scene movements, each one
	// re-entering the same pressure through a different object and hour.
	const target = chapter.targetWords || 2400;
	let movement = 0;
	while (countWords(paragraphs.join('\n\n')) < target * 0.94 && movement < 26) {
		const scene = chapter.scenes[movement % Math.max(1, chapter.scenes.length)];
		const clock = LONGFORM_CLOCKS[movement % LONGFORM_CLOCKS.length];
		const object = LONGFORM_OBJECTS[movement % LONGFORM_OBJECTS.length];
		const transition = LONGFORM_TRANSITIONS[movement % LONGFORM_TRANSITIONS.length];
		const action = LONGFORM_ACTIONS[movement % LONGFORM_ACTIONS.length];
		const otherName = names[(movement + 1) % Math.max(1, names.length)] ?? other;
		const vars = { name, other: otherName, object, clock, place };

		paragraphs.push('***');
		paragraphs.push(`${transition} ${pick(rng, WEATHER)} ${scene?.summary ?? chapter.summary}`);
		paragraphs.push(`${fill(action, vars)} ${fill(pick(rng, INTERIORITY), vars)}`);
		paragraphs.push(
			`${fill(pick(rng, DIALOGUE_A), vars)} ${fill(pick(rng, DIALOGUE_B), vars)} ` +
				`They let the exchange sit there. In the archive, an unanswered question was still a kind of record.`
		);
		paragraphs.push(
			`${fill(pick(rng, DISCOVERY), vars)} ${fill(pick(rng, COST), vars)} ` +
				`At ${clock}, the work was no longer theoretical.`
		);
		movement++;
	}

	return paragraphs.join('\n\n');
}

/* ------------------------------------------------------------------ */
/* Research, craft, cover                                              */
/* ------------------------------------------------------------------ */

const COMPS = [
	{ title: 'The Memory Police', author: 'Yoko Ogawa', price: 16.0, rating: 4.3, reviews: 4820, rank: 1240, angle: 'Literary dystopia with an intimate, bureaucratic texture.' },
	{ title: 'The Friend', author: 'Sigrid Nunez', price: 15.0, rating: 4.2, reviews: 6310, rank: 2100, angle: 'Grief, animals, and the ethics of companionship.' },
	{ title: 'The Passenger', author: 'Cormac McCarthy', price: 18.0, rating: 4.1, reviews: 3890, rank: 980, angle: 'Male interiority and institutional secrecy.' },
	{ title: 'Small Things Like These', author: 'Claire Keegan', price: 14.0, rating: 4.5, reviews: 9120, rank: 420, angle: 'Short, morally exact, commercially durable.' },
	{ title: 'Trust', author: 'Hernan Diaz', price: 17.0, rating: 4.0, reviews: 5410, rank: 1560, angle: 'Competing documents and the construction of truth.' },
	{ title: 'The Bee Sting', author: 'Paul Murray', price: 19.0, rating: 4.4, reviews: 7280, rank: 640, angle: 'Family systems under economic pressure.' }
];

const KEYWORD_BANK = [
	'literary mystery',
	'archive novel',
	'quiet thriller',
	'book club fiction',
	'morally complex novel',
	'family secrets',
	'small town literary fiction',
	'memory and identity',
	'workplace fiction',
	'literary suspense',
	'character-driven mystery',
	'book about grief'
];

export function generateResearch(book: Book): MarketResearch {
	const rng = mulberry32(hashString(book.title + 'research'));
	const keywords = pickMany(rng, KEYWORD_BANK, 8).map((keyword) => {
		const volume = int(rng, 900, 24000);
		const difficulty = int(rng, 18, 78);
		return {
			keyword,
			volume,
			difficulty,
			intent: (difficulty < 35 ? 'commercial' : keyword.split(' ').length > 2 ? 'long-tail' : 'informational') as
				| 'commercial'
				| 'informational'
				| 'long-tail',
			opportunity: Math.round(((100 - difficulty) * volume) / 24000 + 20)
		};
	});
	const comps = pickMany(rng, COMPS, 5).map((c) => ({
		...c,
		price: Number((c.price + (rng() - 0.5) * 2).toFixed(2)),
		rating: Number((c.rating + (rng() - 0.5) * 0.2).toFixed(1))
	}));
	const demandScore = int(rng, 68, 92);
	const competitionScore = int(rng, 38, 74);

	return {
		demandScore,
		competitionScore,
		priceMin: 9.99,
		priceMax: 18.99,
		suggestedPrice: 14.99,
		keywords,
		comps,
		audienceInsight:
			'The strongest buying signal is not genre label but emotional promise: readers want a book they can finish in two sittings and argue about at book club. The cover and subtitle should signal moral tension rather than puzzle-solving.',
		positioning: `Position ${book.title} between upmarket book-club fiction and literary suspense. Lead with voice, not plot; the discovery is the engine, not the pitch.`,
		costEstimate: [
			{ label: 'Drafting (12 chapters)', value: 18.4 },
			{ label: 'Editorial passes', value: 7.2 },
			{ label: 'Continuity + fact checks', value: 2.9 },
			{ label: 'Cover concepts', value: 1.8 },
			{ label: 'Export + QA', value: 0.6 }
		],
		channels: [
			{ name: 'Amazon KDP', fit: 94, note: 'Primary ebook + paperback; category placement matters more than ad spend at launch.' },
			{ name: 'Apple Books', fit: 78, note: 'Strong for literary fiction; enhance with a sample-first campaign.' },
			{ name: 'Kobo Plus', fit: 71, note: 'Subscription read-through; good for series discovery.' },
			{ name: 'IngramSpark', fit: 66, note: 'Library and bookstore distribution for print.' },
			{ name: 'Direct / Gumroad', fit: 52, note: 'Author-brand bundle with the workbook and audio sample.' }
		],
		updatedAt: new Date().toISOString()
	};
}

export function analyzeCraft(book: Book): CraftReport {
	const rng = mulberry32(hashString(book.id + 'craft'));
	const chapters = book.chapters.length
		? book.chapters
		: [{ title: 'Chapter 1', number: 1, scenes: [], content: '', wordCount: 0 } as unknown as Chapter];
	const pacing = chapters.slice(0, 12).map((c) => {
		const tension = Math.min(98, 42 + ((c.number * 13) % 48) + int(rng, -8, 8));
		return {
			chapter: `Ch ${c.number}`,
			tension,
			note:
				tension > 78
					? 'High pressure; verify the scene ends on a cost, not a cliffhanger.'
					: tension < 52
						? 'Reflective beat. Ensure a concrete want drives the scene.'
						: 'Balanced. Watch for repeated emotional register with neighbors.'
		};
	});
	const sceneCircuits = chapters.slice(0, 12).map((c) => {
		const total = Math.max(1, c.scenes?.length ?? 3);
		return { chapter: `Ch ${c.number}`, complete: Math.max(0, total - (c.number % 3 === 0 ? 1 : 0)), total };
	});
	return {
		aiismScore: int(rng, 84, 97),
		readability: int(rng, 58, 72),
		pacing,
		sceneCircuits,
		continuity: [
			{ severity: 'medium', message: 'Elias’s tenure is stated as eight years in Ch 2 and seven in Ch 7.', where: 'Ch 2, Ch 7' },
			{ severity: 'low', message: 'The river path is described as north of the archive twice; once as south.', where: 'Ch 4' },
			{ severity: 'high', message: 'A document quoted in Ch 9 has not yet been introduced in the timeline.', where: 'Ch 9', },
			{ severity: 'low', message: 'Repeated “small, specific” construction in Ch 3 and Ch 6.', where: 'Prose' }
		],
		protocols: [
			{ id: 'fractal', name: 'Fractal Scene Architecture', enabled: true, note: 'Every scene must complete a circuit of change.' },
			{ id: 'character', name: 'Character Hierarchy', enabled: true, note: 'Tier-one oxygen budget: 62% of page time.' },
			{ id: 'aiism', name: 'AI-ism Suppression', enabled: true, note: 'Word-level sweep; structural lists suspended for nonfiction.' },
			{ id: 'gradient', name: 'Semantic Gradient', enabled: true, note: 'Flag uncommitted word choices in revision.' },
			{ id: 'yorke', name: 'Yorke Dramatic Architecture', enabled: true, note: 'Five-act fracture check at act and chapter level.' },
			{ id: 'auditor', name: 'Narrative Consistency Auditor', enabled: true, note: 'Reads canon + narrative graph before every chapter.' }
		],
		genreRouting: [
			{ protocol: 'Scene circuits', applies: 'core' },
			{ protocol: 'Yorke five-act', applies: 'core' },
			{ protocol: 'Prose suppression', applies: 'core' },
			{ protocol: 'Semantic gradient', applies: 'core' },
			{ protocol: 'Consistency auditor', applies: 'core' }
		],
		updatedAt: new Date().toISOString()
	};
}

const PALETTES: CoverDesign['palette'][] = ['midnight', 'parchment', 'forest', 'oxide', 'violet', 'bone'];
const MOTIFS: CoverDesign['motif'][] = ['rings', 'arch', 'waves', 'grid', 'botanical', 'constellation'];

export function generateCover(book: Pick<Book, 'title' | 'subtitle' | 'author' | 'genre'>, style?: Partial<CoverDesign>): CoverDesign {
	const rng = mulberry32(hashString(book.title + 'cover' + JSON.stringify(style ?? {})));
	return {
		palette: style?.palette ?? pick(rng, PALETTES),
		motif: style?.motif ?? pick(rng, MOTIFS),
		typography: style?.typography ?? pick(rng, ['editorial', 'modern', 'classic', 'brutalist'] as CoverDesign['typography'][]),
		tagline: style?.tagline ?? `A ${book.genre.toLowerCase()} about what the record leaves out`,
		backCopy:
			style?.backCopy ??
			`“${book.title} is a rare thing: a book about documents that reads like a thriller, and a thriller that keeps asking what we owe the people we have agreed to forget.”\n\nWhen a routine delivery arrives at the archive addressed to someone who no longer works there, ${book.author}’s narrator must decide whether to protect the institution that made her, or the truth it was built to contain.\n\nA novel about inheritance, complicity, and the quiet violence of an official account.`,
		spineText: style?.spineText ?? `${book.title} · ${book.author}`,
		imprint: style?.imprint ?? 'Scriptora Press',
		updatedAt: new Date().toISOString()
	};
}

/* ------------------------------------------------------------------ */
/* Defaults + derived values                                           */
/* ------------------------------------------------------------------ */

export function defaultConfig(): GenerationConfig {
	return {
		provider: 'Scriptora Engine',
		model: 'studio-prose-1',
		styleAnchor: 'Close third, concrete nouns, no thematic summary at chapter ends. Keep sentences varied; allow silence.',
		temperature: 0.7,
		autonomy: 'supervised',
		budgetCap: 120,
		protocols: ['fractal', 'character', 'aiism', 'gradient', 'yorke', 'auditor']
	};
}

export function recountBook(book: Book): Book {
	let words = 0;
	let progressSum = 0;
	for (const c of book.chapters) {
		const wc = countWords(c.content) || c.wordCount;
		c.wordCount = wc;
		words += wc;
		progressSum += c.status === 'approved' ? 1 : c.status === 'edited' ? 0.88 : c.status === 'drafted' ? 0.66 : c.status === 'drafting' ? 0.3 : 0;
	}
	book.wordCount = words;
	const chapterProgress = book.chapters.length ? (progressSum / book.chapters.length) * 100 : 0;
	const stageWeight: Record<Book['stage'], number> = {
		concept: 6,
		blueprint: 16,
		outline: 30,
		drafting: 62,
		editing: 78,
		design: 88,
		export: 94,
		published: 100
	};
	book.progress = Math.min(100, Math.round(stageWeight[book.stage] * 0.7 + chapterProgress * 0.3));
	book.quality = Math.max(
		40,
		Math.min(
			99,
			Math.round(
				72 +
					(chapterProgress / 100) * 14 +
					(book.craft?.aiismScore ? (book.craft.aiismScore - 85) * 0.2 : 0) -
					(book.craft?.continuity?.filter((c) => c.severity === 'high').length ?? 0) * 3
			)
		)
	);
	return book;
}

export const STAGES: { key: Book['stage']; label: string; hint: string }[] = [
	{ key: 'concept', label: 'Concept', hint: 'Premise, audience, promise' },
	{ key: 'blueprint', label: 'Blueprint', hint: 'Structure, characters, style' },
	{ key: 'outline', label: 'Outline', hint: 'Parts, chapters, scenes' },
	{ key: 'drafting', label: 'Drafting', hint: 'Chapter generation' },
	{ key: 'editing', label: 'Editing', hint: 'Editorial + continuity' },
	{ key: 'design', label: 'Design', hint: 'Cover + interior' },
	{ key: 'export', label: 'Export', hint: 'EPUB, PDF, print' },
	{ key: 'published', label: 'Published', hint: 'Live and selling' }
];
