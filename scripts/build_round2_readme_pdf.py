from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.platypus import (
    SimpleDocTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
    ListFlowable,
    ListItem,
    PageBreak,
)


OUT_DIR = Path("submission")
OUT_DIR.mkdir(exist_ok=True)
OUT_PATH = OUT_DIR / "Project_Zenith_Round2_README.pdf"


def para(text, style):
    return Paragraph(text.replace("&", "&amp;"), style)


def bullets(items, style):
    return ListFlowable(
        [ListItem(Paragraph(item.replace("&", "&amp;"), style), leftIndent=12) for item in items],
        bulletType="bullet",
        start="circle",
        leftIndent=18,
        bulletFontSize=7,
    )


def numbers(items, style):
    return ListFlowable(
        [ListItem(Paragraph(item.replace("&", "&amp;"), style), leftIndent=12) for item in items],
        bulletType="1",
        leftIndent=18,
    )


def code(lines, code_style):
    return Table(
        [[Paragraph("<br/>".join(line.replace("&", "&amp;") for line in lines), code_style)]],
        colWidths=[6.3 * inch],
        style=TableStyle([
            ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#F2F4F7")),
            ("BOX", (0, 0), (-1, -1), 0.5, colors.HexColor("#DADCE0")),
            ("LEFTPADDING", (0, 0), (-1, -1), 8),
            ("RIGHTPADDING", (0, 0), (-1, -1), 8),
            ("TOPPADDING", (0, 0), (-1, -1), 6),
            ("BOTTOMPADDING", (0, 0), (-1, -1), 6),
        ]),
    )


def table(data, widths):
    t = Table(data, colWidths=[w * inch for w in widths], repeatRows=1)
    t.setStyle(TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#E8EEF5")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.HexColor("#0B2545")),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8.5),
        ("GRID", (0, 0), (-1, -1), 0.35, colors.HexColor("#CBD5E1")),
        ("VALIGN", (0, 0), (-1, -1), "TOP"),
        ("LEFTPADDING", (0, 0), (-1, -1), 5),
        ("RIGHTPADDING", (0, 0), (-1, -1), 5),
        ("TOPPADDING", (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
    ]))
    return t


def footer(canvas, doc):
    canvas.saveState()
    canvas.setFont("Helvetica", 8)
    canvas.setFillColor(colors.HexColor("#6B7280"))
    canvas.drawRightString(7.5 * inch, 0.5 * inch, f"Project Zenith - Round 2 README | Page {doc.page}")
    canvas.restoreState()


