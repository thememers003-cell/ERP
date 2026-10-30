import * as XLSX from 'xlsx';

export function exportToExcel(data: any[], fileName: string, sheetName: string = 'Sheet1') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function exportToCSV(data: any[], fileName: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const csv = XLSX.utils.sheet_to_csv(worksheet);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export async function parseExcelOrCSV(file: File): Promise<any[]> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'binary' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json(sheet);
        resolve(json);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = (err) => reject(err);
    reader.readAsBinaryString(file);
  });
}

export function downloadStudentImportTemplate(
  classes?: Array<{ name: string; sections?: Array<{ name: string }> }>
) {
  const sampleClass = classes && classes.length > 0 ? classes[0].name : 'Grade 8';
  const sampleSection =
    classes && classes.length > 0 && classes[0].sections && classes[0].sections.length > 0
      ? classes[0].sections[0].name
      : 'Section A';

  const templateData = [
    {
      'First Name': 'Aarav',
      'Last Name': 'Sharma',
      'Email': 'aarav.sharma@school.edu',
      'Admission Number': 'ADM-2026-001',
      'Roll Number': '01',
      'Class': sampleClass,
      'Section': sampleSection,
      'Gender': 'MALE',
      'Blood Group': 'O+',
      'Parent Name': 'Rajesh Sharma',
      'Parent Phone': '+91 98765 43210',
    },
    {
      'First Name': 'Diya',
      'Last Name': 'Patel',
      'Email': 'diya.patel@school.edu',
      'Admission Number': 'ADM-2026-002',
      'Roll Number': '02',
      'Class': sampleClass,
      'Section': sampleSection,
      'Gender': 'FEMALE',
      'Blood Group': 'B+',
      'Parent Name': 'Sanjay Patel',
      'Parent Phone': '+91 98765 43211',
    },
  ];

  exportToExcel(templateData, 'Student_Import_Template', 'Students');
}

