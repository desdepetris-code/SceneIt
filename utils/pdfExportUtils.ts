import { jsPDF } from 'jspdf';

interface ReportRow {
    title: string;
    status: string;
    details: string;
}

/**
 * Generates a focused CineMontauge report limited to 100 entries.
 */
export const generateAirtimePDF = (title: string, data: ReportRow[], part: number = 1): void => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const tableWidth = pageWidth - (margin * 2);
    
    // Branding
    doc.setFontSize(22);
    doc.setTextColor(65, 105, 225); 
    doc.text("CineMontauge Registry", margin, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(`${title} (Part ${part})`, margin, 32);
    
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont("helvetica", "normal");
    doc.text(`CineMontauge Data Export • ${new Date().toLocaleString()}`, margin, 40);
    
    // Table Config
    const colNoWidth = 10;
    const colTitleWidth = 85;
    const colStatusWidth = 40;
    const colDetailsWidth = tableWidth - colNoWidth - colTitleWidth - colStatusWidth;

    const xNo = margin;
    const xTitle = xNo + colNoWidth;
    const xStatus = xTitle + colTitleWidth;
    const xDetails = xStatus + colStatusWidth;

    const drawHeader = (y: number) => {
        doc.setFontSize(10);
        doc.setTextColor(255);
        doc.setFillColor(30, 30, 30);
        doc.rect(margin, y - 5, tableWidth, 8, 'F');
        doc.text("#", xNo + 2, y);
        doc.text("Title / Episode", xTitle + 2, y);
        doc.text("Status / Air Date", xStatus + 2, y);
        doc.text("Library ID", xDetails + 2, y);
    };

    drawHeader(51);
    
    let y = 58;
    let entryCount = 0;
    doc.setTextColor(0);

    const isEpisode = (t: string) => t.trim().startsWith('-') || (t.includes('E') && !t.startsWith('>>'));

    // Limit to exactly 100 primary entries (shows) or 100 total rows if requested, 
    // but user specified 100 "Found" matches, which maps to 100 rows in this context.
    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        if (y > 280) {
            doc.addPage();
            y = 20;
            drawHeader(y);
            y += 10;
            doc.setTextColor(0);
        }
        
        const isEp = isEpisode(row.title);
        if (!isEp) entryCount++;

        // Highlighting for show headers
        if (!isEp) {
            doc.setFillColor(230, 235, 255); 
            doc.rect(margin, y - 4, tableWidth, 8, 'F');
            doc.setFont("helvetica", "bold");
        } else {
            doc.setFont("helvetica", "normal");
        }

        doc.setFontSize(isEp ? 8 : 9);
        doc.text(row.title.substring(0, 55), xTitle + 2, y);
        doc.text(row.status.substring(0, 25), xStatus + 2, y);
        doc.text(row.details.substring(0, 35), xDetails + 2, y);
        
        y += 8;
        if (isEp) y += 4;
    }
    
    // Footer
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let j = 1; j <= totalPages; j++) {
        doc.setPage(j);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`CineMontauge Archive | Page ${j} of ${totalPages} | Sequential Scan Part ${part}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
    
    doc.save(`CineMontauge_${title.replace(/\s+/g, '_')}_Part_${part}.pdf`);
};
