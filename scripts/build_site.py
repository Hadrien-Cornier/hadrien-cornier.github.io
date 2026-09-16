"""Build the static profile from resume/profile.md. No third-party dependencies."""
from pathlib import Path
import html
import re

ROOT = Path(__file__).resolve().parents[1]
source = (ROOT / 'resume/profile.md').read_text()
def esc(text):
    return html.escape(text)
def inline(text):
    return re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', esc(text))
def paragraphs(text):
    return ''.join('<p>' + esc(p.strip()) + '</p>' for p in text.strip().split('\n\n') if p.strip())
management = paragraphs((ROOT / 'content/management.md').read_text())
notes_source = (ROOT / 'content/notes.md').read_text()
notes = re.findall(r'^## ([^\n]+)\n\n(.*?)(?=^## |\Z)', notes_source, re.S | re.M)
if not notes:
    raise ValueError('Expected notes under level-two headings in content/notes.md.')
note_ids = [re.sub(r'[^a-z0-9]+', '-', title.lower()).strip('-') for title, _ in notes]
if len(set(note_ids)) != len(note_ids):
    raise ValueError('Note titles must produce unique section IDs.')
notes_nav = ''.join(f'<a href="#{ident}">{esc(title)}</a>' for ident, (title, _) in zip(note_ids, notes))
notes_html = ''.join(f'<article class="note" id="{ident}" aria-labelledby="{ident}-title"><h2 id="{ident}-title">{esc(title)}</h2>{paragraphs(body)}</article>' for ident, (title, body) in zip(note_ids, notes))
intro = source.split('\n\n')[2]
chapters = re.findall(r'#### (.*?)\n\n(.*?)(?=\n#### |\nMentored)', source, re.S)
ids = ['data-platform', 'production-ml', 'ai-tooling', 'commercial']
labels = ['Data platforms', 'Production ML', 'AI tooling', 'Commercial & operations']
if len(chapters) != len(ids):
    raise ValueError('Expected four Talroo work areas; update section IDs and navigation for structural changes.')
chapter_html = ''
for i, ((title, content), ident) in enumerate(zip(chapters, ids), 1):
    bullets = re.findall(r'^- (.*)', content, re.M)
    visible_count = 2 if ident in ('data-platform', 'ai-tooling') else 1
    chapter_html += f'''<section class="chapter" id="{ident}" aria-labelledby="{ident}-title">
    <div class="chapter-number">0{i}</div><div><h3 id="{ident}-title">{esc(title)}</h3>
    {''.join('<p class="lead">'+esc(b)+'</p>' for b in bullets[:visible_count])}
    <details><summary>Explore this work <span aria-hidden="true">+</span></summary><ul>{''.join('<li>'+esc(b)+'</li>' for b in bullets[visible_count:])}</ul></details></div></section>'''
earlier = source.split('### Augustus Intelligence')[1].split('## Education')[0]
earlier = '### Augustus Intelligence' + earlier
career = ''
for title, body in re.findall(r'### (.*?)\n\n(.*?)(?=\n### |\Z)', earlier, re.S):
    company, info = title.split(' · ', 1)
    location, dates = info.split(' | ')
    lines = body.strip().split('\n\n')
    bullets = re.findall(r'^- (.*)', body, re.M)
    career += f'<article class="career-row"><div class="meta">{esc(dates)}<br>{esc(location)}</div><div><h3>{esc(company)}</h3><p class="role">{inline(lines[0])}</p>'+''.join('<p>'+esc(b)+'</p>' for b in bullets)+'</div></article>'
education = ''
for name, location, dates, degree in re.findall(r'\*\*(.*?)\*\* · (.*?) \| (.*?)\n([^\n]+)', source.split('## Education')[1].split('## Skills')[0]):
    upcoming = 'Upcoming' in dates
    education += f'<article class="education-item"><p class="meta">{esc(dates)}'+('</p>' if not upcoming else ' <span class="badge">Upcoming</span></p>')+f'<h3>{esc(name)}</h3><p>{esc(degree)}</p><p class="meta">{esc(location)}</p></article>'
