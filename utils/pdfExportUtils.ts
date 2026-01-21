import { jsPDF } from 'jspdf';

interface ReportRow {
    title: string;
    status: string;
    details: string;
}

export const generateAirtimePDF = (title: string, data: ReportRow[]) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const tableWidth = pageWidth - (margin * 2);
    
    // Calculate totals
    const isEpisode = (t: string) => t.trim().startsWith('-') || t.includes('E') && !t.startsWith('>>');
    const totalEpisodes = data.filter(r => isEpisode(r.title)).length;

    // Header
    doc.setFontSize(22);
    doc.setTextColor(65, 105, 225); // Royal Blue / Branded color
    doc.text("SceneIt Airtime Reference", margin, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(title, margin, 32);
    
    // Total Count Badge
    if (totalEpisodes > 0) {
        doc.setFontSize(12);
        doc.setTextColor(220, 38, 38); // Red-600
        doc.setFont("helvetica", "bold");
        doc.text(`TOTAL EPISODES MISSING: ${totalEpisodes}`, margin, 40);
    }
    
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont("helvetica", "normal");
    doc.text(`Generated on: ${new Date().toLocaleString()}`, margin, 46);
    
    // Table Config
    const colNoWidth = 10;
    const colTitleWidth = 85;
    const colStatusWidth = 40;
    const colDetailsWidth = tableWidth - colNoWidth - colTitleWidth - colStatusWidth;

    const xNo = margin;
    const xTitle = xNo + colNoWidth;
    const xStatus = xTitle + colTitleWidth;
    const xDetails = xStatus + colStatusWidth;

    // Table Headers
    doc.setFontSize(10);
    doc.setTextColor(255);
    doc.setFillColor(30, 30, 30);
    doc.rect(margin, 52, tableWidth, 8, 'F');
    
    doc.text("#", xNo + 2, 57);
    doc.text("Title / Episode", xTitle + 2, 57);
    doc.text("Status / Air Date", xStatus + 2, 57);
    doc.text("Latest Progress / ID", xDetails + 2, 57);
    
    // Table Rows
    let y = 65;
    let episodeCounter = 0;
    doc.setTextColor(0);

    data.forEach((row, index) => {
        if (y > 280) {
            doc.addPage();
            y = 20;
            
            // Re-draw headers on new page
            doc.setFillColor(30, 30, 30);
            doc.rect(margin, y - 5, tableWidth, 8, 'F');
            doc.setTextColor(255);
            doc.text("#", xNo + 2, y);
            doc.text("Title / Episode", xTitle + 2, y);
            doc.text("Status / Air Date", xStatus + 2, y);
            doc.text("Latest Progress / ID", xDetails + 2, y);
            doc.setTextColor(0);
            y += 10;
        }
        
        const isEp = isEpisode(row.title);
        if (isEp) episodeCounter++;

        // Zebra striping or background for headers
        if (!isEp) {
            doc.setFillColor(230, 235, 255); // Light blue for show headers
            doc.rect(margin, y - 4, tableWidth, 8, 'F');
            doc.setFont("helvetica", "bold");
        } else {
            if (episodeCounter % 2 === 0) {
                doc.setFillColor(248, 248, 248);
                doc.rect(margin, y - 4, tableWidth, 8, 'F');
            }
            doc.setFont("helvetica", "normal");
        }
        
        // Print row index if it's an episode
        if (isEp) {
            doc.setFontSize(8);
            doc.text(episodeCounter.toString(), xNo + 2, y);
        }

        doc.setFontSize(isEp ? 8 : 9);
        doc.text(row.title.substring(0, 55), xTitle + 2, y);
        doc.text(row.status.substring(0, 25), xStatus + 2, y);
        doc.text(row.details.substring(0, 35), xDetails + 2, y);
        
        y += 8;
        
        // Add extra vertical spacing (blank line) after each episode entry
        if (isEp) {
            y += 4;
        }
    });
    
    // Footer
    const pageCount = (doc as any).internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
        doc.setPage(i);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`Page ${i} of ${pageCount} | CineMontauge SceneIt`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
    
    doc.save(`SceneIt_${title.replace(/\s+/g, '_')}.pdf`);
};