def build():
    doc = SimpleDocTemplate(
        str(OUT_PATH),
        pagesize=letter,
        leftMargin=0.85 * inch,
        rightMargin=0.85 * inch,
        topMargin=0.75 * inch,
        bottomMargin=0.75 * inch,
    )

    styles = getSampleStyleSheet()
    title = ParagraphStyle("TitleZenith", parent=styles["Title"], fontName="Helvetica-Bold", fontSize=22,
                           leading=26, textColor=colors.HexColor("#0B2545"), alignment=TA_LEFT, spaceAfter=6)
    subtitle = ParagraphStyle("SubtitleZenith", parent=styles["BodyText"], fontName="Helvetica", fontSize=10.5,
                              leading=14, textColor=colors.HexColor("#555555"), spaceAfter=14)
    h1 = ParagraphStyle("H1", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=15,
                        leading=18, textColor=colors.HexColor("#2E74B5"), spaceBefore=14, spaceAfter=7)
    h2 = ParagraphStyle("H2", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=12,
                        leading=15, textColor=colors.HexColor("#1F4D78"), spaceBefore=10, spaceAfter=5)
    body = ParagraphStyle("Body", parent=styles["BodyText"], fontName="Helvetica", fontSize=9.8,
                          leading=13, spaceAfter=6)
    small = ParagraphStyle("Small", parent=body, fontSize=8.5, leading=11)
    code_style = ParagraphStyle("Code", parent=styles["Code"], fontName="Courier", fontSize=8.2, leading=10)

    story = [
        Paragraph("Project Zenith - Round 2 README", title),
        Paragraph("AI-powered sky digital twin with CesiumJS visualization, live celestial data, satellite pass predictions, and a Gemini-grounded cosmic narrator.", subtitle),
        table([
            ["Project", "Project Zenith"],
            ["Stack", "Next.js, Node.js, Express, CesiumJS, LangChain, ChromaDB, Gemini 2.5 Flash"],
            ["Mode support", "Live provider mode plus demo fixture fallback for reliable presentations"],
        ], [1.45, 4.85]),
        Spacer(1, 10),
        Paragraph("Installation and Setup Instructions", h1),
        Paragraph("Clone the repository and install dependencies from the repository root:", body),
        code(["git clone <your-repository-url>", "cd zenith", "npm.cmd install"], code_style),
        Spacer(1, 6),
        Paragraph("Create environment files:", body),
        code(["Copy-Item backend\\.env.example backend\\.env", "Copy-Item frontend\\.env.example frontend\\.env.local"], code_style),
        Spacer(1, 6),
        Paragraph("Add environment variables, then seed and run:", body),
        code(["npm.cmd run seed -w backend", "npm.cmd run dev", "Frontend: http://localhost:3000", "Backend health: http://localhost:4000/health", "Demo mode: http://localhost:3000/?demo=1"], code_style),
        Spacer(1, 8),
        table([
            ["Variable", "Where", "Notes"],
            ["NEXT_PUBLIC_API_URL", "frontend", "Backend URL locally or deployed Render URL."],
            ["NEXT_PUBLIC_CESIUM_ION_TOKEN", "frontend", "Optional Cesium ion token for hosted terrain/imagery."],
            ["GEMINI_API_KEY", "backend", "Required for live Gemini narrator responses."],
            ["OPENWEATHER_API_KEY", "backend", "Optional live observing conditions provider."],
            ["CHROMA_API_KEY / CHROMA_URL", "backend", "Optional Chroma Cloud or local Chroma connection."],
            ["FRONTEND_ORIGIN", "backend", "Allowed CORS origin for deployed frontend."],
        ], [2.0, 1.0, 3.3]),
        Paragraph("Website Functionality and Unique Features", h1),
        Paragraph("Project Zenith turns the current sky above an observer into an interactive digital twin. Users can explore celestial objects, ask natural-language questions, view pass predictions, and switch between live data and reliable demo fixtures.", body),
        bullets([
            "Interactive CesiumJS sky visualization with planets, Moon, stars, ISS, satellites, paths, and labels.",
            "Mission-control UI with top command bar, left tool rail, bottom context tray, and compact narrator pill.",
            "Live sky-state API combining observer location, time, planetary data, bright stars, ISS, and satellites.",
            "Search and navigation for Saturn, ISS, Vega, Moon, and visible satellites.",
            "Gemini-grounded Cosmic Narrator using sky-state and Chroma knowledge retrieval context.",
            "Satellite pass predictions powered by CelesTrak TLE data and satellite.js propagation.",
            "Sky events for meteor showers, eclipses, visibility windows, and conjunctions.",
            "ISS live video, observing conditions, share links, snapshot support, and provenance labels.",
            "Demo mode fallback for reliable presentations if external APIs are unavailable.",
        ], small),
        Paragraph("What Makes It Stand Out", h2),
        bullets([
            "Combines orbital mechanics, AI narration, and 3D visualization in one product.",
            "Narrator responses are grounded by the current sky-state instead of generic astronomy copy.",
            "The interface is demo-ready: major tools are one click away and do not require dashboard scrolling.",
            "Live/demo separation keeps the project resilient during judging while preserving real provider support.",
        ], small),
        PageBreak(),
        Paragraph("Dependencies", h1),
        Paragraph("The project uses an npm workspace with separate frontend and backend packages. Node.js 20 or later is recommended.", body),
        table([
            ["Area", "Dependency", "Purpose"],
            ["Runtime", "Node.js 20+", "Runs the Next.js frontend and Express backend."],
            ["Frontend", "Next.js, React", "Application shell, panels, routing, and client UI."],
            ["Visualization", "CesiumJS", "Interactive sky/globe rendering and object/entity display."],
            ["Backend", "Express, Zod", "HTTP APIs, validation, and typed contracts."],
            ["AI", "Gemini 2.5 Flash, LangChain", "Grounded narrator and intent handling."],
            ["Knowledge", "ChromaDB", "Semantic retrieval for astronomy/cultural reference context."],
            ["Orbital data", "satellite.js, CelesTrak", "TLE propagation and satellite/ISS pass prediction."],
            ["Weather", "OpenWeather API", "Live observing conditions."],
        ], [1.25, 1.85, 3.2]),
        Paragraph("Project Structure", h1),
        code([
            "backend/   Node.js + Express APIs, Gemini narration, Chroma retrieval, sky-state services",
            "frontend/  Next.js UI, Cesium scene, panels, narrator, search, demo/live controls",
            "data/      Demo fixtures and astronomy/cultural datasets",
            "docs/      Runbooks, demo scripts, smoke checklists, project notes",
            "scripts/   Validation, doctor, and helper scripts",
        ], code_style),
        Paragraph("Deployment Notes", h1),
        numbers([
            "Deploy backend as a Node web service on Render with build command npm install && npm run build -w backend.",
            "Use start command npm run start -w backend and health check path /health.",
            "Deploy frontend on Vercel or Render with NEXT_PUBLIC_API_URL pointing to the Render backend URL.",
            "Set FRONTEND_ORIGIN on the backend to the exact frontend URL for CORS.",
            "Redeploy frontend after changing NEXT_PUBLIC environment variables.",
        ], small),
        Paragraph("Quick Verification Checklist", h1),
        bullets([
            "Frontend loads without a blank screen.",
            "Globe and sky objects render.",
            "Search finds Saturn and ISS.",
            "Sky, Events, Passes, ISS, Layers, Data, and Save panels open.",
            "Narrator opens from the Ask Zenith pill and answers a question.",
            "Backend /health returns status ok.",
            "Demo mode works at /?demo=1.",
        ], small),
        Paragraph("Conclusion", h1),
        Paragraph("Project Zenith is a complete AI-powered astronomy experience: a live sky digital twin, an orbital-data backend, and a grounded narrator wrapped in a polished mission-control interface. The system uses live APIs for realism and demo fixtures for reliable judging.", body),
    ]

    doc.build(story, onFirstPage=footer, onLaterPages=footer)
    print(OUT_PATH)


if __name__ == "__main__":
    build()