education = education.replace('Jan 2027 (Upcoming)', 'Jan 2027')
skills = source.split('## Skills')[1].strip().split(' · ')
nav = ''.join(f'<a href="#{ident}"><span>0{i}</span>{label}</a>' for i,(ident,label) in enumerate(zip(ids,labels),1))
page = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Hadrien Cornier | Engineering, ML & Data</title>
<meta name="description" content="Hadrien Cornier, engineering manager and hands-on ML/data engineer in Austin. Data platforms, production ML, AI tooling, and commercial operations.">
<link rel="canonical" href="https://hadrien-cornier.github.io/">
<meta property="og:title" content="Hadrien Cornier | Engineering, ML & Data"><meta property="og:description" content="Engineering manager and hands-on ML/data engineer. Based in Austin, Texas."><meta property="og:type" content="website"><meta property="og:url" content="https://hadrien-cornier.github.io/">
<meta name="theme-color" content="#f6f5f0"><link rel="stylesheet" href="assets/site.css"><script src="assets/site.js" defer></script>
</head><body><a class="skip" href="#main">Skip to content</a>
<header class="topbar"><a class="wordmark" href="#">HC<span>.</span></a><nav aria-label="Main navigation"><a href="#experience">Experience</a><a href="#management">Management</a><a href="#education">Education</a><a href="notes.html">Notes</a></nav><a class="resume-link" href="out/resume.pdf" download="Hadrien_Cornier_Resume.pdf">Resume PDF <span aria-hidden="true">↗</span></a></header>
<main id="main"><section class="hero" aria-labelledby="name"><div class="hero-top"><p class="eyebrow"><span class="dot"></span>Austin, Texas</p><p class="eyebrow">Engineering · Machine learning · Data</p></div><h1 id="name">Hadrien Cornier<span>.</span></h1><div class="hero-bottom"><h2>Engineering Manager<br><span class="hero-company">Talroo</span></h2><div><p class="intro">{esc(intro)}</p><div class="contact"><a href="mailto:hadrien.cornier@gmail.com">Get in touch <span aria-hidden="true">↗</span></a><a href="https://linkedin.com/in/hadrien-cornier">LinkedIn <span aria-hidden="true">↗</span></a></div></div></div></section>
<div class="work-layout" id="experience"><aside><h2>Experience</h2><nav aria-label="Areas of work">{nav}<a href="#earlier"><span>05</span>Earlier experience</a></nav></aside><div class="work"><div class="company-heading"><div><p class="eyebrow">Jul 2021–Present · Austin, TX</p><h2>Talroo</h2></div><button id="expand-all" type="button" hidden>Expand all details</button></div><p class="progression">Engineering Manager <span>2025–present</span><br>Senior ML Engineer <span>2022–2025</span><br>ML Engineer <span>2021–2022</span></p>{chapter_html}<p class="mentorship">{esc(re.search(r'Mentored.*',source).group())}</p></div></div>
<section class="section" id="management" aria-labelledby="management-title"><div class="section-title"><h2 id="management-title">Management philosophy</h2></div><div class="prose">{management}<a class="notes-link" href="notes.html">More notes on engineering and business <span aria-hidden="true">↗</span></a></div></section>
<section class="earlier section" id="earlier"><div class="section-title"><p class="eyebrow">Before Talroo</p><h2>Earlier experience</h2></div><div>{career}</div></section>
<section class="section" id="education"><div class="section-title"><h2>Education</h2></div><div class="education-grid">{education}</div></section>
<section class="section" id="skills"><div class="section-title"><p class="eyebrow">Tools & practice</p><h2>Skills</h2></div><ul class="skills">{''.join('<li>'+esc(skill)+'</li>' for skill in skills)}</ul></section>
<footer><p>Hadrien Cornier<span>Austin, Texas</span></p><a href="mailto:hadrien.cornier@gmail.com">hadrien.cornier@gmail.com ↗</a><a href="#">Back to top ↑</a></footer></main></body></html>'''
(ROOT / 'index.html').write_text(page)

notes_page = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>Notes | Hadrien Cornier</title><meta name="description" content="Short notes by Hadrien Cornier on engineering, hiring, product strategy, and advertising.">
<link rel="canonical" href="https://hadrien-cornier.github.io/notes.html"><meta name="theme-color" content="#f6f5f0">
<meta property="og:title" content="Notes | Hadrien Cornier"><meta property="og:description" content="Thoughts on engineering and business."><meta property="og:type" content="website"><meta property="og:url" content="https://hadrien-cornier.github.io/notes.html">
<link rel="stylesheet" href="assets/site.css"></head><body><a class="skip" href="#main">Skip to content</a>
<header class="topbar"><a class="wordmark" href="index.html" aria-label="Hadrien Cornier home">HC<span>.</span></a><nav aria-label="Main navigation"><a href="index.html#experience">Experience</a><a href="index.html#management">Management</a><a href="index.html#education">Education</a><a href="notes.html" aria-current="page">Notes</a></nav><a class="resume-link" href="out/resume.pdf" download="Hadrien_Cornier_Resume.pdf">Resume PDF <span aria-hidden="true">↗</span></a></header>
<main id="main"><header class="notes-header"><p class="eyebrow">Hadrien Cornier</p><h1>Notes<span>.</span></h1><p>Thoughts on engineering and business.</p></header>
<div class="notes-layout"><nav class="notes-nav" aria-label="Notes">{notes_nav}<a class="profile-link" href="index.html">← Back to profile</a></nav><div class="notes-content">{notes_html}</div></div>
<footer><p>Hadrien Cornier<span>Austin, Texas</span></p><a href="mailto:hadrien.cornier@gmail.com">hadrien.cornier@gmail.com ↗</a><a href="#main">Back to top ↑</a></footer></main></body></html>'''
(ROOT / 'notes.html').write_text(notes_page)
