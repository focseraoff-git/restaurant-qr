const { createClient } = require('@supabase/supabase-js');
const path = require('path');
require('dotenv').config({ path: path.resolve(__dirname, '../.env') });

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);
const RESTAURANT_ID = '5331ded5-6ab3-43cf-b64e-dbfdb6a215eb';

const fs = require('fs');

async function listTables() {
    const { data, error } = await supabase
        .from('tables')
        .select('*')
        .eq('restaurant_id', RESTAURANT_ID)
        .order('table_number', { ascending: true }); // String sort might be '1', '10', '11'... but okay for now

    if (error) {
        console.error(error);
        return;
    }

    // Sort properly numerically
    data.sort((a, b) => parseInt(a.table_number.replace(/\D/g, '')) - parseInt(b.table_number.replace(/\D/g, '')));

    let content = '# QR Codes for Restaurant Tables\n\n';
    content += `**Restaurant ID:** \`${RESTAURANT_ID}\`\n\n`;

    data.forEach(table => {
        const url = `http://localhost:5173/?restaurantId=${RESTAURANT_ID}&tableId=${table.id}`;
        content += `- **Table ${table.table_number}**: [Link](${url})\n`;
    });

    const outputPath = 'c:/Users/ADMIN/.gemini/antigravity/brain/b911d36d-ec38-4ff7-8924-2f1fbb3ebd1f/qr_codes.md';
    fs.writeFileSync(outputPath, content);
    console.log(`QR codes saved to ${outputPath}`);
}

listTables();
