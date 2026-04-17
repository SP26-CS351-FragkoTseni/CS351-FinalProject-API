"""
Build docs/Student-Guide-API-React-Angular.pdf from the Markdown source.
Requires: pip install fpdf2
"""
from __future__ import annotations

import re
import sys
from pathlib import Path

try:
    from fpdf import FPDF
    from fpdf.enums import WrapMode
except ImportError:
    print("Install fpdf2: pip install fpdf2", file=sys.stderr)
    sys.exit(1)


def ascii_safe(s: str) -> str:
    return (
        s.replace("\u2014", "-")
        .replace("\u2013", "-")
        .replace("\u2018", "'")
        .replace("\u2019", "'")
        .replace("\u201c", '"')
        .replace("\u201d", '"')
        .replace("\u2026", "...")
        .replace("\u2192", "->")
    )


class GuidePDF(FPDF):
    def footer(self) -> None:
        self.set_y(-12)
        self.set_font("Helvetica", "I", 8)
        self.set_text_color(100, 100, 100)
        self.cell(0, 8, f"Page {self.page_no()}", align="C")


def main() -> None:
    root = Path(__file__).resolve().parent
    md_path = root / "Student-Guide-API-React-Angular.md"
    out_path = root / "Student-Guide-API-React-Angular.pdf"
    if not md_path.is_file():
        print(f"Missing {md_path}", file=sys.stderr)
        sys.exit(1)

    lines = md_path.read_text(encoding="utf-8").splitlines()
    pdf = GuidePDF(format="Letter")
    pdf.set_margins(18, 18, 18)
    pdf.set_auto_page_break(auto=True, margin=16)
    pdf.add_page()
    in_code = False
    code_buf: list[str] = []

    def mc(text: str, h: float, font: tuple[str, str, float], color=(0, 0, 0)) -> None:
        family, style, size = font
        pdf.set_font(family, style, size)
        pdf.set_text_color(*color)
        pdf.set_x(pdf.l_margin)
        pdf.multi_cell(0, h, ascii_safe(text), wrapmode=WrapMode.CHAR)

    def flush_code() -> None:
        nonlocal code_buf
        if not code_buf:
            return
        mc("\n".join(code_buf), 4.2, ("Courier", "", 8.5), (30, 30, 30))
        pdf.ln(2)
        code_buf = []

    for raw in lines:
        line = raw.rstrip()
        if line.strip().startswith("```"):
            if in_code:
                flush_code()
                in_code = False
            else:
                in_code = True
            continue
        if in_code:
            code_buf.append(line)
            continue

        if line.strip() == "---":
            pdf.ln(3)
            pdf.set_draw_color(180, 180, 180)
            pdf.line(pdf.l_margin, pdf.get_y(), pdf.w - pdf.r_margin, pdf.get_y())
            pdf.ln(5)
            continue

        if line.startswith("# "):
            mc(line[2:].strip(), 8, ("Helvetica", "B", 16), (20, 40, 90))
            pdf.ln(2)
            continue
        if line.startswith("## "):
            mc(line[3:].strip(), 7, ("Helvetica", "B", 13), (30, 60, 120))
            pdf.ln(1.5)
            continue
        if line.startswith("### "):
            mc(line[4:].strip(), 6, ("Helvetica", "B", 11))
            pdf.ln(1)
            continue

        stripped = line.strip()
        # Markdown table separator
        if re.match(r"^\|[\s\-:|]+\|$", stripped):
            continue
        # Table row | a | b |
        if re.match(r"^\|.+\|$", stripped):
            mc(stripped, 5, ("Helvetica", "", 9))
            continue

        # Bullet
        m = re.match(r"^(\s*)-\s+(.*)$", line)
        if m:
            mc("  * " + m.group(2), 5.5, ("Helvetica", "", 10))
            continue

        # Numbered
        m = re.match(r"^(\s*)\d+\.\s+(.*)$", line)
        if m:
            mc(line.strip(), 5.5, ("Helvetica", "", 10))
            continue

        if not line.strip():
            pdf.ln(2)
            continue

        # Strip inline markdown ** and ` for body text
        body = line
        body = re.sub(r"\*\*(.+?)\*\*", r"\1", body)
        body = re.sub(r"`([^`]+)`", r"\1", body)
        mc(body, 5.5, ("Helvetica", "", 10))

    pdf.output(str(out_path))
    print(f"Wrote {out_path}")


if __name__ == "__main__":
    main()
