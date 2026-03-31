import { jsPDF } from 'jspdf';

interface Patient {
  nome_completo: string;
  cpf: string;
  data_nascimento?: string;
}

interface Doctor {
  nome: string;
  crm: string;
  especialidade?: string;
}

const CLINIC_NAME = 'CLÍNICA VIDA POPULAR';
const CLINIC_ADDRESS = 'Av. Principal, 123 - Centro, Cuiabá - MT';
const CLINIC_PHONE = '(65) 3000-0000';

class PDFService {
  private doc: jsPDF;

  constructor() {
    this.doc = new jsPDF();
  }

  private drawHeader() {
    this.doc.setFontSize(20);
    this.doc.setTextColor(27, 108, 168); // Brand blue
    this.doc.text(CLINIC_NAME, 105, 20, { align: 'center' });
    
    this.doc.setFontSize(10);
    this.doc.setTextColor(100);
    this.doc.text(CLINIC_ADDRESS, 105, 27, { align: 'center' });
    this.doc.text(CLINIC_PHONE, 105, 32, { align: 'center' });
    
    this.doc.setDrawColor(200);
    this.doc.line(20, 38, 190, 38);
  }

  private drawFooter(doctor: Doctor) {
    this.doc.setDrawColor(200);
    this.doc.line(60, 260, 150, 260); // Signature line
    
    this.doc.setFontSize(10);
    this.doc.setTextColor(0);
    this.doc.text(doctor.nome, 105, 267, { align: 'center' });
    this.doc.text(`CRM: ${doctor.crm}${doctor.especialidade ? ` - ${doctor.especialidade}` : ''}`, 105, 272, { align: 'center' });
    
    this.doc.setFontSize(8);
    this.doc.setTextColor(150);
    this.doc.text('Documento gerado eletronicamente via Sistema Clínica Vida', 105, 285, { align: 'center' });
  }

  generatePrescription(patient: Patient, content: string, doctor: Doctor) {
    this.doc = new jsPDF();
    this.drawHeader();
    
    // Patient Title
    this.doc.setFontSize(14);
    this.doc.setTextColor(0);
    this.doc.text('RECEITUÁRIO MÉDICO', 105, 50, { align: 'center' });
    
    // Patient Data
    this.doc.setFontSize(11);
    this.doc.text(`Paciente: ${patient.nome_completo}`, 20, 65);
    this.doc.text(`CPF: ${patient.cpf}`, 20, 72);
    this.doc.text(`Data: ${new Date().toLocaleDateString('pt-BR')}`, 150, 65);
    
    // Medications Content
    this.doc.setFontSize(12);
    this.doc.text('Prescrição:', 20, 85);
    
    const splitContent = this.doc.splitTextToSize(content, 170);
    this.doc.text(splitContent, 20, 95);
    
    this.drawFooter(doctor);
    this.doc.save(`Receita_${patient.nome_completo.replace(/\s/g, '_')}.pdf`);
  }

  generateSickNote(patient: Patient, days: string, cid: string, doctor: Doctor) {
    this.doc = new jsPDF();
    this.drawHeader();
    
    this.doc.setFontSize(16);
    this.doc.text('ATESTADO MÉDICO', 105, 60, { align: 'center' });
    
    this.doc.setFontSize(12);
    const text = `Atesto, para os devidos fins, que o(a) Sr(a). ${patient.nome_completo}, inscrito(a) no CPF sob o nº ${patient.cpf}, foi atendido(a) nesta unidade de saúde nesta data, necessitando de ${days} dia(s) de repouso para o seu tratamento de saúde.\n\nCID: ${cid || 'Não informado'}`;
    
    const splitText = this.doc.splitTextToSize(text, 160);
    this.doc.text(splitText, 25, 85);
    
    this.doc.text(`Cuiabá - MT, ${new Date().toLocaleDateString('pt-BR')}.`, 105, 150, { align: 'center' });
    
    this.drawFooter(doctor);
    this.doc.save(`Atestado_${patient.nome_completo.replace(/\s/g, '_')}.pdf`);
  }
}

export const pdfService = new PDFService();
