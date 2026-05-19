---
name: human-writing
description: Remove signs of AI-generated writing. Use when editing markdown, technical docs, emails, blog posts, PRDs, or any writing. Detects and fixes: inflated symbolism, promotional language, superficial -ing analyses, vague attributions, em dash overuse, rule of three, AI vocabulary words, negative parallelisms, excessive conjunctive phrases. Based on Wikipedia's "Signs of AI writing" guide.
---
# Humanizing text

Remove AI patterns so writing sounds like a person wrote it. Based on [Wikipedia's Signs of AI writing](https://en.wikipedia.org/wiki/Wikipedia:Signs_of_AI_writing).

## Voice matters

Avoiding AI patterns is only half the job. Sterile, voiceless writing is just as obvious. Signs of soulless writing: every sentence same length/structure, no opinions, no uncertainty, no first-person, no humor, reads like a press release.

Add voice: have opinions, vary rhythm, acknowledge complexity, use "I" when it fits, let mess in, be specific about feelings.

## Content patterns to fix

**Inflated significance**: "serves as," "is a testament," "pivotal moment," "underscores its importance." → Just state facts.

**Undue notability**: "independent coverage," "national media outlets," "active social media presence." → Cite specific sources.

**Superficial -ing analyses**: "highlighting," "ensuring," "reflecting," "symbolizing," "showcasing." → Remove trailing participle phrases.

**Promotional language**: "boasts," "vibrant," "rich," "profound," "groundbreaking," "renowned," "breathtaking," "nestled in the heart of." → Use neutral language.

**Vague attributions**: "Industry reports," "Experts argue," "Some critics argue." → Cite specific sources.

**Formulaic challenges sections**: "Despite its... faces several challenges." → Describe actual problems specifically.

## Language patterns to fix

**AI vocabulary**: additionally, align with, crucial, delve, emphasizing, enduring, enhance, fostering, garner, highlight, interplay, intricate, landscape (abstract), pivotal, showcase, tapestry (abstract), testament, underscore, valuable, vibrant. → Use plain alternatives.

**Copula avoidance**: "serves as," "stands as," "marks," "represents," "boasts," "features" → "is" or "has."

**Negative parallelisms**: "Not only...but..." or "It's not just about..., it's..." → Simplify.

**Rule of three**: LLMs force ideas into groups of three. → Don't force it.

**Synonym cycling**: AI avoids repeating words excessively. → Repeat words when natural.

**False ranges**: "from X to Y" where X/Y aren't on a meaningful scale. → Be concrete.

## Style patterns

**Em dash overuse**: Use commas or periods instead. One em dash per paragraph max.

**Boldface overuse**: Mechanical bolded-keyword emphasis. → Remove bold formatting.

**Inline-header lists**: Bolded headers + colons in list items. → Rewrite as prose.

**Title case in headings**: → Use sentence case.

**Emojis in professional content**: → Remove.

**Curly quotation marks**: → Use straight quotes.

## Communication artifacts

**Chatbot correspondence**: "I hope this helps," "Certainly!," "You're absolutely right!," "Would you like...", "let me know" → Strip from final content.

**Knowledge-cutoff disclaimers**: "As of [date]," "While specific details are limited..." → Remove.

**Sycophantic tone**: "Great question!," "That's an excellent point" → Be direct.

## Filler and hedging

Cut: "In order to" → "To", "Due to the fact that" → "Because", "At this point in time" → "Now", "The system has the ability to" → "The system can", "It is important to note that" → Remove.

Reduce excessive hedging. Make generic positive conclusions specific.

## Example

**Before**: "The new update serves as a testament to innovation. Moreover, it provides a seamless, intuitive experience—ensuring efficiency. It's not just an update, it's a revolution."

**After**: "The update adds batch processing, keyboard shortcuts, and offline mode. Early beta testers report faster task completion."

## Reference

Based on Wikipedia's "Signs of AI writing" page, maintained by WikiProject AI Cleanup. Key insight: LLMs produce the statistically most likely result; human writing has variance, opinions, and personality.
