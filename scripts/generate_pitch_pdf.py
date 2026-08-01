from pathlib import Path

from reportlab.lib import colors
from reportlab.lib.enums import TA_CENTER
from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import mm
from reportlab.platypus import (
    BaseDocTemplate,
    Frame,
    PageTemplate,
    Paragraph,
    Spacer,
    Table,
    TableStyle,
)


ROOT = Path(__file__).resolve().parents[1]
OUTPUT = ROOT / "output" / "pdf" / "roteiro-pitch-partiu-quadra.pdf"


def draw_page(canvas, doc):
    width, height = A4
    canvas.saveState()
    canvas.setFillColor(colors.white)
    canvas.rect(0, 0, width, height, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#174C3C"))
    canvas.rect(0, height - 24 * mm, width, 24 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#F5B942"))
    canvas.circle(width - 18 * mm, height - 12 * mm, 5 * mm, fill=1, stroke=0)
    canvas.setFillColor(colors.HexColor("#6B7280"))
    canvas.setFont("Helvetica", 8)
    canvas.drawRightString(width - 16 * mm, 10 * mm, "Partiu Quadra | roteiro de pitch")
    canvas.restoreState()


def build():
    OUTPUT.parent.mkdir(parents=True, exist_ok=True)
    doc = BaseDocTemplate(
        str(OUTPUT),
        pagesize=A4,
        leftMargin=16 * mm,
        rightMargin=16 * mm,
        topMargin=29 * mm,
        bottomMargin=15 * mm,
        title="Roteiro do pitch - Partiu Quadra",
        author="Gabriel M. Gonçalves",
    )
    frame = Frame(
        doc.leftMargin,
        doc.bottomMargin,
        doc.width,
        doc.height,
        id="content",
        leftPadding=0,
        rightPadding=0,
        topPadding=0,
        bottomPadding=0,
    )
    doc.addPageTemplates([PageTemplate(id="pitch", frames=[frame], onPage=draw_page)])

    styles = getSampleStyleSheet()
    title = ParagraphStyle(
        "Title",
        parent=styles["Title"],
        fontName="Helvetica-Bold",
        fontSize=23,
        leading=27,
        textColor=colors.HexColor("#174C3C"),
        spaceAfter=3 * mm,
    )
    subtitle = ParagraphStyle(
        "Subtitle",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=10,
        leading=14,
        textColor=colors.HexColor("#4B5563"),
        spaceAfter=4 * mm,
    )
    section = ParagraphStyle(
        "Section",
        parent=styles["Heading2"],
        fontName="Helvetica-Bold",
        fontSize=11,
        leading=14,
        textColor=colors.HexColor("#174C3C"),
        spaceBefore=1.5 * mm,
        spaceAfter=1 * mm,
    )
    body = ParagraphStyle(
        "Body",
        parent=styles["BodyText"],
        fontName="Helvetica",
        fontSize=8.6,
        leading=11.4,
        textColor=colors.HexColor("#1F2937"),
        spaceAfter=1.5 * mm,
    )
    cue = ParagraphStyle(
        "Cue",
        parent=body,
        fontName="Helvetica-Bold",
        textColor=colors.HexColor("#8A4B08"),
    )
    time_style = ParagraphStyle(
        "Time",
        parent=styles["BodyText"],
        fontName="Helvetica-Bold",
        fontSize=8,
        leading=10,
        alignment=TA_CENTER,
        textColor=colors.white,
    )

    story = [
        Paragraph("Partiu Quadra", title),
        Paragraph(
            "Roteiro de apresentação - plataforma acessível para encontrar quadras, "
            "organizar times e concluir reservas.",
            subtitle,
        ),
    ]

    rows = [
        (
            "0:00-0:35",
            "1. Problema",
            "Encontrar uma quadra ainda exige mensagens dispersas, pouca transparência "
            "sobre horários e um processo difícil para jogadores e proprietários. "
            "Pessoas que usam teclado ou leitor de tela ainda encontram barreiras em "
            "muitos fluxos de reserva.",
            "Abrir a home e apresentar a proposta em uma frase.",
        ),
        (
            "0:35-1:15",
            "2. Solução",
            "O Partiu Quadra reúne busca, quadras, times, solicitações, aprovação, "
            "pagamento e conversa em uma jornada única. O catálogo e os esportes são "
            "carregados da API, com estados claros de carregamento, vazio e erro.",
            "Filtrar uma modalidade e abrir uma quadra real.",
        ),
        (
            "1:15-2:10",
            "3. Fluxo principal",
            "O jogador escolhe a quadra e o esporte, solicita data e horário e aguarda "
            "a resposta do proprietário. Depois da aprovação, paga por Pix ou cartão "
            "tokenizado e acompanha a confirmação e as mensagens.",
            "Demonstrar solicitação, aprovação e confirmação.",
        ),
        (
            "2:10-2:50",
            "4. Diferenciais",
            "Além da reserva, há times multiesporte, convites, desafios, favoritos e "
            "painel do proprietário. A interface usa HTML semântico, foco visível, "
            "rótulos, contraste, regiões de status e suporte a movimento reduzido.",
            "Navegar somente por teclado por um trecho do fluxo.",
        ),
        (
            "2:50-3:30",
            "5. Tecnologia e segurança",
            "Frontend modular em HTML, CSS e JavaScript; API Spring Boot com PostgreSQL, "
            "Redis e Flyway. A autenticação usa access token por sessão e refresh token "
            "HttpOnly. Pagamentos aceitam referência tokenizada e operações críticas "
            "usam idempotência.",
            "Mostrar rapidamente a arquitetura ou o README.",
        ),
        (
            "3:30-4:00",
            "6. Encerramento",
            "O resultado é uma experiência que reduz atrito para quem quer jogar e "
            "organiza a operação de quem oferece o espaço. Próximos passos: validar "
            "com usuários, registrar auditorias Lighthouse e evoluir disponibilidade "
            "e pagamentos para integrações de produção.",
            "Fechar com a confirmação da reserva e o convite à avaliação.",
        ),
    ]

    for time_text, heading, text_value, demo in rows:
        time_cell = Table(
            [[Paragraph(time_text, time_style)]],
            colWidths=[26 * mm],
            rowHeights=[9 * mm],
            style=TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), colors.HexColor("#174C3C")),
                    ("BOX", (0, 0), (-1, -1), 0, colors.HexColor("#174C3C")),
                    ("VALIGN", (0, 0), (-1, -1), "MIDDLE"),
                ]
            ),
        )
        content = [
            Paragraph(heading, section),
            Paragraph(text_value, body),
            Paragraph(f"<b>Demonstração:</b> {demo}", cue),
        ]
        block = Table(
            [[time_cell, content]],
            colWidths=[30 * mm, doc.width - 30 * mm],
            style=TableStyle(
                [
                    ("VALIGN", (0, 0), (-1, -1), "TOP"),
                    ("LEFTPADDING", (0, 0), (0, 0), 0),
                    ("RIGHTPADDING", (0, 0), (0, 0), 4 * mm),
                    ("LEFTPADDING", (1, 0), (1, 0), 3 * mm),
                    ("RIGHTPADDING", (1, 0), (1, 0), 3 * mm),
                    ("TOPPADDING", (1, 0), (1, 0), 1.5 * mm),
                    ("BOTTOMPADDING", (1, 0), (1, 0), 1.5 * mm),
                    ("BACKGROUND", (1, 0), (1, 0), colors.HexColor("#F3F7F5")),
                    ("BOX", (1, 0), (1, 0), 0.5, colors.HexColor("#D3E2DC")),
                ]
            ),
        )
        story.extend([block, Spacer(1, 2.2 * mm)])

    story.append(
        Paragraph(
            "<b>Checklist antes de apresentar:</b> ambiente com dados semeados; "
            "usuários jogador/proprietário; rede estável; Lighthouse registrado; "
            "tag v1.0-pitch criada; plano alternativo com capturas de tela.",
            ParagraphStyle(
                "Checklist",
                parent=body,
                fontSize=8,
                leading=10,
                textColor=colors.HexColor("#374151"),
                borderColor=colors.HexColor("#F5B942"),
                borderWidth=1,
                borderPadding=6,
                backColor=colors.HexColor("#FFF9E8"),
            ),
        )
    )
    doc.build(story)


if __name__ == "__main__":
    build()
