import { jsPDF } from 'jspdf';

interface ReportRow {
    title: string;
    status: string;
    details: string;
}

/**
 * Generates a refined show-level truth audit report for the CineMontauge registry.
 */
export const generateAirtimePDF = (title: string, data: ReportRow[], part: number = 1): void => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 14;
    const tableWidth = pageWidth - (margin * 2);
    
    // Branding Header
    doc.setFontSize(22);
    doc.setTextColor(65, 105, 225); 
    doc.text("CineMontauge Registry Audit", margin, 22);
    
    doc.setFontSize(14);
    doc.setTextColor(100);
    doc.text(`${title} (Part ${part})`, margin, 32);
    
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.setFont("helvetica", "normal");
    doc.text(`CineMontauge Admin Export • ${new Date().toLocaleString()}`, margin, 40);
    
    // Column Definitions
    const colNoWidth = 10;
    const colTitleWidth = 75;
    const colStatusWidth = 35;
    const colDetailsWidth = tableWidth - colNoWidth - colTitleWidth - colStatusWidth;

    const xNo = margin;
    const xTitle = xNo + colNoWidth;
    const xStatus = xTitle + colTitleWidth;
    const xDetails = xStatus + colStatusWidth;

    const drawHeader = (y: number) => {
        doc.setFontSize(10);
        doc.setTextColor(255);
        doc.setFillColor(20, 20, 20); 
        doc.rect(margin, y - 5, tableWidth, 8, 'F');
        doc.text("#", xNo + 2, y);
        doc.text("Registry Title", xTitle + 2, y);
        doc.text("Status/Part", xStatus + 2, y);
        doc.text("Audit Log / Gap Signature", xDetails + 2, y);
    };

    drawHeader(51);
    
    let y = 58;
    let entryCount = 0;
    doc.setTextColor(0);

    for (let i = 0; i < data.length; i++) {
        const row = data[i];
        
        // Wrap text for details column
        const wrappedDetails = doc.splitTextToSize(row.details, colDetailsWidth - 4);
        const rowHeight = Math.max(8, wrappedDetails.length * 5);

        // Page break logic
        if (y + rowHeight > 280) {
            doc.addPage();
            y = 20;
            drawHeader(y);
            y += 10;
            doc.setTextColor(0);
        }
        
        entryCount++;

        // Alternate row shading for readability
        if (entryCount % 2 !== 0) {
            doc.setFillColor(245, 247, 255); 
            doc.rect(margin, y - 4, tableWidth, rowHeight, 'F');
        }

        doc.setFont("helvetica", "bold");
        doc.setFontSize(9);
        
        // Row Number
        doc.text(`${entryCount}`, xNo + 2, y);
        
        // Title
        doc.text(row.title.substring(0, 50), xTitle + 2, y);
        
        // Status
        doc.setFont("helvetica", "normal");
        doc.text(row.status.substring(0, 20), xStatus + 2, y);
        
        // Wrapped metadata
        doc.setFontSize(8);
        doc.text(wrappedDetails, xDetails + 2, y);
        
        y += rowHeight;
    }
    
    // Final Footer with page numbering
    const totalPages = (doc as any).internal.getNumberOfPages();
    for (let j = 1; j <= totalPages; j++) {
        doc.setPage(j);
        doc.setFontSize(8);
        doc.setTextColor(150);
        doc.text(`CineMontauge Archive • Part ${part} • Page ${j} of ${totalPages}`, pageWidth / 2, doc.internal.pageSize.getHeight() - 10, { align: 'center' });
    }
    
    doc.save(`CineMontauge_Truth_Audit_Part_${part}.pdf`);
};

/**
 * Generates a full Supabase Backend Blueprint for ChatGPT.
 * Refined with comprehensive RLS policies for security.
 */
