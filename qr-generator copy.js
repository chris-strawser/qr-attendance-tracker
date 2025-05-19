// ---------- [4] QR Code Generation Script (Node.js) ----------

const QRCode = require('qrcode');
const fs = require('fs');
const PDFDocument = require('pdfkit');

const students = [
  { id: '75043', name: 'Andrea Sloan' },
  { id: '273898', name: 'Jewel Baca' },
  { id: '273655', name: 'Charles Beene' },
  { id: '273853', name: 'Margaret Beene' },
  { id: '293556', name: 'Briggs Benjamin' },
  { id: '68143', name: 'Abram Boyd' },
  { id: '750061', name: 'Tristin Cargill' },
  { id: '100282', name: 'Barrett Cecchi' },
  { id: '273965', name: 'Chloe Colombo' },
  { id: '274044', name: 'Leon Cordero' },
  { id: '233113', name: 'Callen Coville' },
  { id: '273722', name: 'Lauren Crow' },
  { id: '100209', name: 'Elijah Dastic' },
  { id: '153772', name: 'Elissa Davis' },
  { id: '66412', name: 'Grayson Davis' },
  { id: '273952', name: 'Hannah Del Castillo' },
  { id: '274015', name: 'Kate DiSanto' },
  { id: '273657', name: 'Sierra Lane Esparaza' },
  { id: '254224', name: 'Saydee Gaalswyk' },
  { id: '273804', name: 'Eli Geiges' },
  { id: '274109', name: 'Stella Gonzales' },
  { id: '66546', name: 'Lucas Kleinsmith' },
  { id: '273692', name: 'Finn Land' },
  { id: '66505', name: 'Logan Lattyak' },
  { id: '273797', name: 'Elijah Ledbetter' },
  { id: '274098', name: 'Ezra Lewis' },
  { id: '274097', name: 'Kellen Lewis' },
  { id: '273964', name: 'Sophia Lewis' },
  { id: '100261', name: 'Brody Martin' },
  { id: '273663', name: 'Liam McLean' },
  { id: '5800', name: 'Daniella Mendoza-Ceja' },
  { id: '273986', name: 'Kylie Miller' },
  { id: '273854', name: 'Beckham Moreno' },
  { id: '273864', name: 'Sebastian Morneau' },
  { id: '75875', name: 'Angel Padilla Hernandez' },
  { id: '233176', name: 'Cian Papa' },
  { id: '760116', name: 'Daniel Purify-Baid' },
  { id: '76125', name: 'Wesley Reyes' },
  { id: '66475', name: 'Elias Rodriguez' },
  { id: '273920', name: 'Reese Rodriguez' },
  { id: '273733', name: 'Valentina Santana' },
  { id: '114253', name: 'Charlie Sparshott' },
  { id: '68194', name: 'Bronx Spence' },
  { id: '68149', name: 'Dylan Strawser' },
  { id: '66606', name: 'Destiny Sylvester-Gordon' },
  { id: '233085', name: 'Jack Walz' },
  { id: '273727', name: 'Rhea Wickstrom' },
  { id: '66362', name: 'Brady Wolff' },
  { id: '273762', name: 'Virawateesai (Nick) Wongman' },
  { id: '273703', name: 'Isabella (Bella) Yracheta' },
  { id: '66483', name: 'Grace Zeller' }
];

students.forEach(student => {
  const doc = new PDFDocument({ size: 'A6', margin: 10 });
  const fileName = `${student.id}_badge.pdf`;
  const qrData = JSON.stringify({ id: student.id, name: student.name });

  doc.pipe(fs.createWriteStream(fileName));

  QRCode.toDataURL(qrData, { width: 100 }, (err, url) => {
    if (err) throw err;

    const imageWidth = 100;
    const pageWidth = doc.page.width;
    const xCenter = (pageWidth - imageWidth) / 2;

    // Print name first
    doc.fontSize(9).text(student.name, { align: 'center' });
    doc.moveDown(2);

    // Draw QR code below the name
    doc.image(url, xCenter, doc.y, { width: imageWidth });

    doc.end();
    console.log(`PDF badge created: ${fileName}`);
  });
});