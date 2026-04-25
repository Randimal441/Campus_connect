import { api } from './api';
import { jsPDF } from 'jspdf';

const safeText = (value = '') => String(value).replace(/\s+/g, ' ').trim();

const formatTimestamp = (timestamp) => {
  if (!timestamp) return new Date().toLocaleString();
  const date = new Date(timestamp);
  if (Number.isNaN(date.getTime())) return new Date().toLocaleString();
  return date.toLocaleString();
};

export const medicationChatService = {
  // Send a message and get AI response
  async sendMessage(userId, clubId, message) {
    return api('/medication-chat/send', {
      method: 'POST',
      body: { userId, clubId, message },
    });
  },

  // Get chat history for a user in a club
  async getChatHistory(userId, clubId) {
    return api(`/medication-chat/history/${userId}/${clubId}`);
  },

  // Clear chat history
  async clearChatHistory(userId, clubId) {
    return api(`/medication-chat/clear/${userId}/${clubId}`, {
      method: 'DELETE',
    });
  },

  // Export chat to a styled PDF (frontend-side)
  async exportToPDF(messages, clubName, userName) {
    const doc = new jsPDF({ unit: 'pt', format: 'a4' });
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 40;
    const contentWidth = pageWidth - margin * 2;
    let y = 70;

    doc.setFillColor(20, 87, 185);
    doc.rect(0, 0, pageWidth, 110, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(20);
    doc.text('Medical Chat Export', margin, 42);
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.text(`Club: ${safeText(clubName || 'Clubs & Sports')}`, margin, 62);
    doc.text(`Student: ${safeText(userName || 'Student')}`, margin, 78);
    doc.text(`Generated: ${new Date().toLocaleString()}`, margin, 94);

    doc.setTextColor(24, 24, 24);

    const drawPageNumber = () => {
      const pageNum = doc.internal.getCurrentPageInfo().pageNumber;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(120, 120, 120);
      doc.text(`Page ${pageNum}`, pageWidth - margin - 35, pageHeight - 18);
      doc.setTextColor(24, 24, 24);
    };

    const ensureSpace = (neededHeight) => {
      if (y + neededHeight <= pageHeight - 40) return;
      drawPageNumber();
      doc.addPage();
      y = 50;
    };

    const normalizedMessages = Array.isArray(messages)
      ? messages.filter((msg) => msg && (msg.content || msg.text))
      : [];

    if (normalizedMessages.length === 0) {
      ensureSpace(80);
      doc.setFillColor(245, 247, 250);
      doc.roundedRect(margin, y, contentWidth, 80, 8, 8, 'F');
      doc.setFont('helvetica', 'italic');
      doc.setFontSize(12);
      doc.text('No chat messages found for export.', margin + 16, y + 45);
      y += 100;
    }

    normalizedMessages.forEach((msg) => {
      const role = msg.role === 'user' ? 'Student' : 'Medical Bot';
      const timestamp = formatTimestamp(msg.timestamp);
      const text = safeText(msg.content || msg.text);
      const lines = doc.splitTextToSize(text || '-', contentWidth - 28);
      const bubbleHeight = 44 + lines.length * 14;

      ensureSpace(bubbleHeight + 14);

      const isUser = msg.role === 'user';
      const bgColor = isUser ? [233, 245, 255] : [241, 247, 241];
      const titleColor = isUser ? [11, 80, 170] : [28, 112, 70];

      doc.setFillColor(...bgColor);
      doc.roundedRect(margin, y, contentWidth, bubbleHeight, 10, 10, 'F');

      doc.setFont('helvetica', 'bold');
      doc.setFontSize(11);
      doc.setTextColor(...titleColor);
      doc.text(role, margin + 14, y + 18);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(9);
      doc.setTextColor(110, 110, 110);
      doc.text(timestamp, margin + 14, y + 32);

      doc.setFont('helvetica', 'normal');
      doc.setFontSize(11);
      doc.setTextColor(26, 26, 26);
      doc.text(lines, margin + 14, y + 50);

      y += bubbleHeight + 14;
    });

    drawPageNumber();
    return doc.output('blob');
  },
};
