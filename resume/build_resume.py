"""Build the one-page resume PDF from resume.md."""

from html import escape
from pathlib import Path
import re

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle
from reportlab.lib.units import mm
from reportlab.platypus import BaseDocTemplate, Frame, HRFlowable, PageTemplate, Paragraph, Spacer


ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT / "resume" / "resume.md"
OUTPUT = ROOT / "out" / "resume.pdf"
TEXT = colors.HexColor("#1f2923")
MUTED = colors.HexColor("#536158")
ACCENT = colors.HexColor("#456b55")
RULE = colors.HexColor("#cfd6d0")


def inline(text: str) -> str:
    value = escape(text)
    value = re.sub(r"\*\*(.+?)\*\*", r"<b>\1</b>", value)
    value = re.sub(
        r"\[(.+?)\]\((.+?)\)",
        lambda match: f'<link href="{match.group(2)}" color="#456b55">{match.group(1)}</link>',
        value,
    )
    return value


def separated(text: str) -> str:
    return inline(text).replace(" | ", "&#160; | &#160;")


def parse() -> dict:
    source = SOURCE.read_text()
    title = re.search(r"^# (.+)$", source, re.M).group(1)
    contact = source.split("\n\n", 2)[1]
    sections = {
        heading: body.strip()
        for heading, body in re.findall(r"^## (.+?)\n\n(.*?)(?=^## |\Z)", source, re.M | re.S)
    }
    return {"title": title, "contact": contact, "sections": sections}


def section_heading(label: str, styles: dict) -> list:
    return [
        Spacer(1, 2.2 * mm),
        Paragraph(label.upper(), styles["section"]),
        Spacer(1, 0.45 * mm),
        HRFlowable(width="100%", thickness=0.6, color=RULE),
        Spacer(1, 1.1 * mm),
    ]


def build() -> None:
    data = parse()
    styles = {
        "name": ParagraphStyle(
            "Name", fontName="Helvetica-Bold", fontSize=20, leading=22,
            textColor=TEXT, alignment=TA_CENTER, spaceAfter=2,
        ),
        "contact": ParagraphStyle(
            "Contact", fontName="Helvetica", fontSize=9, leading=11,
            textColor=MUTED, alignment=TA_CENTER,
        ),
        "section": ParagraphStyle(
            "Section", fontName="Helvetica-Bold", fontSize=8.6, leading=10,
            textColor=ACCENT, tracking=1.1,
        ),
        "body": ParagraphStyle(
            "Body", fontName="Helvetica", fontSize=9.1, leading=11.4,
            textColor=TEXT,
        ),
        "company": ParagraphStyle(
            "Company", fontName="Helvetica-Bold", fontSize=10.1, leading=12,
            textColor=TEXT, spaceBefore=1.8, spaceAfter=0.9,
        ),
        "roles": ParagraphStyle(
            "Roles", fontName="Helvetica", fontSize=8.4, leading=10.2,
            textColor=MUTED, spaceAfter=0.8,
        ),
        "bullet": ParagraphStyle(
            "Bullet", fontName="Helvetica", fontSize=8.45, leading=10.55,
            textColor=TEXT, leftIndent=3.2 * mm, firstLineIndent=-2.3 * mm,
            bulletIndent=0.4 * mm, spaceAfter=0.8,
        ),
        "education": ParagraphStyle(
            "Education", fontName="Helvetica", fontSize=8.5, leading=10.4,
            textColor=TEXT, spaceAfter=0.6,
        ),
        "skills": ParagraphStyle(
            "Skills", fontName="Helvetica", fontSize=8.5, leading=10.6,
            textColor=TEXT,
        ),
    }

    doc = BaseDocTemplate(
        str(OUTPUT), pagesize=A4,
        leftMargin=14 * mm, rightMargin=14 * mm,
        topMargin=16 * mm, bottomMargin=12 * mm,
        title="Hadrien Cornier Resume", author="Hadrien Cornier",
        subject="Engineering management, data systems, and production machine learning",
    )
    frame = Frame(doc.leftMargin, doc.bottomMargin, doc.width, doc.height, id="resume")
    doc.addPageTemplates(PageTemplate(id="one-page", frames=[frame]))

    story = [
        Paragraph(inline(data["title"]), styles["name"]),
        Paragraph(separated(data["contact"]), styles["contact"]),
    ]
    story.extend(section_heading("Summary", styles))
    story.append(Paragraph(inline(data["sections"]["Summary"]), styles["body"]))
    story.extend(section_heading("Experience", styles))

    experience = data["sections"]["Experience"]
    jobs = re.findall(r"^### (.+?)\n\n(.*?)(?=^### |\Z)", experience, re.M | re.S)
    for heading, body in jobs:
        company, location, dates = [part.strip() for part in heading.split(" | ")]
        story.append(
            Paragraph(
                f"{inline(company)} <font name='Helvetica' color='#536158'>| {inline(location)} | {inline(dates)}</font>",
                styles["company"],
            )
        )
        blocks = body.split("\n\n")
        story.append(Paragraph(separated(blocks[0]), styles["roles"]))
        for bullet in re.findall(r"^- (.+)$", body, re.M):
            story.append(Paragraph(inline(bullet), styles["bullet"], bulletText="•"))

    story.extend(section_heading("Education", styles))
    for item in re.findall(r"^- (.+)$", data["sections"]["Education"], re.M):
        school, details, dates = [part.strip() for part in item.split(" | ")]
        story.append(
            Paragraph(
                f"{inline(school)} <font color='#536158'>| {inline(details)} | {inline(dates)}</font>",
                styles["education"],
            )
        )

    story.extend(section_heading("Skills", styles))
    story.append(Paragraph(separated(data["sections"]["Skills"]), styles["skills"]))

    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc.build(story)


if __name__ == "__main__":
    build()