export const generateSupabaseSpecPDF = (): void => {
    const doc = new jsPDF();
    const margin = 14;
    let y = 22;

    const addText = (text: string, size: number = 10, style: string = 'normal', color: [number, number, number] = [0, 0, 0]) => {
        doc.setFontSize(size);
        doc.setFont('helvetica', style);
        doc.setTextColor(color[0], color[1], color[2]);
        const lines = doc.splitTextToSize(text, 180);
        lines.forEach((line: string) => {
            if (y > 275) {
                doc.addPage();
                y = 20;
            }
            doc.text(line, margin, y);
            y += size * 0.5 + 2;
        });
    };

    addText("CineMontauge: Supabase Backend Specification v3", 18, 'bold', [65, 105, 225]);
    y += 4;
    addText("COMPREHENSIVE RLS POLICIES & SCHEMA FOR CHATGPT", 12, 'bold', [100, 100, 100]);
    addText("--------------------------------------------------------------------------------", 10, 'normal', [150, 150, 150]);
    y += 5;

    addText("1. Relational Schema Requirements", 14, 'bold');
    addText("Table: profiles -> Basic user metadata (Public read, Owner edit).");
    addText("Table: media_items -> Global cache for TMDB metadata (Public read).");
    addText("Table: library -> Shows/Movies tracked (Private, Owner only).");
    addText("Table: watch_progress -> JSONB episode states (Private, Owner only).");
    addText("Table: weekly_picks -> Daily Gem nominations (Public read, Owner edit).");
    addText("Table: custom_lists -> visibility: ['public', 'followers', 'private'].");
    y += 5;

    addText("2. Row Level Security (RLS) Logic", 14, 'bold');
    
    addText("Table: profiles", 11, 'bold');
    addText("- SELECT: 'true' (Everyone can see usernames/avatars).");
    addText("- INSERT/UPDATE: 'auth.uid() = id' (Only user can change their profile).");
    y += 2;

    addText("Table: library & watch_progress", 11, 'bold');
    addText("- ALL ACTIONS: 'auth.uid() = user_id' (Strict privacy for watch history).");
    y += 2;

    addText("Table: weekly_picks", 11, 'bold');
    addText("- SELECT: 'true' (Nominations are visible to everyone on the dashboard).");
    addText("- INSERT/UPDATE/DELETE: 'auth.uid() = user_id' (Only the nominator can edit).");
    y += 2;

    addText("Table: custom_lists", 11, 'bold');
    addText("- SELECT: 'visibility = \"public\" OR auth.uid() = user_id' (Visibility-based access).");
    addText("- INSERT/UPDATE/DELETE: 'auth.uid() = user_id' (Owner only management).");
    y += 2;

    addText("Table: comments", 11, 'bold');
    addText("- SELECT: 'visibility = \"public\" OR auth.uid() = user_id OR (visibility = \"followers\" AND user_id IN (SELECT followed_id FROM follows WHERE follower_id = auth.uid()))'.");
    addText("- INSERT: 'auth.uid() = user_id'.");
    addText("- UPDATE/DELETE: 'auth.uid() = user_id'.");
    y += 5;

    addText("3. Social Interactions Junctions", 14, 'bold');
    addText("- follows: SELECT everyone, INSERT/DELETE where follower_id = auth.uid().");
    addText("- list_likes: SELECT everyone, INSERT/DELETE where user_id = auth.uid().");
    y += 5;

    addText("4. ChatGPT Prompt for RLS SQL Generation", 14, 'bold');
    addText("Copy and paste the following into ChatGPT:", 11, 'italic');
    addText("'Please write the SQL to enable Row Level Security (RLS) for my CineMontauge database. For profiles, allow public read but owner-only update. For library and watch_progress, ensure strict owner-only access. For custom_lists, allow public read if visibility is \"public\", but restricted to owner if \"private\". For comments, allow public read if \"public\", owner read if \"private\", and if \"followers\", only allow read for users who follow the author via the follows table. Also, write the triggers to automatically create a profile row when a new user signs up in auth.users.'", 10, 'normal', [80, 80, 80]);

    addText("--------------------------------------------------------------------------------", 10, 'normal', [150, 150, 150]);
    addText("Generated by CineMontauge Admin Portal", 8, 'italic', [150, 150, 150]);

    doc.save("CineMontauge_Supabase_Final_Spec.pdf");
};
